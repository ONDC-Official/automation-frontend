import { useState } from "react";
import { toast } from "react-toastify";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/Shadcn/Button/button";
import { RadialProgressChart } from "@/components/Shadcn/Chart";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@pages/user-profile/components/ProgressBar";
import { TagBadge } from "@pages/user-profile/components/TagBadge";
import { formatEnvLabel } from "@pages/user-profile/utils/formatEnvLabel";
import { formatLastRunText } from "@pages/user-profile/utils/formatLastRunText";
import {
    getPastReportMeta,
    getPastReportPcts,
    getPastReportTitle,
} from "@pages/user-profile/utils/getPastReportDisplay";
import type { IPastReportCardProps } from "@pages/user-profile/types";

const CHART_COLOR = "var(--color-alert-500)";

export const PastReportCard = ({
    report,
    isViewing,
    onView,
    flowDescription,
}: IPastReportCardProps) => {
    const [copied, setCopied] = useState(false);
    const meta = getPastReportMeta(report);
    const { overallPct, mandatoryPct, optionalPct } = getPastReportPcts(report);
    const title = getPastReportTitle(report);
    const lastRunText = formatLastRunText(report.updatedAt ?? report.createdAt, overallPct);

    const handleCopy = async () => {
        if (!meta.subscriberUrl) return;
        try {
            await navigator.clipboard.writeText(meta.subscriberUrl);
            setCopied(true);
            toast.success("URL copied");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy URL");
        }
    };

    const hasBadges = meta.domain || meta.env || meta.version || meta.npType;

    return (
        <div
            className={cn(
                "flex flex-col gap-4 rounded-xl border border-n-30 px-4 py-2 mt-3 transition-all",
                "bg-brand-light/40 hover:border-n-40 dark:border-border-default dark:bg-surface-muted lg:flex-row lg:items-center"
            )}
        >
            <div className="min-w-0 flex-1">
                <p className="text-body-1 font-semibold text-text-primary leading-snug truncate">
                    {title}
                </p>

                {flowDescription ? (
                    <p className="text-caption-2 font-semibold text-text-secondary py-1 mt-0.5">
                        {flowDescription}
                    </p>
                ) : null}

                {meta.subscriberUrl ? (
                    <div className="flex items-center gap-1.5 mt-1 min-w-0">
                        <a
                            href={meta.subscriberUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-caption-1 rounded-md text-brand-normal bg-brand-light font-semibold hover:underline p-1 truncate dark:bg-surface-elevated dark:text-brand-light"
                            title={meta.subscriberUrl}
                        >
                            {meta.subscriberUrl}
                        </a>
                        <Button
                            variant="ghost"
                            size="xs"
                            onClick={handleCopy}
                            className={cn(
                                "shrink-0 transition-colors text-brand-normal",
                                copied && "text-success-500"
                            )}
                        >
                            <ClipboardDocumentIcon className="size-4 text-brand-normal hover:text-brand-light" />
                        </Button>
                    </div>
                ) : null}

                {hasBadges ? (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {meta.domain ? <TagBadge label={meta.domain} variant="domain" /> : null}
                        {meta.env ? (
                            <TagBadge label={formatEnvLabel(meta.env)} variant="env" />
                        ) : null}
                        {meta.version ? (
                            <TagBadge label={`v${meta.version}`} variant="version" />
                        ) : null}
                        {meta.npType ? <TagBadge label={meta.npType} variant="npType" /> : null}
                    </div>
                ) : null}

                <p className="text-caption-1 text-text-secondary mt-3">{lastRunText}</p>
            </div>

            <div className="flex items-center gap-4 shrink-0 lg:pl-2">
                <RadialProgressChart
                    value={overallPct}
                    size={70}
                    color={CHART_COLOR}
                    centerTextColor={CHART_COLOR}
                />
                <ProgressBar label="Mandatory" pct={mandatoryPct} />
                <ProgressBar label="Optional" pct={optionalPct} />
                <Button
                    type="button"
                    size="sm"
                    className="shrink-0"
                    disabled={isViewing}
                    isLoading={isViewing}
                    onClick={() => onView(report.test_id)}
                >
                    View
                </Button>
            </div>
        </div>
    );
};
