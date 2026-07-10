import { toast } from "sonner";
import { API_ROUTES } from "@services/apiRoutes";
import { devGuideApi } from "@store/api/developerGuide/devGuideApi";
import type { RootState } from "@store/index";
import {
    clearAuth,
    selectIsLoginPending,
    setLoginPending,
    setToken,
} from "@store/slices/authSlice";
import type { IGetMeResponse, IExchangeCodeResponse } from "./types";

/** Set when `exchangeCode` succeeds this page load — survives URL cleanup after navigate. */
let oauthExchangeCompletedThisPageLoad = false;

const hasOAuthCallbackCode = () => new URLSearchParams(window.location.search).has("code");

export const authApi = devGuideApi.injectEndpoints({
    endpoints: (builder) => ({
        getMe: builder.query<IGetMeResponse, void>({
            query: () => ({
                url: API_ROUTES.AUTH.ME,
                method: "GET",
            }),
            providesTags: ["User"],
            onQueryStarted: async (_arg, { dispatch, getState, queryFulfilled }) => {
                const wasLoginPending = selectIsLoginPending(getState() as RootState);
                try {
                    const { data } = await queryFulfilled;
                    if (!wasLoginPending) {
                        return;
                    }

                    const isFreshOAuthLogin =
                        hasOAuthCallbackCode() || oauthExchangeCompletedThisPageLoad;
                    if (isFreshOAuthLogin && data.ok && data.user) {
                        toast.success("Login Successfull!");
                    }

                    dispatch(setLoginPending(false));
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
                        oauthExchangeCompletedThisPageLoad = true;
                        dispatch(setToken(data.token));
                        // Keep isLoginPending true until getMe resolves the user (Option B).
                    } else {
                        dispatch(setLoginPending(false));
                    }
                } catch (err) {
                    console.error("Error exchanging auth code:", err);
                    dispatch(setLoginPending(false));
                }
            },
        }),
    }),
});

export const { useGetMeQuery, useLazyGetMeQuery, useExchangeCodeMutation } = authApi;
