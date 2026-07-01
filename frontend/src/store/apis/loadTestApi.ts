import { loadTestApiClient } from "@services/apiClient";
import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@store/apis/axiosBaseQuery";

export const loadTestApi = createApi({
    reducerPath: "loadTestApi",
    baseQuery: axiosBaseQuery(loadTestApiClient.getInstance()),
    tagTypes: [],
    endpoints: () => ({}),
});

export default loadTestApi;
