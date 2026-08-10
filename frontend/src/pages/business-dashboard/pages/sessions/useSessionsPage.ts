import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
    useSession,
    useSessionFacets,
    useSessions,
} from "@pages/business-dashboard/hooks/useSessions";
import {
    DEFAULT_LIMIT,
    DEFAULT_ORDER,
    DEFAULT_PAGE,
    DEFAULT_SORT,
    filtersFromSearchParams,
    hasActiveFilters,
    searchParamsFromFilters,
    withoutPaging,
} from "@pages/business-dashboard/lib/sessionFilters";
import type { SessionFilters } from "@pages/business-dashboard/services/types";

export function useSessionsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

    // Filters live in the URL, so a filtered view is a shareable link. The page
    // never keeps a second copy in state — the query string is the source of truth.
    const serialised = searchParams.toString();
    const filters = useMemo(
        () => filtersFromSearchParams(new URLSearchParams(serialised)),
        [serialised]
    );

    const sessionsQuery = useSessions(filters);
    // Facets narrow to the current selection, so the dropdowns only ever offer
    // values that still return rows. Paging is irrelevant to them.
    const facetsQuery = useSessionFacets(withoutPaging(filters));
    const detailQuery = useSession(selectedSessionId);

    const commit = useCallback(
        (next: SessionFilters) => {
            setSearchParams(searchParamsFromFilters(next), { replace: true });
        },
        [setSearchParams]
    );

    /** Any filter change resets to page 1 — page 7 of the old slice is meaningless. */
    const onFilterChange = useCallback(
        (patch: Partial<SessionFilters>) => {
            commit({ ...filters, ...patch, page: DEFAULT_PAGE });
        },
        [commit, filters]
    );

    const onPageChange = useCallback(
        (page: number) => commit({ ...filters, page }),
        [commit, filters]
    );

    const onLimitChange = useCallback(
        (limit: number) => commit({ ...filters, limit, page: DEFAULT_PAGE }),
        [commit, filters]
    );

    const onSortChange = useCallback(
        (sort: string) => {
            const order = filters.sort === sort && filters.order === "desc" ? "asc" : "desc";
            commit({ ...filters, sort, order, page: DEFAULT_PAGE });
        },
        [commit, filters]
    );

    const onReset = useCallback(() => {
        commit({
            page: DEFAULT_PAGE,
            limit: filters.limit,
            sort: DEFAULT_SORT,
            order: DEFAULT_ORDER,
        });
    }, [commit, filters.limit]);

    const rows = useMemo(() => sessionsQuery.data?.data ?? [], [sessionsQuery.data]);

    const selectedRow = useMemo(
        () => rows.find((row) => row.sessionId === selectedSessionId) ?? null,
        [rows, selectedSessionId]
    );

    return {
        filters,
        /** the live query string, handed to the Export page so it opens the same slice */
        exportSearch: serialised,
        facets: facetsQuery.data,
        isFacetsLoading: facetsQuery.isLoading,
        isFiltered: hasActiveFilters(filters),

        rows,
        total: sessionsQuery.data?.total ?? 0,
        page: sessionsQuery.data?.page ?? filters.page ?? DEFAULT_PAGE,
        limit: sessionsQuery.data?.limit ?? filters.limit ?? DEFAULT_LIMIT,
        totalPages: sessionsQuery.data?.totalPages ?? 0,
        isLoading: sessionsQuery.isLoading,
        isFetching: sessionsQuery.isFetching,
        isError: sessionsQuery.isError,
        errorMessage: sessionsQuery.error?.message,
        onRefresh: sessionsQuery.refetch,

        selectedSessionId,
        selectedRow,
        detail: detailQuery.data ?? selectedRow,
        isDetailLoading: detailQuery.isLoading,
        isDetailError: detailQuery.isError,
        onSelectSession: setSelectedSessionId,
        onCloseDetail: () => setSelectedSessionId(null),

        onFilterChange,
        onPageChange,
        onLimitChange,
        onSortChange,
        onReset,
    };
}
