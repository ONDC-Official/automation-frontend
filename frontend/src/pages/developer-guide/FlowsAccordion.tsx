import { FC, useState, useEffect, useRef } from "react";
import type { FlowEntry, FlowStep } from "./types";
import { getActionId } from "./utils";
import { buildStepDisplayItems } from "./FlowInformation/utils";
import { ChevronDownIcon, ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/Shadcn/Button";
import OwnerPill from "./shared/components/OwnerPill";
import { cn } from "@/lib/utils";

interface FlowsAccordionProps {
    flows: FlowEntry[];
    selectedFlow?: string;
    selectedFlowAction?: string;
    setSelectedFlow: (flow: string) => void;
    setSelectedFlowAction: (action: string) => void;
}

const ArrowsIcon = () => (
    <ArrowsRightLeftIcon className="w-4 h-4 text-slate-400 shrink-0" aria-hidden />
);

const FlowsAccordion: FC<FlowsAccordionProps> = ({
    flows,
    selectedFlow,
    selectedFlowAction,
    setSelectedFlow,
    setSelectedFlowAction,
}) => {
    const [openFlowIndex, setOpenFlowIndex] = useState<number | null>(null);
    const [transitioningAction, setTransitioningAction] = useState<string | null>(null);
    const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Open the accordion for the externally-selected flow (e.g. deep-linked from docs button)
    useEffect(() => {
        if (!selectedFlow || flows.length === 0) return;
        const idx = flows.findIndex((f) => f.flowId === selectedFlow);
        if (idx >= 0) setOpenFlowIndex(idx);
    }, [selectedFlow, flows]);

    // Clear the transitioning state once the parent has confirmed the new action.
    // Keep it visible for at least 400 ms so the spinner is noticeable.
    useEffect(() => {
        if (
            selectedFlowAction &&
            transitioningAction &&
            selectedFlowAction === transitioningAction
        ) {
            if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
            transitionTimerRef.current = setTimeout(() => setTransitioningAction(null), 400);
        }
    }, [selectedFlowAction, transitioningAction]);

    useEffect(() => {
        return () => {
            if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
        };
    }, []);

    const toggleFlow = (index: number) => {
        if (openFlowIndex === index) {
            // Collapsing the open card is purely visual — a flow/action must always
            // stay selected so the Example Payload/Request/Response/Validations
            // tabs above keep working.
            setOpenFlowIndex(null);
        } else {
            setOpenFlowIndex(index);

            const flow = flows[index];
            const flowId = flow.flowId;
            setSelectedFlow(flowId);

            const steps = flow.config?.steps ?? [];
            const displayItems = buildStepDisplayItems(steps);
            const firstItem = displayItems[0];

            if (firstItem) {
                const firstActionId =
                    firstItem.type === "pair"
                        ? getActionId(firstItem.request)
                        : getActionId(firstItem.step);
                setTransitioningAction(firstActionId);
                setSelectedFlowAction(firstActionId);
            } else {
                setSelectedFlowAction("");
            }
        }
    };

    const handleStepClick = (flowId: string, actionId: string) => {
        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
        setTransitioningAction(actionId);
        setSelectedFlow(flowId);
        setSelectedFlowAction(actionId);
    };

    const renderStepButton = (step: FlowStep, flowId: string, isSelected: boolean) => {
        const actionId = getActionId(step);
        const isTransitioning = transitioningAction === actionId;

        return (
            <Button
                key={actionId}
                type="button"
                variant="ghost"
                onClick={() => handleStepClick(flowId, actionId)}
                disabled={isTransitioning}
                className={`h-auto w-full min-w-0 flex-col items-stretch px-3 py-2.5 rounded-lg border font-normal text-left transition-[border-color,box-shadow] duration-200 ${
                    isSelected || isTransitioning
                        ? "border-sky-400 dark:border-sky-500 ring-2 ring-sky-100 dark:ring-sky-500/20 bg-white dark:bg-surface-elevated shadow-sm"
                        : "border-slate-200 bg-white dark:bg-surface-elevated hover:border-slate-300 hover:shadow-xs"
                }`}
            >
                <div className="flex w-full min-w-0 items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        {isTransitioning && (
                            <svg
                                className="size-3.5 shrink-0 animate-spin text-sky-500 dark:text-sky-400"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                />
                            </svg>
                        )}

                        <span className="min-w-0 text-body-2 font-medium text-slate-800 wrap-anywhere whitespace-normal">
                            {step.action_label ?? step.api}
                        </span>
                    </div>

                    <OwnerPill
                        owner={step.owner}
                        className="shrink-0 px-1 py-px text-[9px] leading-none"
                    />
                </div>
            </Button>
        );
    };

    const renderStepperBullet = (isActive: boolean, isFirst: boolean, isLast: boolean) => (
        <div
            className="relative flex w-4 shrink-0 items-center justify-center self-stretch"
            aria-hidden
        >
            {/* Upper segment: covers the row gap and connects down to this bullet */}
            {!isFirst && (
                <span className="absolute -top-2.5 bottom-1/2 left-1/2 w-px -translate-x-1/2 bg-slate-200 dark:bg-slate-700" />
            )}
            {/* Lower segment: from this bullet through the row gap to the next */}
            {!isLast && (
                <span className="absolute top-1/2 -bottom-2.5 left-1/2 w-px -translate-x-1/2 bg-slate-200 dark:bg-slate-700" />
            )}
            <span
                className={cn(
                    "relative z-10 size-2.5 shrink-0 rounded-full border-2",
                    isActive
                        ? "border-sky-500 bg-sky-500"
                        : "border-slate-300 bg-white dark:border-slate-600 dark:bg-surface-elevated"
                )}
            />
        </div>
    );

    return (
        <div className="space-y-3">
            {flows.map((flow, flowIndex) => {
                const isOpen = openFlowIndex === flowIndex;
                const flowId = flow.flowId;
                const isSelectedFlow = selectedFlow === flowId;
                const steps = flow.config?.steps ?? [];
                const displayItems = buildStepDisplayItems(steps);
                const flowName = flow.flowId.split("_").join(" ");

                return (
                    <div
                        key={flowIndex}
                        className="bg-white dark:bg-surface-elevated rounded-xl shadow-sm hover:shadow-md overflow-hidden transition-shadow duration-300 border border-slate-200"
                    >
                        <Button
                            onClick={() => toggleFlow(flowIndex)}
                            type="button"
                            variant="ghost"
                            className="h-auto w-full rounded-none p-4 font-normal text-left cursor-pointer bg-white dark:bg-surface-elevated hover:bg-slate-50 dark:hover:bg-surface-muted transition-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-400/60"
                            aria-expanded={isOpen}
                        >
                            <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                                <div className="min-w-0">
                                    <div className="text-body-1 font-semibold text-gray-900 wrap-anywhere whitespace-normal leading-8">
                                        {flowName}
                                    </div>

                                    {flow.description && (
                                        <p
                                            className={`mt-1 text-[12px] leading-5 text-slate-500 wrap-anywhere whitespace-normal ${
                                                isOpen ? "" : "line-clamp-2"
                                            }`}
                                        >
                                            {flow.description}
                                        </p>
                                    )}
                                </div>

                                <ChevronDownIcon
                                    className={`mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${
                                        isOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </div>
                        </Button>

                        <div
                            className={`grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none ${
                                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                            }`}
                        >
                            <div className="overflow-hidden">
                                <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/40 overflow-y-auto">
                                    <div className="flex flex-col gap-2.5 mt-2">
                                        {displayItems.map((item, itemIdx) => {
                                            const isFirst = itemIdx === 0;
                                            const isLast = itemIdx === displayItems.length - 1;

                                            if (item.type === "pair") {
                                                const reqActionId = getActionId(item.request);
                                                const resActionId = getActionId(item.response);

                                                const isReqSelected =
                                                    isSelectedFlow &&
                                                    selectedFlowAction === reqActionId;

                                                const isResSelected =
                                                    isSelectedFlow &&
                                                    selectedFlowAction === resActionId;

                                                const isGroupActive =
                                                    isReqSelected || isResSelected;

                                                return (
                                                    <div
                                                        key={itemIdx}
                                                        className="flex items-center gap-2.5"
                                                    >
                                                        {renderStepperBullet(
                                                            isGroupActive,
                                                            isFirst,
                                                            isLast
                                                        )}
                                                        <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3 items-center">
                                                            {renderStepButton(
                                                                item.request,
                                                                flowId,
                                                                isReqSelected
                                                            )}

                                                            <ArrowsIcon />

                                                            {renderStepButton(
                                                                item.response,
                                                                flowId,
                                                                isResSelected
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            const stepActionId = getActionId(item.step);

                                            const isSelected =
                                                isSelectedFlow &&
                                                selectedFlowAction === stepActionId;

                                            return (
                                                <div
                                                    key={itemIdx}
                                                    className="flex items-center gap-2.5"
                                                >
                                                    {renderStepperBullet(
                                                        isSelected,
                                                        isFirst,
                                                        isLast
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        {renderStepButton(
                                                            item.step,
                                                            flowId,
                                                            isSelected
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default FlowsAccordion;
