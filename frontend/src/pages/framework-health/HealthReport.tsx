import { FC, useState } from "react";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { HealthReportData, DomainResult, VersionResult } from "@hooks/useFrameworkHealth";
import AppJsonViewer from "@components/AppJsonViewer";
import { Badge } from "@components/Shadcn/Badge";
import { Button } from "@components/Shadcn/Button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@components/Shadcn/Dialog";
import { cn } from "@/lib/utils";

interface Props {
    report: HealthReportData;
    lastChecked: Date | null;
}

const StatusBadge: FC<{ status: number | null; healthy: boolean }> = ({ status, healthy }) => (
    <Badge variant={healthy ? "success" : "error"} className="gap-1.5">
        <span
            className={cn("size-1.5 rounded-full", healthy ? "bg-success-500" : "bg-error-500")}
        />
        {status !== null ? status : "ERR"}
    </Badge>
);

const VersionDetail: FC<{ v: VersionResult }> = ({ v }) => {
    const parsedError: object | null = (() => {
        if (!v.error) return null;
        const jsonError: { error: string } = {
            error: v.error,
        };
        try {
            return JSON.parse(JSON.stringify(jsonError));
        } catch {
            return null;
        }
    })();

    return (
        <div
            className={cn(
                "space-y-2 rounded-2xl border p-4",
                v.healthy
                    ? "border-success-200 bg-success-50 dark:border-success-500/30 dark:bg-success-500/10"
                    : "border-error-50 bg-error-50 dark:border-error-500/30 dark:bg-error-500/10"
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <code className="rounded-lg bg-brand-light px-2 py-0.5 font-mono text-caption-1 text-brand-normal dark:bg-brand-normal/10">
                    v{v.version}
                </code>
                <StatusBadge status={v.status} healthy={v.healthy} />
            </div>
            <div className="flex flex-wrap gap-1">
                {v.usecases.map((uc) => (
                    <Badge key={uc} variant="outline" className="normal-case font-normal">
                        {uc}
                    </Badge>
                ))}
            </div>
            {v.error && (
                <div className="overflow-hidden rounded-xl border border-error-50 dark:border-error-500/30">
                    {parsedError ? (
                        <AppJsonViewer
                            value={parsedError}
                            style={{
                                padding: "10px",
                                fontSize: "12px",
                            }}
                            shortenTextAfterLength={0}
                            collapsed={2}
                        />
                    ) : (
                        <pre className="whitespace-pre-wrap break-all bg-error-50 p-2 font-mono text-caption-1 text-error-500 dark:bg-error-500/10">
                            {v.error}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
};

const DomainModal: FC<{
    domain: DomainResult;
    open: boolean;
    onClose: () => void;
}> = ({ domain, open, onClose }) => {
    const allHealthy = domain.versions.every((v) => v.healthy);
    const healthyCount = domain.versions.filter((v) => v.healthy).length;

    const statusLabel = allHealthy ? "All OK" : healthyCount === 0 ? "All Failed" : "Partial";
    const statusVariant = allHealthy ? "success" : healthyCount === 0 ? "error" : "alert";
    const dotColor = allHealthy
        ? "bg-success-500"
        : healthyCount === 0
          ? "bg-error-500"
          : "bg-alert-500";

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="shrink-0 flex-row items-center space-y-0 gap-3 border-b border-n-40 px-6 py-4 pr-12 dark:border-n-60">
                    <span className={cn("size-3 shrink-0 rounded-full", dotColor)} />
                    <DialogTitle className="truncate font-mono">{domain.domain}</DialogTitle>
                    <Badge variant={statusVariant} className="shrink-0">
                        {statusLabel}
                    </Badge>
                    <DialogDescription className="m-0 shrink-0 text-caption-1 text-n-300 dark:text-n-60">
                        {healthyCount}/{domain.versions.length} healthy
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 overflow-y-auto px-6 py-4">
                    {domain.versions.map((v) => (
                        <VersionDetail key={v.version} v={v} />
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};

const DomainBox: FC<{ domain: DomainResult; onOpen: () => void }> = ({ domain, onOpen }) => {
    const allHealthy = domain.versions.every((v) => v.healthy);
    const healthyCount = domain.versions.filter((v) => v.healthy).length;
    const totalCount = domain.versions.length;

    const statusLabel = allHealthy ? "All OK" : healthyCount === 0 ? "All Failed" : "Partial";
    const statusVariant = allHealthy ? "success" : healthyCount === 0 ? "error" : "alert";
    const accentColor = allHealthy
        ? "from-success-500 to-success-500/70"
        : healthyCount === 0
          ? "from-error-500 to-error-500/70"
          : "from-alert-500 to-alert-500/70";
    const dotColor = allHealthy
        ? "bg-success-500"
        : healthyCount === 0
          ? "bg-error-500"
          : "bg-alert-500";

    return (
        <Button
            type="button"
            variant="ghost"
            onClick={onOpen}
            className={cn(
                "group relative h-auto w-full flex-col items-stretch justify-start gap-3 overflow-hidden whitespace-normal rounded-2xl border border-n-40 bg-white p-5 text-left font-normal",
                "transition-all duration-200 hover:border-brand-normal/40 hover:shadow-lg hover:shadow-brand-normal/10",
                "dark:border-n-60 dark:bg-surface-elevated dark:hover:border-brand-normal/30 dark:hover:shadow-brand-normal/5"
            )}
        >
            <div
                className={cn(
                    "absolute inset-x-0 top-0 h-0.75 rounded-t-2xl bg-linear-to-r opacity-80 transition-opacity duration-200 group-hover:opacity-100",
                    accentColor
                )}
            />

            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <span className={cn("mt-0.5 size-2.5 shrink-0 rounded-full", dotColor)} />
                    <span className="break-all font-mono text-body-2 font-semibold leading-tight text-n-900 dark:text-n-0">
                        {domain.domain}
                    </span>
                </div>
                <ArrowTopRightOnSquareIcon
                    className="mt-0.5 size-3.5 shrink-0 text-n-60 transition-colors group-hover:text-brand-normal"
                    aria-hidden
                />
            </div>

            <div className="flex items-center gap-2">
                <Badge variant={statusVariant}>{statusLabel}</Badge>
                <span className="text-caption-1 text-n-300 dark:text-n-60">
                    {healthyCount}/{totalCount} versions
                </span>
            </div>

            <div className="flex flex-wrap gap-1">
                {domain.versions.map((v) => (
                    <Badge
                        key={v.version}
                        variant={v.healthy ? "success" : "error"}
                        className="px-1.5 font-mono normal-case"
                    >
                        v{v.version}
                    </Badge>
                ))}
            </div>
        </Button>
    );
};

const SummaryStat: FC<{
    value: string | number;
    label: string;
    valueClassName?: string;
    labelClassName?: string;
}> = ({ value, label, valueClassName, labelClassName }) => (
    <div className="flex flex-col items-center rounded-2xl border border-n-40 bg-white px-4 py-5 text-center dark:border-n-60 dark:bg-surface-elevated">
        <p className={cn("text-h4 font-bold text-n-900 dark:text-n-0", valueClassName)}>{value}</p>
        <p className={cn("mt-1 text-caption-1 text-n-300 dark:text-n-60", labelClassName)}>
            {label}
        </p>
    </div>
);

const HealthReport: FC<Props> = ({ report, lastChecked }) => {
    const { summary, results } = report;
    const healthPct = summary.totalChecked
        ? Math.round((summary.totalHealthy / summary.totalChecked) * 100)
        : 0;

    const [filter, setFilter] = useState<"all" | "healthy" | "unhealthy">("all");
    const [selected, setSelected] = useState<DomainResult | null>(null);

    const filtered = results.filter((d) => {
        if (filter === "healthy") return d.versions.every((v) => v.healthy);
        if (filter === "unhealthy") return d.versions.some((v) => !v.healthy);
        return true;
    });

    const healthPctColor =
        healthPct === 100
            ? "text-success-500"
            : healthPct >= 50
              ? "text-alert-500"
              : "text-error-500";

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                <SummaryStat value={summary.totalChecked} label="Total Checked" />
                <SummaryStat
                    value={summary.totalHealthy}
                    label="Healthy"
                    valueClassName="text-success-500"
                    labelClassName="text-success-800 dark:text-success-500"
                />
                <SummaryStat
                    value={summary.totalUnhealthy}
                    label="Unhealthy"
                    valueClassName="text-error-500"
                    labelClassName="text-error-500"
                />
                <SummaryStat
                    value={`${healthPct}%`}
                    label="Health Rate"
                    valueClassName={healthPctColor}
                />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-n-40 bg-white px-4 py-2.5 dark:border-n-60 dark:bg-surface-elevated">
                <div className="flex flex-wrap items-center gap-3">
                    <div
                        role="group"
                        aria-label="Filter domains by health"
                        className="inline-flex items-center gap-1.5"
                    >
                        {(
                            [
                                { id: "all", label: "All" },
                                { id: "healthy", label: "Healthy" },
                                { id: "unhealthy", label: "Unhealthy" },
                            ] as const
                        ).map(({ id, label }) => (
                            <Button
                                key={id}
                                type="button"
                                size="sm"
                                variant={filter === id ? "default" : "outline"}
                                aria-pressed={filter === id}
                                onClick={() => setFilter(id)}
                            >
                                {label}
                            </Button>
                        ))}
                    </div>
                    <span className="text-caption-1 text-n-300 dark:text-n-60">
                        {filtered.length} domains
                    </span>
                </div>
                {lastChecked && (
                    <p className="text-caption-1 text-n-300 dark:text-n-60">
                        Last checked: {lastChecked.toLocaleTimeString()}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5">
                {filtered.map((d) => (
                    <DomainBox key={d.domain} domain={d} onOpen={() => setSelected(d)} />
                ))}
            </div>

            {selected && (
                <DomainModal
                    domain={selected}
                    open={Boolean(selected)}
                    onClose={() => setSelected(null)}
                />
            )}
        </div>
    );
};

export default HealthReport;
