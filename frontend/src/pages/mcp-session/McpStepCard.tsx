import { ArrowsRightLeftIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { Badge } from "@components/Shadcn/Badge";
import { Button } from "@components/Shadcn/Button";
import { TooltipHint } from "@components/Shadcn/Tooltip";
import FlippableWrapper from "@components/DomainFlowRunner/FlippableContainer";
import { getCountStyles, getStatusStyles } from "@components/DomainFlowRunner/PairCard";
import type { PairedStep } from "@components/DomainFlowRunner/MappedFlowUtils";
import type { MappedStep } from "@/types/flow-state-type";
import type { McpNpType } from "@store/api";
import { cn } from "@/lib/utils";

/**
 * A step pair, read-only.
 *
 * ## Why this is not `PairCard`
 *
 * `PairCard` renders the same thing and would be the obvious reuse, but it
 * reaches into `useSession()` and `mainApi` in six places — the manual-mode
 * switch, the session's `npType`, the active-flow tint, the payload fetch. All
 * of those are the *workbench's* session, and this page has an engine instead.
 * Threading six overrides through a component the main runner depends on is a
 * worse trade than rendering the layout twice.
 *
 * What is **not** duplicated is the part that must never drift: `getStatusStyles`
 * and `getCountStyles` are imported from `PairCard`, so a status keeps one
 * colour across both screens and changing it is still a one-line change in one
 * place.
 */

export interface McpStepCardProps {
    pairedStep: PairedStep;
    /** The participant's own side, for the "you send" / "mock" badges. */
    npType: McpNpType;
    onInspect: (step: MappedStep) => void;
}

export function McpStepCard({ pairedStep, npType, onInspect }: McpStepCardProps) {
    const { first, second } = pairedStep;

    return (
        <div className="flex flex-col gap-2 py-1 sm:flex-row sm:items-stretch sm:gap-3">
            <div className="min-w-0 flex-1">
                <StepFace step={first} npType={npType} onInspect={onInspect} />
            </div>

            {second ? (
                <div className="flex shrink-0 items-center justify-center self-center">
                    <ArrowsRightLeftIcon className="size-5 text-text-secondary" />
                </div>
            ) : null}

            {second ? (
                <div className="min-w-0 flex-1">
                    <StepFace step={second} npType={npType} onInspect={onInspect} />
                </div>
            ) : null}
        </div>
    );
}

function StepFace({
    step,
    npType,
    onInspect,
}: {
    step: MappedStep;
    npType: McpNpType;
    onInspect: (step: MappedStep) => void;
}) {
    // A completed step is coloured by how the counterparty answered, not by the
    // fact that it finished — an ACK and a NACK are both "COMPLETE".
    const status = step.status === "COMPLETE" ? (step.payloads?.subStatus ?? "ERROR") : step.status;
    const statusStyles = getStatusStyles(status);

    if (step.missedStep) {
        statusStyles.card =
            "border-purple-200 bg-linear-to-br from-purple-50 to-purple-100/80 shadow-xs shadow-purple-100 dark:from-purple-950 dark:to-purple-900/40";
    }

    const isFormType = ["HTML_FORM", "HTML_FORM_MULTI", "DYNAMIC_FORM"].includes(step.actionType);
    const stepInput = step.input;
    const hasInput = Array.isArray(stepInput) ? stepInput.length > 0 : stepInput != null;
    const apiCount = countPayloads(step);
    const openable = step.status === "COMPLETE";

    return (
        <FlippableWrapper flipTrigger={step.status}>
            <div
                role="button"
                tabIndex={0}
                aria-disabled={!openable}
                className={cn(
                    "h-full w-full select-none rounded-xl border p-3 text-left transition-[transform,filter] duration-150",
                    openable
                        ? "cursor-pointer hover:brightness-[0.97] active:scale-[0.97]"
                        : "cursor-default",
                    statusStyles.card
                )}
                onClick={() => onInspect(step)}
                onKeyDown={(e) => e.key === "Enter" && onInspect(step)}
            >
                <div className="flex w-full flex-col gap-2">
                    <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                        <h1 className="min-w-24 flex-1 text-sm leading-snug font-semibold text-text-primary wrap-break-word">
                            {!step.missedStep ? (
                                <span className="mr-1 font-normal text-text-secondary">
                                    {step.index + 1}:
                                </span>
                            ) : null}
                            {isFormType ? step.actionId : step.actionType}
                            {step.label ? (
                                <span className="ml-1.5 text-sm font-normal text-text-secondary">
                                    ({step.label})
                                </span>
                            ) : null}
                        </h1>

                        {step.description ? (
                            <TooltipHint content={step.description}>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    tabIndex={-1}
                                    aria-label="Step description"
                                    className="h-auto shrink-0 rounded-none p-0 text-brand-normal"
                                >
                                    <InformationCircleIcon className="size-4" />
                                </Button>
                            </TooltipHint>
                        ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                        {statusStyles.messageText ? (
                            <Badge
                                variant="status"
                                className={cn("gap-1.5", statusStyles.messageBg)}
                            >
                                {statusStyles.messageText}
                                {["LISTENING", "RESPONDING", "INPUT-REQUIRED"].includes(status) ? (
                                    <span className="size-3 animate-spin-slow rounded-full border-2 border-t-transparent border-n-0" />
                                ) : null}
                            </Badge>
                        ) : null}

                        {step.missedStep ? (
                            <Badge className="border-purple-200 bg-purple-100 text-purple-800">
                                out-of-sequence
                            </Badge>
                        ) : null}
                        {step.unsolicited ? <Badge variant="secondary">unsolicited</Badge> : null}
                        {isFormType ? <Badge variant="secondary">form</Badge> : null}
                        {hasInput ? <Badge variant="inputs">inputs</Badge> : null}

                        {/*
                         * Whose step this is, from the *participant's* point of
                         * view — they are the one reading this page. `owner`
                         * matching their own type means the call is theirs to
                         * make; anything else is the mock's.
                         */}
                        {step.owner === npType ? (
                            <Badge variant="alert">you send</Badge>
                        ) : (
                            <Badge variant="mock">mock</Badge>
                        )}

                        {apiCount > 0 ? (
                            <Badge className={getCountStyles(apiCount)}>
                                <span className="font-normal text-text-secondary">×</span>{" "}
                                {apiCount}
                            </Badge>
                        ) : null}

                        {step.payloads?.timestamp ? (
                            <Badge variant="secondary">
                                {new Date(step.payloads.timestamp).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: false,
                                })}
                            </Badge>
                        ) : null}
                    </div>
                </div>
            </div>
        </FlippableWrapper>
    );
}

/** How many payloads one exchange carries — a retry or a duplicate makes >1. */
function countPayloads(step: MappedStep): number {
    if (step.payloads?.entryType === "FORM") return 0;
    return step.status === "COMPLETE" ? (step.payloads?.payloads.length ?? 0) : 0;
}
