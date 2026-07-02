import { API_ROUTES } from "@services/apiRoutes";
import type { IValidationResponse } from "@pages/schema-validation/types";
import { mainApi } from "@store/api/main/mainApi";
import type { IValidateActionParams } from "./types";

export const validationApi = mainApi.injectEndpoints({
    endpoints: (builder) => ({
        validateAction: builder.mutation<IValidationResponse, IValidateActionParams>({
            query: ({ action, payload }) => ({
                url: API_ROUTES.FLOW.VALIDATE(action),
                method: "POST",
                data: payload,
            }),
        }),
    }),
});

export const { useValidateActionMutation } = validationApi;
