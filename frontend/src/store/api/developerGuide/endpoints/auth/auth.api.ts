import { API_ROUTES } from "@services/apiRoutes";
import { authTokenManager } from "@utils/localStorageManager";
import { devGuideApi } from "@store/api/developerGuide/devGuideApi";
import type { IGetMeResponse, IExchangeCodeResponse } from "./types";

export const authApi = devGuideApi.injectEndpoints({
    endpoints: (builder) => ({
        getMe: builder.query<IGetMeResponse, void>({
            query: () => ({
                url: API_ROUTES.AUTH.ME,
                method: "GET",
            }),
            providesTags: ["User"],
            // Matches the old fetchUser's behavior: clear the stored token whenever this fails
            // (network error, expired token, etc.) so the app doesn't keep retrying with a stale one.
            onQueryStarted: async (_arg, { queryFulfilled }) => {
                try {
                    await queryFulfilled;
                } catch {
                    authTokenManager.remove();
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
            // Never throws (matches the old exchangeCodeForToken) — persists the token on success,
            // just logs on failure. Callers should not use .unwrap() here.
            onQueryStarted: async (_arg, { queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;
                    if (data.token) authTokenManager.set(data.token);
                } catch (err) {
                    console.error("Error exchanging auth code:", err);
                }
            },
        }),
    }),
});

export const { useGetMeQuery, useLazyGetMeQuery, useExchangeCodeMutation } = authApi;
