import { createApi } from "@reduxjs/toolkit/query/react";
import { loadTestApiClient } from "@services/apiClient";
import { axiosBaseQuery } from "@store/api/shared/axiosBaseQuery";

export const loadTestApi = createApi({
    reducerPath: "loadTestApi",
    baseQuery: axiosBaseQuery(loadTestApiClient.getInstance()),
    tagTypes: ["LoadTestSession", "LoadTestRun", "LoadTestDiscovery"],
    endpoints: () => ({}),
});

export default loadTestApi;
