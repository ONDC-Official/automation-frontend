import { useEffect, useMemo } from "react";
import { ChevronDownIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Badge } from "@components/Shadcn/Badge";
import { Progress } from "@components/Shadcn/Progress/progress";
import { getOrderedSteps, stepSignature } from "@components/DomainFlowRunner/MappedFlowUtils";
import { useGetMcpFlowQuery, type McpNpType, type McpRun } from "@store/api";
import type { McpEngineTarget } from "@services/mcpEngineClient";
import type { MappedStep } from "@/types/flow-state-type";
import { cn } from "@/lib/utils";
import { McpStepCard } from "./McpStepCard";
import { isRunActive, runPercent } from "./utils";

/**
 * One run: its progress, and — when opened — its steps.
 *
 * The step map is fetched **only while the card is open**. A session can carry
 * a dozen runs and each map is a separate read on the engine, so fetching them
 * all to render a progress bar the summary already carries would multiply the
 * load by ten for nothing.
 */

export interface McpRunCardProps {
    run: McpRun;
    target: McpEngineTarget;
    npType: McpNpType;
    isOpen: boolean;
    onToggle: () => void;
    /** Bumped by the event stream; makes the open card refetch. */
    revision: number;
    onInspect: (step: MappedStep) => void;
}

export function McpRunCard({
    run,
    target,
    npType,
    isOpen,
    onToggle,
    revision,
    onInspect,
}: McpRunCardProps) {
    const active = isRunActive(run);
    const percent = runPercent(run);

    const flowQuery = useGetMcpFlowQuery(
        { ...target, sessionId: target.sessionId, flowId: run.flow_id },
        { skip: !isOpen, refetchOnMountOrArgChange: true }
    );

    // `revision` is not a query argument — refetch, do not re-key, or every
    // event would drop the open card back through its loading state and the
    // step list would blink on every callback.
    const { refetch, data } = flowQuery;
    useEffect(() => {
        if (isOpen && revision > 0) void refetch();
    }, [revision, isOpen, refetch]);

    const pairs = useMemo(() => (data ? getOrderedSteps(data.map) : []), [data]);

    return (
        <div
            className={cn(
                "rounded-xl border shadow-xs transition-colors",
                active
                    ? "border-brand-light-active bg-brand-light/40 dark:border-border-default dark:bg-brand-dark/20"
                    : "border-n-30 bg-surface-elevated dark:border-border-default"
            )}
        >
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
                <ChevronDownIcon
                    className={cn(
                        "size-4 shrink-0 text-text-secondary transition-transform",
                        isOpen && "rotate-180"
                    )}
                />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold text-text-primary">
                            {run.flow_id}
                        </span>
                        <RunStatusBadge run={run} />
                        {run.attempt > 1 ? (
                            <Badge variant="secondary">attempt {run.attempt}</Badge>
                        ) : null}
                        {run.auto_advance ? <Badge variant="info">auto</Badge> : null}
                    </div>

                    {run.error === undefined ? (
                        <div className="mt-2 flex items-center gap-3">
                            <Progress
                                value={percent}
                                className="h-1.5 flex-1 bg-n-30 **:data-[slot=progress-indicator]:bg-alert-500"
                            />
                            <span className="shrink-0 text-caption-1 font-semibold text-text-secondary">
                                {run.steps_complete ?? 0}/{run.steps_total ?? 0}
                            </span>
                        </div>
                    ) : null}

                    {run.next_message && run.error === undefined ? (
                        <p className="mt-1.5 truncate text-caption-1 text-text-secondary">
                            {run.next_message}
                        </p>
                    ) : null}
                </div>
            </button>

            {run.error !== undefined ? (
                // One run the engine could not read must not take the others
                // with it — say what happened on its own row and carry on.
                <div className="flex items-start gap-2 border-t border-n-30 px-4 py-3 text-caption-1 text-text-secondary dark:border-border-default">
                    <ExclamationTriangleIcon className="mt-0.5 size-4 shrink-0 text-alert-500" />
                    <span>This run could not be read: {run.error}</span>
                </div>
            ) : null}

            {isOpen && run.error === undefined ? (
                <div className="border-t border-n-30 px-4 py-3 dark:border-border-default">
                    {flowQuery.isLoading ? (
                        <p className="text-caption-1 text-text-secondary">Loading steps…</p>
                    ) : flowQuery.isError ? (
                        <p className="text-caption-1 text-error-500">
                            Could not load this run&apos;s steps.
                        </p>
                    ) : pairs.length === 0 ? (
                        <p className="text-caption-1 text-text-secondary">
                            This flow has no steps.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {pairs.map((pair) => (
                                <McpStepCard
                                    key={stepSignature(pair.first)}
                                    pairedStep={pair}
                                    npType={npType}
                                    onInspect={onInspect}
                                />
                            ))}
                        </div>
                    )}

                    {data?.attention ? (
                        <div className="mt-3 rounded-lg border border-alert-200 bg-alert-50/80 px-3 py-2 text-caption-1 text-alert-800 dark:border-alert-800 dark:bg-alert-800/20 dark:text-alert-200">
                            <span className="font-semibold">{data.attention.kind}</span> —{" "}
                            {data.attention.message}
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}

function RunStatusBadge({ run }: { run: McpRun }) {
    if (run.error !== undefined) return <Badge variant="error">unreadable</Badge>;

    switch (run.flow_status) {
        case "COMPLETE":
            return <Badge variant="success">complete</Badge>;
        case "BLOCKED":
            return <Badge variant="error">blocked</Badge>;
        case "IN_PROGRESS":
            return <Badge variant="alert">running</Badge>;
        default:
            return <Badge variant="secondary">not started</Badge>;
    }
}
