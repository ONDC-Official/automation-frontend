import { toast } from "sonner";
import { API_ROUTES } from "@services/apiRoutes";
import { FlowMap } from "@/types/flow-state-type";
import { TransactionCache } from "@/types/session-types";
import { mainApi } from "@store/api/main/mainApi";
import type { IFlowResponse, IActionsResponse, RouteResponse, GeocodeResult } from "./types";

export const flowApi = mainApi.injectEndpoints({
    endpoints: (builder) => ({
        // Zero consumers today — moved verbatim for parity with request-utils.ts. Callers must
        // replicate the `session.subscriberType === "BAP"` early-return guard themselves; it isn't
        // part of the HTTP call.
        triggerSearch: builder.mutation<
            unknown,
            { session: TransactionCache; subUrl: string; transactionId?: string }
        >({
            query: ({ subUrl }) => ({
                url: API_ROUTES.FLOW.TRIGGER,
                method: "POST",
                data: { subscriberUrl: subUrl, initiateSearch: true },
            }),
            invalidatesTags: (_result, _err, { transactionId }) =>
                transactionId ? [{ type: "Flow", id: transactionId }] : [],
        }),
        // Zero consumers today — moved verbatim.
        triggerRequestAction: builder.mutation<
            unknown,
            {
                action: string;
                actionId: string;
                transactionId: string;
                sessionId: string;
                flowId: string;
                version?: string;
                subscriberUrl?: string;
                body?: unknown;
            }
        >({
            query: ({
                action,
                actionId,
                transactionId,
                sessionId,
                flowId,
                version,
                subscriberUrl,
                body,
            }) => ({
                url: API_ROUTES.FLOW.TRIGGER_ACTION(action),
                method: "POST",
                data: body,
                params: {
                    action_id: actionId,
                    transaction_id: transactionId,
                    subscriber_url: subscriberUrl,
                    version,
                    session_id: sessionId,
                    flow_id: flowId,
                },
            }),
            invalidatesTags: (_result, _err, { transactionId }) => [
                { type: "Flow", id: transactionId },
            ],
        }),
        getMappedFlow: builder.query<FlowMap, { transactionId: string; sessionId: string }>({
            query: ({ transactionId, sessionId }) => ({
                url: API_ROUTES.FLOW.CURRENT_STATE,
                method: "GET",
                params: { transaction_id: transactionId, session_id: sessionId },
            }),
            providesTags: (_result, _err, { transactionId }) => [
                { type: "Flow", id: transactionId },
            ],
        }),
        proceedFlow: builder.mutation<
            IFlowResponse,
            {
                sessionId: string;
                transactionId: string;
                jsonPathChanges?: Record<string, unknown>;
                inputs?: unknown;
            }
        >({
            query: ({ sessionId, transactionId, jsonPathChanges, inputs }) => ({
                url: API_ROUTES.FLOW.PROCEED,
                method: "POST",
                data: {
                    session_id: sessionId,
                    transaction_id: transactionId,
                    json_path_changes: jsonPathChanges,
                    inputs,
                },
            }),
            invalidatesTags: (_result, _err, { transactionId }) => [
                { type: "Flow", id: transactionId },
            ],
        }),
        triggerExtra: builder.mutation<
            IFlowResponse,
            { sessionId: string; transactionId: string; triggerExtraKey: string; inputs?: unknown }
        >({
            query: ({ sessionId, transactionId, triggerExtraKey, inputs }) => ({
                url: API_ROUTES.FLOW.PROCEED,
                method: "POST",
                data: {
                    session_id: sessionId,
                    transaction_id: transactionId,
                    inputs,
                    trigger_extra: triggerExtraKey,
                },
            }),
            invalidatesTags: (_result, _err, { transactionId }) => [
                { type: "Flow", id: transactionId },
            ],
        }),
        // Never throws (matches old getRoute) — callers should read `result.data ?? null`.
        getRoute: builder.query<RouteResponse, { from: string; to: string }>({
            query: ({ from, to }) => ({
                url: API_ROUTES.FLOW.ROUTE,
                method: "GET",
                params: { from, to },
            }),
        }),
        // Never throws (matches old geocodePlace) — callers should read `result.data ?? []`.
        geocodePlace: builder.query<GeocodeResult[], { q: string }>({
            query: ({ q }) => ({
                url: API_ROUTES.FLOW.GEOCODE,
                method: "GET",
                params: { q },
            }),
        }),
        // Never throws — toasts "Error while starting new flow" itself (matches old newFlow) and
        // resolves to undefined data on failure; callers should NOT use .unwrap() here.
        newFlow: builder.mutation<
            IFlowResponse,
            {
                sessionId: string;
                flowId: string;
                transactionId: string;
                jsonPathChanges?: Record<string, unknown>;
                inputs?: unknown;
            }
        >({
            query: ({ sessionId, flowId, transactionId, jsonPathChanges, inputs }) => ({
                url: API_ROUTES.FLOW.NEW,
                method: "POST",
                data: {
                    session_id: sessionId,
                    flow_id: flowId,
                    transaction_id: transactionId,
                    json_path_changes: jsonPathChanges,
                    inputs,
                },
            }),
            invalidatesTags: (_result, _err, { transactionId }) => [
                { type: "Flow", id: transactionId },
            ],
            onQueryStarted: async (_arg, { queryFulfilled }) => {
                try {
                    await queryFulfilled;
                } catch {
                    toast.error("Error while starting new flow");
                }
            },
        }),
        htmlFormSubmit: builder.mutation<unknown, { link: string; data: unknown }>({
            query: ({ link, data }) => ({
                url: API_ROUTES.FLOW.EXTERNAL_FORM,
                method: "POST",
                data: { link, data },
            }),
        }),
        updateCustomFlow: builder.mutation<unknown, { sessionId: string; flow: unknown }>({
            query: ({ sessionId, flow }) => ({
                url: API_ROUTES.FLOW.CUSTOM_FLOW,
                method: "POST",
                data: { session_id: sessionId, flows: [flow] },
            }),
        }),
        // Zero consumers today — moved verbatim.
        getActions: builder.mutation<IActionsResponse, { domain: string; version: string }>({
            query: ({ domain, version }) => ({
                url: API_ROUTES.FLOW.ACTIONS,
                method: "POST",
                data: { domain, version },
            }),
        }),
        generateReport: builder.mutation<
            {
                data?: {
                    html?: string;
                    message?: { ack?: { status?: "ACK" | "NACK" } };
                };
            },
            {
                sessionId: string;
                userId?: string;
                body: Record<string, string[]>;
                flowSummary: Record<string, { total: number; completed: number }>;
            }
        >({
            query: ({ sessionId, userId, body, flowSummary }) => ({
                url: API_ROUTES.FLOW.REPORT,
                method: "POST",
                data: { ...body, flow_summary: flowSummary },
                params: {
                    sessionId,
                    ...(userId ? { user_id: userId } : {}),
                },
            }),
            invalidatesTags: (_result, _err, { sessionId }) => [
                { type: "Report", id: sessionId },
                { type: "Report", id: "LIST" },
            ],
        }),
    }),
});

export const {
    useTriggerSearchMutation,
    useTriggerRequestActionMutation,
    useGetMappedFlowQuery,
    useLazyGetMappedFlowQuery,
    useProceedFlowMutation,
    useTriggerExtraMutation,
    useLazyGetRouteQuery,
    useLazyGeocodePlaceQuery,
    useNewFlowMutation,
    useHtmlFormSubmitMutation,
    useUpdateCustomFlowMutation,
    useGetActionsMutation,
    useGenerateReportMutation,
} = flowApi;
