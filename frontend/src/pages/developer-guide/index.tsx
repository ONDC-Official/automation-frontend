import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaChevronLeft } from "react-icons/fa";
import FlowsAccordion from "./FlowsAccordion";
import FlowInformation from "./FlowInformation";
import data from "./data.json";
import IconButton from "@components/ui/mini-components/icon-button";
import { ROUTES } from "@constants/routes";
import DeveloperGuideHeaderFilters from "./DeveloperGuideHeaderFilters";

const DeveloperGuide: FC = () => {
    const navigate = useNavigate();
    const [selectedFlow, setSelectedFlow] = useState<string>("");
    const [selectedFlowAction, setSelectedFlowAction] = useState<string>("");
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleFiltersSubmit = (_data: {
        domain: string;
        version: string;
        useCase: string;
    }): Promise<void> => {
        return Promise.resolve();
    };

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }
        navigate(ROUTES.HOME);
    };

    return (
        <div className="bg-slate-50/50">
            <header className="flex items-center justify-between px-6 bg-gradient-to-r from-white to-sky-50 border-b border-sky-100 shadow-sm py-4">
                <div className="flex items-center gap-6">
                    <IconButton
                        icon={<FaArrowLeft size={16} />}
                        label="Back"
                        onClick={handleBack}
                        color="gray"
                    />
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-bold bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 bg-clip-text text-transparent tracking-tight">
                            DEVELOPER GUIDE
                        </span>
                    </div>
                </div>
                <div className="hidden md:flex flex-wrap items-end justify-end gap-4 text-sm">
                    <DeveloperGuideHeaderFilters onSubmit={handleFiltersSubmit} />
                </div>
            </header>
            <div className="flex flex-1 overflow-hidden px-6 py-6 gap-0">
                {/* ── Collapsible sidebar wrapper ── */}
                <div
                    className={`relative flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
                        sidebarOpen ? "w-[380px]" : "w-0"
                    }`}
                >
                    <aside className="w-[380px] h-full border-r border-slate-200 bg-white overflow-y-auto rounded-2xl shadow-lg shadow-sky-100/50">
                        <div className="px-4 pt-4 pb-2 border-b border-slate-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">Flows</h2>
                            <p className="text-gray-600 text-sm">
                                Explore the configured protocol flows
                            </p>
                        </div>
                        <div className="p-4 pt-3">
                            <FlowsAccordion
                                data={data}
                                selectedFlow={selectedFlow}
                                selectedFlowAction={selectedFlowAction}
                                setSelectedFlow={setSelectedFlow}
                                setSelectedFlowAction={setSelectedFlowAction}
                            />
                        </div>
                    </aside>
                </div>

                {/* ── Sidebar toggle tab ── */}
                <div className="flex-shrink-0 flex items-start pt-4 z-10">
                    <button
                        onClick={() => setSidebarOpen((prev) => !prev)}
                        title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                        className={`group flex items-center justify-center h-12 transition-all duration-200 active:scale-95
                            ${
                                sidebarOpen
                                    ? "w-5 -ml-px rounded-r-lg border-l-0 bg-white border border-slate-200 shadow-sm hover:bg-sky-50 hover:border-sky-300 hover:shadow-md"
                                    : "w-8 rounded-lg bg-sky-500 border border-sky-600 shadow-md shadow-sky-200 hover:bg-sky-600 hover:shadow-sky-300"
                            }`}
                    >
                        <FaChevronLeft
                            className={`transition-transform duration-300 text-[9px]
                                ${
                                    sidebarOpen
                                        ? "text-slate-400 group-hover:text-sky-500"
                                        : "text-white rotate-180"
                                }`}
                        />
                    </button>
                </div>

                {/* ── Main content ── */}
                <div className="flex-1 overflow-y-auto min-w-0 pl-4">
                    <FlowInformation
                        data={data}
                        selectedFlow={selectedFlow}
                        selectedFlowAction={selectedFlowAction}
                    />
                </div>
            </div>
        </div>
    );
};
export default DeveloperGuide;
