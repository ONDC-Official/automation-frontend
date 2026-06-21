import { type FC } from "react";
import { FiChevronLeft } from "react-icons/fi";
import FlowsAccordion from "../FlowsAccordion";
import type { FlowEntry } from "../types";

interface FlowsSidebarProps {
    flows: FlowEntry[];
    selectedFlow: string;
    selectedFlowAction: string;
    setSelectedFlow: (flowId: string) => void;
    setSelectedFlowAction: (actionId: string) => void;
    sidebarOpen: boolean;
    onToggleSidebar: () => void;
}

const FlowsSidebar: FC<FlowsSidebarProps> = ({
    flows,
    selectedFlow,
    selectedFlowAction,
    setSelectedFlow,
    setSelectedFlowAction,
    sidebarOpen,
    onToggleSidebar,
}) => (
    <>
        <div
            className={`sticky top-24 self-start shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
                sidebarOpen ? "w-130" : "w-0"
            }`}
        >
            <aside className="w-130 h-[calc(100vh-6rem)] border-r border-slate-200 bg-white dark:bg-surface-elevated overflow-y-auto rounded-none shadow-[2px_0_10px_0_rgba(0,0,0,0.02)]">
                <div className="p-5">
                    <FlowsAccordion
                        flows={flows}
                        selectedFlow={selectedFlow}
                        selectedFlowAction={selectedFlowAction}
                        setSelectedFlow={setSelectedFlow}
                        setSelectedFlowAction={setSelectedFlowAction}
                    />
                </div>
            </aside>
        </div>

        <div className="sticky top-40 self-start shrink-0 flex items-start pt-4 z-10">
            <button
                onClick={onToggleSidebar}
                title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                className={`group flex items-center justify-center h-12 transition-all duration-200 active:scale-95 ${
                    sidebarOpen
                        ? "w-5 -ml-px rounded-r-lg border-l-0 bg-white dark:bg-surface-elevated border border-gray-200 shadow-xs hover:bg-sky-50 dark:hover:bg-sky-500/10 hover:border-sky-300 dark:hover:border-sky-500/40"
                        : "w-8 rounded-lg bg-sky-500 border border-sky-600 shadow-[0_4px_12px_-2px_rgba(2,132,199,0.5)] hover:bg-sky-600 hover:-translate-y-0.5"
                }`}
            >
                <FiChevronLeft
                    size={10}
                    className={`transition-transform duration-300 ${
                        sidebarOpen
                            ? "text-gray-400 group-hover:text-sky-500 dark:group-hover:text-sky-400"
                            : "text-white rotate-180"
                    }`}
                />
            </button>
        </div>
    </>
);

export default FlowsSidebar;
