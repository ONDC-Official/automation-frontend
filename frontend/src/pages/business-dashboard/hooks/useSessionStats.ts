import httpClient from "@pages/business-dashboard/services/httpClient";
import { compactParams } from "@pages/business-dashboard/lib/queryParams";
import type {
    SessionFilters,
    SessionStatsResponse,
} from "@pages/business-dashboard/services/types";
import { useGet } from "./useGet";

export const statsKeys = {
    all: ["session-stats"] as const,
    summary: (filters: SessionFilters) => ["session-stats", "summary", filters] as const,
};

/**
 * `GET /api/sessions/stats?<filters>` — takes the exact same filter shape as
 * the sessions list, so the Overview KPIs and the Sessions table can never
 * describe different slices. Live data, so it polls on the house 30s interval.
 */
export function useSessionStats(filters: SessionFilters) {
    return useGet<SessionStatsResponse>(
        statsKeys.summary(filters),
        async () =>
            (
                await httpClient.get<SessionStatsResponse>("/api/sessions/stats", {
                    params: compactParams({ ...filters }),
                })
            ).data,
        { refetchInterval: 30_000 }
    );
}
