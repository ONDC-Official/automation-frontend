import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { useExportDashboardParticipantsMutation } from "@pages/business-dashboard/hooks/useExport";
import { useParticipant, useParticipants } from "@pages/business-dashboard/hooks/useParticipants";
import { useSessionFacets } from "@pages/business-dashboard/hooks/useSessions";
import { useStableQueryData } from "@pages/business-dashboard/hooks/useStableQueryData";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "@pages/business-dashboard/lib/sessionFilters";
import {
    DEFAULT_NP_ORDER,
    DEFAULT_NP_SORT,
    hasActiveNpFilters,
    NP_NULL_SENTINEL,
    npFacetFilters,
    npFiltersFromSearchParams,
    searchParamsFromNpFilters,
    withoutNpPaging,
} from "@pages/business-dashboard/lib/npFilters";
import type { IRange } from "@components/DateRangePicker";
import type { NpFilters, ParticipantRow } from "@pages/business-dashboard/services/types";
import { participantKey, selectionOf, type ParticipantSelection } from "./utils";

export function useParticipantsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [selection, setSelection] = useState<ParticipantSelection | null>(null);

    // Filters live in the URL, so a filtered view is a shareable link — the same
    // contract the Sessions page keeps. No second copy in state.
    const serialised = searchParams.toString();
    const filters = useMemo(
        () => npFiltersFromSearchParams(new URLSearchParams(serialised)),
        [serialised]
    );

    const listQuery = useParticipants(filters);

    // Domain and version are session dimensions, so the sessions facets endpoint
    // already offers exactly the right options — no participants-specific one is
    // needed. npFacetFilters is what keeps this page's host search, and its
    // blank-slice sentinel, out of a query that understands neither.
    const facetsQuery = useSessionFacets(npFacetFilters(filters));
    const stableFacets = useStableQueryData(facetsQuery.data);

    /**
     * The drill-down describes the row that was clicked, not everything the
     * host ever ran. Paging goes — page 3 of the list says nothing about one
     * row's totals — and the three identity fields are pinned on top.
     *
     * Those three are a pre-group match on the server, so pinning them leaves
     * the grouped set holding exactly one row for this host, and scopes the
     * drawer's recent sessions and flow verdicts to the same slice for free.
     */
    const detailFilters = useMemo<NpFilters>(() => {
        const base = withoutNpPaging(filters);
        if (!selection) return base;
        return {
            ...base,
            npType: selection.npType ?? NP_NULL_SENTINEL,
            domain: selection.domain ?? NP_NULL_SENTINEL,
            version: selection.version ?? NP_NULL_SENTINEL,
        };
    }, [filters, selection]);

    const detailQuery = useParticipant(selection?.host ?? null, detailFilters);

    /**
     * Merges a patch over the filters currently in the address bar and writes
     * the whole set back.
     *
     * The merge base is `window.location.search`, deliberately not the
     * `filters` this render closed over. react-router commits URL state inside
     * a React transition, so a second change made before the first has
     * committed would otherwise merge over a stale snapshot and silently clobber
     * the first — picking a role right after typing in the search box would drop
     * one of the two. Reading the live URL makes each commit last-write-wins on
     * its own key instead of on the whole query string.
     */
    const commit = useCallback(
        (patch: Partial<NpFilters>) => {
            const live = npFiltersFromSearchParams(new URLSearchParams(window.location.search));
            setSearchParams(searchParamsFromNpFilters({ ...live, ...patch }), { replace: true });
        },
        [setSearchParams]
    );

    /** Any filter change resets to page 1 — page 7 of the old slice is meaningless. */
    const onFilterChange = useCallback(
        (patch: Partial<NpFilters>) => commit({ ...patch, page: DEFAULT_PAGE }),
        [commit]
    );

    const onRangeChange = useCallback(
        (range: IRange) => commit({ from: range.from, to: range.to, page: DEFAULT_PAGE }),
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

    /**
     * Clears every filter. This one REPLACES rather than merging — `commit`
     * merges over the live URL, so a patch could never remove a key.
     */
    const onReset = useCallback(() => {
        setSearchParams(
            searchParamsFromNpFilters({
                page: DEFAULT_PAGE,
                limit: filters.limit,
                sort: DEFAULT_NP_SORT,
                order: DEFAULT_NP_ORDER,
            }),
            { replace: true }
        );
    }, [setSearchParams, filters.limit]);

    const [exportCsv, { isLoading: isDownloading }] = useExportDashboardParticipantsMutation();

    /**
     * Downloads the whole filtered set, not the visible page — `filters` still
     * carries the sort, so the file arrives in the order on screen.
     */
    const onDownloadCsv = useCallback(() => {
        exportCsv({ filters })
            .unwrap()
            .then(() => toast.success("CSV downloaded"))
            .catch((error) => toast.error(error?.message || "The export could not be generated"));
    }, [exportCsv, filters]);

    // Keeps the page on screen while the next one loads; see the hook for why.
    const stable = useStableQueryData(listQuery.data);

    const rows = useMemo(() => stable?.data ?? [], [stable]);

    const selectedKey = useMemo(() => (selection ? participantKey(selection) : null), [selection]);

    const selectedRow = useMemo(
        () => rows.find((row) => participantKey(selectionOf(row)) === selectedKey) ?? null,
        [rows, selectedKey]
    );

    return {
        filters,
        range: useMemo<IRange>(
            () => ({ from: filters.from, to: filters.to }),
            [filters.from, filters.to]
        ),
        isFiltered: hasActiveNpFilters(filters),

        rows,
        total: stable?.total ?? 0,
        page: stable?.page ?? filters.page ?? DEFAULT_PAGE,
        limit: stable?.limit ?? filters.limit ?? DEFAULT_LIMIT,
        totalPages: stable?.totalPages ?? 0,
        // Cold start only — there is genuinely nothing to show yet, so the
        // skeleton is honest. A page or filter change now lands in isPending
        // instead, with the previous rows still on screen.
        isLoading: listQuery.isLoading && !stable,
        isPending: listQuery.isFetching,
        isError: listQuery.isError,
        errorMessage: listQuery.error?.message,
        onRefresh: listQuery.refetch,

        facets: stableFacets,
        // Only the very first facets load disables the dropdowns. Re-keying them
        // on every role change used to grey Domain and Version out until the
        // round trip finished, which read as the filter bar being broken.
        isFacetsLoading: facetsQuery.isLoading && !stableFacets,

        selection,
        selectedKey,
        // The list row shows instantly while the detail fetch is in flight.
        detail: detailQuery.data ?? null,
        selectedRow,
        isDetailLoading: detailQuery.isLoading,
        isDetailError: detailQuery.isError,
        detailErrorMessage: detailQuery.error?.message,
        onSelectRow: (row: ParticipantRow) => setSelection(selectionOf(row)),
        onCloseDetail: () => setSelection(null),

        onFilterChange,
        onRangeChange: onRangeChange,
        onPageChange,
        onLimitChange,
        onSortChange,
        onReset,

        isDownloading,
        onDownloadCsv,
    };
}
