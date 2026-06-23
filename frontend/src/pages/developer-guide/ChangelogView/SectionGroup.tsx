import { type FC, useState } from "react";
import type { ChangeSection } from "../types";
import { IconChevronDown } from "../shared/icons";
import { ChangeRow } from "./ChangeRow";
import { Button } from "@/components/Shadcn/Button";

export const SectionGroup: FC<{ section: ChangeSection }> = ({ section }) => {
    const [collapsed, setCollapsed] = useState(false);

    const counts = {
        added: section.entries.filter((e) => e.kind === "added").length,
        modified: section.entries.filter((e) => e.kind === "modified").length,
        removed: section.entries.filter((e) => e.kind === "removed").length,
    };

    return (
        <div className="border border-slate-200 rounded-xl bg-white dark:bg-surface-elevated overflow-hidden">
            <Button
                onClick={() => setCollapsed((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-brand-light dark:bg-brand-normal/10 hover:bg-brand-light-hover rounded-b-none dark:hover:bg-brand-normal/20 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <span
                        className={`transition-transform duration-200 text-slate-400 ${collapsed ? "-rotate-90" : ""}`}
                    >
                        <IconChevronDown className="size-4" />
                    </span>
                    <span className="text-sm font-semibold text-slate-800">{section.label}</span>
                    <div className="flex items-center gap-1">
                        {counts.added > 0 && (
                            <span className="text-[10px] font-bold text-[#3F7F3F] bg-[#DDEBDD] px-1.5 py-0.5 rounded-full">
                                +{counts.added}
                            </span>
                        )}
                        {counts.modified > 0 && (
                            <span className="text-[10px] font-bold text-[#B45309] bg-[#FDF3D6] px-1.5 py-0.5 rounded-full">
                                ~{counts.modified}
                            </span>
                        )}
                        {counts.removed > 0 && (
                            <span className="text-[10px] font-bold text-[#DC2626] bg-[#FCE7EA] px-1.5 py-0.5 rounded-full">
                                -{counts.removed}
                            </span>
                        )}
                    </div>
                </div>
                <span className="text-xs text-slate-400">{section.totalChanges} changes</span>
            </Button>

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
