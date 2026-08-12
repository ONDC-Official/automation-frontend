import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { useExportDashboardParticipantsMutation } from "@pages/business-dashboard/hooks/useExport";
import { useParticipant, useParticipants } from "@pages/business-dashboard/hooks/useParticipants";
import { useSessionFacets } from "@pages/business-dashboard/hooks/useSessions";
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
    // needed. npFacetFilters is what keeps this page's host search out of it.
    const facetsQuery = useSessionFacets(npFacetFilters(filters));

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

    const commit = useCallback(
        (next: NpFilters) => {
            setSearchParams(searchParamsFromNpFilters(next), { replace: true });
        },
        [setSearchParams]
    );

    /** Any filter change resets to page 1 — page 7 of the old slice is meaningless. */
    const onFilterChange = useCallback(
        (patch: Partial<NpFilters>) => {
            commit({ ...filters, ...patch, page: DEFAULT_PAGE });
        },
        [commit, filters]
    );

    const onRangeChange = useCallback(
        (range: IRange) =>
            commit({
                ...filters,
                from: range.from,
                to: range.to,
                page: DEFAULT_PAGE,
            }),
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
            sort: DEFAULT_NP_SORT,
            order: DEFAULT_NP_ORDER,
        });
    }, [commit, filters.limit]);

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

    const rows = useMemo(() => listQuery.data?.data ?? [], [listQuery.data]);

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
        total: listQuery.data?.total ?? 0,
        page: listQuery.data?.page ?? filters.page ?? DEFAULT_PAGE,
        limit: listQuery.data?.limit ?? filters.limit ?? DEFAULT_LIMIT,
        totalPages: listQuery.data?.totalPages ?? 0,
        isLoading: listQuery.isLoading,
        isFetching: listQuery.isFetching,
        isError: listQuery.isError,
        errorMessage: listQuery.error?.message,
        onRefresh: listQuery.refetch,

        facets: facetsQuery.data,
        isFacetsLoading: facetsQuery.isLoading,

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
