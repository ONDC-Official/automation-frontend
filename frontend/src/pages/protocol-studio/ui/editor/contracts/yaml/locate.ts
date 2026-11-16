import {
    isAlias,
    isMap,
    isScalar,
    isSeq,
    type Alias,
    type Document,
    type Node,
    type Pair,
} from "yaml";

/** A path into a contract file: map keys and sequence indexes, e.g. `["_TESTS_", "search", 3]`. */
export type Locator = (string | number)[];

export interface Located {
    node: Node | null;
    /** The pair holding `node`, when its parent is a map. */
    pair?: Pair;
    parent: Node | null;
    /** Aliases the path went through: an edit here lands on every use of their anchors. */
    crossedAliases: Alias[];
}

const keyOf = (pair: Pair) => (isScalar(pair.key) ? pair.key.value : pair.key);

/** The pair of `map` whose key is `key` (`"null"` also matches a YAML `null` key). */
export const findPair = (map: Node, key: string | number): Pair | undefined => {
    if (!isMap(map)) return undefined;
    return map.items.find((pair) => {
        const k = keyOf(pair);
        return k === key || (k === null && key === "null") || String(k) === String(key);
    }) as Pair | undefined;
};

/**
 * Walks `loc` through the document, following aliases (`doc.getIn` doesn't).
 * Returns null when the path doesn't resolve.
 */
export const resolveLocator = (doc: Document, loc: Locator): Located | null => {
    let node = doc.contents as Node | null;
    let parent: Node | null = null;
    let pair: Pair | undefined;
    const crossedAliases: Alias[] = [];
    for (const step of loc) {
        while (node && isAlias(node)) {
            crossedAliases.push(node);
            node = (node.resolve(doc) as Node | undefined) ?? null;
        }
        if (!node) return null;
        parent = node;
        if (isSeq(node) && typeof step === "number") {
            if (step < 0 || step >= node.items.length) return null;
            node = (node.items[step] as Node | null) ?? null;
            pair = undefined;
        } else if (isMap(node)) {
            pair = findPair(node, step);
            if (!pair) return null;
            node = (pair.value as Node | null) ?? null;
        } else {
            return null;
        }
    }
    return { node, pair, parent, crossedAliases };
};

/** The node at `loc` with aliases followed to their anchored source. */
export const resolveTarget = (doc: Document, loc: Locator) => {
    const located = resolveLocator(doc, loc);
    if (!located) return null;
    let node = located.node;
    const crossed = [...located.crossedAliases];
    while (node && isAlias(node)) {
        crossed.push(node);
        node = (node.resolve(doc) as Node | undefined) ?? null;
    }
    return { ...located, node, crossedAliases: crossed };
};

/** Key of a pair as a string, for display (`null` → `"null"`). */
export const pairKey = (pair: Pair): string => {
    const k = keyOf(pair);
    return k === null ? "null" : String(k);
};
