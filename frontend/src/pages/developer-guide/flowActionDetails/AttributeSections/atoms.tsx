import { FC, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

export const SectionHeader: FC<{ children: ReactNode }> = ({ children }) => (
    <div className="flex items-center gap-2 mb-3">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">
            {children}
        </h4>
        <div className="flex-1 h-px bg-sky-100 dark:bg-sky-500/20" />
    </div>
);

export const LabelBadge: FC<{ children: ReactNode }> = ({ children }) => (
    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0">
        {children}
    </span>
);

export const ValueBadge: FC<{ children: ReactNode }> = ({ children }) => (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-500/10 text-sky-800 dark:text-sky-300 font-mono text-[11px] break-all border border-sky-200 dark:border-sky-500/30 shadow-xs">
        {children}
    </span>
);

/**
 * "JSON Path / Owner / Type" card shared by AttributeSection, EnumSection and TagSection.
 * `headerShaded` preserves a pre-existing visual difference: only Enum/Tag sections tint
 * the header row (`bg-sky-50/60`) — Attribute's header row intentionally has none.
 */
export const DetailsCard: FC<{
    jsonPath: string;
    owner?: string;
    type?: string;
    headerShaded?: boolean;
}> = ({ jsonPath, owner, type, headerShaded = false }) => (
    <div className="rounded-xl border border-sky-100 dark:border-sky-500/30 shadow-xs overflow-hidden">
        <div
            className={cn(
                "px-4 py-3 border-b border-sky-100 dark:border-sky-500/30 flex flex-col gap-1.5",
                headerShaded && "bg-sky-50/60 dark:bg-sky-500/10"
            )}
        >
            <LabelBadge>JSON Path</LabelBadge>
            <div className="overflow-x-auto">
                <ValueBadge>{jsonPath}</ValueBadge>
            </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-sky-100 dark:divide-sky-500/30 bg-white dark:bg-surface-elevated">
            <div className="px-4 py-3 flex flex-col gap-1.5">
                <LabelBadge>Owner</LabelBadge>
                <span className="text-sm text-slate-700 font-medium">{owner ?? "—"}</span>
            </div>
            <div className="px-4 py-3 flex flex-col gap-1.5">
                <LabelBadge>Type</LabelBadge>
                <span className="text-sm text-sky-700 dark:text-sky-300 font-mono font-semibold">
                    {type ?? "—"}
                </span>
            </div>
        </div>
    </div>
);
