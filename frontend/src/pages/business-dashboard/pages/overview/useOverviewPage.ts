import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import type { IRange } from "@pages/business-dashboard/components/DateRangePicker";
import { useSessionStats } from "@pages/business-dashboard/hooks/useSessionStats";
import { isoDaysAgo, toIsoDate } from "@pages/business-dashboard/lib/utils";
import { searchParamsFromFilters } from "@pages/business-dashboard/lib/sessionFilters";
import type { SessionFilters } from "@pages/business-dashboard/services/types";
import { DEFAULT_RANGE_DAYS, MAX_DOMAIN_BARS } from "./constants";
import { bucketLabel, fillDayGaps } from "./utils";

export function useOverviewPage() {
    const [range, setRange] = useState<IRange>(() => ({
        from: isoDaysAgo(DEFAULT_RANGE_DAYS),
        to: toIsoDate(new Date()),
    }));

    const filters = useMemo<SessionFilters>(
        () => ({ from: range.from, to: range.to }),
        [range.from, range.to]
    );

    const { data, isLoading, isError, error, refetch, isFetching } = useSessionStats(filters);

    const totals = data?.totals;

    // byDay is sparse; charting it unfilled would misrepresent the spacing.
    const trend = useMemo(
        () => fillDayGaps(data?.byDay ?? [], range.from, range.to),
        [data, range.from, range.to]
    );

    /**
     * The server already orders breakdowns by `sessions` descending, so this only
     * takes the head — a nominal axis with 40 ticks is unreadable, and the tail is
     * what the Sessions table is for. Bucket keys are nullable.
     */
    const domains = useMemo(
        () =>
            (data?.byDomain ?? []).slice(0, MAX_DOMAIN_BARS).map((bucket) => ({
                ...bucket,
                domain: bucketLabel(bucket.domain),
            })),
        [data]
    );

    const sessionsSparkline = useMemo(
        () => trend.slice(-12).map((point) => point.sessions),
        [trend]
    );

    /** Deep link into Sessions carrying the same date window. */
    const sessionsSearch = useMemo(
        () => new URLSearchParams(searchParamsFromFilters(filters)).toString(),
        [filters]
    );

    const onRangeChange = useCallback((next: IRange) => setRange(next), []);

    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    /**
     * The renderer and the document tree are a heavy dependency for a button that
     * most visits never touch, so it is pulled in on the click rather than at
     * module load. The clock is read here and passed down, keeping the document
     * itself a pure function of its input.
     */
    const onDownloadReport = useCallback(async () => {
        setIsGeneratingReport(true);
        try {
            const { downloadOverviewReport } =
                await import("@pages/business-dashboard/reports/generate");
            await downloadOverviewReport({
                range,
                totals,
                trend,
                domains,
                generatedAt: new Date().toISOString(),
            });
            toast.success("Report downloaded");
        } catch (cause) {
            toast.error(cause instanceof Error ? cause.message : "The report could not be built");
        } finally {
            setIsGeneratingReport(false);
        }
    }, [range, totals, trend, domains]);

    return {
        range,
        onRangeChange,
        sessionsSearch,

        totals,
        trend,
        domains,
        sessionsSparkline,

        isLoading,
        isFetching,
        isError,
        errorMessage: error?.message,
        onRefresh: refetch,

        isGeneratingReport,
        /** No data means an empty document — the button stays out of reach. */
        canDownloadReport: !isLoading && !isError && trend.length > 0,
        onDownloadReport,
    };
}
