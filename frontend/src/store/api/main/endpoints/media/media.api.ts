import { API_ROUTES } from "@services/apiRoutes";
import { mainApi } from "@store/api/main/mainApi";
import type { IUploadImageResponse, IUploadMultipleImagesResponse } from "./types";

// No tags — fire-and-forget mutations with nothing in the cache to invalidate (spec §7.1).
export const mediaApi = mainApi.injectEndpoints({
    endpoints: (builder) => ({
        uploadImage: builder.mutation<IUploadImageResponse, FormData>({
            query: (formData) => ({
                url: API_ROUTES.IMAGES.UPLOAD,
                method: "POST",
                data: formData,
            }),
        }),
        uploadMultipleImages: builder.mutation<IUploadMultipleImagesResponse, FormData>({
            query: (formData) => ({
                url: API_ROUTES.IMAGES.UPLOAD_MULTIPLE,
                method: "POST",
                data: formData,
            }),
        }),
    }),
});

export const { useUploadImageMutation, useUploadMultipleImagesMutation } = mediaApi;
