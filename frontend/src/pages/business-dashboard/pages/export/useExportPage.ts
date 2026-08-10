import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { useExportSessions } from "@dashboard/hooks/useExport";
import { useSessions } from "@dashboard/hooks/useSessions";
import { filtersFromSearchParams, withoutPaging } from "@dashboard/lib/sessionFilters";
import { DEFAULT_COLUMN_IDS, EXPORT_COLUMNS, LOCKED_COLUMN_IDS, PREVIEW_LIMIT } from "./constants";

export function useExportPage() {
    const [searchParams] = useSearchParams();
    const [selected, setSelected] = useState<string[]>(DEFAULT_COLUMN_IDS);

    // The Export page reads the very same query string the Sessions page writes,
    // so arriving from "Export this slice" needs no translation step.
    const serialised = searchParams.toString();
    const filters = useMemo(
        () => filtersFromSearchParams(new URLSearchParams(serialised)),
        [serialised]
    );

    const previewQuery = useSessions({
        ...withoutPaging(filters),
        page: 1,
        limit: PREVIEW_LIMIT,
    });

    const { mutate, isPending } = useExportSessions();

    /** Selection follows EXPORT_COLUMNS order, so the CSV column order is stable. */
    const columns = useMemo(
        () =>
            EXPORT_COLUMNS.map((column) => column.id as string).filter((id) =>
                selected.includes(id)
            ),
        [selected]
    );

    const onToggleColumn = useCallback((id: string) => {
        if (LOCKED_COLUMN_IDS.includes(id)) return;
        setSelected((current) =>
            current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
        );
    }, []);

    const onSelectAll = useCallback(
        () => setSelected(EXPORT_COLUMNS.map((column) => column.id as string)),
        []
    );

    const onSelectDefaults = useCallback(() => setSelected(DEFAULT_COLUMN_IDS), []);

    const onDownload = useCallback(() => {
        mutate(
            { filters: withoutPaging(filters), columns },
            {
                onSuccess: () => toast.success("CSV downloaded"),
                onError: (error) =>
                    toast.error(error.message || "The export could not be generated"),
            }
        );
    }, [mutate, filters, columns]);

    return {
        filters,
        backToSessionsSearch: serialised,

        selected,
        columns,
        onToggleColumn,
        onSelectAll,
        onSelectDefaults,

        previewRows: previewQuery.data?.data ?? [],
        matchingRows: previewQuery.data?.total ?? 0,
        isPreviewLoading: previewQuery.isLoading,
        isPreviewError: previewQuery.isError,
        previewErrorMessage: previewQuery.error?.message,

        isDownloading: isPending,
        onDownload,
    };
}
