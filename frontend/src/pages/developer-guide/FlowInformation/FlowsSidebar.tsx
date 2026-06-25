import { type FC } from "react";
import FlowsAccordion from "../FlowsAccordion";
import type { FlowEntry } from "../types";

interface FlowsSidebarProps {
    flows: FlowEntry[];
    selectedFlow: string;
    selectedFlowAction: string;
    setSelectedFlow: (flowId: string) => void;
    setSelectedFlowAction: (actionId: string) => void;
    sidebarOpen: boolean;
}

const FlowsSidebar: FC<FlowsSidebarProps> = ({
    flows,
    selectedFlow,
    selectedFlowAction,
    setSelectedFlow,
    setSelectedFlowAction,
    sidebarOpen,
}) => (
    <div
        className={`sticky top-0 self-start shrink-0 overflow-hidden h-[calc(100vh-10rem)] transition-all duration-300 ease-in-out ${
            sidebarOpen ? "w-96" : "w-0"
        }`}
    >
        <aside className="w-96 h-full dark:bg-surface-elevated overflow-y-auto">
            <FlowsAccordion
                flows={flows}
                selectedFlow={selectedFlow}
                selectedFlowAction={selectedFlowAction}
                setSelectedFlow={setSelectedFlow}
                setSelectedFlowAction={setSelectedFlowAction}
            />
        </aside>
    </div>
);

export default FlowsSidebar;
