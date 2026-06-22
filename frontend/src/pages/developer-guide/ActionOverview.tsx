import { FC } from "react";
import Tippy from "@tippyjs/react";
import type { FlowStep } from "./types";
import "tippy.js/animations/perspective-subtle.css";

import { FaSquareArrowUpRight } from "react-icons/fa6";
import GuideCard from "./shared/components/GuideCard";

interface ActionOverviewProps {
    step: FlowStep;
    actionId: string;
}

const ActionOverview: FC<ActionOverviewProps> = ({ step, actionId }) => {
    const description = step.description ?? step.summary;
    const isResponse = !!step.responseFor;

    return (
        <GuideCard border="slate" rounded="2xl" layout="block">
            {/* Header strip */}
            <div className="flex items-center gap-3 px-6 py-4 bg-sky-50 dark:bg-sky-500/10 border-slate-100">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 shrink-0">
                    <FaSquareArrowUpRight className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-sky-500 dark:text-sky-400 uppercase tracking-widest mb-0.5">
                        {isResponse ? "Response Action" : "Request Action"}
                    </p>
                    <p className="text-base font-bold text-slate-900 font-mono truncate">
                        {step.api ?? actionId}
                    </p>
                </div>
                {step.unsolicited && (
                    <Tippy
                        content={
                            <div className="text-xs p-3 rounded-xl bg-white dark:bg-surface-elevated max-w-xs">
                                <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1.5">
                                    Unsolicited Message
                                </p>
                                <p className="text-slate-600 leading-relaxed">
                                    A message sent by the Provider Platform (BPP) proactively,
                                    without being requested by a Buyer Platform (BAP) request. These
                                    are identified by a{" "}
                                    <code className="text-sky-600 dark:text-sky-400 font-mono text-[11px] bg-sky-50 dark:bg-sky-500/10 px-1 rounded">
                                        message_id
                                    </code>{" "}
                                    that doesn't match any active BAP-originated request.
                                </p>
                            </div>
                        }
                        allowHTML={false}
                        placement="bottom"
                        arrow={true}
                        animation="perspective-subtle"
                    >
                        <span className="shrink-0 text-[11px] font-semibold leading-none text-[#E6862E] bg-[#FCE8D7] rounded-full px-3 py-1 cursor-help">
                            Unsolicited
                        </span>
                    </Tippy>
                )}
                {step.responseFor && (
                    <span className="shrink-0 text-[11px] font-semibold leading-none text-slate-600 bg-slate-100 rounded-full px-3 py-1 font-mono">
                        ← {step.responseFor}
                    </span>
                )}
            </div>

            {/* Description body */}
            {description && (
                <div className="px-4 py-4">
                    <p className="text-sm text-slate-800 leading-relaxed mb-0">{description}</p>
                </div>
            )}
        </GuideCard>
    );
};

export default ActionOverview;
