import { API_ROUTES } from "@services/apiRoutes";
import { mainApi } from "@store/api/main/mainApi";
import type {
    ICheckCompletionResponse,
    IFinvuCompletionResponse,
    IFinvuVerifyConsentResponse,
} from "./types";

export const formApi = mainApi.injectEndpoints({
    endpoints: (builder) => ({
        // Contract (keyed by transaction_id): the form's final step fires a callback that
        // writes form_completed:{transaction_id}; the frontend polls check-completion and
        // clears stale state with resetCompletion before each run.
        checkCompletion: builder.query<ICheckCompletionResponse, { transactionId: string }>({
            query: ({ transactionId }) => ({
                url: API_ROUTES.FORM.CHECK_COMPLETION,
                method: "GET",
                params: { transaction_id: transactionId },
                timeout: 5000,
            }),
            providesTags: (_result, _err, { transactionId }) => [
                { type: "FormCompletion", id: transactionId },
            ],
        }),
        resetCompletion: builder.mutation<void, { transactionId: string }>({
            query: ({ transactionId }) => ({
                url: API_ROUTES.FORM.RESET_COMPLETION,
                method: "POST",
                data: { transaction_id: transactionId },
                timeout: 5000,
            }),
            invalidatesTags: (_result, _err, { transactionId }) => [
                { type: "FormCompletion", id: transactionId },
            ],
        }),
        // Stores the workbench tab URL to return to after the form callback, keyed by
        // transaction_id (the callback looks it up by transaction_id and uses it as the
        // 302 target). Pass the current page URL verbatim (window.location.href).
        saveRedirection: builder.mutation<void, { redirectionUrl: string; transactionId: string }>({
            query: ({ redirectionUrl, transactionId }) => ({
                url: API_ROUTES.FORM.SAVE_REDIRECTION,
                method: "POST",
                data: { redirection_url: redirectionUrl, transaction_id: transactionId },
                timeout: 5000,
            }),
        }),
        verifyFinvuConsent: builder.mutation<
            IFinvuVerifyConsentResponse,
            { transactionId: string; sessionId: string }
        >({
            query: ({ transactionId, sessionId }) => ({
                url: API_ROUTES.FINVU.VERIFY_CONSENT,
                method: "POST",
                data: { transactionId, sessionId },
                timeout: 15000,
            }),
        }),
        getFinvuCompletion: builder.query<
            IFinvuCompletionResponse,
            { sessionId: string; transactionId: string }
        >({
            query: ({ sessionId, transactionId }) => ({
                url: API_ROUTES.FINVU.CHECK_COMPLETION,
                method: "GET",
                params: { session_id: sessionId, transaction_id: transactionId },
                timeout: 5000,
            }),
            providesTags: (_result, _err, { transactionId }) => [
                { type: "FinvuConsent", id: transactionId },
            ],
        }),
    }),
});

export const {
    useCheckCompletionQuery,
    useLazyCheckCompletionQuery,
    useResetCompletionMutation,
    useSaveRedirectionMutation,
    useVerifyFinvuConsentMutation,
    useLazyGetFinvuCompletionQuery,
} = formApi;
