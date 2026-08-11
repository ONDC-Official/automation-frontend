import {
    useGetDashboardSessionFacetsQuery,
    useGetDashboardSessionQuery,
    useGetDashboardSessionsQuery,
} from "@store/api";
import type { SessionFilters } from "@pages/business-dashboard/services/types";

/** `GET /api/sessions/?<filters>` */
export const useSessions = (filters: SessionFilters) => useGetDashboardSessionsQuery(filters);

/** `GET /api/sessions/:sessionId` — the full stored document. */
export const useSession = (sessionId: string | null) =>
    useGetDashboardSessionQuery(sessionId ?? "", { skip: !sessionId });

/** `GET /api/sessions/facets?<filters>` — the filter dropdown options. */
export const useSessionFacets = (filters: SessionFilters = {}) =>
    useGetDashboardSessionFacetsQuery(filters);
