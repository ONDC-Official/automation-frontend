import { type FC, type ReactNode, useState } from "react";
import type { ChangeEntry } from "../types";
import { IconChevronDown } from "../shared/icons";
import { KIND_CONFIG } from "./kindConfig";
import { DIFF_CHIP_CLASSES } from "./DiffViewer";

const LABEL_COL = "w-20 shrink-0";

/** A single labelled row: a colored chip in a fixed-width column + dashed content. */
const EntryDetailRow: FC<{ label: string; chipClass: string; children: ReactNode }> = ({
    label,
    chipClass,
    children,
}) => (
    <div className="flex items-start gap-3">
        <div className={`${LABEL_COL} flex items-start`}>
            <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold leading-none ${chipClass}`}
            >
                {label}
            </span>
        </div>
        <div className="flex-1 min-w-0 text-xs font-mono text-slate-600 leading-relaxed break-all">
            {children}
        </div>
    </div>
);

/**
 * One change entry rendered as its own collapsible card — header bar shows the
 * entry's summary, body lists Modified/Before/After as dashed, labelled rows.
 */
export const FlowEntryCard: FC<{ entry: ChangeEntry }> = ({ entry }) => {
    const [collapsed, setCollapsed] = useState(false);
    const cfg = KIND_CONFIG[entry.kind] ?? KIND_CONFIG.modified;
    const hasBefore = entry.before !== undefined && entry.before !== "";
    const hasAfter = entry.after !== undefined && entry.after !== "";

    return (
        <div className="border border-slate-200 rounded-xl bg-white dark:bg-surface-elevated overflow-hidden">
            <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-indigo-50/70 dark:bg-indigo-500/10 hover:bg-indigo-100/70 dark:hover:bg-indigo-500/20 transition-colors text-left"
            >
                <span className="text-sm font-semibold text-slate-800 truncate">
                    {entry.summary}
                </span>
                <span
                    className={`shrink-0 transition-transform duration-200 text-slate-400 ${collapsed ? "-rotate-90" : ""}`}
                >
                    <IconChevronDown size={14} />
                </span>
            </button>

            {!collapsed && (
                <div className="flex flex-col gap-2 p-4">
                    <EntryDetailRow label={cfg.label} chipClass={`${cfg.bg} ${cfg.color}`}>
                        <div>- {entry.path}</div>
                        <div className="text-slate-500 mt-0.5">{entry.summary}</div>
                    </EntryDetailRow>

                    {hasBefore && (
                        <EntryDetailRow label="Before" chipClass={DIFF_CHIP_CLASSES.Before}>
                            - {entry.before}
                        </EntryDetailRow>
                    )}

                    {hasAfter && (
                        <EntryDetailRow label="After" chipClass={DIFF_CHIP_CLASSES.After}>
                            - {entry.after}
                        </EntryDetailRow>
                    )}
                </div>
            )}
        </div>
    );
};
