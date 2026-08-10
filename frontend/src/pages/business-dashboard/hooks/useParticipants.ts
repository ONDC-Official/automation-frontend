import httpClient from "@dashboard/services/httpClient";
import { compactParams } from "@dashboard/lib/queryParams";
import type {
    NpFilters,
    ParticipantDetail,
    ParticipantListResponse,
} from "@dashboard/services/types";
import { useGet } from "./useGet";

export const participantKeys = {
    all: ["participants"] as const,
    list: (filters: NpFilters) => ["participants", "list", filters] as const,
    detail: (host: string, filters: NpFilters) =>
        ["participants", "detail", host, filters] as const,
};

export function useParticipants(filters: NpFilters) {
    return useGet<ParticipantListResponse>(participantKeys.list(filters), async () => {
        const response = await httpClient.get<ParticipantListResponse>(
            "/api/sessions/participants",
            { params: compactParams({ ...filters }) }
        );
        return response.data;
    });
}

export function useParticipant(host: string | null, filters: NpFilters) {
    return useGet<ParticipantDetail>(
        participantKeys.detail(host ?? "", filters),
        async () => {
            // The host is a path segment and may contain a port, so it is encoded.
            const response = await httpClient.get<ParticipantDetail>(
                `/api/sessions/participants/${encodeURIComponent(host ?? "")}`,
                { params: compactParams({ ...filters }) }
            );
            return response.data;
        },
        { enabled: Boolean(host) }
    );
}
