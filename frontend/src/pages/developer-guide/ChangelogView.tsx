import { FC, useState, useRef } from "react";
import JsonView from "@uiw/react-json-view";
import { FiChevronDown, FiChevronRight, FiPlus, FiMinus, FiEdit2 } from "react-icons/fi";
import type { ChangelogEntry, ChangeSection, ChangeEntry, ChangeKind } from "./types";

interface ChangelogViewProps {
    changelogs: ChangelogEntry[];
}

/* ─── helpers ───────────────────────────────────────────────────────────── */

function tryParseJson(str: string | undefined): object | null {
    if (!str) return null;
    try {
        const parsed = JSON.parse(str);
        return typeof parsed === "object" && parsed !== null ? parsed : null;
    } catch {
        return null;
    }
}

const KIND_CONFIG: Record<ChangeKind, { label: string; icon: FC<{ size?: number; className?: string }>; color: string; bg: string; border: string }> = {
    added: { label: "Added", icon: FiPlus, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
    removed: { label: "Removed", icon: FiMinus, color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
    modified: { label: "Modified", icon: FiEdit2, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
};

/* ─── DiffViewer ────────────────────────────────────────────────────────── */

/**
 * Renders a Before / After tab switcher.
 * The SAME JsonView instance is kept mounted — when `value` changes without
 * unmounting, @uiw/react-json-view automatically highlights the diff in red/green.
 */
const DiffViewer: FC<{ before?: string; after?: string }> = ({ before, after }) => {
    const [tab, setTab] = useState<"before" | "after">("before");
    const jsonRef = useRef<HTMLDivElement>(null);

    const beforeJson = tryParseJson(before);
    const afterJson  = tryParseJson(after);

    const hasBefore = before !== undefined && before !== "";
    const hasAfter  = after !== undefined && after !== "";
    if (!hasBefore && !hasAfter) return null;

    // The live value shown — switching tab updates src on the SAME mounted JsonView
    const liveJson = tab === "before" ? beforeJson : afterJson;
    const liveRaw  = tab === "before" ? before : after;

    return (
        <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
            {/* tab strip */}
            <div className="flex items-center px-3 pt-2 gap-1 border-b border-slate-200 bg-white">
                {hasBefore && (
                    <button
                        type="button"
                        onClick={() => setTab("before")}
                        className={`px-3 py-1.5 text-[11px] font-semibold rounded-t-md transition-all -mb-px ${
                            tab === "before"
                                ? "bg-slate-50 text-rose-600 border border-b-slate-50 border-rose-300"
                                : "text-slate-400 hover:text-slate-600 border border-transparent"
                        }`}
                    >
                        Before
                    </button>
                )}
                {hasAfter && (
                    <button
                        type="button"
                        onClick={() => setTab("after")}
                        className={`px-3 py-1.5 text-[11px] font-semibold rounded-t-md transition-all -mb-px ${
                            tab === "after"
                                ? "bg-slate-50 text-emerald-600 border border-b-slate-50 border-emerald-300"
                                : "text-slate-400 hover:text-slate-600 border border-transparent"
                        }`}
                    >
                        After
                    </button>
                )}
                {hasBefore && hasAfter && (
                    <span className="ml-auto mr-1 text-[10px] text-slate-400 italic pb-1.5">
                        switch tabs to see diff
                    </span>
                )}
            </div>

            {/* content — same DOM node, value prop changes → diff highlight */}
            <div ref={jsonRef} className="p-4 bg-white max-h-72 overflow-auto">
                {liveJson ? (
                    <JsonView
                        value={liveJson}
                        displayDataTypes={false}
                        displayObjectSize={false}
                        enableClipboard
                        collapsed={2}
                    />
                ) : (
                    <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                        {liveRaw ?? "—"}
                    </pre>
                )}
            </div>
        </div>
    );
};

/* ─── ChangeRow ─────────────────────────────────────────────────────────── */

const ChangeRow: FC<{ entry: ChangeEntry }> = ({ entry }) => {
    const [open, setOpen] = useState(false);
    const cfg = KIND_CONFIG[entry.kind] ?? KIND_CONFIG.modified;
    const Icon = cfg.icon;
    const hasDiff = !!(entry.before || entry.after);

    return (
        <div>
            <button
                type="button"
                disabled={!hasDiff}
                onClick={() => setOpen((v) => !v)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors rounded-lg ${
                    hasDiff ? "hover:bg-slate-50 cursor-pointer" : ""
                }`}
            >
                {/* kind chip */}
                <span className={`mt-0.5 flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                    <Icon size={9} />
                    {cfg.label}
                </span>

                <div className="flex-1 min-w-0">
                    {entry.path && (
                        <span className="block text-xs font-mono text-slate-500 truncate mb-0.5">
                            {entry.path}
                        </span>
                    )}
                    <span className="text-sm text-slate-700 leading-snug">{entry.summary}</span>
                </div>

                {hasDiff && (
                    <span className="flex-shrink-0 mt-1 text-slate-400">
                        {open ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                    </span>
                )}
            </button>

            {open && hasDiff && (
                <div className="px-4 pb-4">
                    <DiffViewer before={entry.before} after={entry.after} />
                </div>
            )}
        </div>
    );
};

/* ─── SectionGroup ──────────────────────────────────────────────────────── */

const SectionGroup: FC<{ section: ChangeSection }> = ({ section }) => {
    const [collapsed, setCollapsed] = useState(false);

    const counts = {
        added:    section.entries.filter((e) => e.kind === "added").length,
        modified: section.entries.filter((e) => e.kind === "modified").length,
        removed:  section.entries.filter((e) => e.kind === "removed").length,
    };

    return (
        <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
            <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/80 hover:bg-slate-100/80 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <span className={`transition-transform duration-200 text-slate-400 ${collapsed ? "-rotate-90" : ""}`}>
                        <FiChevronDown size={14} />
                    </span>
                    <span className="text-sm font-semibold text-slate-800">{section.label}</span>
                    <div className="flex items-center gap-1">
                        {counts.added > 0 && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                +{counts.added}
                            </span>
                        )}
                        {counts.modified > 0 && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                ~{counts.modified}
                            </span>
                        )}
                        {counts.removed > 0 && (
                            <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                                -{counts.removed}
                            </span>
                        )}
                    </div>
                </div>
                <span className="text-xs text-slate-400">{section.totalChanges} changes</span>
            </button>

            {!collapsed && (
                <div className="divide-y divide-slate-100">
                    {section.entries.map((entry, i) => (
                        <ChangeRow key={i} entry={entry} />
                    ))}
                    {section.truncated && (
                        <p className="px-4 py-2.5 text-xs text-slate-400 italic">
                            + {section.truncatedCount} more changes
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

/* ─── ChangelogView ─────────────────────────────────────────────────────── */

const ChangelogView: FC<ChangelogViewProps> = ({ changelogs }) => {
    if (!changelogs || changelogs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-sm font-medium text-slate-500">No changelog entries</p>
                <p className="text-xs text-slate-400 mt-1">Changes between versions will appear here.</p>
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

                        <span className="flex-shrink-0 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5">
                            {log.totalChanges} changes total
                        </span>
                    </div>

                    {/* ── Summary row ── */}
                    {log.summary?.sections && log.summary.sections.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {log.summary.sections.map((sec) => (
                                <span
                                    key={sec.section}
                                    className="text-xs text-slate-600 bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-1.5"
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
                            <p className="text-sm text-slate-400">No detailed breakdown available.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {log.sections.map((sec, sIdx) => (
                                <SectionGroup key={sIdx} section={sec} />
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ChangelogView;
