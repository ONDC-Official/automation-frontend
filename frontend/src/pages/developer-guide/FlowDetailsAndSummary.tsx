import { FC } from "react";
import { Flow } from "./types";

interface FlowDetailsAndSummaryProps {
    flow: Flow;
}

const FlowDetailsAndSummary: FC<FlowDetailsAndSummaryProps> = ({ flow }) => {
    const hasDetails = flow.details && flow.details.length > 0;
    const hasReference = !!flow.reference?.trim();
    const flowTitle = flow.meta?.flowName ?? flow.meta?.flowId ?? flow.summary ?? "";
    const flowDescription = flow.meta?.description ?? "";
    const domain = typeof flow.meta?.domain === "string" ? flow.meta.domain : undefined;
    const version = typeof flow.meta?.version === "string" ? flow.meta.version : undefined;

    return (
        <div className="space-y-10">
            <section className="space-y-4">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{flowTitle}</h1>
                {(domain || version) && (
                    <p className="text-sm text-slate-500">
                        {domain && <span className="font-medium">Domain: {domain}</span>}
                        {domain && version && " · "}
                        {version && <span className="font-medium">Version: {version}</span>}
                    </p>
                )}
                {flowDescription && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-6 py-4">
                        <p className="text-sm text-slate-700 leading-relaxed mb-0">
                            {flowDescription}
                        </p>
                    </div>
                )}
            </section>

            {hasDetails && (
                <section>
                    <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        Flow details
                    </h2>
                    <div className="space-y-3">
                        {flow?.details
                            ?.filter((d) => d.description)
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
