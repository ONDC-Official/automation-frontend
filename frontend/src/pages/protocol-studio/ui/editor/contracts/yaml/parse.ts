import { isAlias, isNode, LineCounter, parseDocument, visit, type Document } from "yaml";

/**
 * A contract file (actions / validations / openapi YAML) parsed for viewing
 * and range-preserving editing. The text is the source of truth: every
 * structured edit is a splice of it, and the parse is only ever read.
 */
export interface ParsedContract {
    text: string;
    /** Parsed with build-tools' defaults (yaml 1.2 core, unique keys), plus source tokens. */
    doc: Document.Parsed;
    lineCounter: LineCounter;
    errors: ContractYamlIssue[];
    warnings: ContractYamlIssue[];
    eol: "\n" | "\r\n";
    census: YamlCensus;
}

export interface ContractYamlIssue {
    message: string;
    /** 1-based, like Monaco. */
    line: number;
    column: number;
    endLine: number;
    endColumn: number;
}

export interface YamlCensus {
    anchors: number;
    aliases: number;
    /** Lines whose first non-blank character is `#`. */
    commentLines: number;
    lines: number;
    /** Anchor names defined more than once (the later definition wins for every following alias). */
    redefinedAnchors: string[];
    /** `<<` merge keys: build-tools' parser keeps them literally, the compiler's merges them. */
    mergeKeys: number;
}

const CACHE_SIZE = 6;
const cache = new Map<string, ParsedContract>();

const toIssue = (
    lineCounter: LineCounter,
    message: string,
    pos: [number, number]
): ContractYamlIssue => {
    const start = lineCounter.linePos(pos[0]);
    const end = lineCounter.linePos(Math.max(pos[1], pos[0]));
    return {
        message,
        line: start.line,
        column: start.col,
        endLine: end.line,
        endColumn: end.col === start.col && end.line === start.line ? end.col + 1 : end.col,
    };
};

export const countCommentLines = (text: string) => {
    let count = 0;
    for (const line of text.split("\n")) if (/^\s*#/.test(line)) count++;
    return count;
};

const takeCensus = (doc: Document.Parsed, text: string): YamlCensus => {
    let anchors = 0;
    let aliases = 0;
    let mergeKeys = 0;
    const seen = new Set<string>();
    const redefined = new Set<string>();
    visit(doc, {
        Node(_key, node) {
            if (isAlias(node)) {
                aliases++;
                return;
            }
            if (isNode(node) && node.anchor) {
                anchors++;
                if (seen.has(node.anchor)) redefined.add(node.anchor);
                seen.add(node.anchor);
            }
        },
        Pair(_key, pair) {
            const key = pair.key as { value?: unknown } | null;
            if (key && typeof key === "object" && key.value === "<<") mergeKeys++;
        },
    });
    return {
        anchors,
        aliases,
        commentLines: countCommentLines(text),
        lines: text.length === 0 ? 0 : text.split("\n").length,
        redefinedAnchors: [...redefined],
        mergeKeys,
    };
};

/** Parses a contract file. Cached by text, so re-renders and edit verification don't re-parse. */
export const parseContract = (text: string): ParsedContract => {
    const hit = cache.get(text);
    if (hit) {
        cache.delete(text);
        cache.set(text, hit);
        return hit;
    }
    const lineCounter = new LineCounter();
    const doc = parseDocument(text, { keepSourceTokens: true, lineCounter, prettyErrors: false });
    const parsed: ParsedContract = {
        text,
        doc,
        lineCounter,
        errors: doc.errors.map((e) => toIssue(lineCounter, e.message, e.pos)),
        warnings: doc.warnings.map((e) => toIssue(lineCounter, e.message, e.pos)),
        eol: text.includes("\r\n") ? "\r\n" : "\n",
        census: takeCensus(doc, text),
    };
    cache.set(text, parsed);
    if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value as string);
    return parsed;
};

/** The parsed plain value, aliases expanded without yaml's alias-count limit. */
export const toPlain = (parsed: ParsedContract): unknown => {
    try {
        return parsed.doc.toJS({ maxAliasCount: -1 });
    } catch {
        return undefined;
    }
};

/** 1-based line of an offset. */
export const lineOf = (parsed: ParsedContract, offset: number) =>
    parsed.lineCounter.linePos(offset).line;
