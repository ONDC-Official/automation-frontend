import { FC } from "react";
import type { FlowEntry } from "../types";

interface FlowContextStripProps {
    flow: FlowEntry;
}

/** Minimal one-line flow context (name, version/domain, tags) shown above an action's detail — the full FlowDetailsAndSummary is reserved for when no action is selected yet. */
const FlowContextStrip: FC<FlowContextStripProps> = ({ flow }) => {
    const flowName = flow.flowId.split("_").join(" ");

    return (
        <div className="flex items-center gap-2 flex-wrap text-sm mb-4">
            <span className="font-semibold text-slate-800">{flowName}</span>
            {(flow.domain || flow.version) && (
                <span className="text-slate-400">
                    {flow.domain}
                    {flow.domain && flow.version && " · "}
                    {flow.version && `v${flow.version}`}
                </span>
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
        </div>
    );
};

export default FlowContextStrip;
