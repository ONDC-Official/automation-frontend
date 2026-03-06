import { FC, useState } from "react";
import Filters from "./Filters";
import FlowsAccordion from "./FlowsAccordion";
import FlowInformation from "./FlowInformation";
import data from "./data.json";

const DeveloperGuide: FC = () => {
    const [selectedFlow, setSelectedFlow] = useState<string>("");
    const [selectedFlowAction, setSelectedFlowAction] = useState<string>("");

    const [activeSidebar, setActiveSidebar] = useState<"info" | "flows" | null>(null);

    const toggleSidebar = (type: "info" | "flows") => {
        setActiveSidebar((prev) => (prev === type ? null : type));
    };

    const handleFiltersSubmit = (_data: {
        domain: string;
        version: string;
        useCase: string;
    }): Promise<void> => Promise.resolve();

    return (
        <div className="bg-slate-50/50">
            <header className="border-b border-slate-200 bg-white shadow-sm">
                <div className="px-6 py-6">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-center">
                        Developer Guide
                    </h1>
                    <p className="text-sm text-slate-600 mt-1  leading-relaxed mb-0 text-center">
                        Explore API flows, request/response actions, schema attributes, and
                        x-validations for each payload field.
                    </p>
                </div>
            </header>
            <div className="flex flex-1 overflow-hidden">
                {/* TOGGLE STRIP */}
                <div className="w-[60px] border-r border-slate-200 bg-white flex flex-col items-center py-4 gap-6">
                    {/* INFO TOGGLE */}
                    <button
                        onClick={() => toggleSidebar("info")}
                        className={`group flex flex-col items-center gap-1.5 px-2 py-2 rounded-xl transition-all duration-200 ${
                            activeSidebar === "info"
                                ? "bg-sky-50 text-sky-600"
                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.8}
                        >
                            <circle cx="12" cy="12" r="9" />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 11v5M12 8h.01"
                            />
                        </svg>
                        <span className="text-[10px] font-medium tracking-wide">Info</span>
                    </button>

                    {/* FLOWS TOGGLE */}
                    <button
                        onClick={() => toggleSidebar("flows")}
                        className={`group flex flex-col items-center gap-1.5 px-2 py-2 rounded-xl transition-all duration-200 ${
                            activeSidebar === "flows"
                                ? "bg-sky-50 text-sky-600"
                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.8}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 6h18M3 12h12M3 18h8"
                            />
                        </svg>
                        <span className="text-[10px] font-medium tracking-wide">Flows</span>
                    </button>
                </div>

                {/* INFO SIDEBAR */}
                {activeSidebar === "info" && (
                    <aside className="w-[340px] border-r border-slate-200 bg-white overflow-y-auto">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                            <span className="text-lg font-semibold text-slate-800">Info</span>
                            <button
                                onClick={() => setActiveSidebar(null)}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
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
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4">
                            <Filters onSubmit={handleFiltersSubmit} />
                        </div>
                    </aside>
                )}

                {/* FLOWS SIDEBAR */}
                {activeSidebar === "flows" && (
                    <aside className="w-[340px] border-r border-slate-200 bg-white overflow-y-auto">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                            <span className="text-lg font-semibold text-slate-800">Flows</span>
                            <button
                                onClick={() => setActiveSidebar(null)}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
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
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4">
                            <FlowsAccordion
                                data={data}
                                selectedFlow={selectedFlow}
                                selectedFlowAction={selectedFlowAction}
                                setSelectedFlow={setSelectedFlow}
                                setSelectedFlowAction={setSelectedFlowAction}
                            />
                        </div>
                    </aside>
                )}

                {/* MAIN CONTENT (unchanged) */}
                <div className="flex-1 overflow-y-auto">
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
