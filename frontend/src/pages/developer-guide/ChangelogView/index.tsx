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
        <div className="w-full flex flex-col gap-10">
            {changelogs.map((log, idx) => (
                <div key={`${log.fromVersion}-${log.toVersion}-${idx}`}>
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
