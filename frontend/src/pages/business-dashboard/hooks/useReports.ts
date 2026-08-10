import { useGetDashboardReportQuery, useGetDashboardReportsQuery } from "@store/api";
import type { ReportFilters } from "@pages/business-dashboard/services/types";

/** `GET /report/?<page,limit,userId,q,sort,order>` */
export const useReports = (filters: ReportFilters) => useGetDashboardReportsQuery(filters);

/** `GET /report/:testId` — a base64 HTML blob out of GridFS. */
export const useReport = (testId: string | null) =>
    useGetDashboardReportQuery(testId ?? "", { skip: !testId });
