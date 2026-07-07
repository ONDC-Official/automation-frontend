import { API_ROUTES } from "@services/apiRoutes";
import { devGuideApi } from "@store/api/developerGuide/devGuideApi";
import { clearAuth, setToken } from "@store/slices/authSlice";
import type { IGetMeResponse, IExchangeCodeResponse } from "./types";

export const authApi = devGuideApi.injectEndpoints({
    endpoints: (builder) => ({
        getMe: builder.query<IGetMeResponse, void>({
            query: () => ({
                url: API_ROUTES.AUTH.ME,
                method: "GET",
            }),
            providesTags: ["User"],
            onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
                try {
                    await queryFulfilled;
                } catch {
                    dispatch(clearAuth());
                }
            },
        }),
        exchangeCode: builder.mutation<IExchangeCodeResponse, { code: string }>({
            query: ({ code }) => ({
                url: API_ROUTES.AUTH.EXCHANGE,
                method: "POST",
                data: { code },
            }),
            invalidatesTags: ["User"],
            onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;
                    if (data.token) {
                        dispatch(setToken(data.token));
                    }
                } catch (err) {
                    console.error("Error exchanging auth code:", err);
                }
            },
        }),
    }),
});

export const { useGetMeQuery, useLazyGetMeQuery, useExchangeCodeMutation } = authApi;
