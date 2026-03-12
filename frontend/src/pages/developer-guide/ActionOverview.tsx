import { FC } from "react";
import Tippy from "@tippyjs/react";
// import "tippy.js/dist/tippy.css";
// import "tippy.js/themes/light.css";
import type { FlowStep } from "./types";
import "tippy.js/animations/perspective-subtle.css";

import { FaSquareArrowUpRight } from "react-icons/fa6";

interface ActionOverviewProps {
    step: FlowStep;
    actionId: string;
}

const ActionOverview: FC<ActionOverviewProps> = ({ step, actionId }) => {
    const description = step.description ?? step.summary;
    const isResponse = !!step.responseFor;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            {/* Header strip */}
            <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-sky-50 to-white border-b border-slate-100">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-100 text-sky-600 shrink-0">
                    <FaSquareArrowUpRight className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-sky-500 uppercase tracking-widest mb-0.5">
                        {isResponse ? "Response Action" : "Request Action"}
                    </p>
                    <p className="text-base font-bold text-slate-900 font-mono truncate">
                        {step.api ?? actionId}
                    </p>
                </div>
                {step.unsolicited && (
                    <Tippy
                        content={
                            <div className="text-xs p-3 rounded-xl bg-white max-w-xs">
                                <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-widest mb-1.5">
                                    Unsolicited Message
                                </p>
                                <p className="text-slate-600 leading-relaxed">
                                    A message sent by the Provider Platform (BPP) proactively,
                                    without being requested by a Buyer Platform (BAP) request. These
                                    are identified by a{" "}
                                    <code className="text-sky-600 font-mono text-[11px] bg-sky-50 px-1 rounded">
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
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 cursor-help">
                            Unsolicited
                        </span>
                    </Tippy>
                )}
                {step.responseFor && (
                    <span className="shrink-0 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-3 py-1 font-mono">
                        ← {step.responseFor}
                    </span>
                )}
            </div>

            {/* Description body */}
            {description && (
                <div className="px-6 py-4">
                    <p className="text-sm text-slate-600 leading-relaxed mb-0">{description}</p>
                </div>
            )}
        </div>
    );
};

export default ActionOverview;
