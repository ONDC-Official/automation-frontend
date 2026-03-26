import { type FC, useState } from "react";
import { FiArrowRight, FiSearch } from "react-icons/fi";
import type { SupportedActions } from "./types";

interface SupportedActionsViewProps {
    supportedActions: SupportedActions;
}

const SupportedActionsView: FC<SupportedActionsViewProps> = ({ supportedActions }) => {
    const [search, setSearch] = useState("");
    const { supportedActions: actionMap, apiProperties } = supportedActions;

    const actionEntries = Object.entries(actionMap).filter(([action]) =>
        action.toLowerCase().includes(search.trim().toLowerCase()),
    );

    return (
        <div className="w-full flex flex-col gap-6">
            {/* Header + search */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Supported Actions
                    </p>
                    <p className="text-sm text-slate-600">
                        {actionEntries.length} action{actionEntries.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <div className="relative w-full sm:w-64">
                    <FiSearch
                        size={14}
                        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filter actions..."
                        className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                    />
                </div>
            </div>

            {/* Action cards */}
            <div className="grid gap-4 sm:grid-cols-2">
                {actionEntries.map(([action, partners]) => {
                    const props = apiProperties[action];
                    return (
                        <div
                            key={action}
                            className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                        >
                            {/* Card header */}
                            <div className="flex items-center gap-2 px-4 py-3 bg-sky-50/60 border-b border-slate-100">
                                <span className="font-mono text-sm font-bold text-slate-900">
                                    {action}
                                </span>
                            </div>

                            <div className="px-4 py-3 space-y-3">
                                {/* Transaction partners */}
                                {partners.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                                            Transaction Partners
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {partners.map((p) => (
                                                <span
                                                    key={p}
                                                    className="inline-flex items-center rounded-full px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200"
                                                >
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Async predecessor */}
                                {props?.async_predecessor && (
                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <FiArrowRight size={12} className="text-sky-500 shrink-0" />
                                        <span>
                                            Responds to{" "}
                                            <span className="font-mono font-semibold text-slate-800">
                                                {props.async_predecessor}
                                            </span>
                                        </span>
                                    </div>
                                )}

                                {/* API-level transaction partners (from apiProperties) */}
                                {props?.transaction_partner &&
                                    props.transaction_partner.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                                                API Partners
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {props.transaction_partner.map((tp) => (
                                                    <span
                                                        key={tp}
                                                        className="inline-flex items-center rounded-full px-2.5 py-0.5 bg-sky-50 text-sky-700 text-[11px] font-medium border border-sky-200"
                                                    >
                                                        {tp}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {actionEntries.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 py-12 text-center">
                    <p className="text-sm text-slate-400">No actions match your filter.</p>
                </div>
            )}
        </div>
    );
};

export default SupportedActionsView;
