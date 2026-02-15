import { FC } from "react";
import { Flow } from "./types";

interface FlowDetailsAndSummaryProps {
    flow: Flow;
    selectedFlowAction: string;
}

const FlowDetailsAndSummary: FC<FlowDetailsAndSummaryProps> = ({ flow, selectedFlowAction }) => {
    const hasDetails = flow.details && flow.details.length > 0;
    const hasReference = !!flow.reference?.trim();
    const flowTitle = flow.meta?.flowId ?? flow.summary ?? "";
    const flowDescription = flow.meta?.description ?? "";

    return (
        <div className="space-y-10">
            <section className="space-y-4">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {flowTitle}
                </h1>
                {flowDescription && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-6 py-4">
                        <p className="text-sm text-slate-700 leading-relaxed">{flowDescription}</p>
                    </div>
                )}
                {selectedFlowAction && (
                    <div className="inline-flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Current action
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-800 text-sm font-semibold border border-sky-200/80 font-mono">
                            {selectedFlowAction}
                        </span>
                    </div>
                )}
            </section>

            {hasDetails && (
                <section>
                    <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        Flow details
                    </h2>
                    <div className="space-y-3">
                        {flow.details
                            .filter((d) => d.description)
                            .map((detail, index) => (
                                <div
                                    key={index}
                                    className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
                                >
                                    <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            {detail.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                    </div>
                </section>
            )}

            {hasReference && (
                <section>
                    <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        Reference
                    </h2>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-6 py-4">
                        <p className="text-sm text-slate-600 leading-relaxed">{flow.reference}</p>
                    </div>
                </section>
            )}
        </div>
    );
};

export default FlowDetailsAndSummary;
