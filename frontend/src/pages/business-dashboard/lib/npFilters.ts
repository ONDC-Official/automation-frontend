import { compactParams } from "@dashboard/lib/queryParams";
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from "@dashboard/lib/sessionFilters";
import type { NpFilters } from "@dashboard/services/types";

/**
 * URL <-> filter translation for the participants page, mirroring
 * sessionFilters.ts.
 *
 * Copied rather than parameterised, for the reason that file gives: the sort
 * whitelist is different (every participant column is computed by the
 * aggregation, none is a stored session field), so a shared helper would have
 * to know about both anyway.
 */

/** Client mirror of the server whitelist, so a hand-edited URL degrades to the
 *  default sort instead of 400-ing. */
export const NP_SORTABLE_FIELDS = [
    "host",
    "sessions",
    "firstSessionAt",
    "lastSessionAt",
    "firstPayloadAt",
    "flowsAttempted",
    "flowsJudged",
    "flowsPassed",
    "flowsFailed",
    "passRate",
] as const;

export const DEFAULT_NP_SORT = "sessions";
export const DEFAULT_NP_ORDER = "desc" as const;

export function npFiltersFromSearchParams(params: URLSearchParams): NpFilters {
    const read = (key: string) => params.get(key) || undefined;

    const readNumber = (key: string, fallback: number, max?: number) => {
        const parsed = Number(params.get(key));
        if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
        return max === undefined ? parsed : Math.min(parsed, max);
    };

    const rawSort = read("sort");
    const rawOrder = read("order");

    return {
        from: read("from"),
        to: read("to"),
        npType: read("npType"),
        domain: read("domain"),
        version: read("version"),
        sessionType: read("sessionType"),
        q: read("q"),
        page: readNumber("page", DEFAULT_PAGE),
        limit: readNumber("limit", DEFAULT_LIMIT, MAX_LIMIT),
        sort: NP_SORTABLE_FIELDS.includes(rawSort as (typeof NP_SORTABLE_FIELDS)[number])
            ? rawSort
            : DEFAULT_NP_SORT,
        order: rawOrder === "asc" ? "asc" : DEFAULT_NP_ORDER,
    };
}

export function searchParamsFromNpFilters(filters: NpFilters) {
    return compactParams({ ...filters });
}

export function hasActiveNpFilters(filters: NpFilters) {
    const { page, limit, sort, order, ...rest } = filters;
    void page;
    void limit;
    void sort;
    void order;
    return Object.values(rest).some(
        (value) => value !== undefined && value !== null && value !== ""
    );
}

/** Strips paging, for the calls that describe the whole filtered set. */
export function withoutNpPaging(filters: NpFilters): NpFilters {
    const { page, limit, sort, order, ...rest } = filters;
    void page;
    void limit;
    void sort;
    void order;
    return rest;
}
