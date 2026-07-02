import { API_ROUTES } from "@services/apiRoutes";
import { loadTestApi } from "@store/api/loadTest/loadTestApi";
import type { PreorderResponse, IStartPreorderRunParams, IRunStatusParams } from "./types";

export const loadTestRunApi = loadTestApi.injectEndpoints({
    endpoints: (builder) => ({
        startPreorderRun: builder.mutation<PreorderResponse, IStartPreorderRunParams>({
            query: ({ sessionId, rps, duration }) => ({
                url: API_ROUTES.LOAD_TEST.PREORDER(sessionId),
                method: "POST",
                data: { rps, duration_sec: duration },
            }),
        }),
        // Pattern A (spec §9.1) — poll until status === "completed"; the stop condition lives in
        // the consuming hook via pollingInterval, not here.
        getRunStatus: builder.query<Record<string, unknown>, IRunStatusParams>({
            query: ({ sessionId, runId }) => ({
                url: API_ROUTES.LOAD_TEST.RUN_STATUS(sessionId, runId),
                method: "GET",
            }),
            providesTags: (_result, _err, { runId }) => [{ type: "LoadTestRun", id: runId }],
        }),
    }),
});

export const { useStartPreorderRunMutation, useGetRunStatusQuery } = loadTestRunApi;
