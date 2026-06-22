import type { FC } from "react";
import type { ChangeSection } from "../types";
import { FlowEntryCard } from "./FlowEntryCard";

/** Plain heading + one card per entry, in the exact order the backend returns. */
export const FlowsSection: FC<{ section: ChangeSection }> = ({ section }) => (
    <div className="border border-slate-200 rounded-xl bg-white dark:bg-surface-elevated p-4 flex flex-col gap-3">
        <h3 className="text-base font-bold text-slate-900">{section.label}</h3>
        <div className="flex flex-col gap-4">
            {section.entries.map((entry, i) => (
                <FlowEntryCard key={i} entry={entry} />
            ))}
            {section.truncated && (
                <p className="text-xs text-slate-400 italic">
                    + {section.truncatedCount} more changes
                </p>
            )}
        </div>
    </div>
);
