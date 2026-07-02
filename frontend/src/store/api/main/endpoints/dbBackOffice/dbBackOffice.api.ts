import { API_ROUTES } from "@services/apiRoutes";
import { FlowInDB } from "@/types/session-types";
import { mainApi } from "@store/api/main/mainApi";
import type {
    IAdminAuthResponse,
    IAdminAuthCredentials,
    IGetPayloadsParams,
    IHealthReportData,
    PayloadResponse,
    IReportResponse,
    ISessionsResponse,
} from "./types";

export const dbBackOfficeApi = mainApi.injectEndpoints({
    endpoints: (builder) => ({
        adminAuth: builder.mutation<IAdminAuthResponse, IAdminAuthCredentials>({
            query: ({ username, password }) => ({
                url: API_ROUTES.DB.ADMIN_AUTH,
                method: "GET",
                params: { username, password },
            }),
        }),
        getPayloads: builder.query<unknown, IGetPayloadsParams>({
            query: ({ domain, version, action, page }) => ({
                url: API_ROUTES.DB.PAYLOADS(domain, version, action, page),
                method: "GET",
            }),
            providesTags: ["Payload"],
        }),
        // Preserves the 5-minute timeout the old raw-axios call used for this potentially slow check.
        getApiServiceHealth: builder.query<IHealthReportData, void>({
            query: () => ({
                url: API_ROUTES.HEALTH.API_SERVICE,
                method: "GET",
                timeout: 5 * 60 * 1000,
            }),
            providesTags: ["Health"],
        }),
        getCompletePayload: builder.query<PayloadResponse[], { payloadIds: string[] }>({
            query: ({ payloadIds }) => ({
                url: API_ROUTES.DB.PAYLOAD,
                method: "POST",
                data: { payload_ids: payloadIds },
            }),
        }),
        // Preserves the 2-minute timeout the old raw-axios call used for this potentially slow read.
        getReport: builder.query<IReportResponse, { sessionId: string }>({
            query: ({ sessionId }) => ({
                url: API_ROUTES.DB.REPORT,
                method: "GET",
                params: { session_id: sessionId },
                timeout: 120000,
            }),
            providesTags: (_result, _err, { sessionId }) => [{ type: "Report", id: sessionId }],
        }),
        getPayloadsBySessionId: builder.query<PayloadResponse[], { sessionId: string }>({
            query: ({ sessionId }) => ({
                url: API_ROUTES.DB.SESSION_PAYLOADS(sessionId),
                method: "GET",
            }),
            providesTags: (_result, _err, { sessionId }) => [
                { type: "SessionLogs", id: sessionId },
            ],
        }),
        getSessions: builder.query<
            ISessionsResponse,
            { subId: string; npType: string; domain?: string; version?: string }
        >({
            query: ({ subId, npType, domain, version }) => ({
                url: API_ROUTES.DB.SESSIONS,
                method: "GET",
                params: {
                    sub_id: subId,
                    np_type: npType,
                    ...(domain && { domain }),
                    ...(version && { version }),
                },
            }),
        }),
        // x-api-key is added automatically by apiClient's request interceptor for any URL
        // containing "/api/sessions/flows" — no need to set it here.
        addFlowToSessionInDB: builder.mutation<unknown, { sessionId: string; flow: FlowInDB }>({
            query: ({ sessionId, flow }) => ({
                url: API_ROUTES.API.SESSIONS_FLOWS(sessionId),
                method: "POST",
                data: flow,
            }),
        }),
        // Zero consumers today — moved verbatim.
        updateFlowInSession: builder.mutation<unknown, { sessionId: string; flow: FlowInDB }>({
            query: ({ sessionId, flow }) => ({
                url: API_ROUTES.API.SESSIONS_FLOWS(sessionId),
                method: "PUT",
                data: { flow },
            }),
        }),
        // Never throws (matches old getSubscriberUrls) — callers should read `result.data ?? []`.
        getSubscriberUrls: builder.query<{ subscriberUrls: string[] }, { userId: string }>({
            query: ({ userId }) => ({
                url: API_ROUTES.DB.SUBSCRIBER_URLS(userId),
                method: "GET",
            }),
            providesTags: (_result, _err, { userId }) => [{ type: "SubscriberUrl", id: userId }],
        }),
        // Zero consumers today — moved verbatim (never throws).
        getLogs: builder.query<unknown, { sessionId: string }>({
            query: ({ sessionId }) => ({
                url: API_ROUTES.LOGS.BASE,
                method: "GET",
                params: { sessionId },
            }),
        }),
    }),
});

export const {
    useAdminAuthMutation,
    useGetPayloadsQuery,
    useLazyGetPayloadsQuery,
    useGetApiServiceHealthQuery,
    useLazyGetApiServiceHealthQuery,
    useLazyGetCompletePayloadQuery,
    useGetReportQuery,
    useLazyGetReportQuery,
    useGetPayloadsBySessionIdQuery,
    useLazyGetPayloadsBySessionIdQuery,
    useLazyGetSessionsQuery,
    useAddFlowToSessionInDBMutation,
    useUpdateFlowInSessionMutation,
    useLazyGetSubscriberUrlsQuery,
    useLazyGetLogsQuery,
} = dbBackOfficeApi;
