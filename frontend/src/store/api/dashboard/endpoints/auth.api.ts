import { dashboardApi } from "@store/api/dashboard/dashboardApi";
import type { LoginRequest, MeResponse } from "@pages/business-dashboard/services/types";

export const dashboardAuthApi = dashboardApi.injectEndpoints({
    endpoints: (builder) => ({
        /**
         * The session is an httpOnly cookie the browser cannot read, so this is
         * the only way to learn whether it is still valid.
         */
        getDashboardMe: builder.query<MeResponse, void>({
            query: () => ({ url: "/auth/me", method: "GET" }),
            providesTags: ["DashboardAuth"],
        }),

        /** 204 plus a Set-Cookie; nothing to read off the body. */
        dashboardLogin: builder.mutation<void, LoginRequest>({
            query: (body) => ({ url: "/auth/login", method: "POST", data: body }),
            invalidatesTags: ["DashboardAuth"],
        }),

        dashboardLogout: builder.mutation<void, void>({
            query: () => ({ url: "/auth/logout", method: "POST" }),
            invalidatesTags: ["DashboardAuth"],
        }),
    }),
});

export const { useGetDashboardMeQuery, useDashboardLoginMutation, useDashboardLogoutMutation } =
    dashboardAuthApi;
