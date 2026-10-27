import type { IProblemsPanelProps } from "@pages/protocol-studio/ui/editor/types";

const ORDER = { error: 0, warning: 1, info: 2 } as const;

/**
 * What the linter found on the protocol and the journeys, worst first.
 * Clicking a row selects what it points at and brings it into view.
 */
export const ProblemsPanel = ({ problems, onReveal }: IProblemsPanelProps) => {
    const sorted = [...problems].sort((a, b) => ORDER[a.level] - ORDER[b.level]);
    const errors = problems.filter((p) => p.level === "error").length;
    const warnings = problems.filter((p) => p.level === "warning").length;

    return (
        <div className="studio-well flex h-full flex-col">
            <div className="studio-hairline-b flex items-center gap-2 px-3 py-1.5">
                <span className="studio-eyebrow">Problems</span>
                <span className="studio-text-faint text-[11px]">
                    {problems.length === 0
                        ? "none"
                        : `${errors} ${errors === 1 ? "error" : "errors"} · ${warnings} ${warnings === 1 ? "warning" : "warnings"} · ${problems.length - errors - warnings} info`}
                </span>
            </div>
            <ol className="min-h-0 flex-1 overflow-auto px-2 py-2 text-[12px] leading-5">
                {sorted.length === 0 ? (
                    <li className="studio-text-faint px-1">
                        Nothing to report. Problems appear here as the protocol and journeys change.
                    </li>
                ) : (
                    sorted.map((problem) => (
                        <li key={problem.id}>
                            <button
                                type="button"
                                className="studio-problem"
                                data-level={problem.level}
                                onClick={() => onReveal(problem)}
                                disabled={!problem.nodeId && !problem.edgeId && !problem.journeyId}
                                title={
                                    problem.nodeId || problem.edgeId || problem.journeyId
                                        ? "Reveal"
                                        : undefined
                                }
                            >
                                <span
                                    className="studio-level"
                                    data-level={
                                        problem.level === "warning" ? "warn" : problem.level
                                    }
                                >
                                    {problem.level === "warning"
                                        ? "WARN"
                                        : problem.level.toUpperCase()}
                                </span>
                                <span className="min-w-0 flex-1 break-words text-left">
                                    {problem.message}
                                </span>
                                {problem.journeyId ? (
                                    <span className="studio-badge shrink-0">journey</span>
                                ) : null}
                            </button>
                        </li>
                    ))
                )}
            </ol>
        </div>
    );
};

export default ProblemsPanel;
