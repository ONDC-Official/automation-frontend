import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@store/api/shared/axiosBaseQuery";
import dashboardHttpClient from "@pages/business-dashboard/services/httpClient";

/**
 * Its own API rather than endpoints on `mainApi`, for the same reason
 * `devGuideApi` and `loadTestApi` are separate: a different base query. This one
 * runs on the dashboard's axios instance, which sends the session cookie and
 * carries neither the workbench Bearer token nor the DB service key — the
 * read-only proxy behind `/dashboard` accepts neither.
 */
export const dashboardApi = createApi({
    reducerPath: "dashboardApi",
    baseQuery: axiosBaseQuery(dashboardHttpClient),
    tagTypes: [
        "DashboardAuth",
        "DashboardSession",
        "DashboardStats",
        "DashboardParticipant",
        "DashboardReport",
    ],
    endpoints: () => ({}),
});

export default dashboardApi;
