import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { useExportParticipants } from "@pages/business-dashboard/hooks/useExport";
import { useParticipant, useParticipants } from "@pages/business-dashboard/hooks/useParticipants";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "@pages/business-dashboard/lib/sessionFilters";
import {
    DEFAULT_NP_ORDER,
    DEFAULT_NP_SORT,
    hasActiveNpFilters,
    npFiltersFromSearchParams,
    searchParamsFromNpFilters,
    withoutNpPaging,
} from "@pages/business-dashboard/lib/npFilters";
import type { IRange } from "@pages/business-dashboard/components/DateRangePicker";
import type { NpFilters } from "@pages/business-dashboard/services/types";

export function useParticipantsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedHost, setSelectedHost] = useState<string | null>(null);

    // Filters live in the URL, so a filtered view is a shareable link — the same
    // contract the Sessions page keeps. No second copy in state.
    const serialised = searchParams.toString();
    const filters = useMemo(
        () => npFiltersFromSearchParams(new URLSearchParams(serialised)),
        [serialised]
    );

    const listQuery = useParticipants(filters);
    // The drill-down describes the same slice, so it takes the filters without
    // paging — page 3 of the list says nothing about one participant's totals.
    const detailFilters = useMemo(() => withoutNpPaging(filters), [filters]);
    const detailQuery = useParticipant(selectedHost, detailFilters);

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

    const { mutate: exportCsv, isPending: isDownloading } = useExportParticipants();

    /**
     * Downloads the whole filtered set, not the visible page — `filters` still
     * carries the sort, so the file arrives in the order on screen.
     */
    const onDownloadCsv = useCallback(() => {
        exportCsv(
            { filters },
            {
                onSuccess: () => toast.success("CSV downloaded"),
                onError: (error) =>
                    toast.error(error.message || "The export could not be generated"),
            }
        );
    }, [exportCsv, filters]);

    const rows = useMemo(() => listQuery.data?.data ?? [], [listQuery.data]);

    const selectedRow = useMemo(
        () => rows.find((row) => row.host === selectedHost) ?? null,
        [rows, selectedHost]
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

        selectedHost,
        // The list row shows instantly while the detail fetch is in flight.
        detail: detailQuery.data ?? null,
        selectedRow,
        isDetailLoading: detailQuery.isLoading,
        isDetailError: detailQuery.isError,
        detailErrorMessage: detailQuery.error?.message,
        onSelectHost: setSelectedHost,
        onCloseDetail: () => setSelectedHost(null),

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
