import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import type { ApiError } from "@dashboard/services/httpClient";

export function useGet<TData>(
    key: QueryKey,
    fetcher: () => Promise<TData>,
    options?: Omit<UseQueryOptions<TData, ApiError>, "queryKey" | "queryFn">
) {
    return useQuery<TData, ApiError>({
        queryKey: key,
        queryFn: fetcher,
        ...options,
    });
}
