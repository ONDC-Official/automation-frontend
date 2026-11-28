import { mainApi } from "@store/api/main/mainApi";
import type {
    FdCertificate,
    FdExchange,
    FdRun,
    FdSessionView,
    FdVerification,
} from "@pages/fd-session/types";

/** The FD pages' API: our backend's /fd routes, which relay to the FD workbench. */
const base = (sessionId: string) => `/fd/sessions/${encodeURIComponent(sessionId)}`;

export const fdApi = mainApi.injectEndpoints({
    endpoints: (builder) => ({
        getFdSession: builder.query<FdSessionView, { sessionId: string }>({
            query: ({ sessionId }) => ({ url: base(sessionId) }),
            providesTags: (_r, _e, { sessionId }) => [{ type: "Session", id: `fd:${sessionId}` }],
        }),
        getFdExchanges: builder.query<FdExchange[], { sessionId: string }>({
            query: ({ sessionId }) => ({ url: `${base(sessionId)}/exchanges` }),
        }),
        startFdRun: builder.mutation<FdRun, { sessionId: string }>({
            query: ({ sessionId }) => ({ url: `${base(sessionId)}/runs`, method: "POST" }),
            invalidatesTags: (_r, _e, { sessionId }) => [
                { type: "Session", id: `fd:${sessionId}` },
            ],
        }),
        // A run plays for as long as its scenarios take: minutes against a real participant.
        playFdRun: builder.mutation<FdRun, { sessionId: string; runId: string; knownPan?: string }>(
            {
                query: ({ sessionId, runId, knownPan }) => ({
                    url: `${base(sessionId)}/runs/${runId}/play`,
                    method: "POST",
                    data: knownPan ? { knownPan } : {},
                    timeout: 15 * 60_000,
                }),
                invalidatesTags: (_r, _e, { sessionId }) => [
                    { type: "Session", id: `fd:${sessionId}` },
                ],
            }
        ),
        finishFdRun: builder.mutation<FdRun, { sessionId: string; runId: string }>({
            query: ({ sessionId, runId }) => ({
                url: `${base(sessionId)}/runs/${runId}/finish`,
                method: "POST",
            }),
            invalidatesTags: (_r, _e, { sessionId }) => [
                { type: "Session", id: `fd:${sessionId}` },
            ],
        }),
        stopFdRun: builder.mutation<FdRun, { sessionId: string; runId: string }>({
            query: ({ sessionId, runId }) => ({
                url: `${base(sessionId)}/runs/${runId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_r, _e, { sessionId }) => [
                { type: "Session", id: `fd:${sessionId}` },
            ],
        }),
        issueFdCertificate: builder.mutation<
            FdCertificate | FdCertificate["certificate"],
            { sessionId: string; runs: string[] }
        >({
            query: ({ sessionId, runs }) => ({
                url: `${base(sessionId)}/certificates`,
                method: "POST",
                data: { runs },
            }),
            invalidatesTags: (_r, _e, { sessionId }) => [
                { type: "Session", id: `fd:${sessionId}` },
            ],
        }),
        getFdCertificate: builder.query<
            FdCertificate,
            { sessionId: string; certificateId: string }
        >({
            query: ({ sessionId, certificateId }) => ({
                url: `${base(sessionId)}/certificates/${certificateId}`,
            }),
        }),
        verifyFdCertificate: builder.query<
            FdVerification,
            { sessionId: string; certificateId: string }
        >({
            query: ({ sessionId, certificateId }) => ({
                url: `${base(sessionId)}/certificates/${certificateId}/verify`,
            }),
        }),
    }),
});

export const {
    useGetFdSessionQuery,
    useGetFdExchangesQuery,
    useStartFdRunMutation,
    usePlayFdRunMutation,
    useFinishFdRunMutation,
    useStopFdRunMutation,
    useIssueFdCertificateMutation,
    useGetFdCertificateQuery,
    useLazyVerifyFdCertificateQuery,
} = fdApi;

/** The run report is a whole HTML page: opened in a new tab straight from the backend. */
export const fdRunReportUrl = (sessionId: string, runId: string) =>
    `${import.meta.env.VITE_BACKEND_URL ?? ""}${base(sessionId)}/runs/${runId}/report`;
