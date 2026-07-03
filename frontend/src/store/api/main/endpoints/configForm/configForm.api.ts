import { API_ROUTES } from "@services/apiRoutes";
import { mainApi } from "@store/api/main/mainApi";
import type {
    IScenarioFormDataResponse,
    IReportingStatusParams,
    IGetFlowsParams,
    IGetFlowsResponse,
} from "./types";

export const configFormApi = mainApi.injectEndpoints({
    endpoints: (builder) => ({
        getScenarioFormData: builder.query<IScenarioFormDataResponse, void>({
            query: () => ({
                url: API_ROUTES.CONFIG.SCENARIO_FORM_DATA,
                method: "GET",
            }),
            providesTags: ["ScenarioFormData"],
        }),
        getReportingStatus: builder.query<unknown, IReportingStatusParams>({
            query: ({ domain, version }) => ({
                url: API_ROUTES.CONFIG.REPORTING_STATUS,
                method: "GET",
                params: { domain, version },
            }),
            transformResponse: (response: { data: unknown }) => response.data,
            providesTags: ["ReportingStatus"],
        }),
        getFlows: builder.query<IGetFlowsResponse, IGetFlowsParams>({
            query: ({ domain, version, usecase }) => ({
                url: API_ROUTES.CONFIG.FLOWS,
                method: "GET",
                params: { domain, version, usecase },
            }),
            providesTags: ["ProfileFlows"],
        }),
    }),
});

export const {
    useGetScenarioFormDataQuery,
    useLazyGetScenarioFormDataQuery,
    useGetReportingStatusQuery,
    useGetFlowsQuery,
    useLazyGetFlowsQuery,
} = configFormApi;
