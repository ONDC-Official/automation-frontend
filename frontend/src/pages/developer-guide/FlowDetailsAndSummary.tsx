import { FC } from "react";
import type { FlowEntry } from "./types";
import GuideCard from "./shared/components/GuideCard";

interface FlowDetailsAndSummaryProps {
    flow: FlowEntry;
}

const FlowDetailsAndSummary: FC<FlowDetailsAndSummaryProps> = ({ flow }) => {
    const config = flow.config;
    const hasDetails = config?.details && config.details.length > 0;
    const hasReference = !!config?.reference?.trim();
    const flowTitle = flow.flowId.split("_").join(" ");
    const flowSummary = config?.summary ?? flow.description;

    return (
        <div className="space-y-10">
            <section className="space-y-4">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{flowTitle}</h1>
                {(flow.domain || flow.version) && (
                    <p className="text-sm text-slate-700">
                        {flow.domain && <span className="font-medium">Domain: {flow.domain}</span>}
                        {flow.domain && flow.version && " · "}
                        {flow.version && (
                            <span className="font-medium">Version: {flow.version}</span>
                        )}
                    </p>
                )}
                {flow.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {flow.tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center rounded-full px-3 py-1 bg-sky-50 text-sky-700 text-[11px] font-semibold leading-none"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
                {flowSummary && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-6 py-4">
                        <p className="text-sm text-slate-800 leading-relaxed mb-0">{flowSummary}</p>
                    </div>
                )}
            </section>

            {hasDetails && (
                <section>
                    <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        Flow details
                    </h2>
                    <div className="space-y-3">
                        {config.details
                            ?.filter((d) => d.description)
                            .map((detail, index) => (
                                <GuideCard key={index} border="slate" rounded="xl" layout="block">
                                    <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            {detail.description}
                                        </p>
                                    </div>
                                </GuideCard>
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
                        <p className="text-sm text-slate-600 leading-relaxed">{config.reference}</p>
                    </div>
                </section>
            )}
        </div>
    );
};

export default FlowDetailsAndSummary;
