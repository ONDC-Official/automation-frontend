import type { Node } from "yaml";

import {
    resolveLocator,
    type Locator,
} from "@pages/protocol-studio/ui/editor/contracts/yaml/locate";
import { lineOf, type ParsedContract } from "@pages/protocol-studio/ui/editor/contracts/yaml/parse";
import { contentEnd } from "@pages/protocol-studio/ui/editor/contracts/yaml/plan";

/** The lines (1-based, inclusive) a node spans, its key included: for revealing it in Source. */
export const linesAt = (
    parsed: ParsedContract,
    loc: Locator
): { line: number; endLine: number } | null => {
    const located = resolveLocator(parsed.doc, loc);
    if (!located) return null;
    const key = located.pair?.key as Node | null | undefined;
    const start = key?.range?.[0] ?? located.node?.range?.[0];
    if (start === undefined) return null;
    const end = located.node?.range ? contentEnd(located.node) : start + 1;
    return { line: lineOf(parsed, start), endLine: lineOf(parsed, Math.max(start, end - 1)) };
};
