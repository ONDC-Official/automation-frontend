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
        "Expectation",
        "FlowPermission",
        "Payload",
        "Report",
        "SessionLogs",
        "SubscriberUrl",
        "ScenarioPreference",
        "ProfileFlows",
        "Validation",
        "Subscriber",
        "FormCompletion",
        "FinvuConsent",
        "Health",
    ],
    endpoints: () => ({}),
});

export default mainApi;
