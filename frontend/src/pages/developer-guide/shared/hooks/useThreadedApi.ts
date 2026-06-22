import { useCallback, useEffect, useState } from "react";

export interface UseThreadedApiConfig<TItem> {
    /** Whether the panel is backed by the API (flowId + useCaseId present) vs local-only fallback state. */
    enabled: boolean;
    fetchItems: () => Promise<TItem[]>;
    /** Dependencies that should trigger a refetch (e.g. [flowId, useCaseId, actionApi]). */
    deps: unknown[];
}

export interface UseThreadedApiResult<TItem> {
    items: TItem[];
    setItems: (next: TItem[] | ((prev: TItem[]) => TItem[])) => void;
    loading: boolean;
    error: string | null;
    setError: (message: string | null) => void;
    refetch: (showLoader?: boolean) => Promise<void>;
    /** Runs an API mutation, surfaces failures into `error`, and refetches on success. Resolves to whether it succeeded. */
    mutate: (action: () => Promise<unknown>, errorMessage: string) => Promise<boolean>;
}

/**
 * Encapsulates the dual local-state/API-backed fetch+mutate lifecycle shared by
 * NotesPanel and CommentsPanel: load on mount when `enabled`, track loading/error,
 * and refetch after create/update/delete/resolve actions.
 */
export function useThreadedApi<TItem>({
    enabled,
    fetchItems,
    deps,
}: UseThreadedApiConfig<TItem>): UseThreadedApiResult<TItem> {
    const [items, setItems] = useState<TItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(
        async (showLoader = true) => {
            if (!enabled) return;
            if (showLoader) setLoading(true);
            setError(null);
            try {
                const list = await fetchItems();
                setItems(list);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load");
            } finally {
                if (showLoader) setLoading(false);
            }
        },

        [enabled, fetchItems, ...deps]
    );

    useEffect(() => {
        if (enabled) void refetch();
    }, [enabled, ...deps]);

    const mutate = useCallback(
        async (action: () => Promise<unknown>, errorMessage: string) => {
            setError(null);
            try {
                await action();
                await refetch(false);
                return true;
            } catch (err) {
                setError(err instanceof Error ? err.message : errorMessage);
                return false;
            }
        },
        [refetch]
    );

    return { items, setItems, loading, error, setError, refetch, mutate };
}
