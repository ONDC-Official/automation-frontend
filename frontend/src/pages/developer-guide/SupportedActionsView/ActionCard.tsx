import { type FC } from "react";
import type { ActionRelationship } from "./types";

interface ActionCardProps {
    api: string;
    nextActions: string[];
    requiredHistory: string[];
    asyncPredecessor: string | null;
    isEntry: boolean;
    relationship: ActionRelationship;
    focused: string | null;
    onToggleFocus: (api: string) => void;
}

const RELATIONSHIP_RING_CLASS: Record<ActionRelationship, string> = {
    focused: "ring-2 ring-sky-400 border-sky-300",
    next: "ring-2 ring-sky-300 border-sky-200",
    history: "ring-2 ring-slate-300 border-slate-300",
    none: "hover:shadow-md hover:border-slate-300",
};

const ActionCard: FC<ActionCardProps> = ({
    api,
    nextActions,
    requiredHistory,
    asyncPredecessor,
    isEntry,
    relationship,
    focused,
    onToggleFocus,
}) => {
    const isResponse = api.startsWith("on_");
    const ringClass =
        relationship === "none" && focused ? "opacity-35" : RELATIONSHIP_RING_CLASS[relationship];

    return (
        <div
            className={`relative rounded-xl border border-slate-200 bg-white dark:bg-surface-elevated shadow-xs overflow-hidden transition-all duration-200 ${ringClass}`}
        >
            <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${isResponse ? "bg-indigo-400" : "bg-sky-400"}`}
            />

            <div className="pl-4 pr-4 py-3 flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 dark:bg-surface-muted/60">
                <button
                    onClick={() => onToggleFocus(api)}
                    title="Focus this action"
                    className="flex items-center gap-2 flex-1 min-w-0 text-left group"
                >
                    <span className="font-mono text-sm font-bold text-slate-800 truncate">
                        {api}
                    </span>
                    <svg
                        className="h-3 w-3 text-slate-300 group-hover:text-slate-500 shrink-0 transition"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                    </svg>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                    {isEntry && (
                        <span className="inline-flex items-center rounded-md px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-semibold uppercase tracking-wide">
                            Entry
                        </span>
                    )}
                    {isResponse && (
                        <span className="inline-flex items-center rounded-md px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-[10px] font-semibold uppercase tracking-wide">
                            Response
                        </span>
                    )}
                </div>
            </div>

            <div className="pl-5 pr-4 py-3 space-y-3.5">
                {asyncPredecessor && (
                    <div className="flex items-start gap-2 border-l-2 border-slate-300 pl-2.5 py-0.5">
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Async response to{" "}
                            <button
                                onClick={() => onToggleFocus(asyncPredecessor)}
                                className="font-mono font-semibold text-slate-700 hover:text-sky-700 dark:hover:text-sky-400 hover:underline transition"
                            >
                                {asyncPredecessor}
                            </button>{" "}
                            — must share the same{" "}
                            <span className="font-semibold text-slate-700">message_id</span>.
                        </p>
                    </div>
                )}

                <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-xs bg-sky-400 inline-block shrink-0" />
                        Valid Next
                    </p>
                    {nextActions.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {nextActions.map((next) => (
                                <button
                                    key={next}
                                    onClick={() => onToggleFocus(next)}
                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border transition-all ${
                                        focused === next
                                            ? "bg-sky-500 text-white border-sky-500 shadow-xs"
                                            : "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30 hover:bg-sky-100 dark:hover:bg-sky-500/20"
                                    }`}
                                >
                                    {next}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 italic">
                            Terminal — no further actions can follow.
                        </p>
                    )}
                </div>

                <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-xs bg-slate-400 inline-block shrink-0" />
                        Required History
                    </p>
                    {requiredHistory.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {requiredHistory.map((h) => (
                                <button
                                    key={h}
                                    onClick={() => onToggleFocus(h)}
                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border transition-all ${
                                        focused === h
                                            ? "bg-slate-700 text-white border-slate-700 shadow-xs"
                                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                                    }`}
                                >
                                    {h}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 italic">No prior history required.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActionCard;
