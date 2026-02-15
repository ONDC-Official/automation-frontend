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
        <div className="min-h-screen bg-slate-50/50">
            <header className="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-6 py-5">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Developer Guide
                    </h1>
                    <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                        Explore API flows, request/response actions, schema attributes, and x-validations for each payload field.
                    </p>
                </div>
            </header>
            <Filters onSubmit={handleFiltersSubmit} />
            <div className="max-w-[1600px] mx-auto px-6 pb-10 flex gap-8">
                <aside className="w-[340px] shrink-0">
                    <div className="sticky top-[140px]">
                        <FlowsAccordion
                            data={data}
                            selectedFlow={selectedFlow}
                            selectedFlowAction={selectedFlowAction}
                            setSelectedFlow={setSelectedFlow}
                            setSelectedFlowAction={setSelectedFlowAction}
                        />
                    </div>
                </aside>
                <main className="flex-1 min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
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
