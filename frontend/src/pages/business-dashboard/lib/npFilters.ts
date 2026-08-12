import { compactParams } from "@pages/business-dashboard/lib/queryParams";
import {
    DEFAULT_LIMIT,
    DEFAULT_PAGE,
    MAX_LIMIT,
} from "@pages/business-dashboard/lib/sessionFilters";
import type { NpFilters } from "@pages/business-dashboard/services/types";

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
 *  default sort instead of 400-ing. The first four are the row's compound
 *  identity, and so double as the server's paging tiebreaker. */
export const NP_SORTABLE_FIELDS = [
    "host",
    "npType",
    "domain",
    "version",
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

/**
 * Wire value for a slice that recorded no role / domain / version.
 *
 * Mirrors NP_NULL_SENTINEL in automation-db/src/utils/npFilters.ts. Needed
 * because compactParams drops null and "" before they are ever sent, so a blank
 * slice has no other way to travel as a filter.
 */
export const NP_NULL_SENTINEL = "__none__";

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

/**
 * Filters for the shared `/api/sessions/facets` endpoint.
 *
 * Two things are stripped, because that endpoint is parsed by `parseSessionQuery`
 * and not by the participants' own `parseNpQuery`:
 *
 * - `q`, which there is a partial *sessionId* match while this page means a
 *   partial *host* by it. Passing it would narrow every dropdown by a string
 *   that matches no session id.
 * - `NP_NULL_SENTINEL`, which only `parseNpQuery` translates back to "no value
 *   recorded". `parseSessionQuery` would match the literal string `__none__`,
 *   find nothing, and empty every dropdown — so selecting "None recorded" for
 *   Domain would wipe out the Version options too.
 */
export function npFacetFilters(filters: NpFilters): NpFilters {
    const { q, npType, domain, version, ...rest } = withoutNpPaging(filters);
    void q;

    const realValue = (value?: string) => (value === NP_NULL_SENTINEL ? undefined : value);

    return {
        ...rest,
        npType: realValue(npType),
        domain: realValue(domain),
        version: realValue(version),
    };
}
