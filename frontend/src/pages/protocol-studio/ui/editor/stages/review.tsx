import type { MockPlaygroundConfigV2Type } from "@ondc/automation-mock-runner";
import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

import { ProblemsPanel } from "@pages/protocol-studio/ui/editor/dock/problems-panel";
import type { Coverage } from "@pages/protocol-studio/ui/editor/journeys/derive";
import type {
    FlatGraph,
    Fork,
    ProtocolProblem,
    StudioGraph,
    StudioJourney,
    StudioStage,
} from "@pages/protocol-studio/ui/editor/types";

export interface IReviewStageProps {
    config: MockPlaygroundConfigV2Type;
    root: StudioGraph;
    flat: FlatGraph;
    forks: Fork[];
    journeys: StudioJourney[];
    problems: ProtocolProblem[];
    coverage: Coverage;
    onReveal: (problem: ProtocolProblem) => void;
    onGoToStage: (stage: StudioStage) => void;
    onDownloadConfig: () => void;
    onDownloadJourneys: () => void;
}

const countGroups = (root: StudioGraph): number =>
    root.nodes.reduce((n, node) => n + (node.group ? 1 + countGroups(node.group.graph) : 0), 0);

const Stat = ({
    label,
    value,
    hint,
    onClick,
}: {
    label: string;
    value: string | number;
    hint?: string;
    onClick?: () => void;
}) => (
    <button
        type="button"
        className="studio-stat"
        onClick={onClick}
        disabled={!onClick}
        title={hint}
    >
        <span className="studio-stat-value">{value}</span>
        <span className="studio-stat-label">{label}</span>
    </button>
);

/**
 * Stage 4 — the whole thing at a glance: counts, every problem the linters
 * found, which journeys cover which nodes and alternatives, and export.
 */
export const ReviewStage = ({
    config,
    root,
    flat,
    forks,
    journeys,
    problems,
    coverage,
    onReveal,
    onGoToStage,
    onDownloadConfig,
    onDownloadJourneys,
}: IReviewStageProps) => {
    const errors = problems.filter((p) => p.level === "error").length;
    const warnings = problems.filter((p) => p.level === "warning").length;
    const options = forks.reduce((n, fork) => n + fork.options.length, 0);
    const coveredOptions = options - coverage.uncovered.length;
    const coveredNodes = flat.nodes.length - coverage.unvisited.length;
    const pct = (a: number, b: number) => (b === 0 ? "—" : `${Math.round((a / b) * 100)}%`);

    // Rows grouped by the sub-protocol they sit in; the top level first.
    const groupsInOrder = [undefined, ...new Set([...flat.groupOf.values()])];
    const groupName = (id: string) => {
        let name = id;
        const visit = (graph: StudioGraph) => {
            for (const node of graph.nodes) {
                if (node.id === id && node.group) name = node.group.name || id;
                if (node.group) visit(node.group.graph);
            }
        };
        visit(root);
        return name;
    };

    return (
        <div className="studio-stage-page" data-stage="review">
            <main className="studio-stage-main studio-stage-main-wide">
                <section className="studio-glass studio-card">
                    <header className="studio-card-head">
                        <div>
                            <p className="studio-eyebrow">Summary</p>
                            <p className="studio-card-title">
                                {config.meta.domain} {config.meta.version}
                                {config.meta.use_case_id ? ` · ${config.meta.use_case_id}` : ""}
                            </p>
                        </div>
                    </header>
                    <div className="studio-stats px-4 pb-4">
                        <Stat
                            label="nodes"
                            value={flat.nodes.length}
                            onClick={() => onGoToStage("protocol")}
                        />
                        <Stat
                            label="wires"
                            value={flat.edges.length}
                            onClick={() => onGoToStage("protocol")}
                        />
                        <Stat
                            label="forks"
                            value={forks.length}
                            hint="alternatives and decisions"
                            onClick={() => onGoToStage("protocol")}
                        />
                        <Stat
                            label="sub-protocols"
                            value={countGroups(root)}
                            onClick={() => onGoToStage("protocol")}
                        />
                        <Stat
                            label="journeys"
                            value={journeys.length}
                            onClick={() => onGoToStage("journeys")}
                        />
                        <Stat
                            label="alternatives covered"
                            value={pct(coveredOptions, options)}
                            hint={`${coveredOptions} of ${options}`}
                            onClick={() => onGoToStage("journeys")}
                        />
                        <Stat
                            label="nodes visited"
                            value={pct(coveredNodes, flat.nodes.length)}
                            hint={`${coveredNodes} of ${flat.nodes.length}`}
                            onClick={() => onGoToStage("journeys")}
                        />
                        <Stat
                            label="problems"
                            value={`${errors} / ${warnings}`}
                            hint="errors / warnings"
                        />
                    </div>
                </section>

                <div className="studio-stage-grid">
                    <section className="studio-glass studio-card">
                        <header className="studio-card-head">
                            <div>
                                <p className="studio-eyebrow">Problems</p>
                                <p className="studio-card-title">Protocol and journeys</p>
                            </div>
                        </header>
                        <div className="studio-card-body studio-card-body-tall mx-3 mb-3">
                            <ProblemsPanel problems={problems} onReveal={onReveal} />
                        </div>
                    </section>

                    <section className="studio-glass studio-card">
                        <header className="studio-card-head">
                            <div>
                                <p className="studio-eyebrow">Export</p>
                                <p className="studio-card-title">What leaves Studio</p>
                            </div>
                        </header>
                        <div className="flex flex-col gap-3 px-4 pb-4">
                            <div className="studio-export-row">
                                <div className="min-w-0 flex-1">
                                    <p className="studio-mono text-[12.5px]">config.json</p>
                                    <p className="studio-text-dim text-[11.5px]">
                                        The v2 config as today: meta, helpers. The graph and
                                        journeys join it once the schema lands in the lib.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="studio-key studio-key-sm"
                                    onClick={onDownloadConfig}
                                >
                                    <ArrowDownTrayIcon />
                                    Download
                                </button>
                            </div>
                            <div className="studio-export-row">
                                <div className="min-w-0 flex-1">
                                    <p className="studio-mono text-[12.5px]">journeys.json</p>
                                    <p className="studio-text-dim text-[11.5px]">
                                        The protocol graph and every journey, as Studio holds them
                                        in memory — for review, not yet a deployable format.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="studio-key studio-key-sm"
                                    onClick={onDownloadJourneys}
                                >
                                    <ArrowDownTrayIcon />
                                    Download
                                </button>
                            </div>
                            <p className="studio-text-faint text-[11.5px]">
                                Compiled flows, deployment YAML and promotion to a live session
                                arrive with the graph executor.
                            </p>
                        </div>
                    </section>
                </div>

                <section className="studio-glass studio-card">
                    <header className="studio-card-head">
                        <div>
                            <p className="studio-eyebrow">Coverage</p>
                            <p className="studio-card-title">Which journeys visit which nodes</p>
                        </div>
                        <button
                            type="button"
                            className="studio-key studio-key-sm"
                            onClick={() => onGoToStage("journeys")}
                        >
                            <ArrowTopRightOnSquareIcon />
                            Journeys
                        </button>
                    </header>
                    {journeys.length === 0 || flat.nodes.length === 0 ? (
                        <p className="studio-text-dim px-4 pb-4 text-[12px]">
                            {flat.nodes.length === 0
                                ? "Add nodes on the Protocol stage first."
                                : "No journeys yet — derive them on the Journeys stage to see coverage."}
                        </p>
                    ) : (
                        <div className="studio-matrix-wrap mx-4 mb-4">
                            <table className="studio-matrix">
                                <thead>
                                    <tr>
                                        <th className="studio-matrix-node">node</th>
                                        {journeys.map((journey) => (
                                            <th key={journey.id} title={journey.title}>
                                                <span>{journey.title || journey.id}</span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupsInOrder.map((groupId) => {
                                        const rows = flat.nodes.filter(
                                            (node) => flat.groupOf.get(node.id) === groupId
                                        );
                                        if (rows.length === 0) return null;
                                        return [
                                            groupId ? (
                                                <tr
                                                    key={`g-${groupId}`}
                                                    className="studio-matrix-group"
                                                >
                                                    <td colSpan={journeys.length + 1}>
                                                        {groupName(groupId)}
                                                    </td>
                                                </tr>
                                            ) : null,
                                            ...rows.map((node) => (
                                                <tr
                                                    key={node.id}
                                                    data-unvisited={
                                                        coverage.byNode.has(node.id)
                                                            ? undefined
                                                            : true
                                                    }
                                                >
                                                    <td className="studio-matrix-node studio-mono">
                                                        {node.id}
                                                    </td>
                                                    {journeys.map((journey) => (
                                                        <td
                                                            key={journey.id}
                                                            className="studio-matrix-cell"
                                                        >
                                                            {coverage.byNode
                                                                .get(node.id)
                                                                ?.includes(journey.id) ? (
                                                                <span className="studio-matrix-dot" />
                                                            ) : null}
                                                        </td>
                                                    ))}
                                                </tr>
                                            )),
                                        ];
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {coverage.uncovered.length > 0 ? (
                        <div className="px-4 pb-4">
                            <p className="studio-eyebrow mb-1">Alternatives no journey takes</p>
                            <ul className="studio-facts">
                                {coverage.uncovered.map(({ fork, option }) => (
                                    <li key={option.edge.id}>
                                        <span
                                            className="studio-types-dot"
                                            data-status="unavailable"
                                            aria-hidden="true"
                                        />
                                        <span className="studio-mono">{fork.nodeId}</span> →{" "}
                                        {option.label}
                                        <span className="studio-text-faint">
                                            {" "}
                                            ({option.target.id})
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </section>
            </main>
        </div>
    );
};

export default ReviewStage;
