import { useState } from "react";
import {
    ArrowPathIcon,
    BoltIcon,
    CheckCircleIcon,
    ChevronDownIcon,
    ExclamationTriangleIcon,
    ShareIcon,
} from "@heroicons/react/24/outline";

import CircularProgress from "@components/DomainFlowRunner/CircularProgress";
import { FlowActionButton } from "@components/DomainFlowRunner/FlowActionButton";
import { Badge } from "@components/Shadcn/Badge";
import { Button } from "@components/Shadcn/Button";
import { Progress } from "@components/Shadcn/Progress/progress";
import { TooltipHint } from "@components/Shadcn/Tooltip";
import { cn } from "@/lib/utils";
import type { IStudioLiveStatus } from "@store/api";

import { LiveGraph } from "@pages/protocol-studio/live/live-graph";
import { LiveNextUpBar } from "@pages/protocol-studio/live/live-next-up";
import { LiveRowView, LiveStepCard } from "@pages/protocol-studio/live/live-step-card";
import type {
    LiveJourneyState,
    LiveModel,
    LiveNextUp,
    LiveStep,
} from "@pages/protocol-studio/live/live-steps";
import type { WalkResult } from "@pages/protocol-studio/ui/editor/journeys/derive";
import type { LiveProblem } from "@pages/protocol-studio/live/use-live-run";
import type {
    FlatGraph,
    RunStatus,
    StudioGraph,
    StudioJourney,
    StudioNode,
} from "@pages/protocol-studio/ui/editor/types";

/** What the side panel shows: a step of a journey, or a payload the run did not take. */
export type LiveSelection =
    | { kind: "step"; journeyId: string; nodeId: string }
    | { kind: "rejected"; journeyId: string; index: number };

const RUNNING = "border-brand-light-active bg-brand-light text-brand-normal dark:bg-brand-dark/30";

const JOURNEY_STATE: Record<LiveJourneyState, { text: string; className: string }> = {
    "not-started": { text: "Not started", className: "" },
    idle: { text: "Running", className: RUNNING },
    working: { text: "Mock sending", className: RUNNING },
    waiting: {
        text: "Waiting for your NP",
        className:
            "border-alert-200 bg-alert-50 text-alert-800 dark:border-alert-800/40 dark:bg-alert-800/15 dark:text-alert-200",
    },
    input: { text: "Needs input", className: RUNNING },
    paused: { text: "Paused", className: RUNNING },
    finished: {
        text: "Finished",
        className:
            "border-success-200 bg-success-50 text-success-800 dark:border-success-800/40 dark:bg-success-800/15 dark:text-success-200",
    },
    failed: {
        text: "Failed",
        className: "border-error-50 bg-error-50 text-error-500 dark:bg-error-800/10",
    },
    deviated: {
        text: "Deviated",
        className:
            "border-purple-200 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-100",
    },
};

export interface ILiveJourneyCardProps {
    journey: StudioJourney;
    walk: WalkResult;
    model: LiveModel;
    status: IStudioLiveStatus | null;
    journeyState: LiveJourneyState;
    transactionId: string | null;
    /**
     * Started, but the participant opens the journey: the request it must send (no
     * transaction exists until it arrives).
     */
    awaiting: string | null;
    /** What went wrong on the run, newest first (shown on the open card). */
    problems: LiveProblem[];
    /** What happens next on the run (shown on the open card). */
    nextUp: LiveNextUp;
    /** Opens the inputs / form prompt again. */
    onInputs: () => void;
    /** Step-through: has the mock send the payload it is paused before. */
    onStep: () => void;
    /** The card is expanded: it is the journey the page drives and polls. */
    open: boolean;
    onToggle: () => void;
    busy: boolean;
    onStart: () => void;
    onFinish: () => void;
    onTrigger: (nodeId: string) => void;
    selection: LiveSelection | null;
    onSelectStep: (step: LiveStep) => void;
    onSelectRejected: (index: number) => void;
    /** For the Graph view. */
    root: StudioGraph;
    flat: FlatGraph;
}

/**
 * One picked journey as a v1 flow card: title, progress and controls in the
 * header; the steps as paired cards in the body, then on-demand triggers,
 * steps that ran off the path, and the payloads the run did not take. The
 * graph, lit with the run, is one click away.
 */
export const LiveJourneyCard = ({
    journey,
    walk,
    model,
    status,
    journeyState,
    transactionId,
    awaiting,
    problems,
    nextUp,
    onInputs,
    onStep,
    open,
    onToggle,
    busy,
    onStart,
    onFinish,
    onTrigger,
    selection,
    onSelectStep,
    onSelectRejected,
    root,
    flat,
}: ILiveJourneyCardProps) => {
    const [graph, setGraph] = useState(false);
    const { done, total } = model.progress;
    const percent = total ? (done / total) * 100 : 0;
    const look = JOURNEY_STATE[journeyState];
    const started = !!transactionId || !!awaiting;
    const ended = ["finished", "failed", "deviated"].includes(journeyState);
    const canFinish = open && started && !ended && !!status?.next.canEnd;
    const selectedNode =
        selection?.journeyId === journey.id && selection.kind === "step" ? selection.nodeId : null;
    const selectedRejected =
        selection?.journeyId === journey.id && selection.kind === "rejected"
            ? selection.index
            : null;
    const triggerable = new Set(status?.next.onDemand ?? []);
    const onDemand: StudioNode[] = walk.onDemand.filter((n) => journey.onDemand.includes(n.id));
    const rejected = status?.rejected ?? [];
    const deviation = status?.state.deviation ?? null;

    return (
        <div
            className="w-full"
            // e2e hooks (studio-e2e reads these; keep them in step with the state they name).
            data-journey-id={journey.id}
            data-journey-state={journeyState}
            data-transaction-id={transactionId ?? undefined}
            data-awaiting={awaiting ?? undefined}
            data-open={open || undefined}
        >
            <div
                className={cn(
                    "overflow-hidden rounded-xl border border-n-30 shadow-xs dark:border-border-default",
                    open
                        ? "bg-brand-light/40 dark:border-brand-normal/25 dark:bg-surface-elevated"
                        : "bg-surface-elevated"
                )}
            >
                <div
                    className="cursor-pointer px-5 py-4"
                    onClick={onToggle}
                    aria-expanded={open}
                    aria-controls={`live-journey-${journey.id}`}
                >
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="min-w-0 flex-1 wrap-break-word text-body-1 font-semibold text-text-primary">
                            {journey.title || journey.id}
                        </h2>
                        <Badge variant="secondary" className={look.className}>
                            {look.text}
                        </Badge>
                        <ChevronDownIcon
                            className={cn(
                                "size-5 shrink-0 text-text-secondary transition-transform duration-300",
                                open && "rotate-180"
                            )}
                        />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-4">
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                            <Progress
                                value={percent}
                                className="h-1.5 w-full bg-n-30 **:data-[slot=progress-indicator]:bg-brand-normal dark:bg-surface-muted"
                            />
                            <div className="flex min-w-0 items-baseline gap-3">
                                <span className="min-w-0 flex-1 wrap-break-word text-body-2 font-regular text-text-secondary">
                                    {awaiting
                                        ? `Listening for your ${awaiting} · the run starts on the transaction_id you send`
                                        : journey.description ||
                                          (started
                                              ? ""
                                              : "Start the journey to run it against your NP")}
                                </span>
                                <span className="shrink-0 text-caption-1 text-text-secondary">
                                    {done} of {total} steps
                                </span>
                                <span className="shrink-0 text-body-2 font-bold text-brand-normal">
                                    {percent.toFixed(0)}%
                                </span>
                            </div>
                            {transactionId ? (
                                <span
                                    className="truncate font-mono text-caption-1 text-text-secondary"
                                    title="This run's transaction_id"
                                >
                                    txn {transactionId}
                                </span>
                            ) : null}
                        </div>
                        <div
                            className="flex shrink-0 items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {!started ? (
                                <FlowActionButton
                                    label="Start journey"
                                    variant="play"
                                    disabled={busy}
                                    onClick={onStart}
                                />
                            ) : (
                                <TooltipHint content="Run the journey again on a new transaction">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-lg"
                                        aria-label="New transaction"
                                        disabled={busy}
                                        onClick={onStart}
                                        className="rounded-full bg-brand-light text-brand-normal hover:opacity-80 dark:bg-brand-dark/30"
                                    >
                                        <ArrowPathIcon className="size-5" />
                                    </Button>
                                </TooltipHint>
                            )}
                            {canFinish ? (
                                <TooltipHint content="Finish the journey here: the last step may end it">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-lg"
                                        aria-label="Finish journey"
                                        disabled={busy}
                                        onClick={onFinish}
                                        className="rounded-full bg-success-50 text-success-500 hover:opacity-80 dark:bg-success-800/20"
                                    >
                                        <CheckCircleIcon className="size-6" />
                                    </Button>
                                </TooltipHint>
                            ) : null}
                            <TooltipHint content={graph ? "Hide the graph" : "Show the graph"}>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-lg"
                                    aria-label="Graph"
                                    aria-pressed={graph}
                                    onClick={() => {
                                        setGraph((g) => !g);
                                        if (!open) onToggle();
                                    }}
                                    className={cn(
                                        "rounded-full text-text-secondary hover:opacity-80",
                                        graph
                                            ? "bg-brand-normal text-n-0"
                                            : "bg-n-20 dark:bg-surface-muted"
                                    )}
                                >
                                    <ShareIcon className="size-5" />
                                </Button>
                            </TooltipHint>
                            {open && started ? (
                                <CircularProgress
                                    key={transactionId}
                                    sqSize={24}
                                    strokeWidth={3}
                                    duration={3}
                                    onComplete={async () => undefined}
                                    loop={true}
                                    isActive={!ended}
                                    id={`live-journey-poll-${journey.id}`}
                                />
                            ) : null}
                        </div>
                    </div>
                </div>

                {open ? (
                    <div
                        id={`live-journey-${journey.id}`}
                        className="flex flex-col gap-3 border-t border-n-30 px-5 pt-4 pb-5 dark:border-border-default"
                    >
                        {graph ? (
                            <LiveGraph
                                root={root}
                                flat={flat}
                                walk={walk}
                                runStatus={
                                    status
                                        ? (status.status as Record<string, RunStatus>)
                                        : undefined
                                }
                            />
                        ) : null}

                        <LiveNextUpBar
                            next={nextUp}
                            onInputs={onInputs}
                            onStep={onStep}
                            busy={busy}
                        />
                        {problems.length ? <ProblemsAlert problems={problems} /> : null}
                        {deviation ? (
                            <Notice tone="purple" title={`Deviated at ${deviation.nodeId}`}>
                                The journey expects case <b>{deviation.expected}</b>, but the data
                                your NP sent took <b>{deviation.actual}</b>. Start a new transaction
                                and send data that leads to {deviation.expected}, or run the journey
                                that matches {deviation.actual}.
                            </Notice>
                        ) : null}

                        <div className="flex flex-col">
                            {model.rows.map((row) => (
                                <LiveRowView
                                    key={row.key}
                                    row={row}
                                    active={open && !ended}
                                    selectedNodeId={selectedNode}
                                    onStepClick={onSelectStep}
                                />
                            ))}
                        </div>

                        {onDemand.length ? (
                            <Section title="On-demand triggers" bar="bg-sky-400">
                                <div className="flex flex-wrap gap-2">
                                    {onDemand.map((node) => {
                                        const can = triggerable.has(node.id);
                                        return (
                                            <TooltipHint
                                                key={node.id}
                                                content={
                                                    can
                                                        ? `Have the mock send ${node.api} now`
                                                        : node.owner === status?.plays
                                                          ? "Not available at this point of the run"
                                                          : "Your NP sends this one"
                                                }
                                            >
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="rounded-full"
                                                    disabled={!can || busy}
                                                    data-trigger={node.id}
                                                    onClick={() => onTrigger(node.id)}
                                                >
                                                    <BoltIcon className="size-4" />
                                                    {node.id}
                                                </Button>
                                            </TooltipHint>
                                        );
                                    })}
                                </div>
                            </Section>
                        ) : null}

                        {model.extra.length ? (
                            <Section title="Extra steps" bar="bg-alert-500">
                                <div className="flex flex-col gap-2">
                                    {model.extra.map((step) => (
                                        <LiveStepCard
                                            key={step.nodeId}
                                            step={step}
                                            active={open && !ended}
                                            selected={selectedNode === step.nodeId}
                                            onClick={onSelectStep}
                                        />
                                    ))}
                                </div>
                            </Section>
                        ) : null}

                        {rejected.length ? (
                            <Section title={`Not taken · ${rejected.length}`} bar="bg-purple-500">
                                <div className="flex flex-col gap-2">
                                    {rejected.map((r, index) => (
                                        <button
                                            key={`${r.ts}-${index}`}
                                            type="button"
                                            data-rejected-action={r.action ?? ""}
                                            onClick={() => onSelectRejected(index)}
                                            className={cn(
                                                "w-full rounded-xl border border-purple-200 bg-linear-to-br from-purple-50 to-purple-100/80 p-3 text-left shadow-xs transition-[filter] hover:brightness-[0.97] dark:border-purple-400/25 dark:from-purple-500/[0.08] dark:to-purple-500/[0.04]",
                                                selectedRejected === index &&
                                                    "ring-2 ring-brand-normal ring-offset-1 ring-offset-surface-page"
                                            )}
                                        >
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="text-sm font-semibold text-text-primary">
                                                    {r.action ?? "unknown action"}
                                                </span>
                                                <Badge className="border-purple-200 bg-purple-100 text-purple-800">
                                                    out-of-sequence
                                                </Badge>
                                                <Badge variant="secondary">
                                                    {new Date(r.ts).toLocaleTimeString()}
                                                </Badge>
                                            </div>
                                            <p className="mt-1 text-caption-1 text-text-secondary">
                                                {r.reason}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </Section>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const Section = ({
    title,
    bar,
    children,
}: {
    title: string;
    bar: string;
    children: React.ReactNode;
}) => (
    <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center gap-2">
            <span className={cn("h-4 w-1 rounded-full", bar)} />
            <span className="text-body-2 font-semibold text-text-primary">{title}</span>
        </div>
        {children}
    </div>
);

const NOTICE_TONE = {
    purple: "border-purple-200 bg-purple-50/80 text-purple-900 dark:border-purple-400/25 dark:bg-purple-500/10 dark:text-purple-100",
    error: "border-error-50 bg-error-50/80 text-error-500 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-50",
};

const at = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString() : null);

/** Every problem of the run in one alert: the newest in full, the earlier ones folded. */
const ProblemsAlert = ({ problems }: { problems: LiveProblem[] }) => {
    const [newest, ...earlier] = problems;
    return (
        <div
            role="alert"
            data-problems={problems.length}
            className={cn("flex gap-2 rounded-xl border p-3 text-body-2", NOTICE_TONE.error)}
        >
            <ExclamationTriangleIcon className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline gap-x-2 font-semibold">
                    {newest.title}
                    {at(newest.at) ? (
                        <span className="text-caption-1 font-normal text-text-secondary">
                            {at(newest.at)}
                        </span>
                    ) : null}
                </p>
                <p className="mt-0.5 wrap-break-word font-mono text-[12px] text-text-secondary">
                    {newest.detail}
                </p>
                {earlier.length ? (
                    <details className="mt-2">
                        <summary className="cursor-pointer text-caption-1 text-text-secondary">
                            {earlier.length} earlier
                        </summary>
                        <ul className="mt-1 flex flex-col gap-1.5">
                            {earlier.map((p) => (
                                <li key={p.key} className="text-caption-1">
                                    <span className="font-semibold">{p.title}</span>
                                    {at(p.at) ? (
                                        <span className="text-text-secondary"> · {at(p.at)}</span>
                                    ) : null}
                                    <p className="wrap-break-word font-mono text-text-secondary">
                                        {p.detail}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </details>
                ) : null}
            </div>
        </div>
    );
};

const Notice = ({
    tone,
    title,
    children,
}: {
    tone: keyof typeof NOTICE_TONE;
    title: string;
    children: React.ReactNode;
}) => (
    <div className={cn("flex gap-2 rounded-xl border p-3 text-body-2", NOTICE_TONE[tone])}>
        <ExclamationTriangleIcon className="mt-0.5 size-4 shrink-0" />
        <div className="min-w-0">
            <p className="font-semibold">{title}</p>
            <p className="mt-0.5 text-text-secondary">{children}</p>
        </div>
    </div>
);
