import { ArrowDownIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/Shadcn/Button/button";
import { RadialProgressChart } from "@/components/Shadcn/Chart";
import { Spinner } from "@/components/Shadcn/Spinner/spinner";
import { cn } from "@/lib/utils";
import type { IHistorySessionHeaderProps } from "@pages/user-profile/types";

const CHART_COLORS = {
    reportable: "var(--color-alert-500)",
    mandatory: "var(--color-success-500)",
    optional: "var(--color-brand-normal)",
} as const;

export const HistorySessionHeader = ({
    session,
    lastRunText,
    reportablePct,
    mandatoryPct,
    optionalPct,
    isResumeDisabled,
    hasPayloads,
    downloadingLogs,
    onResume,
    onDownloadLogs,
}: IHistorySessionHeaderProps) => (
    <div className="flex flex-1 items-center gap-4 min-w-0">
        <div className="flex-1 min-w-0 text-left">
            <p className="text-body-2 font-semibold text-text-primary truncate font-mono">
                {session.sessionId}
            </p>
            <div className="flex gap-2 mt-1 flex-col">
                <span
                    className={cn(
                        "p-1 rounded text-caption-1 font-semibold w-fit",
                        session.reportExists
                            ? "bg-success-50 text-success-800"
                            : "bg-error-50 text-error-500"
                    )}
                >
                    {session.reportExists ? "Report Available" : "No Report"}
                </span>
                <span className="text-caption-1 text-text-secondary">{lastRunText}</span>
            </div>
        </div>

        <div
            className="hidden md:flex items-center gap-3 shrink-0"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex flex-col items-center gap-1">
                <RadialProgressChart
                    value={reportablePct}
                    size={70}
                    color={CHART_COLORS.reportable}
                    centerTextColor={CHART_COLORS.reportable}
                />
            </div>
            <div className="flex flex-col items-center gap-1">
                <RadialProgressChart
                    value={mandatoryPct}
                    size={70}
                    color={CHART_COLORS.mandatory}
                    centerTextColor={CHART_COLORS.mandatory}
                />
            </div>
            <div className="flex flex-col items-center gap-1">
                <RadialProgressChart
                    value={optionalPct}
                    size={70}
                    color={CHART_COLORS.optional}
                    centerTextColor={CHART_COLORS.optional}
                />
            </div>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button
                type="button"
                size="sm"
                onClick={onResume}
                disabled={isResumeDisabled}
                title={
                    isResumeDisabled
                        ? "Session is older than 48 hours and can no longer be resumed."
                        : undefined
                }
                className="gap-1"
            >
                Resume
            </Button>
            <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={onDownloadLogs}
                disabled={!hasPayloads || downloadingLogs}
                title={!hasPayloads ? "No logs available to download for this session." : undefined}
                className="size-8 rounded-full bg-brand-light-hover"
            >
                {downloadingLogs ? (
                    <Spinner className="size-4" />
                ) : (
                    <div className="flex items-center justify-center bg-brand-normal p-1 rounded-full">
                        <ArrowDownIcon className="size-3 text-n-0" />
                    </div>
                )}
            </Button>
        </div>
    </div>
);
