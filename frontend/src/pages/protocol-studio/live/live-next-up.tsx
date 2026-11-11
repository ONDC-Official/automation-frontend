import {
    ArrowRightCircleIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    PencilSquareIcon,
    PlayIcon,
    SignalIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@components/Shadcn/Button";
import { cn } from "@/lib/utils";

import type { LiveJourneyState, LiveNextUp } from "@pages/protocol-studio/live/live-steps";

const TONE: Record<LiveNextUp["tone"], string> = {
    neutral: "border-n-30 bg-surface-elevated text-text-primary dark:border-border-default",
    brand: "border-brand-light-active bg-brand-light/70 text-brand-normal dark:border-brand-dark/40 dark:bg-brand-dark/20",
    alert: "border-alert-200 bg-alert-50 text-alert-800 dark:border-alert-800/40 dark:bg-alert-800/15 dark:text-alert-200",
    success:
        "border-success-200 bg-success-50 text-success-800 dark:border-success-800/40 dark:bg-success-800/15 dark:text-success-200",
    error: "border-error-50 bg-error-50 text-error-500 dark:border-error-800/40 dark:bg-error-800/10",
    purple: "border-purple-200 bg-purple-50 text-purple-900 dark:border-purple-800/40 dark:bg-purple-900/20 dark:text-purple-100",
};

const ICON: Record<LiveNextUp["tone"], typeof SignalIcon> = {
    neutral: ArrowRightCircleIcon,
    brand: ArrowRightCircleIcon,
    alert: SignalIcon,
    success: CheckCircleIcon,
    error: ExclamationTriangleIcon,
    purple: ExclamationTriangleIcon,
};

/** The open journey's "what happens next" line, with the tester's action when there is one. */
export const LiveNextUpBar = ({
    next,
    onInputs,
    onStep,
    busy,
}: {
    next: LiveNextUp;
    onInputs: () => void;
    onStep: () => void;
    busy: boolean;
}) => {
    const Icon = ICON[next.tone];
    return (
        <div
            role="status"
            aria-live="polite"
            data-next-action={next.action ?? "none"}
            data-next-tone={next.tone}
            data-next-api={next.api ?? undefined}
            className={cn(
                "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-3 py-2.5 text-body-2",
                TONE[next.tone]
            )}
        >
            <Icon
                className={cn(
                    "size-5 shrink-0",
                    next.tone === "alert" && "animate-pulse",
                    next.tone === "neutral" && "text-text-secondary"
                )}
                aria-hidden="true"
            />
            <p className="min-w-0 flex-1 wrap-break-word">
                <span className="font-semibold">{next.text}</span>
                {next.api ? (
                    <code className="mx-1.5 rounded-md bg-n-0/70 px-1.5 py-0.5 font-mono text-[12px] font-semibold dark:bg-n-100/10">
                        {next.api}
                    </code>
                ) : null}
                {next.detail ? <span className="opacity-80"> {next.detail}</span> : null}
            </p>
            {next.action === "inputs" ? (
                <Button type="button" size="sm" disabled={busy} onClick={onInputs}>
                    <PencilSquareIcon className="size-4" />
                    Provide inputs
                </Button>
            ) : next.action === "step" ? (
                <Button type="button" size="sm" disabled={busy} onClick={onStep}>
                    <PlayIcon className="size-4" />
                    Run step
                </Button>
            ) : null}
        </div>
    );
};

const COUNTERS: { label: string; states: LiveJourneyState[]; dot: string }[] = [
    { label: "Finished", states: ["finished"], dot: "bg-success-500" },
    {
        label: "Running",
        states: ["idle", "working", "waiting", "input", "paused"],
        dot: "bg-brand-normal",
    },
    { label: "Failed", states: ["failed", "deviated"], dot: "bg-error-500" },
    { label: "Not started", states: ["not-started"], dot: "bg-n-50" },
];

/** A one-line read-out of every journey on the page, and the tag filter in force. */
export const LiveJourneySummary = ({
    states,
    shown,
    total,
    tags,
    onClearTags,
}: {
    /** Journey id → its state, for the journeys on the page. */
    states: LiveJourneyState[];
    shown: number;
    total: number;
    tags: string[];
    onClearTags: () => void;
}) => (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-body-2 text-text-secondary">
        <span className="font-semibold text-text-primary">
            {shown === total ? total : `${shown} of ${total}`}{" "}
            {total === 1 ? "journey" : "journeys"}
        </span>
        {COUNTERS.map((c) => {
            const count = states.filter((s) => c.states.includes(s)).length;
            if (!count) return null;
            return (
                <span key={c.label} className="flex items-center gap-1.5">
                    <span className={cn("size-2 rounded-full", c.dot)} aria-hidden="true" />
                    {c.label} <span className="font-semibold text-text-primary">{count}</span>
                </span>
            );
        })}
        {tags.length ? (
            <button
                type="button"
                onClick={onClearTags}
                className="ml-auto flex items-center gap-1 rounded-full border border-n-30 bg-surface-elevated px-2.5 py-0.5 text-caption-1 hover:bg-surface-muted dark:border-border-default"
                title="Show every journey"
            >
                Tags: {tags.join(", ")}
                <XMarkIcon className="size-3.5" aria-hidden="true" />
            </button>
        ) : null}
    </div>
);
