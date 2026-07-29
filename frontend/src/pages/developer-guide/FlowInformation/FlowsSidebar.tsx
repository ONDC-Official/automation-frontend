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
        className={`sticky top-4 self-start shrink-0 overflow-hidden h-[calc(100vh-6rem)] transition-[width] duration-300 ease-in-out ${
            sidebarOpen ? "w-80" : "w-0"
        }`}
    >
        <aside className="h-full w-80 overflow-y-auto dark:bg-surface-page">
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
