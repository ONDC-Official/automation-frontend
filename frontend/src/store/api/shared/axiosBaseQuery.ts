import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import type { AxiosError, AxiosInstance, AxiosRequestConfig, Method } from "axios";

export interface IAxiosBaseQueryArgs {
    url: string;
    method?: Method;
    data?: unknown;
    params?: AxiosRequestConfig["params"];
    timeout?: number;
}

export interface IAxiosBaseQueryError {
    status?: number;
    data?: unknown;
    message?: string;
}

export const axiosBaseQuery =
    (instance: AxiosInstance): BaseQueryFn<IAxiosBaseQueryArgs, unknown, IAxiosBaseQueryError> =>
    async ({ url, method = "GET", data, params, timeout }) => {
        try {
            const result = await instance.request({
                url,
                method,
                data,
                params,
                timeout,
            });

            return { data: result.data };
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string; error?: string }>;

            return {
                error: {
                    status: axiosError.response?.status,
                    data: axiosError.response?.data,
                    message:
                        axiosError.response?.data?.message ??
                        axiosError.response?.data?.error ??
                        axiosError.message,
                },
            };
        }
    };
