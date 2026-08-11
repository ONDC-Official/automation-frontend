import { useGetDashboardSessionStatsQuery } from "@store/api";
import type { SessionFilters } from "@pages/business-dashboard/services/types";

/**
 * `GET /api/sessions/stats?<filters>`. Live data, so it polls on the house 30s
 * interval.
 */
export const useSessionStats = (filters: SessionFilters) =>
    useGetDashboardSessionStatsQuery(filters, { pollingInterval: 30_000 });
