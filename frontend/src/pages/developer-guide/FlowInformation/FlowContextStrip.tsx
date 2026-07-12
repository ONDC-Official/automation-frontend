import { FC } from "react";
import type { FlowEntry } from "../types";

interface FlowContextStripProps {
    flow: FlowEntry;
    action: string;
}

/** Minimal one-line flow context (name, version/domain, tags) shown above an action's detail — the full FlowDetailsAndSummary is reserved for when no action is selected yet. */
const FlowContextStrip: FC<FlowContextStripProps> = ({ flow, action }) => {
    const flowName = flow.flowId.split("_").join(" ");
    const description = flow.config?.steps.find((step) => step.action_id === action)?.description;

    return (
        <div className="border-b border-slate-200 dark:border-border-default pb-4">
            <div className="flex items-start justify-between gap-4">
                <span className="font-semibold text-slate-800 dark:text-slate-100">{flowName}</span>

                <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {(flow.domain || flow.version) && (
                        <span className="inline-flex items-center rounded-full px-3 py-1 bg-sky-50 text-sky-700 text-[11px] font-semibold leading-none dark:bg-sky-500/10 dark:text-sky-300">
                            {flow.domain}
                            {flow.domain && flow.version && " · "}
                            {flow.version && `v${flow.version}`}
                        </span>
                    )}

                    {/* {flow.tags.length > 0 &&
                        flow.tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center rounded-full px-3 py-1 bg-sky-50 text-sky-700 text-[11px] font-semibold leading-none dark:bg-sky-500/10 dark:text-sky-300"
                            >
                                {tag}
                            </span>
                        ))} */}
                </div>
            </div>

            {description && (
                <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-border-default dark:bg-surface-elevated dark:text-slate-300">
                    {description}
                </p>
            )}
        </div>
    );
};

export default FlowContextStrip;
