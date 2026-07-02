import { toast } from "sonner";
import { API_ROUTES } from "@services/apiRoutes";
import { mainApi } from "@store/api/main/mainApi";

export const sessionApi = mainApi.injectEndpoints({
    endpoints: (builder) => ({
        createSession: builder.mutation<{ sessionId: string }, Record<string, unknown>>({
            query: (data) => ({
                url: API_ROUTES.SESSIONS.BASE,
                method: "POST",
                data,
            }),
        }),
        // Playground's own session-create — same resource (spec §6 item 1), distinct name since
        // the payload/response shape differs from the plain scenario `createSession` above.
        createPlaygroundSession: builder.mutation<
            { sessionId: string },
            { sessionData: unknown; playgroundConfig: unknown }
        >({
            query: (data) => ({
                url: "/sessions/playground",
                method: "POST",
                data,
            }),
        }),
        getSessionById: builder.query<Record<string, unknown>, { sessionId: string }>({
            query: ({ sessionId }) => ({
                url: API_ROUTES.SESSIONS.BASE,
                method: "GET",
                params: { session_id: sessionId },
            }),
            providesTags: (_result, _err, { sessionId }) => [{ type: "Session", id: sessionId }],
        }),
        putCacheData: builder.mutation<unknown, { data: unknown; sessionId: string }>({
            query: ({ data, sessionId }) => ({
                url: API_ROUTES.SESSIONS.BASE,
                method: "PUT",
                data,
                params: { session_id: sessionId },
            }),
            invalidatesTags: (_result, _err, { sessionId }) => [{ type: "Session", id: sessionId }],
        }),
        // Never throws (matches old clearFlowData) — toasts both outcomes itself; callers should
        // NOT use .unwrap() and should proceed regardless of success/failure, same as before.
        clearFlowData: builder.mutation<unknown, { sessionId: string; flowId: string }>({
            query: ({ sessionId, flowId }) => ({
                url: API_ROUTES.SESSIONS.CLEAR_FLOW,
                method: "DELETE",
                params: { session_id: sessionId, flow_id: flowId },
            }),
            invalidatesTags: (_result, _err, { sessionId }) => [{ type: "Session", id: sessionId }],
            onQueryStarted: async (_arg, { queryFulfilled }) => {
                try {
                    await queryFulfilled;
                    toast.info("Flow cleared");
                } catch {
                    toast.error("Error clearing flow");
                }
            },
        }),
        // Never throws (matches old getTransactionData) — toasts on failure itself; callers
        // should read `result.data` (possibly undefined) rather than using .unwrap().
        getTransactionData: builder.query<
            unknown,
            { transactionId: string; subscriberUrl: string }
        >({
            query: ({ transactionId, subscriberUrl }) => ({
                url: API_ROUTES.SESSIONS.TRANSACTION,
                method: "GET",
                params: { transaction_id: transactionId, subscriber_url: subscriberUrl },
            }),
            onQueryStarted: async (_arg, { queryFulfilled }) => {
                try {
                    await queryFulfilled;
                } catch {
                    toast.error("Error while fetching transaction data");
                }
            },
        }),
        // Zero consumers today — moved verbatim (never throws, toasts+swallows).
        addExpectation: builder.mutation<
            unknown,
            { action: string; flowId: string; subscriberUrl: string; sessionId: string }
        >({
            query: ({ action, flowId, subscriberUrl, sessionId }) => ({
                url: API_ROUTES.SESSIONS.EXPECTATION,
                method: "POST",
                params: {
                    expected_action: action,
                    flow_id: flowId,
                    subscriber_url: subscriberUrl,
                    session_id: sessionId,
                },
            }),
            onQueryStarted: async (_arg, { queryFulfilled }) => {
                try {
                    await queryFulfilled;
                } catch (err) {
                    toast.error(
                        (err as { error?: { message?: string } })?.error?.message ??
                            "addExpectation failed"
                    );
                }
            },
        }),
        // Never throws (matches old deleteExpectation) — toasts on failure itself; callers
        // should NOT use .unwrap().
        deleteExpectation: builder.mutation<unknown, { sessionId: string; subscriberUrl: string }>({
            query: ({ sessionId, subscriberUrl }) => ({
                url: API_ROUTES.SESSIONS.EXPECTATION,
                method: "DELETE",
                params: { session_id: sessionId, subscriber_url: subscriberUrl },
            }),
            onQueryStarted: async (_arg, { queryFulfilled }) => {
                try {
                    await queryFulfilled;
                } catch (err) {
                    toast.error(
                        (err as { error?: { message?: string } })?.error?.message ??
                            "deleteExpectation failed"
                    );
                }
            },
        }),
        // Never throws (matches old requestForFlowPermission) — toasts on both an
        // invalid-permission response and a request failure, same as before. Callers should read
        // `result.data?.valid` (undefined-safe) rather than using .unwrap().
        requestForFlowPermission: builder.query<
            { valid: boolean; message: string },
            { action: string; subscriberUrl: string }
        >({
            query: ({ action, subscriberUrl }) => ({
                url: API_ROUTES.SESSIONS.FLOW_PERMISSION,
                method: "GET",
                params: { action, subscriber_url: subscriberUrl },
            }),
            onQueryStarted: async (_arg, { queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;
                    if (!data.valid) toast.error(data.message);
                } catch (err) {
                    toast.error(
                        (err as { error?: { message?: string } })?.error?.message ??
                            "requestForFlowPermission failed"
                    );
                }
            },
        }),
    }),
});

export const {
    useCreateSessionMutation,
    useCreatePlaygroundSessionMutation,
    useGetSessionByIdQuery,
    useLazyGetSessionByIdQuery,
    usePutCacheDataMutation,
    useClearFlowDataMutation,
    useGetTransactionDataQuery,
    useLazyGetTransactionDataQuery,
    useAddExpectationMutation,
    useDeleteExpectationMutation,
    useRequestForFlowPermissionQuery,
    useLazyRequestForFlowPermissionQuery,
} = sessionApi;
