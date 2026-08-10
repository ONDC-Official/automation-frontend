import httpClient from "@dashboard/services/httpClient";
import { compactParams } from "@dashboard/lib/queryParams";
import type {
    SessionDetails,
    SessionFacets,
    SessionFilters,
    SessionListResponse,
} from "@dashboard/services/types";
import { useGet } from "./useGet";

export const sessionKeys = {
    all: ["sessions"] as const,
    list: (filters: SessionFilters) => ["sessions", "list", filters] as const,
    detail: (sessionId: string) => ["sessions", "detail", sessionId] as const,
    facets: (filters: SessionFilters) => ["sessions", "facets", filters] as const,
};

/**
 * `GET /api/sessions/?<filters>`. Any recognised param flips the endpoint from
 * the legacy bare array to the paginated envelope, so this hook always sends at
 * least `page`/`limit`.
 */
export function useSessions(filters: SessionFilters) {
    return useGet<SessionListResponse>(sessionKeys.list(filters), async () => {
        const response = await httpClient.get<SessionListResponse>("/api/sessions/", {
            params: compactParams({ ...filters }),
        });
        return response.data;
    });
}

/** `GET /api/sessions/:sessionId` — the full stored document. */
export function useSession(sessionId: string | null) {
    return useGet<SessionDetails>(
        sessionKeys.detail(sessionId ?? ""),
        async () => (await httpClient.get<SessionDetails>(`/api/sessions/${sessionId}`)).data,
        { enabled: Boolean(sessionId) }
    );
}

/**
 * `GET /api/sessions/facets?<filters>` — the filter dropdown options.
 *
 * It takes the same filter set as the list, so the options narrow to what is
 * actually reachable from the current selection: picking a domain leaves only
 * the versions that exist within it, and no combination the user can build ever
 * returns zero rows by surprise.
 */
export function useSessionFacets(filters: SessionFilters = {}) {
    return useGet<SessionFacets>(
        sessionKeys.facets(filters),
        async () =>
            (
                await httpClient.get<SessionFacets>("/api/sessions/facets", {
                    params: compactParams({ ...filters }),
                })
            ).data,
        { staleTime: 60_000 }
    );
}
