export type JsonKind = "object" | "array" | "string" | "number" | "boolean" | "null";

export function kindOf(value: unknown): JsonKind {
    if (value === null || value === undefined) return "null";
    if (Array.isArray(value)) return "array";
    switch (typeof value) {
        case "object":
            return "object";
        case "number":
            return "number";
        case "boolean":
            return "boolean";
        default:
            return "string";
    }
}

export function isBranch(value: unknown) {
    const kind = kindOf(value);
    return kind === "object" || kind === "array";
}

export function entriesOf(value: unknown): Array<[string, unknown]> {
    if (Array.isArray(value)) {
        return value.map((item, index) => [String(index), item]);
    }
    if (value && typeof value === "object") {
        return Object.entries(value as Record<string, unknown>);
    }
    return [];
}

/** `{ 3 keys }` / `[ 12 items ]` — the closed-branch preview. */
export function summarise(value: unknown) {
    const count = entriesOf(value).length;
    if (Array.isArray(value)) {
        return `[ ${count} ${count === 1 ? "item" : "items"} ]`;
    }
    return `{ ${count} ${count === 1 ? "key" : "keys"} }`;
}

/** Every branch path down to `maxDepth`, used to seed the expanded set. */
export function pathsToDepth(value: unknown, maxDepth: number, path = "$") {
    const paths: string[] = [];

    const walk = (node: unknown, currentPath: string, depth: number) => {
        if (depth > maxDepth || !isBranch(node)) return;
        paths.push(currentPath);
        for (const [key, child] of entriesOf(node)) {
            walk(child, `${currentPath}.${key}`, depth + 1);
        }
    };

    walk(value, path, 0);
    return paths;
}

/** Branch paths whose key or leaf value matches `needle`, so search auto-opens them. */
export function pathsMatching(value: unknown, needle: string, path = "$") {
    const query = needle.trim().toLowerCase();
    if (!query) return [];

    const matches: string[] = [];

    const walk = (node: unknown, currentPath: string): boolean => {
        if (!isBranch(node)) {
            return String(node).toLowerCase().includes(query);
        }

        let hit = false;
        for (const [key, child] of entriesOf(node)) {
            const childHit =
                key.toLowerCase().includes(query) || walk(child, `${currentPath}.${key}`);
            hit = hit || childHit;
        }
        if (hit) matches.push(currentPath);
        return hit;
    };

    walk(value, path);
    return matches;
}

export function matchesSearch(key: string, value: unknown, needle: string) {
    const query = needle.trim().toLowerCase();
    if (!query) return false;
    if (key.toLowerCase().includes(query)) return true;
    if (isBranch(value)) return false;
    return String(value).toLowerCase().includes(query);
}
