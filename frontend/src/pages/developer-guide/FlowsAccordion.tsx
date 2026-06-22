import { FC, useState, useEffect, useRef } from "react";
import type { FlowEntry, FlowStep } from "./types";
import { getActionId } from "./utils";
import { buildStepDisplayItems } from "./FlowInformation/utils";
import {
    ChevronDownIcon,
    InformationCircleIcon,
    ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";

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
        const showUnsolicited = step.unsolicited === true;
        const isTransitioning = transitioningAction === actionId;

        return (
            <button
                key={actionId}
                onClick={() => handleStepClick(flowId, actionId)}
                disabled={isTransitioning}
                className={`w-full flex-1 min-w-0 px-3 py-2.5 rounded-lg border text-left transition-all duration-200 ${
                    isSelected || isTransitioning
                        ? "border-sky-400 dark:border-sky-500 ring-2 ring-sky-100 dark:ring-sky-500/20 bg-white dark:bg-surface-elevated shadow-sm"
                        : "border-slate-200 bg-white dark:bg-surface-elevated hover:border-slate-300 hover:shadow-xs"
                }`}
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        {isTransitioning && (
                            <svg
                                className="shrink-0 h-3.5 w-3.5 animate-spin text-sky-500"
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
                        <span className="text-body-2 font-medium text-slate-800 truncate">
                            {step.action_label ?? step.api}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 text-sky-700">
                        <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold leading-non bg-sky-50 rounded-full px-3 py-1">
                            Docs
                        </span>

                        <InformationCircleIcon className="w-4 h-4" aria-hidden />
                    </div>
                </div>
                {showUnsolicited && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-caption-2 font-semibold leading-none text-[#E6862E] bg-[#FCE8D7] rounded-full px-3 py-1">
                            UNSOLICITED
                        </span>
                    </div>
                )}
            </button>
        );
    };

    return (
        <div className="space-y-3">
            {flows.map((flow, flowIndex) => {
                const isOpen = openFlowIndex === flowIndex;
                const flowId = flow.flowId;
                const isSelectedFlow = selectedFlow === flowId;
                const steps = flow.config?.steps ?? [];
                const displayItems = buildStepDisplayItems(steps);
                const flowName = flowId.split("_").join(" ");
                return (
                    <div
                        key={flowIndex}
                        className="bg-white dark:bg-surface-elevated rounded-xl shadow-sm hover:shadow-md overflow-hidden transition-all duration-300 border border-slate-200"
                    >
                        <button
                            onClick={() => toggleFlow(flowIndex)}
                            type="button"
                            className="w-full text-left flex items-center justify-between p-4 cursor-pointer bg-white dark:bg-surface-elevated hover:bg-slate-50 dark:hover:bg-surface-muted transition-colors duration-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-400/60"
                            aria-expanded={isOpen}
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="flex-1 min-w-0">
                                    <span className="font-semibold text-gray-900 text-body-1 wrap-break-word block">
                                        {flowName}
                                    </span>
                                    {flow.description && (
                                        <p className="text-caption-2 text-slate-500 mt-0.5 line-clamp-2">
                                            {flow.description}
                                        </p>
                                    )}
                                    {/* {flow.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {flow.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="text-[11px] font-semibold leading-none text-sky-700 bg-sky-50 rounded-full px-3 py-1"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )} */}
                                </div>
                            </div>
                            <ChevronDownIcon
                                className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-3 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                            />
                        </button>

                        <div
                            className={`grid transition-all duration-300 ease-in-out ${
                                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                            }`}
                        >
                            <div className="overflow-hidden">
                                <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/40 overflow-y-auto">
                                    <div className="grid grid-cols-2 gap-2.5 mt-2">
                                        {displayItems.map((item, itemIdx) => {
                                            if (item.type === "pair") {
                                                const reqActionId = getActionId(item.request);
                                                const resActionId = getActionId(item.response);
                                                const isReqSelected =
                                                    isSelectedFlow &&
                                                    selectedFlowAction === reqActionId;
                                                const isResSelected =
                                                    isSelectedFlow &&
                                                    selectedFlowAction === resActionId;

                                                return (
                                                    <div
                                                        key={itemIdx}
                                                        className="col-span-2 flex items-center gap-3"
                                                    >
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
                                                );
                                            }
                                            const stepActionId = getActionId(item.step);
                                            const isSelected =
                                                isSelectedFlow &&
                                                selectedFlowAction === stepActionId;
                                            return (
                                                <div key={itemIdx}>
                                                    {renderStepButton(
                                                        item.step,
                                                        flowId,
                                                        isSelected
                                                    )}
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
