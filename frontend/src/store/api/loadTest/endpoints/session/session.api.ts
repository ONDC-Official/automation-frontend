import { API_ROUTES } from "@services/apiRoutes";
import { loadTestApi } from "@store/api/loadTest/loadTestApi";
import type { ICreateLoadTestSessionParams, ICreateLoadTestSessionResponse } from "./types";

// Named createLoadTestSession/deleteLoadTestSession (not createSession/deleteSession) to avoid a
// hook-name collision with main's session endpoints (spec §4.3) once those exist.
export const loadTestSessionApi = loadTestApi.injectEndpoints({
    endpoints: (builder) => ({
        // timeout: 0 on both preserves the old raw-axios calls' unlimited wait (no timeout was ever
        // configured for the load-test client pre-migration).
        createLoadTestSession: builder.mutation<
            ICreateLoadTestSessionResponse,
            ICreateLoadTestSessionParams
        >({
            query: ({ bppId, bppUri }) => ({
                url: API_ROUTES.LOAD_TEST.SESSIONS,
                method: "POST",
                data: { bpp_id: bppId, bpp_uri: bppUri },
                timeout: 0,
            }),
            invalidatesTags: [{ type: "LoadTestSession", id: "LIST" }],
        }),
        deleteLoadTestSession: builder.mutation<unknown, string>({
            query: (sessionId) => ({
                url: API_ROUTES.LOAD_TEST.SESSION_BY_ID(sessionId),
                method: "DELETE",
                timeout: 0,
            }),
            invalidatesTags: [{ type: "LoadTestSession", id: "LIST" }],
        }),
    }),
});

export const { useCreateLoadTestSessionMutation, useDeleteLoadTestSessionMutation } =
    loadTestSessionApi;
