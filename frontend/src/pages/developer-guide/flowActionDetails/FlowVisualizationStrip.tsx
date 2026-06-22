import { type FC } from "react";
import { FiArrowRight } from "react-icons/fi";
import { buildStepDisplayItems } from "../FlowInformation/utils";
import { getActionId } from "../utils";
import type { FlowStep } from "../types";
import GuideCard from "../shared/components/GuideCard";

interface FlowVisualizationStripProps {
    steps: FlowStep[];
    selectedFlowAction: string;
    onSelectAction: (actionId: string) => void;
}

const StepChip: FC<{ step: FlowStep; isSelected: boolean; onClick: () => void }> = ({
    step,
    isSelected,
    onClick,
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={isSelected}
        className={`shrink-0 px-3 py-1.5 rounded-lg border text-xs font-medium font-mono transition-colors ${
            isSelected
                ? "bg-sky-50 dark:bg-sky-500/10 border-sky-300 dark:border-sky-500/40 text-sky-900 dark:text-sky-300 ring-1 ring-sky-200/60 dark:ring-sky-500/20"
                : "bg-white dark:bg-surface-elevated border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
        }`}
    >
        {step.action_label ?? step.api}
    </button>
);

/** Compact step-diagram strip for the flow containing the currently selected action — lets users jump between steps without leaving the Example Payload tab. */
const FlowVisualizationStrip: FC<FlowVisualizationStripProps> = ({
    steps,
    selectedFlowAction,
    onSelectAction,
}) => {
    const displayItems = buildStepDisplayItems(steps);

    if (displayItems.length === 0) return null;

    return (
        <GuideCard border="slate" rounded="xl" className="px-4 py-3">
            <div className="flex items-center gap-3 overflow-x-auto">
                {displayItems.map((item, idx) => {
                    if (item.type === "pair") {
                        const requestId = getActionId(item.request);
                        const responseId = getActionId(item.response);
                        return (
                            <div key={idx} className="flex items-center gap-2 shrink-0">
                                <StepChip
                                    step={item.request}
                                    isSelected={selectedFlowAction === requestId}
                                    onClick={() => onSelectAction(requestId)}
                                />
                                <FiArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                <StepChip
                                    step={item.response}
                                    isSelected={selectedFlowAction === responseId}
                                    onClick={() => onSelectAction(responseId)}
                                />
                            </div>
                        );
                    }
                    const stepId = getActionId(item.step);
                    return (
                        <StepChip
                            key={idx}
                            step={item.step}
                            isSelected={selectedFlowAction === stepId}
                            onClick={() => onSelectAction(stepId)}
                        />
                    );
                })}
            </div>
        </GuideCard>
    );
};

export default FlowVisualizationStrip;
