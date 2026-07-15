import { FC } from "react";
import type { FlowEntry } from "../types";

interface FlowContextStripProps {
    flow: FlowEntry;
    action: string;
    /** Shown as a chip next to the domain chip only while the action selector sidebar is collapsed, since the selected action is otherwise not visible anywhere. */
    actionLabel?: string;
    sidebarOpen: boolean;
}

const chipClassName =
    "inline-flex items-center rounded-full px-3 py-1 border border-sky-200 bg-sky-50 text-sky-700 text-[11px] font-semibold leading-none dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300";

/** Minimal one-line flow context (name, version/domain, tags) shown above an action's detail — the full FlowDetailsAndSummary is reserved for when no action is selected yet. */
const FlowContextStrip: FC<FlowContextStripProps> = ({
    flow,
    action,
    actionLabel,
    sidebarOpen,
}) => {
    const flowName = flow.flowId.split("_").join(" ");
    const description = flow.config?.steps.find((step) => step.action_id === action)?.description;

    return (
        <div className="border-b border-slate-200 dark:border-border-default pb-4">
            <div className="grid grid-cols-[60%_40%] items-start gap-4 ">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 wrap-break-word">{flowName}</span>
                    {!sidebarOpen && actionLabel && (
                        <span className={chipClassName}>{actionLabel}</span>
                    )}
                </div>

                <div className="flex flex-wrap pr-4 items-center justify-end gap-1.5">
                    {(flow.domain || flow.version) && (
                        <span className={chipClassName}>
                            {flow.domain}
                            {flow.domain && flow.version && " · "}
                            {flow.version && `v${flow.version}`}
                        </span>
                    )}

                    {/* {flow.tags.length > 0 &&
                        flow.tags.map((tag) => (
                            <span key={tag} className={chipClassName}>
                                {tag}
                            </span>
                        ))} */}
                </div>
            </div>

            {description && (
                <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-border-default dark:bg-surface-elevated">
                    {description}
                </p>
            )}
        </div>
    );
};

export default FlowContextStrip;
