import { dashboardApi } from "@store/api/dashboard/dashboardApi";
import dashboardHttpClient from "@pages/business-dashboard/services/httpClient";
import {
    compactParams,
    filenameFromContentDisposition,
} from "@pages/business-dashboard/lib/queryParams";
import type { NpFilters, SessionFilters } from "@pages/business-dashboard/services/types";

export interface IExportSessionsArgs {
    filters: SessionFilters;
    /** column ids in the order they should appear in the CSV */
    columns: string[];
}

export interface IExportParticipantsArgs {
    filters: NpFilters;
}

function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

/**
 * Both are mutations because they are imperative user actions with a side effect
 * (a file lands on disk), not cacheable server state — so neither provides tags
 * and neither is ever re-run on its own.
 *
 * They use `queryFn` with the axios instance directly rather than the shared
 * base query, because both need `responseType: "blob"` and the response's
 * Content-Disposition header, and axiosBaseQuery exposes neither.
 */
export const dashboardExportApi = dashboardApi.injectEndpoints({
    endpoints: (builder) => ({
        /**
         * Takes the same SessionFilters the table is showing, so "download what
         * I'm looking at" is one call. Paging is dropped so the file covers the
         * whole filtered set.
         */
        exportDashboardSessions: builder.mutation<void, IExportSessionsArgs>({
            queryFn: async ({ filters, columns }) => {
                try {
                    const response = await dashboardHttpClient.get("/api/sessions/export", {
                        params: compactParams({
                            ...filters,
                            page: undefined,
                            limit: undefined,
                            columns: columns.join(","),
                        }),
                        responseType: "blob",
                    });

                    triggerDownload(
                        new Blob([response.data as BlobPart], { type: "text/csv" }),
                        filenameFromContentDisposition(
                            response.headers["content-disposition"] as string | undefined,
                            `sessions-${new Date().toISOString().slice(0, 10)}.csv`
                        )
                    );

                    return { data: undefined };
                } catch (error) {
                    return { error: { message: (error as Error).message } };
                }
            },
        }),

        /**
         * Columns are fixed to what the page shows — the ask is "download what
         * I'm looking at", not "compose an extract". `sort`/`order` are kept so
         * the file's row order matches the screen, and `tz` goes along because
         * the server renders timestamps as display text and only the browser
         * knows which zone the reader is in.
         */
        exportDashboardParticipants: builder.mutation<void, IExportParticipantsArgs>({
            queryFn: async ({ filters }) => {
                try {
                    const response = await dashboardHttpClient.get(
                        "/api/sessions/participants/export",
                        {
                            params: compactParams({
                                ...filters,
                                page: undefined,
                                limit: undefined,
                                tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
                            }),
                            responseType: "blob",
                        }
                    );

                    triggerDownload(
                        new Blob([response.data as BlobPart], { type: "text/csv" }),
                        filenameFromContentDisposition(
                            response.headers["content-disposition"] as string | undefined,
                            `participants-${new Date().toISOString().slice(0, 10)}.csv`
                        )
                    );

                    return { data: undefined };
                } catch (error) {
                    return { error: { message: (error as Error).message } };
                }
            },
        }),
    }),
});

export const { useExportDashboardSessionsMutation, useExportDashboardParticipantsMutation } =
    dashboardExportApi;
