import { API_ROUTES } from "@services/apiRoutes";
import { loadTestApi } from "@store/api/loadTest/loadTestApi";
import type { ICreateLoadTestSessionParams, ICreateLoadTestSessionResponse } from "./types";

// Named createLoadTestSession/deleteLoadTestSession (not createSession/deleteSession) to avoid a
// hook-name collision with main's session endpoints (spec §4.3) once those exist.
export const loadTestSessionApi = loadTestApi.injectEndpoints({
    endpoints: (builder) => ({
        createLoadTestSession: builder.mutation<
            ICreateLoadTestSessionResponse,
            ICreateLoadTestSessionParams
        >({
            query: ({ bppId, bppUri }) => ({
                url: API_ROUTES.LOAD_TEST.SESSIONS,
                method: "POST",
                data: { bpp_id: bppId, bpp_uri: bppUri },
            }),
            invalidatesTags: [{ type: "LoadTestSession", id: "LIST" }],
        }),
        deleteLoadTestSession: builder.mutation<unknown, string>({
            query: (sessionId) => ({
                url: API_ROUTES.LOAD_TEST.SESSION_BY_ID(sessionId),
                method: "DELETE",
            }),
            invalidatesTags: [{ type: "LoadTestSession", id: "LIST" }],
        }),
    }),
});

export const { useCreateLoadTestSessionMutation, useDeleteLoadTestSessionMutation } =
    loadTestSessionApi;
