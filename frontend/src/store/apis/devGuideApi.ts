import { createApi } from "@reduxjs/toolkit/query/react";
import { developerGuideApiClient } from "@services/apiClient";
import { API_ROUTES } from "@services/apiRoutes";
import { IUser } from "@/types/user";
import { axiosBaseQuery } from "@store/apis/axiosBaseQuery";

export interface IGetMeResponse {
    ok: boolean;
    user: IUser;
}

export const devGuideApi = createApi({
    reducerPath: "devGuideApi",
    baseQuery: axiosBaseQuery(developerGuideApiClient.getInstance()),
    tagTypes: ["User"],
    endpoints: (builder) => ({
        getMe: builder.query<IGetMeResponse, void>({
            query: () => ({
                url: API_ROUTES.AUTH.ME,
                method: "GET",
            }),
            providesTags: ["User"],
        }),
    }),
});

export const { useGetMeQuery, useLazyGetMeQuery } = devGuideApi;

export default devGuideApi;
