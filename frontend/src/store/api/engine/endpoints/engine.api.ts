import { engineApi } from "@store/api/engine/engineApi";
import type {
    McpDataResponse,
    McpEventsResponse,
    McpFlowResponse,
    McpPayloadResponse,
    McpSessionResponse,
} from "@store/api/engine/types";

/**
 * Reads against one `ondc-mcp` engine.
 *
 * Every argument carries `engine` and `token` because neither is global: the
 * engine is named by the link, and the token authorises this viewer against
 * that engine and nothing else. They are part of the cache key, which is what
 * keeps two tabs on two engines from reading each other's data.
 *
 * All of these are reads. The engine's viewer surface has no mutations at all —
 * the model drives the run, and a human clicking "proceed" from here would race
 * the lock that stops the same step going out twice.
 */

interface EngineArgs {
    engine: string;
    token: string;
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export const engineEndpoints = engineApi.injectEndpoints({
    endpoints: (builder) => ({
        getMcpSession: builder.query<McpSessionResponse, EngineArgs & { sessionId: string }>({
            query: ({ engine, token, sessionId }) => ({
                url: `${engine}/ui/api/sessions/${encodeURIComponent(sessionId)}`,
                method: "GET",
                headers: auth(token),
            }),
            providesTags: (_result, _error, { sessionId }) => [
                { type: "EngineSession", id: sessionId },
            ],
        }),

        getMcpFlow: builder.query<
            McpFlowResponse,
            EngineArgs & { sessionId: string; flowId: string }
        >({
            query: ({ engine, token, sessionId, flowId }) => ({
                url: `${engine}/ui/api/sessions/${encodeURIComponent(
                    sessionId
                )}/flows/${encodeURIComponent(flowId)}`,
                method: "GET",
                headers: auth(token),
            }),
            providesTags: (_result, _error, { sessionId, flowId }) => [
                { type: "EngineFlow", id: `${sessionId}:${flowId}` },
            ],
        }),

        getMcpPayload: builder.query<
            McpPayloadResponse,
            EngineArgs & { sessionId: string; payloadId: string }
        >({
            query: ({ engine, token, sessionId, payloadId }) => ({
                url: `${engine}/ui/api/sessions/${encodeURIComponent(
                    sessionId
                )}/payloads/${encodeURIComponent(payloadId)}`,
                method: "GET",
                headers: auth(token),
            }),
            // Payload bodies are immutable once recorded, so this is the one
            // read here that never needs refetching.
            providesTags: (_result, _error, { payloadId }) => [
                { type: "EnginePayload", id: payloadId },
            ],
        }),

        getMcpBusinessData: builder.query<
            McpDataResponse,
            EngineArgs & { sessionId: string; transactionId: string }
        >({
            query: ({ engine, token, sessionId, transactionId }) => ({
                url: `${engine}/ui/api/sessions/${encodeURIComponent(sessionId)}/data`,
                method: "GET",
                params: { transaction_id: transactionId },
                headers: auth(token),
            }),
            providesTags: (_result, _error, { transactionId }) => [
                { type: "EngineData", id: transactionId },
            ],
        }),

        /**
         * The journal, read from a cursor.
         *
         * The live feed is an `EventSource` rather than this — see
         * `useMcpSessionPage`. This exists for the first load and for the case
         * where the stream could not be opened at all, so the page still shows
         * what happened rather than nothing.
         */
        getMcpEvents: builder.query<
            McpEventsResponse,
            EngineArgs & { sessionId: string; afterSeq?: number }
        >({
            query: ({ engine, token, sessionId, afterSeq = 0 }) => ({
                url: `${engine}/ui/api/sessions/${encodeURIComponent(sessionId)}/events`,
                method: "GET",
                params: { after_seq: afterSeq },
                headers: auth(token),
            }),
        }),
    }),
});

export const {
    useGetMcpSessionQuery,
    useGetMcpFlowQuery,
    useLazyGetMcpPayloadQuery,
    useGetMcpBusinessDataQuery,
    useLazyGetMcpEventsQuery,
} = engineEndpoints;
