import { FC, useState } from "react";
import { OpenAPISpecification } from "./types";
import type { FlowStep } from "./types";
import { getActionId } from "./utils";
import { FcWorkflow } from "react-icons/fc";
import { FaChevronDown } from "react-icons/fa6";

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

    steps?.forEach((s, i) => {
        const aid = getActionId(s);
        actionIdToIdx.set(aid, i);
    });

    for (let i = 0; i < steps?.length; i++) {
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

            setSelectedFlowAction("");
        } else {
            setOpenFlowIndex(index);

            const flowId = flows[index].meta?.flowId ?? "";

            setSelectedFlow(flowId);

            // Auto-select first step

            const displayItems = buildStepDisplayItems(flows[index].steps);

            const firstItem = displayItems[0];

            if (firstItem) {
                const firstActionId =
                    firstItem.type === "pair"
                        ? getActionId(firstItem.request)
                        : getActionId(firstItem.step);

                setSelectedFlowAction(firstActionId);
            } else {
                setSelectedFlowAction("");
            }
        }
    };

    const handleStepClick = (flowSummary: string, actionId: string) => {
        setSelectedFlow(flowSummary);

        setSelectedFlowAction(actionId);
    };

    const renderStepButton = (step: FlowStep, flowId: string, isSelected: boolean) => {
        const actionId = getActionId(step);
        const showUnsolicited = step.unsolicited === true;

        return (
            <button
                key={actionId}
                onClick={() => handleStepClick(flowId, actionId)}
                className={`w-full flex-1 min-w-0 text-left px-3 py-2.5 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sky-400 ${
                    isSelected
                        ? "bg-sky-50 border-sky-300 text-sky-900 shadow-sm ring-1 ring-sky-200/60 font-medium"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                }`}
            >
                <div className="flex items-center justify-center gap-2">
                    <span className="text-sm font-medium truncate">{step.action_label}</span>
                    {showUnsolicited && (
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                            unsolicited
                        </span>
                    )}
                </div>
            </button>
        );
    };

    return (
        <div className="space-y-3">
            {flows.map((flow, flowIndex) => {
                const isOpen = openFlowIndex === flowIndex;
                const isSelectedFlow = selectedFlow === (flow.meta?.flowId ?? "");
                const flowId = flow.meta?.flowId ?? "";
                const displayItems = buildStepDisplayItems(flow.steps);

                return (
                    <div
                        key={flowIndex}
                        className="bg-white rounded-2xl shadow-lg shadow-sky-100/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-sky-200/50 border border-sky-100"
                    >
                        <button
                            onClick={() => toggleFlow(flowIndex)}
                            type="button"
                            className="w-full text-left flex items-center justify-between p-4 cursor-pointer bg-gradient-to-r from-sky-50 to-sky-100/50 hover:from-sky-100 hover:to-sky-100 transition-colors duration-200 focus:outline-none"
                            aria-expanded={isOpen}
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 text-sky-600 shrink-0">
                                    <FcWorkflow className="w-5 h-5" />
                                </span>
                                <span className="font-semibold text-gray-900 text-sm break-words">
                                    {flow.meta?.flowName ?? flow.meta?.flowId}
                                </span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm pointer-events-none shrink-0 ml-3">
                                <FaChevronDown
                                    className={`w-3 h-3 text-sky-600 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                                />
                            </div>
                        </button>

                        {isOpen && (
                            <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/40 max-h-80 overflow-y-auto">
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
