import { dashboardApi } from "@store/api/dashboard/dashboardApi";
import { compactParams } from "@pages/business-dashboard/lib/queryParams";
import type {
    SessionDetails,
    SessionFacets,
    SessionFilters,
    SessionListResponse,
    SessionStatsResponse,
} from "@pages/business-dashboard/services/types";

export const dashboardSessionsApi = dashboardApi.injectEndpoints({
    endpoints: (builder) => ({
        /**
         * Any recognised param flips the endpoint from the legacy bare array to
         * the paginated envelope, so callers always send at least page/limit.
         */
        getDashboardSessions: builder.query<SessionListResponse, SessionFilters>({
            query: (filters) => ({
                url: "/api/sessions/",
                method: "GET",
                params: compactParams({ ...filters }),
            }),
            providesTags: ["DashboardSession"],
        }),

        getDashboardSession: builder.query<SessionDetails, string>({
            query: (sessionId) => ({
                url: `/api/sessions/${sessionId}`,
                method: "GET",
            }),
            providesTags: (_r, _e, sessionId) => [{ type: "DashboardSession", id: sessionId }],
        }),

        /**
         * The filter dropdown options. Takes the same filter set as the list, so
         * the options narrow to what is actually reachable from the current
         * selection: picking a domain leaves only the versions that exist within
         * it, and no combination the user can build returns zero rows by surprise.
         */
        getDashboardSessionFacets: builder.query<SessionFacets, SessionFilters>({
            query: (filters) => ({
                url: "/api/sessions/facets",
                method: "GET",
                params: compactParams({ ...filters }),
            }),
            providesTags: ["DashboardSession"],
        }),

        /**
         * Takes the exact same filter shape as the sessions list, so the Overview
         * KPIs and the Sessions table can never describe different slices.
         */
        getDashboardSessionStats: builder.query<SessionStatsResponse, SessionFilters>({
            query: (filters) => ({
                url: "/api/sessions/stats",
                method: "GET",
                params: compactParams({ ...filters }),
            }),
            providesTags: ["DashboardStats"],
        }),
    }),
});

export const {
    useGetDashboardSessionsQuery,
    useGetDashboardSessionQuery,
    useGetDashboardSessionFacetsQuery,
    useGetDashboardSessionStatsQuery,
} = dashboardSessionsApi;
