import { JSONPath } from "jsonpath-plus";

type JsonValue = null | boolean | number | string | object;

/**
 * Drop-in replacement for jsonpath.query() — returns an array of matches.
 */
export function queryJsonPath(data: unknown, path: string): unknown[] {
    if (!path.trim()) {
        return [];
    }

    const result = JSONPath({
        path,
        json: data as JsonValue,
        wrap: true,
    });

    return Array.isArray(result) ? result : result === undefined ? [] : [result];
}
