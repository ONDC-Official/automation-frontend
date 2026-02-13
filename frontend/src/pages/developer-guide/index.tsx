import { FC, useState } from "react";
import Filters from "./Filters";
import FlowsAccordion from "./FlowsAccordion";
import FlowInformation from "./FlowInformation";
import data from "./data.json";

const DeveloperGuide: FC = () => {
    const [selectedFlow, setSelectedFlow] = useState<string>("");
    const [selectedFlowAction, setSelectedFlowAction] = useState<string>("");

    const handleFiltersSubmit = (_data: {
        domain: string;
        version: string;
        useCase: string;
    }): Promise<void> => Promise.resolve();

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="border-b border-slate-200/80 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-[1600px] mx-auto px-4 py-4">
                    <h1 className="text-xl font-semibold text-slate-800 tracking-tight">
                        Developer Guide
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Explore flows, actions, and schema attributes
                    </p>
                </div>
            </div>
            <Filters onSubmit={handleFiltersSubmit} />
            <div className="max-w-[1600px] mx-auto px-4 pb-8 flex gap-6">
                <aside className="w-[320px] shrink-0">
                    <div className="sticky top-[120px]">
                        <FlowsAccordion
                            data={data}
                            selectedFlow={selectedFlow}
                            selectedFlowAction={selectedFlowAction}
                            setSelectedFlow={setSelectedFlow}
                            setSelectedFlowAction={setSelectedFlowAction}
                        />
                    </div>
                </aside>
                <main className="flex-1 min-w-0 rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
                    <FlowInformation
                        data={data}
                        selectedFlow={selectedFlow}
                        selectedFlowAction={selectedFlowAction}
                    />
                </main>
            </div>
        </div>
    );
};
export default DeveloperGuide;
