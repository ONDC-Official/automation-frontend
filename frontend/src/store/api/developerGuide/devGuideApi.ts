import { createApi } from "@reduxjs/toolkit/query/react";
import { developerGuideApiClient } from "@services/apiClient";
import { axiosBaseQuery } from "@store/api/shared/axiosBaseQuery";

export const devGuideApi = createApi({
    reducerPath: "devGuideApi",
    baseQuery: axiosBaseQuery(developerGuideApiClient.getInstance()),
    tagTypes: ["User", "Build", "Spec", "ValidationTable", "Changelog", "Docs", "Note", "Comment"],
    endpoints: () => ({}),
});

export default devGuideApi;
