import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@services/apiClient";
import { axiosBaseQuery } from "@store/apis/axiosBaseQuery";

export const mainApi = createApi({
    reducerPath: "mainApi",
    baseQuery: axiosBaseQuery(apiClient.getInstance()),
    tagTypes: [],
    endpoints: () => ({}),
});

export default mainApi;
