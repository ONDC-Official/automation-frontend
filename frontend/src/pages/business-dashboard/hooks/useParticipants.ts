import { useGetDashboardParticipantQuery, useGetDashboardParticipantsQuery } from "@store/api";
import type { NpFilters } from "@pages/business-dashboard/services/types";

export const useParticipants = (filters: NpFilters) => useGetDashboardParticipantsQuery(filters);

export const useParticipant = (host: string | null, filters: NpFilters) =>
    useGetDashboardParticipantQuery({ host: host ?? "", filters }, { skip: !host });
