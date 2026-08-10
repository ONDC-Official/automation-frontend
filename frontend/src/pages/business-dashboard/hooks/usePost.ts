import {
    useMutation,
    useQueryClient,
    type QueryKey,
    type UseMutationOptions,
} from "@tanstack/react-query";
import type { ApiError } from "@pages/business-dashboard/services/httpClient";

interface PostOptions<TData, TVariables> extends Omit<
    UseMutationOptions<TData, ApiError, TVariables>,
    "mutationFn"
> {
    /** keys to invalidate on success */
    invalidates?: QueryKey[];
}

export function usePost<TData, TVariables = void>(
    mutator: (variables: TVariables) => Promise<TData>,
    { invalidates, ...options }: PostOptions<TData, TVariables> = {}
) {
    const queryClient = useQueryClient();

    return useMutation<TData, ApiError, TVariables>({
        mutationFn: mutator,
        ...options,
        onSuccess: (data, variables, onMutateResult, context) => {
            invalidates?.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
            options.onSuccess?.(data, variables, onMutateResult, context);
        },
    });
}
