import { dashboardApi } from "@store/api/dashboard/dashboardApi";
import { compactParams } from "@pages/business-dashboard/lib/queryParams";
import type {
    ReportBlob,
    ReportFilters,
    ReportListResponse,
} from "@pages/business-dashboard/services/types";
import type { IAxiosBaseQueryError } from "@store/api/shared/axiosBaseQuery";

/**
 * `GET /report/` answers an empty list with a 200 and an empty envelope, so this
 * is belt-and-braces: the legacy `/report/user/:userId` handler still 404s with
 * `{error:"No reports found for user"}` on empty. If that route is ever put back
 * on the proxy, "no rows" still lands as an empty state rather than an error.
 */
const isEmptyListNotFound = (error: IAxiosBaseQueryError) =>
    error.status === 404 && /no reports found/i.test(error.message ?? "");

const emptyReportList = (filters: ReportFilters): ReportListResponse => ({
    data: [],
    total: 0,
    page: filters.page ?? 1,
    limit: filters.limit ?? 0,
    totalPages: 0,
});

export const dashboardReportsApi = dashboardApi.injectEndpoints({
    endpoints: (builder) => ({
        getDashboardReports: builder.query<ReportListResponse, ReportFilters>({
            queryFn: async (filters, _api, _extra, baseQuery) => {
                const result = await baseQuery({
                    url: "/report/",
                    method: "GET",
                    params: compactParams({ ...filters }),
                });

                if (result.error) {
                    const error = result.error as IAxiosBaseQueryError;
                    if (isEmptyListNotFound(error)) return { data: emptyReportList(filters) };
                    return { error };
                }

                return { data: result.data as ReportListResponse };
            },
            providesTags: ["DashboardReport"],
        }),

        /**
         * `data` is a base64 HTML blob out of GridFS. It stays base64 here;
         * ReportViewer hands it to a sandboxed iframe rather than the DOM.
         */
        getDashboardReport: builder.query<ReportBlob, string>({
            query: (testId) => ({
                url: `/report/${testId}`,
                method: "GET",
            }),
            providesTags: (_r, _e, testId) => [{ type: "DashboardReport", id: testId }],
        }),
    }),
});

export const { useGetDashboardReportsQuery, useGetDashboardReportQuery } = dashboardReportsApi;
