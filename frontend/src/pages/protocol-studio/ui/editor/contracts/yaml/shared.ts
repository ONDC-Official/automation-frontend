import { isAlias, isMap, isSeq, type Document, type Node } from "yaml";

import {
    pairKey,
    resolveLocator,
    type Locator,
} from "@pages/protocol-studio/ui/editor/contracts/yaml/locate";
import type { ParsedContract } from "@pages/protocol-studio/ui/editor/contracts/yaml/parse";

export interface AnchorUse {
    locator: Locator;
    /** Source offsets of the alias (`*name`). */
    range: [number, number];
}

export interface AnchorInfo {
    name: string;
    node: Node;
    locator: Locator;
    /** Every alias that refers to this definition (an anchor redefined later is a separate entry). */
    uses: AnchorUse[];
}

/** Walks every node with its locator (aliases are visited, never followed). */
export const walkNodes = (doc: Document, visit: (node: Node, loc: Locator) => void) => {
    const walk = (node: Node | null | undefined, loc: Locator) => {
        if (!node) return;
        visit(node, loc);
        if (isAlias(node)) return;
        if (isSeq(node)) {
            node.items.forEach((item, index) => walk(item as Node, [...loc, index]));
        } else if (isMap(node)) {
            for (const pair of node.items) walk(pair.value as Node, [...loc, pairKey(pair)]);
        }
    };
    walk(doc.contents as Node, []);
};

const censusCache = new WeakMap<Document, AnchorInfo[]>();

/** Every anchor in document order, with the aliases that resolve to it. */
export const anchorCensus = (parsed: ParsedContract): AnchorInfo[] => {
    const cached = censusCache.get(parsed.doc);
    if (cached) return cached;
    const anchors: AnchorInfo[] = [];
    // In document order an alias refers to the latest definition of its name.
    const latest = new Map<string, AnchorInfo>();
    walkNodes(parsed.doc, (node, loc) => {
        if (isAlias(node)) {
            const target = latest.get(node.source);
            const range = node.range ?? [0, 0];
            target?.uses.push({ locator: loc, range: [range[0], range[1]] });
            return;
        }
        if (node.anchor) {
            const info: AnchorInfo = { name: node.anchor, node, locator: loc, uses: [] };
            anchors.push(info);
            latest.set(node.anchor, info);
        }
    });
    censusCache.set(parsed.doc, anchors);
    return anchors;
};

export interface SharedImpact {
    /** The outermost shared definition the edit lands in. */
    anchor: string;
    definedAt: Locator;
    /** Where else the edit shows: the definition plus every alias of it. */
    uses: Locator[];
    /** The edit is under the shared node rather than on it. */
    viaAncestor: boolean;
    /** The path itself went through an alias (the user is looking at a use, not the definition). */
    throughAlias: boolean;
}

/**
 * Whether editing the node at `loc` also changes other places: it (or an
 * ancestor) is an anchor that is aliased, or the path crossed an alias.
 */
export const sharedImpact = (parsed: ParsedContract, loc: Locator): SharedImpact | null => {
    const census = anchorCensus(parsed);
    const byNode = new Map<Node, AnchorInfo>();
    for (const info of census) byNode.set(info.node, info);

    let outer: { info: AnchorInfo; depth: number } | null = null;
    let throughAlias = false;
    for (let depth = 0; depth <= loc.length; depth++) {
        const located = resolveLocator(parsed.doc, loc.slice(0, depth));
        if (!located) break;
        if (located.crossedAliases.length) throughAlias = true;
        let node = located.node;
        while (node && isAlias(node)) {
            throughAlias = true;
            node = (node.resolve(parsed.doc) as Node | undefined) ?? null;
        }
        const info = node ? byNode.get(node) : undefined;
        if (info && info.uses.length > 0 && !outer) outer = { info, depth };
    }
    if (!outer) return null;
    return {
        anchor: outer.info.name,
        definedAt: outer.info.locator,
        uses: [outer.info.locator, ...outer.info.uses.map((use) => use.locator)],
        viaAncestor: outer.depth < loc.length,
        throughAlias,
    };
};

/** Anchors defined inside `node` (itself included) that are aliased somewhere: removing or moving it would break them. */
export const aliasedAnchorsWithin = (parsed: ParsedContract, node: Node): string[] => {
    const census = anchorCensus(parsed);
    const inside = new Set<Node>();
    const collect = (n: Node | null | undefined) => {
        if (!n || isAlias(n)) return;
        inside.add(n);
        if (isSeq(n)) n.items.forEach((item) => collect(item as Node));
        else if (isMap(n)) for (const pair of n.items) collect(pair.value as Node);
    };
    collect(node);
    return census
        .filter((info) => inside.has(info.node) && info.uses.length > 0)
        .map((i) => i.name);
};
