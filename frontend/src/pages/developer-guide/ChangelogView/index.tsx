import type { FC } from "react";
import type { ChangelogEntry } from "../types";
import { SectionGroup } from "./SectionGroup";
import { FlowsSection } from "./FlowsSection";

interface ChangelogViewProps {
    changelogs: ChangelogEntry[];
}

const ChangelogView: FC<ChangelogViewProps> = ({ changelogs }) => {
    if (!changelogs || changelogs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-sm font-medium text-slate-500">No changelog entries</p>
                <p className="text-xs text-slate-400 mt-1">
                    Changes between versions will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full py-4 flex flex-col gap-10">
            {changelogs.map((log, idx) => (
                <div key={`${log.fromVersion}-${log.toVersion}-${idx}`}>
                    {/* ── Version header ── */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-slate-200">
                        <div className="flex items-baseline gap-3">
                            <h2 className="font-mono text-2xl font-bold text-slate-900 tracking-tight">
                                v{log.toVersion}
                            </h2>
                            <span className="text-sm text-slate-400">
                                ← <span className="font-mono">v{log.fromVersion}</span>
                            </span>
                            {log.generatedAt && (
                                <span className="text-xs text-slate-400">
                                    {new Date(log.generatedAt).toLocaleDateString("en-GB", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                            )}
                        </div>

                        <span className="shrink-0 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5">
                            {log.totalChanges} changes total
                        </span>
                    </div>

                    {/* ── Summary row ── */}
                    {log.summary?.sections && log.summary.sections.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {log.summary.sections.map((sec) => (
                                <span
                                    key={sec.section}
                                    className="text-xs text-slate-600 bg-white dark:bg-surface-elevated border border-slate-200 shadow-xs rounded-lg px-3 py-1.5"
                                >
                                    {sec.label}{" "}
                                    <strong className="text-slate-800">{sec.count}</strong>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* ── Section groups ── */}
                    {!log.sections || log.sections.length === 0 ? (
                        <div className="border border-dashed border-slate-200 rounded-xl py-8 text-center">
                            <p className="text-sm text-slate-400">
                                No detailed breakdown available.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {log.sections.map((sec, sIdx) =>
                                sec.section === "flows" ? (
                                    <FlowsSection key={sIdx} section={sec} />
                                ) : (
                                    <SectionGroup key={sIdx} section={sec} />
                                )
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ChangelogView;
