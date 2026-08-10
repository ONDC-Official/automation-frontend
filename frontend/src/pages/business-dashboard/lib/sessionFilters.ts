import type { SessionFilters, SessionResult } from "@dashboard/services/types";
import { compactParams } from "./queryParams";

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 500;
export const DEFAULT_SORT = "createdAt";
export const DEFAULT_ORDER: NonNullable<SessionFilters["order"]> = "desc";

/**
 * Server-side whitelist — anything else is a 400, not a silent fallback. Parsed
 * URLs are clamped to this list so a hand-edited or stale link degrades to the
 * default sort instead of erroring the whole page.
 */
export const SORTABLE_FIELDS = [
    "createdAt",
    "updatedAt",
    "sessionId",
    "domain",
    "version",
    "npType",
    "sessionType",
    "flowsTotal",
    "flowsPassed",
    "flowsFailed",
    "passRate",
] as const;

const RESULTS: SessionResult[] = ["PASS", "FAIL", "MIXED"];

/**
 * The sessions filter shape, serialised to and from the URL query string.
 * Lives in `lib/` rather than the sessions page because the export page reads
 * the exact same slice — that is what makes "download what I'm looking at" a
 * single call with identical params.
 */
export function filtersFromSearchParams(params: URLSearchParams): SessionFilters {
    const read = (key: string) => params.get(key) || undefined;
    const readNumber = (key: string, fallback: number, max?: number) => {
        const parsed = Number(params.get(key));
        if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
        return max === undefined ? parsed : Math.min(parsed, max);
    };
    const rawResult = read("result");
    const rawReportExists = read("reportExists");
    const rawOrder = read("order");
    const rawSort = read("sort");

    return {
        from: read("from"),
        to: read("to"),
        npType: read("npType"),
        npId: read("npId"),
        domain: read("domain"),
        version: read("version"),
        sessionType: read("sessionType"),
        usecaseId: read("usecaseId"),
        userId: read("userId"),
        reportExists: rawReportExists === undefined ? undefined : rawReportExists === "true",
        result: RESULTS.includes(rawResult as SessionResult)
            ? (rawResult as SessionResult)
            : undefined,
        q: read("q"),
        page: readNumber("page", DEFAULT_PAGE),
        limit: readNumber("limit", DEFAULT_LIMIT, MAX_LIMIT),
        sort: SORTABLE_FIELDS.includes(rawSort as (typeof SORTABLE_FIELDS)[number])
            ? rawSort
            : DEFAULT_SORT,
        order: rawOrder === "asc" ? "asc" : DEFAULT_ORDER,
    };
}

/** The inverse — empty values are dropped so the URL only carries real filters. */
export function searchParamsFromFilters(filters: SessionFilters) {
    return compactParams({ ...filters });
}

/** True when anything beyond paging/sorting defaults is set. */
export function hasActiveFilters(filters: SessionFilters) {
    const { page, limit, sort, order, ...rest } = filters;
    void page;
    void limit;
    void sort;
    void order;
    return Object.values(rest).some(
        (value) => value !== undefined && value !== null && value !== ""
    );
}

/** Filters minus paging — what stats and export care about. */
export function withoutPaging(filters: SessionFilters): SessionFilters {
    const { page, limit, sort, order, ...rest } = filters;
    void page;
    void limit;
    void sort;
    void order;
    return rest;
}
