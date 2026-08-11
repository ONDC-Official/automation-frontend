export type QueryParamValue = string | number | boolean | undefined | null;

/**
 * Drops empty values so an untouched filter never widens the query string —
 * `{ domain: "", page: 1 }` becomes `{ page: 1 }`. Used by every hook that
 * forwards `SessionFilters` to the BFF, and by the sessions page when it
 * mirrors its filters into the URL.
 */
export function compactParams<T extends Record<string, QueryParamValue>>(
    params: T
): Record<string, string> {
    const out: Record<string, string> = {};

    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === "") continue;
        out[key] = String(value);
    }

    return out;
}

/** Pulls a filename out of a `Content-Disposition` header, if the BFF exposes one. */
export function filenameFromContentDisposition(header: string | undefined, fallback: string) {
    if (!header) return fallback;
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
    return match?.[1] ? decodeURIComponent(match[1]) : fallback;
}
