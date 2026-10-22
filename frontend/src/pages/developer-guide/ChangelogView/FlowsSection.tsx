import type { FC } from "react";
import type { ChangeSection } from "../types";
import { FlowEntryCard } from "./FlowEntryCard";
import { formatDateOnly } from "../shared/utils/formatDateTime";

/** Plain heading + one card per entry, in the exact order the backend returns. */
export const FlowsSection: FC<{ section: ChangeSection; generatedAt?: string }> = ({
    section,
    generatedAt,
}) => {
    const dateLabel = formatDateOnly(generatedAt);
    return (
        <div className="border border-slate-200 rounded-xl bg-white dark:bg-surface-elevated p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-slate-900">{section.label}</h3>
                {dateLabel && (
                    <span
                        className="text-xs text-slate-400 shrink-0"
                        title="Date this change was recorded"
                    >
                        {dateLabel}
                    </span>
                )}
            </div>
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
};
