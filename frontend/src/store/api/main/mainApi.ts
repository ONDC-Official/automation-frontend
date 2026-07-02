import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@services/apiClient";
import { axiosBaseQuery } from "@store/api/shared/axiosBaseQuery";

export const mainApi = createApi({
    reducerPath: "mainApi",
    baseQuery: axiosBaseQuery(apiClient.getInstance()),
    tagTypes: [
        "ScenarioFormData",
        "ReportingStatus",
        "Session",
        "Flow",
        "Payload",
        "Report",
        "SessionLogs",
        "SubscriberUrl",
        "ScenarioPreference",
        "ProfileFlows",
        "Subscriber",
        "FormCompletion",
        "FinvuConsent",
        "Health",
        "Build",
        "Spec",
        "ValidationTable",
        "Changelog",
        "Docs",
    ],
    endpoints: () => ({}),
});

export default mainApi;
