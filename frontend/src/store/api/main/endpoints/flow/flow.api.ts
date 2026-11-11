import { toast } from "sonner";
import { API_ROUTES } from "@services/apiRoutes";
import { FlowMap } from "@/types/flow-state-type";
import { TransactionCache } from "@/types/session-types";
import { mainApi } from "@store/api/main/mainApi";
import type {
    IFlowResponse,
    IActionsResponse,
    RouteResponse,
    GeocodeResult,
    TrackContextResponse,
    IStudioLiveActionResponse,
    IStudioLiveStatus,
} from "./types";

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
        // Protocol Studio live sessions: the same proxies as v1 flows, graph-v2 shapes.
        getStudioLiveStatus: builder.query<
            IStudioLiveStatus,
            { transactionId: string; sessionId: string }
        >({
            query: ({ transactionId, sessionId }) => ({
                url: API_ROUTES.FLOW.CURRENT_STATE,
                method: "GET",
                params: { transaction_id: transactionId, session_id: sessionId },
            }),
            providesTags: (_result, _err, { transactionId }) => [
                { type: "Flow", id: transactionId },
            ],
        }),
        startStudioLiveFlow: builder.mutation<
            IStudioLiveActionResponse,
            {
                sessionId: string;
                journeyId: string;
                transactionId: string;
                /** Step through: the mock sends one payload per click. */
                stepThrough?: boolean;
            }
        >({
            query: ({ sessionId, journeyId, transactionId, stepThrough }) => ({
                url: API_ROUTES.FLOW.NEW,
                method: "POST",
                data: {
                    session_id: sessionId,
                    flow_id: journeyId,
                    transaction_id: transactionId,
                    ...(stepThrough !== undefined ? { step_through: stepThrough } : {}),
                },
            }),
            invalidatesTags: (_result, _err, { transactionId }) => [
                { type: "Flow", id: transactionId },
            ],
        }),
        proceedStudioLiveFlow: builder.mutation<
            IStudioLiveActionResponse,
            {
                sessionId: string;
                transactionId: string;
                inputs?: Record<string, unknown>;
                formData?: Record<string, unknown>;
                triggerExtra?: string;
                finish?: boolean;
                /** Step through: the mock sends one payload per click. */
                stepThrough?: boolean;
                /** Only save the settings (the run carries on if step-through was turned off). */
                settingsOnly?: boolean;
            }
        >({
            query: ({
                sessionId,
                transactionId,
                inputs,
                formData,
                triggerExtra,
                finish,
                stepThrough,
                settingsOnly,
            }) => ({
                url: API_ROUTES.FLOW.PROCEED,
                method: "POST",
                data: {
                    session_id: sessionId,
                    transaction_id: transactionId,
                    ...(inputs ? { inputs } : {}),
                    ...(formData ? { form_data: formData } : {}),
                    ...(triggerExtra ? { trigger_extra: triggerExtra } : {}),
                    ...(finish ? { finish: true } : {}),
                    ...(stepThrough !== undefined ? { step_through: stepThrough } : {}),
                    ...(settingsOnly ? { settings_only: true } : {}),
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
        // Resolves the token in a public tracking link. Fetched once per page load —
        // the ids it returns don't change for the life of the transaction.
        getTrackContext: builder.query<TrackContextResponse, { token: string }>({
            query: ({ token }) => ({
                url: API_ROUTES.FLOW.TRACK_CONTEXT,
                method: "GET",
                params: { token },
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
        htmlFormSubmit: builder.mutation<
            unknown,
            { link: string; data: unknown; enctype?: string }
        >({
            query: ({ link, data, enctype }) => ({
                url: API_ROUTES.FLOW.EXTERNAL_FORM,
                method: "POST",
                data: { link, data, enctype },
            }),
        }),
        // Fetch a seller-hosted xInput form's raw HTML through the backend proxy.
        htmlFormFetch: builder.query<string, { link: string }>({
            query: ({ link }) => ({
                url: API_ROUTES.FLOW.EXTERNAL_FORM,
                method: "GET",
                params: { link },
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
    useGetStudioLiveStatusQuery,
    useStartStudioLiveFlowMutation,
    useProceedStudioLiveFlowMutation,
    useProceedFlowMutation,
    useTriggerExtraMutation,
    useLazyGetRouteQuery,
    useGetTrackContextQuery,
    useLazyGeocodePlaceQuery,
    useNewFlowMutation,
    useHtmlFormSubmitMutation,
    useHtmlFormFetchQuery,
    useUpdateCustomFlowMutation,
    useGetActionsMutation,
    useGenerateReportMutation,
} = flowApi;
