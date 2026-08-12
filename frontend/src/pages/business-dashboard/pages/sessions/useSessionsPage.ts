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
import { useStableQueryData } from "@pages/business-dashboard/hooks/useStableQueryData";
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

    /**
     * Merges a patch over the filters currently in the address bar and writes
     * the whole set back.
     *
     * The merge base is `window.location.search`, deliberately not the `filters`
     * this render closed over: react-router commits URL state inside a React
     * transition, so a second change made before the first has committed would
     * merge over a stale snapshot and silently clobber it.
     */
    const commit = useCallback(
        (patch: Partial<SessionFilters>) => {
            const live = filtersFromSearchParams(new URLSearchParams(window.location.search));
            setSearchParams(searchParamsFromFilters({ ...live, ...patch }), { replace: true });
        },
        [setSearchParams]
    );

    /** Any filter change resets to page 1 — page 7 of the old slice is meaningless. */
    const onFilterChange = useCallback(
        (patch: Partial<SessionFilters>) => commit({ ...patch, page: DEFAULT_PAGE }),
        [commit]
    );

    const onPageChange = useCallback((page: number) => commit({ page }), [commit]);

    const onLimitChange = useCallback(
        (limit: number) => commit({ limit, page: DEFAULT_PAGE }),
        [commit]
    );

    const onSortChange = useCallback(
        (sort: string) => {
            const order = filters.sort === sort && filters.order === "desc" ? "asc" : "desc";
            commit({ sort, order, page: DEFAULT_PAGE });
        },
        [commit, filters.sort, filters.order]
    );

    /** Clears every filter, so this REPLACES — a patch through `commit` could
     *  never remove a key. */
    const onReset = useCallback(() => {
        setSearchParams(
            searchParamsFromFilters({
                page: DEFAULT_PAGE,
                limit: filters.limit,
                sort: DEFAULT_SORT,
                order: DEFAULT_ORDER,
            }),
            { replace: true }
        );
    }, [setSearchParams, filters.limit]);

    // Keeps the page on screen while the next one loads; see the hook for why.
    const stable = useStableQueryData(sessionsQuery.data);
    const stableFacets = useStableQueryData(facetsQuery.data);

    const rows = useMemo(() => stable?.data ?? [], [stable]);

    const selectedRow = useMemo(
        () => rows.find((row) => row.sessionId === selectedSessionId) ?? null,
        [rows, selectedSessionId]
    );

    return {
        filters,
        /** the live query string, handed to the Export page so it opens the same slice */
        exportSearch: serialised,
        facets: stableFacets,
        // Only the very first load disables the dropdowns; re-keying them on
        // every filter change used to grey them out mid-interaction.
        isFacetsLoading: facetsQuery.isLoading && !stableFacets,
        isFiltered: hasActiveFilters(filters),

        rows,
        total: stable?.total ?? 0,
        page: stable?.page ?? filters.page ?? DEFAULT_PAGE,
        limit: stable?.limit ?? filters.limit ?? DEFAULT_LIMIT,
        totalPages: stable?.totalPages ?? 0,
        // Cold start only; a page or filter change lands in isPending instead,
        // with the previous rows still on screen.
        isLoading: sessionsQuery.isLoading && !stable,
        isPending: sessionsQuery.isFetching,
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
