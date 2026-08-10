import { useCallback, useMemo, useState } from "react";

import { useReport, useReports } from "@dashboard/hooks/useReports";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "@dashboard/lib/sessionFilters";
import type { ReportFilters } from "@dashboard/services/types";
import { decodeReportHtml } from "./utils";

export function useReportsPage() {
    // Report sort fields are their own whitelist (createdAt, updatedAt, test_id,
    // total_tests, passed_tests); newest first is the only one the UI asks for.
    const [filters, setFilters] = useState<ReportFilters>({
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT,
        sort: "createdAt",
        order: "desc",
    });
    const [openTestId, setOpenTestId] = useState<string | null>(null);

    const listQuery = useReports(filters);
    const blobQuery = useReport(openTestId);

    const rows = useMemo(() => listQuery.data?.data ?? [], [listQuery.data]);

    const onSearch = useCallback(
        (q: string) =>
            setFilters((current) => ({
                ...current,
                q: q || undefined,
                page: DEFAULT_PAGE,
            })),
        []
    );

    const onUserFilter = useCallback(
        (userId: string) =>
            setFilters((current) => ({
                ...current,
                userId: userId || undefined,
                page: DEFAULT_PAGE,
            })),
        []
    );

    const reportHtml = useMemo(
        () => (blobQuery.data ? decodeReportHtml(blobQuery.data.data) : null),
        [blobQuery.data]
    );

    const onDownloadReport = useCallback(() => {
        if (!reportHtml || !openTestId) return;

        const url = URL.createObjectURL(new Blob([reportHtml], { type: "text/html" }));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${openTestId}.html`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    }, [reportHtml, openTestId]);

    const onPageChange = useCallback(
        (page: number) => setFilters((current) => ({ ...current, page })),
        []
    );

    const onLimitChange = useCallback(
        (limit: number) => setFilters((current) => ({ ...current, limit, page: DEFAULT_PAGE })),
        []
    );

    return {
        filters,
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

        openTestId,
        reportHtml,
        isBlobLoading: blobQuery.isLoading,
        isBlobError: blobQuery.isError,
        blobErrorMessage: blobQuery.error?.message,
        onOpenReport: setOpenTestId,
        onCloseReport: () => setOpenTestId(null),
        onDownloadReport,

        onSearch,
        onUserFilter,
        onPageChange,
        onLimitChange,
    };
}
