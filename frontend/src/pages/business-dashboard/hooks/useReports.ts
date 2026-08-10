import httpClient from "@dashboard/services/httpClient";
import { compactParams } from "@dashboard/lib/queryParams";
import type { ApiError } from "@dashboard/services/httpClient";
import type { ReportBlob, ReportFilters, ReportListResponse } from "@dashboard/services/types";
import { useGet } from "./useGet";

export const reportKeys = {
    all: ["reports"] as const,
    list: (filters: ReportFilters) => ["reports", "list", filters] as const,
    detail: (testId: string) => ["reports", "detail", testId] as const,
};

/**
 * `GET /report/` now answers an empty list with a 200 and an empty envelope, so
 * this is belt-and-braces: the legacy `/report/user/:userId` handler still 404s
 * with `{error:"No reports found for user"}` on empty. If that route is ever
 * put back on the proxy, "no rows" still lands as an EmptyState here rather
 * than as an error toast at the call site.
 */
function isEmptyListNotFound(error: ApiError) {
    return error.status === 404 && /no reports found/i.test(error.message);
}

function emptyReportList(filters: ReportFilters): ReportListResponse {
    return {
        data: [],
        total: 0,
        page: filters.page ?? 1,
        limit: filters.limit ?? 0,
        totalPages: 0,
    };
}

/** `GET /report/?<page,limit,userId,q,sort,order>` */
export function useReports(filters: ReportFilters) {
    return useGet<ReportListResponse>(reportKeys.list(filters), async () => {
        try {
            const response = await httpClient.get<ReportListResponse>("/report/", {
                params: compactParams({ ...filters }),
            });
            return response.data;
        } catch (error) {
            if (isEmptyListNotFound(error as ApiError)) return emptyReportList(filters);
            throw error;
        }
    });
}

/**
 * `GET /report/:testId` — `data` is a base64 HTML blob out of GridFS. It stays
 * base64 here; `ReportViewer` hands it to a sandboxed iframe rather than the DOM.
 */
export function useReport(testId: string | null) {
    return useGet<ReportBlob>(
        reportKeys.detail(testId ?? ""),
        async () => (await httpClient.get<ReportBlob>(`/report/${testId}`)).data,
        { enabled: Boolean(testId) }
    );
}
