import type { FC } from "react";
import type { ChangeEntry } from "../types";
import { KIND_CONFIG } from "./kindConfig";
import { DiffViewer } from "./DiffViewer";

/** Always shows Modified/Added/Removed + Before/After inline — no per-entry toggle. */
export const ChangeRow: FC<{ entry: ChangeEntry }> = ({ entry }) => {
    const cfg = KIND_CONFIG[entry.kind] ?? KIND_CONFIG.modified;
    const Icon = cfg.icon;
    const hasDiff = !!(entry.before || entry.after);

    return (
        <div className="px-4 py-3">
            <div className="flex items-start gap-3">
                {/* kind chip */}
                <span
                    className={`mt-0.5 shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold leading-none ${cfg.bg} ${cfg.color}`}
                >
                    <Icon className="w-3 h-3" />
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
            </div>

            {hasDiff && (
                <div className="pl-9">
                    <DiffViewer before={entry.before} after={entry.after} />
                </div>
            )}
        </div>
    );
};
