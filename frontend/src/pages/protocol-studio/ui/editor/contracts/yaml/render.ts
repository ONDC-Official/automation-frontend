import { CST, Document, isScalar, parseDocument, Scalar, visit, type Node } from "yaml";

import type { FileStyle } from "@pages/protocol-studio/ui/editor/contracts/yaml/style";
import type { TextPatch } from "@pages/protocol-studio/ui/editor/contracts/yaml/patch";

export type ScalarValue = string | number | boolean | null;

/** Would `value`, written as a plain scalar, read back as exactly that string? */
const plainRoundTrips = (value: string) => {
    if (value === "" || value !== value.trim() || value.includes("\n")) return false;
    try {
        // A warning (e.g. `!(…)` read as a tag) means it needs quotes too.
        const doc = parseDocument(value, { logLevel: "silent" });
        return doc.errors.length === 0 && doc.warnings.length === 0 && doc.toJS() === value;
    } catch {
        return false;
    }
};

/**
 * Rewrites one scalar in place, keeping its style (quotes, trailing comment)
 * where the new value allows it. Strings that would read back as something
 * else (`true`, `123`, `null`, `a: b`) are double-quoted.
 */
export const scalarPatch = (node: Scalar, value: ScalarValue, inFlow: boolean): TextPatch => {
    const token = node.srcToken;
    if (!token || !("offset" in token)) throw new Error("This value has no source to edit");
    const original = CST.stringify(token);
    // CST tokens are plain data; jsdom (tests) has no structuredClone.
    const copy = JSON.parse(JSON.stringify(token)) as typeof token;
    let type: Scalar.Type | undefined;
    let text: string;
    if (typeof value === "string") {
        text = value;
        const current = node.type ?? Scalar.PLAIN;
        const plainLike =
            current === Scalar.PLAIN ||
            current === Scalar.BLOCK_FOLDED ||
            current === Scalar.BLOCK_LITERAL;
        if (plainLike && !plainRoundTrips(value)) type = Scalar.QUOTE_DOUBLE;
        else if (current === Scalar.BLOCK_FOLDED || current === Scalar.BLOCK_LITERAL)
            type = Scalar.PLAIN;
    } else {
        text = value === null ? "null" : String(value);
        type = Scalar.PLAIN;
    }
    CST.setScalarValue(copy, text, { inFlow, ...(type ? { type } : {}) });
    return { from: token.offset, to: token.offset + original.length, insert: CST.stringify(copy) };
};

/** Mark JSONPath strings with the file's quote style before a new node is written. */
const applyPathQuotes = (doc: Document, style: FileStyle) => {
    if (style.pathQuote === "PLAIN") return;
    visit(doc, {
        Scalar(_key, node) {
            if (typeof node.value === "string" && node.value.startsWith("$"))
                node.type = style.pathQuote;
        },
    });
};

/**
 * A new block node as text, every line indented to `column` and ending in the
 * file's EOL: `value` is a sequence item (`- …`) or a `{key: value}` pair.
 */
export const renderBlock = (value: unknown, column: number, style: FileStyle): string => {
    const doc = new Document(value);
    applyPathQuotes(doc, style);
    const body = doc.toString({
        indent: style.indent,
        indentSeq: style.indentSeq,
        lineWidth: 0,
        minContentWidth: 0,
    });
    const pad = " ".repeat(column);
    return (
        body
            .replace(/\n$/, "")
            .split("\n")
            .map((line) => (line.length ? pad + line : line))
            .join(style.eol) + style.eol
    );
};

/** A flow collection, written inline (`[A, B]` / `{a: 1}`). */
export const renderFlow = (value: unknown, style: FileStyle): string => {
    const doc = new Document(value);
    applyPathQuotes(doc, style);
    if (doc.contents && !isScalar(doc.contents))
        (doc.contents as Node & { flow?: boolean }).flow = true;
    return doc.toString({ lineWidth: 0 }).replace(/\n$/, "");
};
