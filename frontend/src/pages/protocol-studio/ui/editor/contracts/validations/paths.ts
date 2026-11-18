/** Session data, not the payload: such paths have no schema field. */
export const isExternalPath = (path: string) => /^\$\._EXTERNAL\b/.test(path);

/**
 * A variable's path resolved against the rule's `_SCOPE_`, exactly as the
 * compiler does it (`mergePathWithScope`): `${scope}.${path.slice(2)}`.
 */
export const mergeScope = (path: string, scope?: string) => {
    if (!scope || isExternalPath(path)) return path;
    if (path === "$") return scope;
    return `${scope}.${path.slice(2)}`;
};

export interface CanonicalPath {
    /** `$.message.order.items[*].id`: indexes, `*` and filters all become `[*]`. */
    path: string;
    /** Filters that were folded away, e.g. `descriptor.code=='ROUTE_INFO'`. */
    filters: string[];
}

/**
 * A JSONPath's steps after `$`: names, `*`, indexes/slices, filters (`?(…)`,
 * kept whole) and `..`. Throws on unbalanced brackets or quotes.
 */
export const pathSteps = (path: string): string[] => {
    const steps: string[] = [];
    let i = 1;
    while (i < path.length) {
        const c = path[i];
        if (c === ".") {
            if (path[i + 1] === ".") {
                steps.push("..");
                i += 2;
                if (path[i] === "[") continue;
            } else i += 1;
            const name = /^[^.[\]]+/.exec(path.slice(i));
            if (!name) {
                if (path[i] === "[") continue;
                throw new Error(`Empty step at ${i}`);
            }
            steps.push(name[0]);
            i += name[0].length;
        } else if (c === "[") {
            let depth = 0;
            let quote: string | null = null;
            let j = i;
            for (; j < path.length; j++) {
                const ch = path[j];
                if (quote) {
                    if (ch === "\\") j++;
                    else if (ch === quote) quote = null;
                } else if (ch === "'" || ch === '"') quote = ch;
                else if (ch === "[" || ch === "(") depth++;
                else if (ch === "]" || ch === ")") {
                    depth--;
                    if (depth === 0) break;
                }
            }
            if (j >= path.length) throw new Error("Unclosed [");
            const inner = path.slice(i + 1, j).trim();
            const quoted = /^(['"])(.*)\1$/.exec(inner);
            steps.push(quoted ? (quoted[2] as string) : inner);
            i = j + 1;
        } else {
            throw new Error(`Unexpected "${c}" at ${i}`);
        }
    }
    return steps;
};

const cache = new Map<string, CanonicalPath | null>();

/**
 * One spelling per payload field, so tests and schema rows can be matched:
 * array steps (`[0]`, `[*]`, `[?(…)]`) collapse to `[*]`, quoted names are
 * unquoted. Recursive descent (`..`) is kept. Null when it isn't a JSONPath.
 */
export const canonicalPath = (path: string): CanonicalPath | null => {
    if (cache.has(path)) return cache.get(path) ?? null;
    let result: CanonicalPath | null = null;
    if (path.startsWith("$")) {
        try {
            const filters: string[] = [];
            let out = "$";
            for (const step of pathSteps(path)) {
                if (
                    step === "*" ||
                    /^-?\d+$/.test(step) ||
                    /^-?\d*:-?\d*(:-?\d+)?$/.test(step) ||
                    /^\d+(,\d+)+$/.test(step)
                ) {
                    out += "[*]";
                } else if (step.startsWith("?(") || step.startsWith("(")) {
                    filters.push(step.replace(/^\?\(|^\(|\)$/g, "").replace(/@\./g, ""));
                    out += "[*]";
                } else if (step === "..") {
                    out += "..";
                } else {
                    out += out.endsWith("..") ? step : `.${step}`;
                }
            }
            result = { path: out, filters };
        } catch {
            result = null;
        }
    }
    cache.set(path, result);
    if (cache.size > 5000) cache.delete(cache.keys().next().value as string);
    return result;
};

/** Every prefix of a canonical path (`$.a`, `$.a.b[*]`, …), for subtree counts. */
export const pathPrefixes = (path: string): string[] => {
    const out: string[] = [];
    const re = /\.[^.[\]]+|\[\*\]|\.\./g;
    let acc = "$";
    for (const match of path.slice(1).match(re) ?? []) {
        acc += match;
        if (match !== "..") out.push(acc);
    }
    return out;
};
