import { API_ROUTES } from "@services/apiRoutes";
import type { DiscoveryResponse } from "@/types/apiShared/loadTest";
import { loadTestApi } from "@store/api/loadTest/loadTestApi";
import type { PayloadResponse } from "./types";

export const loadTestDiscoveryApi = loadTestApi.injectEndpoints({
    endpoints: (builder) => ({
        // timeout: 0 preserves the old raw-axios call's unlimited wait — discovery has no polling
        // fallback (its response is the final result), and probing/aggregating a seller's endpoints
        // can legitimately take longer than the client's default 30s.
        generateDiscoveryPayload: builder.query<PayloadResponse, string>({
            query: (sessionId) => ({
                url: API_ROUTES.LOAD_TEST.DISCOVERY_PAYLOAD(sessionId),
                method: "GET",
                timeout: 0,
            }),
        }),
        startDiscovery: builder.mutation<
            DiscoveryResponse,
            { sessionId: string; payload: Record<string, unknown> | null }
        >({
            query: ({ sessionId, payload }) => ({
                url: API_ROUTES.LOAD_TEST.DISCOVERY(sessionId),
                method: "POST",
                data: { payload },
                timeout: 0,
            }),
            invalidatesTags: (_result, _err, { sessionId }) => [
                { type: "LoadTestDiscovery", id: sessionId },
            ],
        }),
    }),
});

export const { useLazyGenerateDiscoveryPayloadQuery, useStartDiscoveryMutation } =
    loadTestDiscoveryApi;
