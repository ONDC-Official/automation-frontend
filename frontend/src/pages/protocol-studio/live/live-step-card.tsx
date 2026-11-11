import {
    ArrowPathIcon,
    ArrowsRightLeftIcon,
    InformationCircleIcon,
    ScaleIcon,
} from "@heroicons/react/24/outline";

import FlippableWrapper from "@components/DomainFlowRunner/FlippableContainer";
import { getCountStyles, getStatusStyles } from "@components/DomainFlowRunner/PairCard";
import { Badge } from "@components/Shadcn/Badge";
import { Button } from "@components/Shadcn/Button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@components/Shadcn/Tooltip";
import { cn } from "@/lib/utils";

import type { LiveRow, LiveStep, LiveStepState } from "@pages/protocol-studio/live/live-steps";

/** A step state in v1's card styles and badge text. */
const STATE_STYLE: Record<
    LiveStepState,
    { key: Parameters<typeof getStatusStyles>[0]; text?: string; muted?: boolean }
> = {
    ack: { key: "SUCCESS" },
    done: { key: "SUCCESS", text: "SENT" },
    nack: { key: "ERROR" },
    failed: { key: "ERROR", text: "FAILED" },
    sending: { key: "RESPONDING" },
    waiting: { key: "LISTENING" },
    input: { key: "INPUT-REQUIRED", text: "INPUT REQUIRED" },
    paused: { key: "INPUT-REQUIRED", text: "PAUSED" },
    skipped: { key: "WAITING", text: "SKIPPED", muted: true },
    pending: { key: "WAITING" },
};

/**
 * Dark mode, over v1's card styles: v1 keeps its light borders (success-200, error-50)
 * and solid badges in dark, which glare on a dark page. Here each state is a faint
 * tint of its hue with a border to match, and the badge a tinted chip.
 */
const DARK: Record<Parameters<typeof getStatusStyles>[0], { card: string; badge: string }> = {
    SUCCESS: {
        card: "dark:border-success-500/25 dark:bg-success-500/[0.06]",
        badge: "dark:bg-success-500/20 dark:text-success-200",
    },
    ERROR: {
        card: "dark:border-error-500/35 dark:bg-error-500/[0.08]",
        badge: "dark:bg-error-500/25 dark:text-error-50",
    },
    RESPONDING: {
        card: "dark:border-brand-normal/40 dark:bg-brand-normal/[0.08]",
        badge: "dark:bg-brand-normal/25 dark:text-brand-light-active",
    },
    "INPUT-REQUIRED": {
        card: "dark:border-brand-normal/40 dark:bg-brand-normal/[0.08]",
        badge: "dark:bg-brand-normal/25 dark:text-brand-light-active",
    },
    LISTENING: {
        card: "dark:border-alert-500/30 dark:bg-alert-500/[0.07]",
        badge: "dark:bg-alert-500/20 dark:text-alert-200",
    },
    WAITING: { card: "", badge: "dark:bg-n-500/40 dark:text-n-30" },
    PROCESSING: { card: "", badge: "" },
    "WAITING-SUBMISSION": { card: "", badge: "" },
};

/** Whether a state is still moving: its badge spins while the journey is open. */
const LIVE_STATES = new Set<LiveStepState>(["sending", "waiting", "input"]);

const time = (iso: string) =>
    new Date(iso).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });

/** What the card's face leaves out, for its info tooltip. */
const detailsOf = (step: LiveStep): string[] =>
    [
        step.description || null,
        `Sent by the ${step.owner} · ${step.youSend ? "your NP" : "the mock"}`,
        step.group ? `In group ${step.group}` : null,
        step.via ? `Reached via ${step.via}` : null,
        step.onDemand ? "On demand: runs when triggered" : null,
        step.repeats ? "Repeats until its exit condition holds" : null,
        step.journeySkips
            ? "Optional · this journey passes over it"
            : step.optional
              ? "Optional"
              : null,
    ].filter((line): line is string => !!line);

export interface ILiveStepCardProps {
    step: LiveStep;
    /** The journey is the one open on the page: moving states spin. */
    active: boolean;
    selected: boolean;
    onClick: (step: LiveStep) => void;
}

/**
 * One step of a live journey, drawn as v1's flow-testing step card: what it
 * is, its status, who sends it and the tags that say how it runs. Clicking a
 * step that ran shows its request and response in the side panel.
 */
export const LiveStepCard = ({ step, active, selected, onClick }: ILiveStepCardProps) => {
    const look = STATE_STYLE[step.state];
    const styles = { ...getStatusStyles(look.key) };
    if (look.text) styles.messageText = look.text;
    if (step.onDemand && step.calls.length === 0)
        styles.card =
            "border-purple-200 bg-linear-to-br from-purple-50 to-purple-100/80 shadow-xs shadow-purple-100 dark:border-purple-400/25 dark:from-purple-500/[0.08] dark:to-purple-500/[0.04] dark:shadow-none";
    const count = step.calls.length;
    const details = detailsOf(step);
    return (
        <FlippableWrapper flipTrigger={step.state}>
            <div
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                data-state={step.state}
                data-node-id={step.nodeId}
                data-calls={count}
                className={cn(
                    "h-full w-full cursor-pointer select-none rounded-xl border p-3 text-left transition-[transform,filter] duration-150 hover:brightness-[0.97] active:scale-[0.97]",
                    styles.card,
                    !(step.onDemand && step.calls.length === 0) && DARK[look.key].card,
                    look.muted && "opacity-70",
                    selected && "ring-2 ring-brand-normal ring-offset-1 ring-offset-surface-page"
                )}
                onClick={() => onClick(step)}
                onKeyDown={(e) => e.key === "Enter" && onClick(step)}
            >
                <div className="flex w-full flex-col gap-2">
                    <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                        <h3 className="min-w-24 flex-1 text-sm leading-snug font-semibold text-text-primary wrap-break-word">
                            {step.number !== null ? (
                                <span className="mr-1 font-normal text-text-secondary">
                                    {step.number}:
                                </span>
                            ) : null}
                            {step.api}
                            {step.label ? (
                                <span className="ml-1.5 text-sm font-normal text-text-secondary">
                                    ({step.label})
                                </span>
                            ) : null}
                        </h3>
                        <div className="flex shrink-0 items-center gap-1.5">
                            {step.kind === "unsolicited" ? (
                                <Badge variant="secondary">unsolicited</Badge>
                            ) : null}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            tabIndex={-1}
                                            aria-label="Step details"
                                            className="h-auto shrink-0 rounded-none p-0 text-text-secondary hover:text-brand-normal"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <InformationCircleIcon className="size-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-xs">
                                        <ul className="flex flex-col gap-0.5">
                                            {details.map((line) => (
                                                <li key={line}>{line}</li>
                                            ))}
                                        </ul>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                        {styles.messageText ? (
                            <Badge
                                variant="status"
                                className={cn("gap-1.5", styles.messageBg, DARK[look.key].badge)}
                            >
                                {styles.messageText}
                                {active && LIVE_STATES.has(step.state) ? (
                                    <span className="size-3 animate-spin-slow rounded-full border-2 border-t-transparent border-n-0" />
                                ) : null}
                            </Badge>
                        ) : null}
                        {step.youSend ? (
                            <Badge variant="alert">you send</Badge>
                        ) : step.form ? (
                            <Badge variant="secondary">form</Badge>
                        ) : step.inputs ? (
                            <Badge variant="inputs">inputs</Badge>
                        ) : null}
                        {step.repeats ? (
                            <Badge variant="secondary" className="gap-1" title="Repeats">
                                <ArrowPathIcon className="size-3" />
                            </Badge>
                        ) : null}
                        {count > 0 ? (
                            <Badge className={getCountStyles(count)}>
                                <span className="font-normal text-text-secondary">×</span> {count}
                            </Badge>
                        ) : null}
                        {step.time ? (
                            <span className="ml-auto text-caption-1 text-text-secondary tabular-nums">
                                {time(step.time)}
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>
        </FlippableWrapper>
    );
};

export interface ILiveRowProps {
    row: LiveRow;
    active: boolean;
    selectedNodeId: string | null;
    onStepClick: (step: LiveStep) => void;
}

/** A request with the callback that answers it, side by side, or a decision divider. */
export const LiveRowView = ({ row, active, selectedNodeId, onStepClick }: ILiveRowProps) => {
    if (row.type === "decision")
        return (
            <div
                className={cn(
                    "flex items-center gap-2 py-1 text-caption-1 text-text-secondary",
                    row.deviated && "text-purple-700 dark:text-purple-300"
                )}
            >
                <span className="h-px flex-1 bg-n-30 dark:bg-border-default" />
                <ScaleIcon className="size-4 shrink-0" aria-hidden="true" />
                <span className="shrink-0">
                    decision <span className="font-mono">{row.nodeId}</span>
                    {row.expected ? (
                        <>
                            {" "}
                            · expects <span className="font-semibold">{row.expected}</span>
                        </>
                    ) : null}
                    {row.taken ? (
                        <>
                            {" "}
                            · took <span className="font-semibold">{row.taken}</span>
                        </>
                    ) : null}
                </span>
                {row.deviated ? (
                    <Badge className="border-purple-200 bg-purple-100 text-purple-800">
                        deviated
                    </Badge>
                ) : null}
                <span className="h-px flex-1 bg-n-30 dark:bg-border-default" />
            </div>
        );
    const card = (step: LiveStep) => (
        <LiveStepCard
            step={step}
            active={active}
            selected={selectedNodeId === step.nodeId}
            onClick={onStepClick}
        />
    );
    return (
        <div className="flex flex-col gap-2 py-1 sm:flex-row sm:items-stretch sm:gap-3">
            <div className="min-w-0 flex-1">{card(row.first)}</div>
            {row.second ? (
                <>
                    <div className="flex shrink-0 items-center justify-center self-center">
                        <ArrowsRightLeftIcon className="size-5 text-text-secondary" />
                    </div>
                    <div className="min-w-0 flex-1">{card(row.second)}</div>
                </>
            ) : null}
        </div>
    );
};
