import { API_ROUTES } from "@services/apiRoutes";
import { loadTestApi } from "@store/api/loadTest/loadTestApi";
import type { PreorderResponse, IStartPreorderRunParams, IRunStatusParams } from "./types";

export const loadTestRunApi = loadTestApi.injectEndpoints({
    endpoints: (builder) => ({
        // timeout: 0 preserves the old raw-axios call's unlimited wait — a load-test run request can
        // legitimately take a while to be accepted by a backend that's about to generate heavy load.
        startPreorderRun: builder.mutation<PreorderResponse, IStartPreorderRunParams>({
            query: ({ sessionId, rps, duration }) => ({
                url: API_ROUTES.LOAD_TEST.PREORDER(sessionId),
                method: "POST",
                data: { rps, duration_sec: duration },
                timeout: 0,
            }),
        }),
        // Pattern A (spec §9.1) — poll until status === "completed"; the stop condition lives in
        // the consuming hook via pollingInterval, not here. timeout: 0 preserves the old raw-axios
        // call's unlimited wait — the consuming hook aborts polling on the first request error, so a
        // premature client timeout here (the backend is deliberately busy generating load) would
        // silently stop a run that's still healthy server-side.
        getRunStatus: builder.query<Record<string, unknown>, IRunStatusParams>({
            query: ({ sessionId, runId }) => ({
                url: API_ROUTES.LOAD_TEST.RUN_STATUS(sessionId, runId),
                method: "GET",
                timeout: 0,
            }),
            providesTags: (_result, _err, { runId }) => [{ type: "LoadTestRun", id: runId }],
        }),
    }),
});

export const { useStartPreorderRunMutation, useGetRunStatusQuery } = loadTestRunApi;
