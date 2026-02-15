import { FC, useState } from "react";
import { OpenAPISpecification } from "./types";
import type { FlowStep } from "./types";
import { getActionId } from "./utils";

interface FlowsAccordionProps {
    data: OpenAPISpecification;
    selectedFlow?: string;
    selectedFlowAction?: string;
    setSelectedFlow: (flow: string) => void;
    setSelectedFlowAction: (action: string) => void;
}

type StepPair = {
    type: "pair";
    request: FlowStep;
    response: FlowStep;
    requestIdx: number;
    responseIdx: number;
};
type StepSingle = { type: "single"; step: FlowStep; stepIdx: number };
type StepDisplayItem = StepPair | StepSingle;

function buildStepDisplayItems(steps: FlowStep[]): StepDisplayItem[] {
    const displayed = new Set<number>();
    const items: StepDisplayItem[] = [];
    const actionIdToIdx = new Map<string, number>();

    steps.forEach((s, i) => {
        const aid = getActionId(s);
        actionIdToIdx.set(aid, i);
    });

    for (let i = 0; i < steps.length; i++) {
        if (displayed.has(i)) continue;
        const step = steps[i];
        const responseFor = step.responseFor;

        if (responseFor) {
            const requestIdx = actionIdToIdx.get(responseFor);
            if (requestIdx != null && !displayed.has(requestIdx)) {
                items.push({
                    type: "pair",
                    request: steps[requestIdx],
                    response: step,
                    requestIdx,
                    responseIdx: i,
                });
                displayed.add(requestIdx);
                displayed.add(i);
                continue;
            }
        }

        const actionId = getActionId(step);
        const responderIdx = steps.findIndex((s) => s.responseFor === actionId);
        if (responderIdx >= 0 && !displayed.has(responderIdx)) {
            items.push({
                type: "pair",
                request: step,
                response: steps[responderIdx],
                requestIdx: i,
                responseIdx: responderIdx,
            });
            displayed.add(i);
            displayed.add(responderIdx);
        } else {
            items.push({ type: "single", step, stepIdx: i });
            displayed.add(i);
        }
    }
    return items;
}

const ArrowsIcon = () => (
    <span
        className="flex items-center justify-center w-8 h-8 rounded-md bg-slate-100 text-slate-500 shrink-0 text-sm font-medium"
        aria-hidden
    >
        ↔
    </span>
);

const FlowsAccordion: FC<FlowsAccordionProps> = ({
    data,
    selectedFlow,
    selectedFlowAction,
    setSelectedFlow,
    setSelectedFlowAction,
}) => {
    const [openFlowIndex, setOpenFlowIndex] = useState<number | null>(null);

    const flows = data["x-flows"] || [];

    const toggleFlow = (index: number) => {
        if (openFlowIndex === index) {
            setOpenFlowIndex(null);
            setSelectedFlow("");
        } else {
            setOpenFlowIndex(index);
            setSelectedFlow(flows[index].meta?.flowId ?? "");
        }

        setSelectedFlowAction("");
    };

    const handleStepClick = (flowSummary: string, actionId: string) => {
        setSelectedFlow(flowSummary);
        setSelectedFlowAction(actionId);
    };

    const renderStepButton = (step: FlowStep, flowId: string, isSelected: boolean) => {
        const actionId = getActionId(step);
        return (
            <button
                key={actionId}
                onClick={() => handleStepClick(flowId, actionId)}
                className={`flex-1 min-w-0 text-left px-3 py-2.5 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sky-400 ${
                    isSelected
                        ? "bg-sky-50 border-sky-300 text-sky-900 shadow-sm ring-1 ring-sky-200/60 font-medium"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                }`}
            >
                <span className="text-sm font-medium truncate block">{step.action_label}</span>
            </button>
        );
    };

    return (
        <div className="space-y-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1 mb-4">
                Flows
            </p>
            {flows.map((flow, flowIndex) => {
                const isOpen = openFlowIndex === flowIndex;
                const isSelectedFlow = selectedFlow === (flow.meta?.flowId ?? "");
                const flowId = flow.meta?.flowId ?? "";
                const displayItems = buildStepDisplayItems(flow.steps);

                return (
                    <div
                        key={flowIndex}
                        className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow"
                    >
                        <button
                            onClick={() => toggleFlow(flowIndex)}
                            className="w-full px-4 py-4 flex items-center justify-between text-left bg-white hover:bg-slate-50/80 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-400/40"
                        >
                            <span className="font-semibold text-slate-800 text-sm">
                                {flow.meta?.flowId}
                            </span>
                            <span
                                className={`flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-600 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                                aria-hidden
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </span>
                        </button>

                        {isOpen && (
                            <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/40">
                                <div className="space-y-2.5 mt-2">
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
                                                    className="flex items-center gap-3"
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
                                            isSelectedFlow && selectedFlowAction === stepActionId;
                                        return (
                                            <div key={itemIdx}>
                                                {renderStepButton(item.step, flowId, isSelected)}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default FlowsAccordion;
