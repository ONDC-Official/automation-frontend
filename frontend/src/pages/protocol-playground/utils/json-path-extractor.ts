/**
 * Standalone JSON-path extractor for a ValidationConfig.
 *
 * Self-contained: NO imports from the rest of the codebase, so this file can be
 * copied as-is into another project. The only optional dependency is Node's
 * `fs`, dynamically imported inside the CLI block (never touched when used as a
 * library / in the browser).
 *
 * Given a ValidationConfig it returns `Record<string, string[]>` keyed by each
 * top-level `_TESTS_` base key (e.g. "search", "on_search"), mapping to the
 * deduped set of full JSON paths referenced by that test tree. For each test
 * (recursing into nested `_RETURN_` arrays) it:
 *  - collects variable values that are JSON paths (strings starting with `$`),
 *  - merges the test's own `_SCOPE_` into the path to form the end path,
 *  - normalizes filter-query syntax `[?(@.x=='y')]` into `[*]`,
 *  - ignores `$._EXTERNAL` (session-data) paths.
 */

// ---------------------------------------------------------------------------
// Minimal local types (kept loose so they don't depend on the source repo).
// ---------------------------------------------------------------------------
type Primitive = number | string | boolean | null;
type ConfigVariable = string | Primitive[];

export type TestObject = {
    _NAME_?: string;
    _RETURN_?: string | TestObject[];
    _SCOPE_?: string;
    [key: string]: ConfigVariable | number | TestObject[] | undefined;
};

export type ValidationConfig = {
    _TESTS_: Record<string, TestObject[]>;
    [key: string]: unknown;
};

// ---------------------------------------------------------------------------
// Inlined constants (mirror src/constants/syntax.ts).
// ---------------------------------------------------------------------------
const TESTS_KEY = "_TESTS_";
const RETURN_KEY = "_RETURN_";
const SCOPE_KEY = "_SCOPE_";
const EXTERNAL_PREFIX = "$._EXTERNAL";

// Reserved TestObject keys — everything else on a test is a "variable".
const RESERVED_KEYS = new Set([
    "_NAME_",
    "_RETURN_",
    "_SCOPE_",
    "_CONTINUE_",
    "_ERROR_CODE_",
    "_SUCCESS_CODE_",
    "_DESCRIPTION_",
]);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function extractJsonPaths(
    config: ValidationConfig,
): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    const tests = config[TESTS_KEY] ?? {};
    for (const baseKey in tests) {
        const acc = new Set<string>();
        for (const test of tests[baseKey]) collectPaths(test, acc);
        out[baseKey] = [...acc];
    }
    return out;
}

function collectPaths(test: TestObject, acc: Set<string>) {
    const scope =
        typeof test[SCOPE_KEY] === "string" ? (test[SCOPE_KEY] as string) : undefined;
    for (const key of Object.keys(test)) {
        if (RESERVED_KEYS.has(key)) continue; // reserved => not a variable
        const value = test[key];
        if (typeof value !== "string" || !value.startsWith("$")) continue;
        if (value.startsWith(EXTERNAL_PREFIX)) continue; // ignore session-data paths
        acc.add(replaceBracketsWithAsteriskNested(mergeScope(value, scope)));
    }
    const ret = test[RETURN_KEY];
    if (Array.isArray(ret)) {
        for (const child of ret) collectPaths(child, acc);
    }
}

/**
 * Merges a variable path onto its test's scope, mirroring the validator
 * (src/generator/validators/tests-config/sub-validations.ts). Scope is applied
 * per-test and is NOT inherited by nested tests.
 */
function mergeScope(path: string, scope?: string): string {
    if (!scope) return path;
    const rel = cleanseDollarDot(path);
    return rel.startsWith("[") ? `${scope}${rel}` : `${scope}.${rel}`;
}

function cleanseDollarDot(path: string): string {
    if (path.startsWith("$.")) return path.slice(2).trim();
    if (path.startsWith("$")) return path.slice(1).trim();
    return path.trim();
}

/**
 * Replaces JSONPath filter-query expressions (`[?(@.field=='x')]`) with `[*]`,
 * handling nested brackets. Plain `[*]` and other segments are preserved.
 */
export function replaceBracketsWithAsteriskNested(jsonPath: string): string {
    let result = "";
    let i = 0;
    while (i < jsonPath.length) {
        if (jsonPath[i] === "[" && jsonPath.substring(i).startsWith("[?(@.")) {
            let bracketDepth = 1;
            let j = i + 1;
            while (j < jsonPath.length && bracketDepth > 0) {
                if (jsonPath[j] === "[") bracketDepth++;
                else if (jsonPath[j] === "]") bracketDepth--;
                j++;
            }
            result += "[*]";
            i = j;
        } else {
            result += jsonPath[i];
            i++;
        }
    }
    return result;
}
