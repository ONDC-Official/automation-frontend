import { API_ROUTES } from "@services/apiRoutes";
import type { IPastReport } from "@/types/apiShared/userProfile";
import { mainApi } from "@store/api/main/mainApi";
import type { IScenarioPreferenceAPI } from "./types";

export const userProfileApi = mainApi.injectEndpoints({
    endpoints: (builder) => ({
        getScenarioPreferences: builder.query<Record<string, IScenarioPreferenceAPI>, void>({
            query: () => ({
                url: API_ROUTES.USER.SCENARIO_PREFERENCES,
                method: "GET",
            }),
            providesTags: (result) => [
                { type: "ScenarioPreference", id: "LIST" },
                ...Object.keys(result ?? {}).map((key) => ({
                    type: "ScenarioPreference" as const,
                    id: key,
                })),
            ],
        }),
        saveScenarioPreference: builder.mutation<
            unknown,
            { configKey: string; payload: IScenarioPreferenceAPI }
        >({
            query: ({ configKey, payload }) => ({
                url: API_ROUTES.USER.SCENARIO_PREFERENCE_BY_KEY(configKey),
                method: "PUT",
                data: payload,
            }),
            invalidatesTags: [{ type: "ScenarioPreference", id: "LIST" }],
        }),
        deleteScenarioPreference: builder.mutation<unknown, string>({
            query: (configKey) => ({
                url: API_ROUTES.USER.SCENARIO_PREFERENCE_BY_KEY(configKey),
                method: "DELETE",
            }),
            invalidatesTags: [{ type: "ScenarioPreference", id: "LIST" }],
        }),
        getPastReports: builder.query<IPastReport[], string>({
            query: (userId) => ({
                url: API_ROUTES.USER.PAST_REPORTS(userId),
                method: "GET",
            }),
            providesTags: ["Report"],
        }),
    }),
});

export const {
    useGetScenarioPreferencesQuery,
    useLazyGetScenarioPreferencesQuery,
    useSaveScenarioPreferenceMutation,
    useDeleteScenarioPreferenceMutation,
    useGetPastReportsQuery,
} = userProfileApi;
