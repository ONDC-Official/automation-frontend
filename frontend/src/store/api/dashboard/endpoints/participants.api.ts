import { dashboardApi } from "@store/api/dashboard/dashboardApi";
import { compactParams } from "@pages/business-dashboard/lib/queryParams";
import type {
    NpFilters,
    ParticipantDetail,
    ParticipantListResponse,
} from "@pages/business-dashboard/services/types";

export const dashboardParticipantsApi = dashboardApi.injectEndpoints({
    endpoints: (builder) => ({
        getDashboardParticipants: builder.query<ParticipantListResponse, NpFilters>({
            query: (filters) => ({
                url: "/api/sessions/participants",
                method: "GET",
                params: compactParams({ ...filters }),
            }),
            providesTags: ["DashboardParticipant"],
        }),

        getDashboardParticipant: builder.query<
            ParticipantDetail,
            { host: string; filters: NpFilters }
        >({
            query: ({ host, filters }) => ({
                // The host is a path segment and may carry a port, so it is encoded.
                url: `/api/sessions/participants/${encodeURIComponent(host)}`,
                method: "GET",
                params: compactParams({ ...filters }),
            }),
            providesTags: (_r, _e, { host }) => [{ type: "DashboardParticipant", id: host }],
        }),
    }),
});

export const { useGetDashboardParticipantsQuery, useGetDashboardParticipantQuery } =
    dashboardParticipantsApi;
