import { type FC, type ReactNode, useState } from "react";
import type { ChangeEntry } from "../types";
import { IconChevronDown } from "../shared/icons";
import { KIND_CONFIG } from "./kindConfig";
import { DIFF_CHIP_CLASSES } from "./DiffViewer";
import { Button } from "@/components/Shadcn/Button";

const LABEL_COL = "w-28 shrink-0";
const CHIP_WIDTH = "w-20";

const EntryDetailRow: FC<{
    label: string;
    chipClass: string;
    children: ReactNode;
}> = ({ label, chipClass, children }) => (
    <div className="flex items-start gap-1">
        <div className={`${LABEL_COL} flex items-center gap-3`}>
            <span
                className={`
                    ${CHIP_WIDTH}
                    inline-flex
                    items-center
                    justify-center
                    px-3
                    py-1
                    font-mono
                    rounded-sm
                    text-[13px]
                    font-semibold
                    leading-none
                    ${chipClass}
                `}
            >
                {label}
            </span>

            <span className="font-mono text-neutral-600">-</span>
        </div>

        <div className="flex-1 min-w-0 text-xs font-mono text-neutral-600 leading-relaxed break-all">
            {children}
        </div>
    </div>
);

export const FlowEntryCard: FC<{ entry: ChangeEntry }> = ({ entry }) => {
    const [collapsed, setCollapsed] = useState(false);

    const cfg = KIND_CONFIG[entry.kind] ?? KIND_CONFIG.modified;

    const hasBefore = entry.before !== undefined && entry.before !== "";
    const hasAfter = entry.after !== undefined && entry.after !== "";

    return (
        <div
            className={`rounded-xl bg-white dark:bg-surface-elevated overflow-hidden ${
                collapsed ? "" : "rounded-b-none border-b"
            }`}
        >
            <Button
                onClick={() => setCollapsed((v) => !v)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-brand-light dark:bg-brand-normal/10 hover:bg-brand-light-hover rounded-b-none dark:hover:bg-brand-normal/20 transition-colors text-left"
            >
                <span className="text-body-2 font-medium text-slate-800 truncate">
                    {entry.summary}
                </span>

                <span
                    className={`shrink-0 transition-transform duration-200 text-slate-400 ${
                        collapsed ? "-rotate-90" : ""
                    }`}
                >
                    <IconChevronDown className="w-3.5 h-3.5" />
                </span>
            </Button>

            {!collapsed && (
                <div className="flex flex-col gap-2 py-4">
                    <EntryDetailRow label={cfg.label} chipClass={`${cfg.bg} ${cfg.color}`}>
                        <div>{entry.path}</div>
                        <div className="mt-0.5">{entry.summary}</div>
                    </EntryDetailRow>

                    {hasBefore && (
                        <EntryDetailRow label="Before" chipClass={DIFF_CHIP_CLASSES.Before}>
                            {entry.before}
                        </EntryDetailRow>
                    )}

                    {hasAfter && (
                        <EntryDetailRow label="After" chipClass={DIFF_CHIP_CLASSES.After}>
                            {entry.after}
                        </EntryDetailRow>
                    )}
                </div>
            )}
        </div>
    );
};
