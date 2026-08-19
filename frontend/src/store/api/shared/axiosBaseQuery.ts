import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import type { AxiosError, AxiosInstance, AxiosRequestConfig, Method } from "axios";

// Mutation error toasts are handled per-endpoint in each endpoint file's `onQueryStarted`
export interface IAxiosBaseQueryArgs {
    url: string;
    method?: Method;
    data?: unknown;
    params?: AxiosRequestConfig["params"];
    timeout?: number;
    // Per-request headers, for the one caller whose credential cannot live on
    // the instance: the MCP session viewer reads a different engine on every
    // visit, so its token arrives with the request rather than with the client.
    headers?: AxiosRequestConfig["headers"];
}

export interface IAxiosBaseQueryError {
    status?: number;
    data?: unknown;
    message?: string;
}

export const axiosBaseQuery =
    (instance: AxiosInstance): BaseQueryFn<IAxiosBaseQueryArgs, unknown, IAxiosBaseQueryError> =>
    async ({ url, method = "GET", data, params, timeout, headers }, { signal }) => {
        try {
            const result = await instance.request({
                url,
                method,
                data,
                params,
                timeout,
                headers,
                // RTK Query aborts this when the query args change or the last
                // subscriber goes away. Without forwarding it, a superseded
                // request still ran to completion holding one of the browser's
                // ~6 connections per host, so the request the user is actually
                // waiting on could queue behind results already thrown away.
                //
                // An abort rejects with code ERR_CANCELED and lands in the catch
                // below; RTK Query discards the result of a request it aborted,
                // so it never reaches the UI.
                signal,
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
