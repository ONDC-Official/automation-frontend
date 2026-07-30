import { FC } from "react";
import { ArrowsPointingInIcon, ArrowsPointingOutIcon } from "@heroicons/react/24/outline";
import { Button } from "@components/Shadcn/Button";
import { TooltipHint } from "@components/Shadcn/Tooltip";
import type { FlowEntry } from "../types";

interface FlowContextStripProps {
    flow: FlowEntry;
    action: string;
    /** Selected action shown as a chip inside the step description container. */
    actionLabel?: string;
    isFullscreen?: boolean;
    onToggleFullscreen?: () => void;
}

const chipClassName =
    "inline-flex items-center rounded-full px-3 py-1 border border-sky-200 bg-sky-50 text-sky-700 text-[11px] font-semibold leading-none dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300";

/** Minimal one-line flow context (name, version/domain, tags) shown above an action's detail — the full FlowDetailsAndSummary is reserved for when no action is selected yet. */
const FlowContextStrip: FC<FlowContextStripProps> = ({
    flow,
    action,
    actionLabel,
    isFullscreen = false,
    onToggleFullscreen,
}) => {
    const flowName = flow.flowId.split("_").join(" ");
    const description = flow.config?.steps.find((step) => step.action_id === action)?.description;

    const flowDescription = flow.description?.trim();

    return (
        <div className="border-b border-slate-200 dark:border-border-default pb-4">
            <div className="grid grid-cols-[60%_40%] items-center gap-4 ">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 wrap-break-word">{flowName}</span>
                </div>

                <div className="flex flex-wrap pr-4 items-center justify-end gap-1.5">
                    {(flow.domain || flow.version) && (
                        <span className={chipClassName}>
                            {flow.domain}
                            {flow.domain && flow.version && " · "}
                            {flow.version && `v${flow.version}`}
                        </span>
                    )}

                    {onToggleFullscreen && (
                        <TooltipHint
                            content={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                            side="bottom"
                        >
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={onToggleFullscreen}
                                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                            >
                                {isFullscreen ? (
                                    <ArrowsPointingInIcon className="size-4" />
                                ) : (
                                    <ArrowsPointingOutIcon className="size-4" />
                                )}
                            </Button>
                        </TooltipHint>
                    )}

                    {/* {flow.tags.length > 0 &&
                        flow.tags.map((tag) => (
                            <span key={tag} className={chipClassName}>
                                {tag}
                            </span>
                        ))} */}
                </div>
            </div>

            {flowDescription && (
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {flowDescription}
                </p>
            )}

            {(actionLabel || description) && (
                <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-border-default dark:bg-surface-elevated">
                    {actionLabel && <span className={chipClassName}>{actionLabel}</span>}
                    {description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default FlowContextStrip;
