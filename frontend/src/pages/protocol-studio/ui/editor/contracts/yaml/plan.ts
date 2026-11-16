import {
    isAlias,
    isMap,
    isScalar,
    isSeq,
    type Node,
    type Pair,
    type YAMLMap,
    type YAMLSeq,
} from "yaml";

import {
    findPair,
    resolveLocator,
    resolveTarget,
    type Locator,
} from "@pages/protocol-studio/ui/editor/contracts/yaml/locate";
import type { ParsedContract } from "@pages/protocol-studio/ui/editor/contracts/yaml/parse";
import {
    columnOf,
    isBlankLine,
    lineStart,
    nextLineStart,
    type TextPatch,
} from "@pages/protocol-studio/ui/editor/contracts/yaml/patch";
import {
    renderBlock,
    renderFlow,
    scalarPatch,
    type ScalarValue,
} from "@pages/protocol-studio/ui/editor/contracts/yaml/render";
import {
    aliasedAnchorsWithin,
    anchorCensus,
    sharedImpact,
    type SharedImpact,
} from "@pages/protocol-studio/ui/editor/contracts/yaml/shared";
import { detectStyle } from "@pages/protocol-studio/ui/editor/contracts/yaml/style";

/** A structured edit of a contract file. Every edit becomes minimal text patches. */
export type ContractEdit =
    | { op: "setScalar"; at: Locator; value: ScalarValue }
    | { op: "setSeqItems"; at: Locator; items: ScalarValue[] }
    | { op: "insertSeqItem"; at: Locator; index: number; value: unknown }
    | { op: "removeSeqItem"; at: Locator; index: number }
    | { op: "moveSeqItem"; at: Locator; from: number; to: number }
    | { op: "duplicateSeqItem"; at: Locator; index: number }
    | { op: "setPair"; at: Locator; key: string; value: unknown }
    | { op: "removePair"; at: Locator; key: string }
    | { op: "renameKey"; at: Locator; from: string; to: string }
    | { op: "unshare"; at: Locator };

export interface PlannedEdit {
    patches: TextPatch[];
    /** The edit lands in a shared (anchored and aliased) node: it shows in every use. */
    impact: SharedImpact | null;
}

export class EditBlockedError extends Error {}

const blocked = (message: string): never => {
    throw new EditBlockedError(message);
};

const rangeOf = (node: Node | null | undefined): [number, number, number] => {
    const range = node?.range;
    if (!range) return blocked("This part of the file has no source position");
    return range;
};

/**
 * Where a node's content really ends: its last leaf's value, or a flow
 * collection's closing bracket. A block collection's own range runs over
 * trailing comment lines up to the next sibling's content, so it can't be used.
 */
export const contentEnd = (node: Node): number => {
    if (isScalar(node) || isAlias(node)) return rangeOf(node)[1];
    if ((isSeq(node) || isMap(node)) && node.flow) {
        const token = node.srcToken;
        if (token?.type === "flow-collection") {
            const close = token.end.find(
                (t) => t.type === "flow-seq-end" || t.type === "flow-map-end"
            );
            if (close) return close.offset + 1;
        }
        return rangeOf(node)[1];
    }
    if (isSeq(node)) {
        for (let i = node.items.length - 1; i >= 0; i--) {
            const item = node.items[i] as Node | null;
            if (item?.range) return contentEnd(item);
        }
    } else if (isMap(node)) {
        for (let i = node.items.length - 1; i >= 0; i--) {
            const pair = node.items[i] as Pair;
            const last = ((pair.value as Node | null) ?? (pair.key as Node | null)) as Node | null;
            if (last?.range) return contentEnd(last);
        }
    }
    return rangeOf(node)[1];
};

/** Start of the line after `node`'s content (the whole node, through its last line). */
const nodeLinesEnd = (text: string, node: Node) =>
    nextLineStart(text, Math.max(0, contentEnd(node) - 1));

/** Consume blank lines after `offset`, stopping at anything else (comments included). */
const skipBlankLines = (text: string, offset: number) => {
    let at = offset;
    while (at < text.length && isBlankLine(text, at)) {
        const next = nextLineStart(text, at);
        if (next === at) break;
        at = next;
    }
    return at;
};

/** Offsets of each block-sequence item's `-` indicator, in item order. */
const seqIndicators = (seq: YAMLSeq): number[] => {
    const token = seq.srcToken;
    if (!token || token.type !== "block-seq") return blocked("Not a block list");
    const offsets: number[] = [];
    for (const item of token.items) {
        const ind = item.start.find((t) => t.type === "seq-item-ind");
        if (ind) offsets.push(ind.offset);
    }
    if (offsets.length !== seq.items.length) return blocked("Couldn't line up this list's items");
    return offsets;
};

interface Span {
    from: number;
    to: number;
}

/** Whole lines of a block-sequence item: from its `-` line to the end of its last line. */
const seqItemSpan = (text: string, seq: YAMLSeq, index: number, indicators: number[]): Span => {
    const ind = indicators[index] as number;
    const before = text.slice(lineStart(text, ind), ind);
    const from = /^\s*$/.test(before) ? lineStart(text, ind) : ind;
    const item = seq.items[index] as Node | null;
    const next = indicators[index + 1];
    let to: number;
    if (item?.range) to = nodeLinesEnd(text, item);
    else to = next !== undefined ? lineStart(text, next) : nextLineStart(text, ind);
    return { from, to };
};

/** Whole lines of a map pair. A first pair sharing its line with `- ` starts at its key. */
const pairSpan = (text: string, map: YAMLMap, pair: Pair): Span & { inline: boolean } => {
    const key = pair.key as Node;
    const [keyStart] = rangeOf(key);
    const before = text.slice(lineStart(text, keyStart), keyStart);
    const inline = !/^\s*$/.test(before);
    const from = inline ? keyStart : lineStart(text, keyStart);
    const value = pair.value as Node | null;
    let to = value?.range ? nodeLinesEnd(text, value) : nextLineStart(text, keyStart);
    if (inline) {
        // Join the next key onto the `- ` line instead of leaving it empty.
        const index = map.items.indexOf(pair);
        const nextKey = map.items[index + 1]?.key as Node | undefined;
        if (nextKey?.range) to = nextKey.range[0];
    }
    return { from, to, inline };
};

/** Column the keys of a block map sit at. */
const mapColumn = (text: string, map: YAMLMap) => columnOf(text, rangeOf(map)[0]);

const located = (parsed: ParsedContract, at: Locator) => {
    const target = resolveTarget(parsed.doc, at);
    if (!target) return blocked(`Nothing at ${at.join(".")}`);
    return target;
};

const asSeq = (parsed: ParsedContract, at: Locator): YAMLSeq => {
    const { node } = located(parsed, at);
    if (!node || !isSeq(node)) return blocked(`${at.join(".")} is not a list`);
    return node;
};

const asMap = (parsed: ParsedContract, at: Locator): YAMLMap => {
    const { node } = located(parsed, at);
    if (!node || !isMap(node)) return blocked(`${at.join(".")} is not a mapping`);
    return node;
};

const guardAnchors = (parsed: ParsedContract, node: Node | null, verb: string) => {
    if (!node) return;
    const names = aliasedAnchorsWithin(parsed, node);
    if (names.length) {
        blocked(
            `Can't ${verb} this: it defines ${names.map((n) => `&${n}`).join(", ")}, which other parts of the file reuse. Edit it in Source.`
        );
    }
};

/** Replace a whole `key: value` pair of a block map with `key: <value>` rendered fresh. */
const replacePair = (
    parsed: ParsedContract,
    map: YAMLMap,
    pair: Pair,
    value: unknown
): TextPatch => {
    const { text } = parsed;
    const style = detectStyle(parsed);
    const span = pairSpan(text, map, pair);
    const key = pair.key as Node & { value?: unknown };
    const keyValue = isScalar(key) ? key.value : String(key);
    const rendered = renderBlock(new Map([[keyValue, value]]), mapColumn(text, map), style);
    if (!span.inline) return { from: span.from, to: span.to, insert: rendered };
    // Inline first pair (`- key: …`): keep the dash line, and the following keys' indentation.
    const column = mapColumn(text, map);
    let insert = rendered.slice(column);
    const index = map.items.indexOf(pair);
    if (index < map.items.length - 1) insert += " ".repeat(column);
    return { from: span.from, to: span.to, insert };
};

const replaceFlow = (parsed: ParsedContract, node: Node, value: unknown): TextPatch => {
    const [from, to] = rangeOf(node);
    return { from, to, insert: renderFlow(value, detectStyle(parsed)) };
};

/** The pair holding the collection at `at` (so it can be rewritten whole), when its parent is a map. */
const holdingPair = (parsed: ParsedContract, at: Locator) => {
    if (at.length === 0) return null;
    const parent = resolveTarget(parsed.doc, at.slice(0, -1));
    const key = at[at.length - 1];
    if (!parent?.node || !isMap(parent.node) || parent.node.flow) return null;
    const pair = findPair(parent.node, key as string);
    return pair ? { map: parent.node, pair } : null;
};

const scalarItems = (seq: YAMLSeq): ScalarValue[] =>
    seq.items.map((item) => (isScalar(item) ? (item.value as ScalarValue) : null));

/** Indexes of `a` kept in `b` by a longest common subsequence: pairs [indexInA, indexInB]. */
export const lcsPairs = <T>(a: T[], b: T[]): [number, number][] => {
    const table: number[][] = Array.from({ length: a.length + 1 }, () =>
        Array(b.length + 1).fill(0)
    );
    for (let i = a.length - 1; i >= 0; i--) {
        for (let j = b.length - 1; j >= 0; j--) {
            table[i]![j] =
                a[i] === b[j]
                    ? table[i + 1]![j + 1]! + 1
                    : Math.max(table[i + 1]![j]!, table[i]![j + 1]!);
        }
    }
    const pairs: [number, number][] = [];
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
        if (a[i] === b[j]) {
            pairs.push([i, j]);
            i++;
            j++;
        } else if (table[i + 1]![j]! >= table[i]![j + 1]!) i++;
        else j++;
    }
    return pairs;
};

/** Text of a node's source with every anchor in `names` removed (so a copy doesn't redefine it). */
const stripAnchors = (source: string, names: string[]) => {
    let out = source;
    for (const name of names) {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        out = out.replace(new RegExp(`&${escaped}(?=[\\s,\\]}]|$) ?`, "g"), "");
    }
    return out;
};

const anchorsWithin = (node: Node): string[] => {
    const names: string[] = [];
    const collect = (n: Node | null | undefined) => {
        if (!n || isAlias(n)) return;
        if (n.anchor) names.push(n.anchor);
        if (isSeq(n)) n.items.forEach((item) => collect(item as Node));
        else if (isMap(n)) for (const pair of n.items) collect(pair.value as Node);
    };
    collect(node);
    return names;
};

/** After stripping an item's anchor, `- \n    key: v` reads better as `- key: v`. */
const tidyDash = (itemText: string, dashColumn: number, eol: string) => {
    const pad = " ".repeat(dashColumn);
    const pattern = new RegExp(`^${pad}- *${eol === "\r\n" ? "\\r\\n" : "\\n"}${pad}  (?=\\S)`);
    return itemText.replace(pattern, `${pad}- `);
};

const planSetSeqItems = (
    parsed: ParsedContract,
    at: Locator,
    items: ScalarValue[]
): TextPatch[] => {
    const { text } = parsed;
    const seq = asSeq(parsed, at);
    const style = detectStyle(parsed);
    if (seq.flow || seq.items.length === 0) {
        const holder = holdingPair(parsed, at);
        // An empty `[]` among block lists becomes a block list; a flow list stays flow.
        if (seq.items.length === 0 && items.length > 0 && holder) {
            return [replacePair(parsed, holder.map, holder.pair, items)];
        }
        return [replaceFlow(parsed, seq, items)];
    }
    if (items.length === 0) {
        guardAnchors(parsed, seq, "empty this list");
        const holder = holdingPair(parsed, at);
        if (!holder) return blocked("Can't empty this list here");
        return [replacePair(parsed, holder.map, holder.pair, [])];
    }
    const before = scalarItems(seq);
    const kept = lcsPairs(before, items);
    const keptA = new Set(kept.map(([i]) => i));
    const indicators = seqIndicators(seq);
    const column = columnOf(text, indicators[0] as number);
    const patches: TextPatch[] = [];
    for (let i = 0; i < before.length; i++) {
        if (keptA.has(i)) continue;
        guardAnchors(parsed, seq.items[i] as Node, "remove this value");
        const span = seqItemSpan(text, seq, i, indicators);
        patches.push({ from: span.from, to: span.to, insert: "" });
    }
    // New values go before the next kept item (or after the last item).
    const insertions = new Map<number, ScalarValue[]>();
    let k = 0;
    for (let j = 0; j < items.length; j++) {
        if (k < kept.length && kept[k]![1] === j) {
            k++;
            continue;
        }
        const anchorItem = k < kept.length ? kept[k]![0] : before.length;
        const list = insertions.get(anchorItem) ?? [];
        list.push(items[j] as ScalarValue);
        insertions.set(anchorItem, list);
    }
    for (const [anchorItem, values] of insertions) {
        const offset =
            anchorItem < before.length
                ? seqItemSpan(text, seq, anchorItem, indicators).from
                : seqItemSpan(text, seq, before.length - 1, indicators).to;
        const insert = values.map((v) => renderBlock([v], column, style)).join("");
        patches.push({
            from: offset,
            to: offset,
            insert: ensureLineStart(text, offset, insert, style.eol),
        });
    }
    return patches;
};

/** An insertion at the very end of a file with no final newline needs one first. */
const ensureLineStart = (text: string, offset: number, insert: string, eol: string) =>
    offset === text.length && text.length > 0 && !text.endsWith("\n") ? eol + insert : insert;

const planInsertSeqItem = (
    parsed: ParsedContract,
    at: Locator,
    index: number,
    value: unknown
): TextPatch[] => {
    const { text } = parsed;
    const seq = asSeq(parsed, at);
    const style = detectStyle(parsed);
    if (seq.flow || seq.items.length === 0) {
        if (seq.items.some((item) => !isScalar(item)))
            return blocked("Edit this inline list in Source");
        const plain: unknown[] = scalarItems(seq);
        plain.splice(index, 0, value);
        const holder = holdingPair(parsed, at);
        const scalarList = plain.every((v) => v === null || typeof v !== "object");
        // An empty `[]` in a block file, or a list gaining a mapping, becomes a block list.
        if (holder && (seq.items.length === 0 || !scalarList)) {
            return [replacePair(parsed, holder.map, holder.pair, plain)];
        }
        if (!scalarList) return blocked("Edit this inline list in Source");
        return [replaceFlow(parsed, seq, plain)];
    }
    const indicators = seqIndicators(seq);
    const column = columnOf(text, indicators[0] as number);
    const offset =
        index < seq.items.length
            ? seqItemSpan(text, seq, index, indicators).from
            : seqItemSpan(text, seq, seq.items.length - 1, indicators).to;
    const insert = renderBlock([value], column, style);
    return [{ from: offset, to: offset, insert: ensureLineStart(text, offset, insert, style.eol) }];
};

const planRemoveSeqItem = (parsed: ParsedContract, at: Locator, index: number): TextPatch[] => {
    const { text } = parsed;
    const seq = asSeq(parsed, at);
    if (index < 0 || index >= seq.items.length) return blocked("No such item");
    guardAnchors(parsed, seq.items[index] as Node, "remove");
    if (seq.flow) {
        if (seq.items.some((item) => !isScalar(item)))
            return blocked("Edit this inline list in Source");
        const plain = scalarItems(seq);
        plain.splice(index, 1);
        return [replaceFlow(parsed, seq, plain)];
    }
    if (seq.items.length === 1) {
        const holder = holdingPair(parsed, at);
        if (!holder) return blocked("Can't remove the only item here");
        return [replacePair(parsed, holder.map, holder.pair, [])];
    }
    const indicators = seqIndicators(seq);
    const span = seqItemSpan(text, seq, index, indicators);
    return [{ from: span.from, to: skipBlankLines(text, span.to), insert: "" }];
};

const planMoveSeqItem = (
    parsed: ParsedContract,
    at: Locator,
    from: number,
    to: number
): TextPatch[] => {
    const { text } = parsed;
    const seq = asSeq(parsed, at);
    if (from === to) return [];
    if (from < 0 || to < 0 || from >= seq.items.length || to >= seq.items.length) {
        return blocked("No such item");
    }
    if (seq.flow) {
        if (seq.items.some((item) => !isScalar(item)))
            return blocked("Edit this inline list in Source");
        const plain = scalarItems(seq);
        const [moved] = plain.splice(from, 1);
        plain.splice(to, 0, moved as ScalarValue);
        return [replaceFlow(parsed, seq, plain)];
    }
    // Moving an anchor past (or an alias before) its uses would break them.
    guardAnchors(parsed, seq.items[from] as Node, "move");
    const indicators = seqIndicators(seq);
    const span = seqItemSpan(text, seq, from, indicators);
    let moved = text.slice(span.from, span.to);
    if (!moved.endsWith("\n")) moved += parsed.eol;
    const target = seqItemSpan(text, seq, to, indicators);
    const offset = to > from ? target.to : target.from;
    return [
        { from: span.from, to: span.to, insert: "" },
        { from: offset, to: offset, insert: ensureLineStart(text, offset, moved, parsed.eol) },
    ];
};

const planDuplicateSeqItem = (parsed: ParsedContract, at: Locator, index: number): TextPatch[] => {
    const { text } = parsed;
    const seq = asSeq(parsed, at);
    const item = seq.items[index] as Node | undefined;
    if (!item) return blocked("No such item");
    if (seq.flow) {
        if (!isScalar(item)) return blocked("Edit this inline list in Source");
        const plain = scalarItems(seq);
        plain.splice(index + 1, 0, item.value as ScalarValue);
        return [replaceFlow(parsed, seq, plain)];
    }
    const indicators = seqIndicators(seq);
    const span = seqItemSpan(text, seq, index, indicators);
    const names = isAlias(item) ? [] : anchorsWithin(item);
    let copy = stripAnchors(text.slice(span.from, span.to), names);
    copy = tidyDash(copy, columnOf(text, indicators[index] as number), parsed.eol);
    if (!copy.endsWith("\n")) copy = parsed.eol + copy;
    return [{ from: span.to, to: span.to, insert: copy }];
};

const planSetPair = (
    parsed: ParsedContract,
    at: Locator,
    key: string,
    value: unknown
): TextPatch[] => {
    const { text } = parsed;
    const style = detectStyle(parsed);
    const map = asMap(parsed, at);
    if (key === "<<")
        return blocked("Merge keys (<<) read differently in build-tools and the compiler");
    const existing = findPair(map, key);
    if (existing) {
        const current = existing.value as Node | null;
        const isScalarValue = value === null || typeof value !== "object";
        if (current && isScalar(current) && isScalarValue && current.srcToken) {
            return [scalarPatch(current, value as ScalarValue, !!map.flow)];
        }
        guardAnchors(parsed, current, "replace");
        if (map.flow) {
            const plain = { ...(map.toJSON() as Record<string, unknown>), [key]: value };
            return [replaceFlow(parsed, map, plain)];
        }
        return [replacePair(parsed, map, existing, value)];
    }
    if (map.flow || map.items.length === 0) {
        const plain = { ...((map.toJSON() as Record<string, unknown>) ?? {}), [key]: value };
        const holder = holdingPair(parsed, at);
        if (holder && map.items.length === 0)
            return [replacePair(parsed, holder.map, holder.pair, plain)];
        return [replaceFlow(parsed, map, plain)];
    }
    const last = map.items[map.items.length - 1] as Pair;
    const lastValue = (last.value as Node | null) ?? (last.key as Node);
    const offset = nodeLinesEnd(text, lastValue);
    const insert = renderBlock(new Map([[key, value]]), mapColumn(text, map), style);
    return [{ from: offset, to: offset, insert: ensureLineStart(text, offset, insert, style.eol) }];
};

const planRemovePair = (parsed: ParsedContract, at: Locator, key: string): TextPatch[] => {
    const { text } = parsed;
    const map = asMap(parsed, at);
    const pair = findPair(map, key);
    if (!pair) return blocked(`No "${key}" here`);
    guardAnchors(parsed, pair.value as Node | null, "remove");
    if (map.flow) {
        const plain = { ...(map.toJSON() as Record<string, unknown>) };
        delete plain[key];
        return [replaceFlow(parsed, map, plain)];
    }
    if (map.items.length === 1) {
        const holder = holdingPair(parsed, at);
        if (holder) return [replacePair(parsed, holder.map, holder.pair, {})];
        const parent = resolveLocator(parsed.doc, at.slice(0, -1));
        if (parent?.node && isSeq(parent.node)) return blocked("Remove the whole item instead");
        return blocked("Can't remove the only entry here");
    }
    const span = pairSpan(text, map, pair);
    return [
        { from: span.from, to: span.inline ? span.to : skipBlankLines(text, span.to), insert: "" },
    ];
};

const planRenameKey = (
    parsed: ParsedContract,
    at: Locator,
    from: string,
    to: string
): TextPatch[] => {
    const map = asMap(parsed, at);
    if (to === "<<")
        return blocked("Merge keys (<<) read differently in build-tools and the compiler");
    if (findPair(map, to)) return blocked(`"${to}" already exists here`);
    const pair = findPair(map, from);
    if (!pair || !isScalar(pair.key)) return blocked(`No "${from}" here`);
    return [scalarPatch(pair.key, to, !!map.flow)];
};

/** Indent every line after the first by `shift` columns (negative removes). */
const reindentTail = (source: string, shift: number) => {
    const lines = source.split("\n");
    return lines
        .map((line, i) => {
            if (i === 0 || line.trim() === "") return line;
            if (shift >= 0) return " ".repeat(shift) + line;
            const lead = line.length - line.trimStart().length;
            return line.slice(Math.min(lead, -shift));
        })
        .join("\n");
};

const planUnshare = (parsed: ParsedContract, at: Locator): TextPatch[] => {
    const { text, doc } = parsed;
    const here = resolveLocator(doc, at);
    const alias = here?.node;
    if (!alias || !isAlias(alias))
        return blocked("Only a reused (aliased) value can be copied out");
    const source = alias.resolve(doc) as Node | undefined;
    if (!source?.range) return blocked("Couldn't find what this reuses");
    const [aliasFrom, aliasTo] = rangeOf(alias);
    const srcFrom = source.range[0];
    const srcEnd = contentEnd(source);
    const names = anchorsWithin(source);
    if (isScalar(source) || (isMap(source) && source.flow) || (isSeq(source) && source.flow)) {
        const value = stripAnchors(text.slice(srcFrom, srcEnd), names).trimEnd();
        return [{ from: aliasFrom, to: aliasTo, insert: value }];
    }
    const aliasColumn = columnOf(text, aliasFrom);
    const lineHead = text.slice(lineStart(text, aliasFrom), aliasFrom);
    const isSeqItem = /^\s*-\s+$/.test(lineHead);
    const sourceColumn = columnOf(text, srcFrom);
    const body = stripAnchors(text.slice(srcFrom, srcEnd), names).replace(/\s+$/, "");
    if (isSeqItem) {
        // `- *x` → `- key: …` continuing at the alias's column.
        return [
            {
                from: aliasFrom,
                to: aliasTo,
                insert: reindentTail(body, aliasColumn - sourceColumn),
            },
        ];
    }
    // `key: *x` → `key:` then the block on the following lines.
    const style = detectStyle(parsed);
    const keyColumn = lineHead.length - lineHead.trimStart().length;
    const column = isSeq(source) && !style.indentSeq ? keyColumn : keyColumn + style.indent;
    const block = " ".repeat(column) + reindentTail(body, column - sourceColumn);
    let from = aliasFrom;
    while (from > 0 && text[from - 1] === " ") from--;
    return [{ from, to: aliasTo, insert: parsed.eol + block }];
};

/** Turns one structured edit into text patches against `parsed.text`. Throws `EditBlockedError` with a reason. */
export const planEdit = (parsed: ParsedContract, edit: ContractEdit): PlannedEdit => {
    if (parsed.errors.length) blocked("Fix the YAML errors first (Source view)");
    let impactAt: Locator = edit.at;
    let patches: TextPatch[];
    switch (edit.op) {
        case "setScalar": {
            const target = resolveTarget(parsed.doc, edit.at);
            const node = target?.node;
            if (node && isScalar(node) && node.srcToken) {
                const parent = target.parent;
                const inFlow = !!(parent && (isMap(parent) || isSeq(parent)) && parent.flow);
                patches = [scalarPatch(node, edit.value, inFlow)];
            } else {
                const key = edit.at[edit.at.length - 1];
                if (typeof key !== "string") return blocked("Nothing to set here");
                patches = planSetPair(parsed, edit.at.slice(0, -1), key, edit.value);
            }
            break;
        }
        case "setSeqItems": {
            const target = resolveTarget(parsed.doc, edit.at);
            const key = edit.at[edit.at.length - 1];
            // A missing list, or `key:` with nothing after it, is set as a whole.
            if ((!target || !target.node || isScalar(target.node)) && typeof key === "string") {
                patches = planSetPair(parsed, edit.at.slice(0, -1), key, edit.items);
            } else {
                patches = planSetSeqItems(parsed, edit.at, edit.items);
            }
            break;
        }
        case "insertSeqItem":
            patches = planInsertSeqItem(parsed, edit.at, edit.index, edit.value);
            break;
        case "removeSeqItem":
            impactAt = [...edit.at, edit.index];
            patches = planRemoveSeqItem(parsed, edit.at, edit.index);
            break;
        case "moveSeqItem":
            patches = planMoveSeqItem(parsed, edit.at, edit.from, edit.to);
            break;
        case "duplicateSeqItem":
            patches = planDuplicateSeqItem(parsed, edit.at, edit.index);
            break;
        case "setPair":
            impactAt = [...edit.at, edit.key];
            patches = planSetPair(parsed, edit.at, edit.key, edit.value);
            break;
        case "removePair":
            impactAt = [...edit.at, edit.key];
            patches = planRemovePair(parsed, edit.at, edit.key);
            break;
        case "renameKey":
            patches = planRenameKey(parsed, edit.at, edit.from, edit.to);
            break;
        case "unshare":
            return { patches: planUnshare(parsed, edit.at), impact: null };
    }
    return { patches, impact: sharedImpact(parsed, impactAt) };
};

/** The outermost alias the locator goes through, for "Make a separate copy". */
export const outermostAlias = (parsed: ParsedContract, at: Locator): Locator | null => {
    for (let depth = 1; depth <= at.length; depth++) {
        const prefix = at.slice(0, depth);
        const here = resolveLocator(parsed.doc, prefix);
        if (here?.node && isAlias(here.node)) return prefix;
    }
    return null;
};

/** Every anchor name in the file (to pick fresh names and to check a copy doesn't redefine one). */
export const anchorNames = (parsed: ParsedContract) =>
    new Set(anchorCensus(parsed).map((a) => a.name));
