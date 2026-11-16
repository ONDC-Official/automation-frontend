import { isMap, isScalar, isSeq, Scalar, type Node } from "yaml";

import { walkNodes } from "@pages/protocol-studio/ui/editor/contracts/yaml/shared";
import { columnOf } from "@pages/protocol-studio/ui/editor/contracts/yaml/patch";
import type { ParsedContract } from "@pages/protocol-studio/ui/editor/contracts/yaml/parse";

/** How a file writes things, sampled from what it already has, so new nodes look native. */
export interface FileStyle {
    /** Spaces per nesting level of a map. */
    indent: number;
    /** `key:\n  - a` (true) vs `key:\n- a` (false). */
    indentSeq: boolean;
    /** How JSONPath strings (`$.…`) are written: TRV11 quotes them, TRV10 and FIS12 don't. */
    pathQuote: "QUOTE_DOUBLE" | "QUOTE_SINGLE" | "PLAIN";
    eol: "\n" | "\r\n";
}

const styleCache = new WeakMap<ParsedContract, FileStyle>();

const mostCommon = <T>(counts: Map<T, number>, fallback: T): T => {
    let best = fallback;
    let max = 0;
    for (const [value, count] of counts) {
        if (count > max) {
            best = value;
            max = count;
        }
    }
    return best;
};

export const detectStyle = (parsed: ParsedContract): FileStyle => {
    const cached = styleCache.get(parsed);
    if (cached) return cached;
    const { text } = parsed;
    const indents = new Map<number, number>();
    const seqIndent = new Map<boolean, number>();
    const quotes = new Map<FileStyle["pathQuote"], number>();
    let samples = 0;

    walkNodes(parsed.doc, (node: Node) => {
        if (samples > 4000) return;
        if (isScalar(node) && typeof node.value === "string" && node.value.startsWith("$")) {
            const type = node.type;
            if (
                type === Scalar.QUOTE_DOUBLE ||
                type === Scalar.QUOTE_SINGLE ||
                type === Scalar.PLAIN
            ) {
                quotes.set(type, (quotes.get(type) ?? 0) + 1);
            }
        }
        if (!isMap(node) || node.flow || !node.range) return;
        const mapColumn = columnOf(text, node.range[0]);
        for (const pair of node.items) {
            const value = pair.value as Node | null;
            if (!value?.range || !isScalar(pair.key) || !pair.key.range) continue;
            const keyColumn = columnOf(text, pair.key.range[0]);
            if (keyColumn !== mapColumn) continue;
            if (isMap(value) && !value.flow) {
                const step = columnOf(text, value.range[0]) - keyColumn;
                if (step > 0 && step <= 8) indents.set(step, (indents.get(step) ?? 0) + 1);
                samples++;
            } else if (isSeq(value) && !value.flow) {
                const dash = columnOf(text, value.range[0]);
                seqIndent.set(dash > keyColumn, (seqIndent.get(dash > keyColumn) ?? 0) + 1);
                samples++;
            }
        }
    });

    const style: FileStyle = {
        indent: mostCommon(indents, 2),
        indentSeq: mostCommon(seqIndent, true),
        pathQuote: mostCommon(quotes, "PLAIN"),
        eol: parsed.eol,
    };
    styleCache.set(parsed, style);
    return style;
};
