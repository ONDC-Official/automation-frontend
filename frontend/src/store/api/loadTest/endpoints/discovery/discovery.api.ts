import { API_ROUTES } from "@services/apiRoutes";
import type { DiscoveryResponse } from "@/types/apiShared/loadTest";
import { loadTestApi } from "@store/api/loadTest/loadTestApi";
import type { PayloadResponse } from "./types";

export const loadTestDiscoveryApi = loadTestApi.injectEndpoints({
    endpoints: (builder) => ({
        generateDiscoveryPayload: builder.query<PayloadResponse, string>({
            query: (sessionId) => ({
                url: API_ROUTES.LOAD_TEST.DISCOVERY_PAYLOAD(sessionId),
                method: "GET",
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
            }),
            invalidatesTags: (_result, _err, { sessionId }) => [
                { type: "LoadTestDiscovery", id: sessionId },
            ],
        }),
    }),
});

export const { useLazyGenerateDiscoveryPayloadQuery, useStartDiscoveryMutation } =
    loadTestDiscoveryApi;
