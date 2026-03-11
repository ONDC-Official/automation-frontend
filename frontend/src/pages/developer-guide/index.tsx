import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
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
            <div className="flex flex-1 overflow-hidden px-6 py-6">
                {/* FLOWS LIST (always visible, similar layout to flow-testing) */}
                <aside className="w-full md:w-[380px] border-r border-slate-200 bg-white overflow-y-auto rounded-2xl shadow-lg shadow-sky-100/50">
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

                {/* MAIN CONTENT */}
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
