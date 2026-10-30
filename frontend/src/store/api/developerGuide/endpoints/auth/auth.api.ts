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
import type {
    IGetMeResponse,
    IExchangeCodeResponse,
    ILoginProviderResponse,
    ISelectOrganisationResponse,
} from "./types";

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
                        toast.success("Login successful!", {
                            description: "You're signed in and ready to go.",
                            position: "top-right",
                        });
                    }

                    dispatch(setLoginPending(false));
                } catch {
                    toast.error("We couldn't sign you in. Please try again.");
                    dispatch(clearAuth());
                }
            },
        }),
        // Which login the login service has switched on (LOGIN_PROVIDER); rarely changes.
        getLoginProvider: builder.query<ILoginProviderResponse, void>({
            query: () => ({
                url: API_ROUTES.AUTH.PROVIDER,
                method: "GET",
            }),
            keepUnusedDataFor: 3600,
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
                    toast.error("We couldn't sign you in. Please try again.");
                    dispatch(setLoginPending(false));
                }
            },
        }),
        // Switch the NP Portal organisation an ONDC user works for; the login
        // service checks membership and returns a new token carrying it.
        selectOrganisation: builder.mutation<ISelectOrganisationResponse, string>({
            query: (organisationId) => ({
                url: API_ROUTES.AUTH.SELECT_ORG,
                method: "POST",
                data: { organisationId },
            }),
            onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;
                    // Store the new token before refetching the user, or getMe
                    // would still send the old one and show the old organisation.
                    dispatch(setToken(data.token));
                    dispatch(authApi.util.invalidateTags(["User"]));
                } catch {
                    // The caller shows the error.
                }
            },
        }),
    }),
});

export const {
    useGetMeQuery,
    useLazyGetMeQuery,
    useExchangeCodeMutation,
    useGetLoginProviderQuery,
    useSelectOrganisationMutation,
} = authApi;
