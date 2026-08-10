import httpClient from "@dashboard/services/httpClient";
import { compactParams, filenameFromContentDisposition } from "@dashboard/lib/queryParams";
import type { NpFilters, SessionFilters } from "@dashboard/services/types";
import { usePost } from "./usePost";

export const exportKeys = {
    all: ["export"] as const,
    sessionsCsv: ["export", "sessions-csv"] as const,
    participantsCsv: ["export", "participants-csv"] as const,
};

export interface ExportSessionsRequest {
    filters: SessionFilters;
    /** column ids in the order they should appear in the CSV */
    columns: string[];
}

export interface ExportParticipantsRequest {
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
 * `GET /api/sessions/export?<filters>&columns=a,b,c` — streams a CSV back with
 * a `Content-Disposition` attachment header. Takes the same `SessionFilters`
 * the table is showing, so "download what I'm looking at" is one call.
 *
 * Modelled as a mutation because it is an imperative user action with a side
 * effect (a file lands on disk), not cacheable server state.
 */
export function useExportSessions() {
    return usePost<void, ExportSessionsRequest>(
        async ({ filters, columns }) => {
            const response = await httpClient.get("/api/sessions/export", {
                params: compactParams({
                    ...filters,
                    page: undefined,
                    limit: undefined,
                    columns: columns.join(","),
                }),
                responseType: "blob",
            });

            const filename = filenameFromContentDisposition(
                response.headers["content-disposition"] as string | undefined,
                `sessions-${new Date().toISOString().slice(0, 10)}.csv`
            );

            triggerDownload(new Blob([response.data as BlobPart], { type: "text/csv" }), filename);
        },
        { mutationKey: exportKeys.sessionsCsv }
    );
}

/**
 * `GET /api/sessions/participants/export?<filters>&tz=…` — the participants
 * table as a CSV, columns fixed to what the page shows. No column picker: the
 * ask here is "download what I'm looking at", not "compose an extract".
 *
 * Paging is dropped so the file covers the whole filtered set, but `sort`/
 * `order` are kept so its row order matches the screen. `tz` goes along because
 * the server renders the timestamps as display text, and only the browser knows
 * which zone the user is reading them in.
 */
export function useExportParticipants() {
    return usePost<void, ExportParticipantsRequest>(
        async ({ filters }) => {
            const response = await httpClient.get("/api/sessions/participants/export", {
                params: compactParams({
                    ...filters,
                    page: undefined,
                    limit: undefined,
                    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
                }),
                responseType: "blob",
            });

            const filename = filenameFromContentDisposition(
                response.headers["content-disposition"] as string | undefined,
                `participants-${new Date().toISOString().slice(0, 10)}.csv`
            );

            triggerDownload(new Blob([response.data as BlobPart], { type: "text/csv" }), filename);
        },
        { mutationKey: exportKeys.participantsCsv }
    );
}
