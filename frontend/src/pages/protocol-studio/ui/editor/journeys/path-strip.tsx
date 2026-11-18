import { ArrowLongRightIcon, XMarkIcon } from "@heroicons/react/24/outline";

import { NODE_KINDS } from "@pages/protocol-studio/ui/editor/graph/catalog";
import type { WalkEnd } from "@pages/protocol-studio/ui/editor/journeys/derive";
import type { Fork, ForkOption, JourneyStep } from "@pages/protocol-studio/ui/editor/types";

export interface IPathStripProps {
    title: string;
    subtitle?: string;
    steps: JourneyStep[];
    end: WalkEnd;
    selectedNodeId: string | null;
    onSelectNode: (nodeId: string) => void;
    onChoose: (fork: Fork, option: ForkOption) => void;
    onClear: (fork: Fork) => void;
    /** Interactive mode: forks are not resolved here, they are asked at run time. */
    openMode?: boolean;
    /** Every fork on the protocol, for the open mode's read-out. */
    forks?: Fork[];
}

const chooserText = (fork: Fork) =>
    fork.chooser === "protocol"
        ? "the protocol decides from state"
        : fork.chooser === "mixed"
          ? "either side may act next"
          : `${fork.chooser} chooses`;

const endText: Record<WalkEnd, string> = {
    end: "ends here",
    fork: "pick an option to continue",
    cycle: "loops — stops at the repeat cap",
    limit: "too long to preview",
    "no-entry": "entry not on the protocol",
};

/**
 * The journey as a strip across the top of the canvas: a chip per node, a
 * fork card wherever the protocol forks, the chosen option marked and an
 * open fork pulsing with its options as buttons. Clicking a chip selects the
 * node on the dimmed canvas below.
 */
export const PathStrip = ({
    title,
    subtitle,
    steps,
    end,
    selectedNodeId,
    onSelectNode,
    onChoose,
    onClear,
    openMode,
    forks = [],
}: IPathStripProps) => (
    <section className="studio-glass studio-path" aria-label="Journey path">
        <header className="studio-path-head">
            <div className="min-w-0 flex-1">
                <p className="studio-eyebrow">{openMode ? "Interactive · open mode" : "Journey"}</p>
                <p className="studio-path-title" title={subtitle}>
                    {title}
                    {subtitle ? <span className="studio-text-dim"> · {subtitle}</span> : null}
                </p>
            </div>
            {!openMode ? (
                <span className="studio-badge" data-end={end}>
                    {endText[end]}
                </span>
            ) : null}
        </header>

        {openMode ? (
            <div className="studio-path-row">
                {forks.length === 0 ? (
                    <p className="studio-text-faint text-[12px]">
                        The protocol has no forks: an interactive run and a preset are the same.
                    </p>
                ) : (
                    forks.map((fork) => (
                        <div key={fork.key} className="studio-fork-card" data-open>
                            <button
                                type="button"
                                className="studio-fork-node"
                                onClick={() => onSelectNode(fork.nodeId)}
                            >
                                {fork.nodeId}
                            </button>
                            <p className="studio-fork-chooser">
                                {fork.kind === "decision"
                                    ? "decision · decides itself"
                                    : `prompted at run time · ${chooserText(fork)}`}
                            </p>
                            <div className="studio-fork-options">
                                {fork.options.map((option) => (
                                    <span
                                        key={option.edge.id}
                                        className="studio-fork-option"
                                        data-static
                                    >
                                        {option.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        ) : (
            <ol className="studio-path-row">
                {steps.map((step, index) => {
                    if (step.type === "node") {
                        const { Icon } = NODE_KINDS[step.node.kind];
                        return (
                            <li key={`n-${index}`} className="studio-path-item">
                                {index > 0 ? (
                                    <ArrowLongRightIcon
                                        className="studio-path-arrow"
                                        aria-hidden="true"
                                    />
                                ) : null}
                                <button
                                    type="button"
                                    className="studio-path-chip"
                                    data-kind={step.node.kind}
                                    data-selected={selectedNodeId === step.node.id || undefined}
                                    data-skipped={step.skipped || undefined}
                                    onClick={() => onSelectNode(step.node.id)}
                                    title={`${step.node.id} · ${step.node.owner}${step.via?.label ? ` · via “${step.via.label}”` : ""}${step.skipped ? " · skipped by this journey (optional)" : step.node.optional ? " · optional" : ""}${step.repeats ? " · repeats until exit() holds" : ""}`}
                                >
                                    <Icon />
                                    <span className="studio-mono">{step.node.api}</span>
                                    {step.node.id !== step.node.api ? (
                                        <span className="studio-path-chip-id">{step.node.id}</span>
                                    ) : null}
                                    {step.repeats ? (
                                        <span className="studio-path-chip-id" aria-label="repeats">
                                            ↻
                                        </span>
                                    ) : null}
                                    {step.node.end ? (
                                        <span className="studio-path-chip-id">end</span>
                                    ) : null}
                                </button>
                            </li>
                        );
                    }
                    const { fork, chosen } = step;
                    return (
                        <li key={`f-${index}`} className="studio-path-item">
                            <ArrowLongRightIcon className="studio-path-arrow" aria-hidden="true" />
                            <div
                                className="studio-fork-card"
                                data-pending={chosen ? undefined : true}
                                data-kind={fork.kind}
                            >
                                <p className="studio-fork-chooser">
                                    {fork.kind === "decision" ? "decision" : "⑂ alternatives"} ·{" "}
                                    {chooserText(fork)}
                                </p>
                                <div className="studio-fork-options">
                                    {fork.options.map((option) => {
                                        const isChosen = chosen?.edge.id === option.edge.id;
                                        return (
                                            <button
                                                key={option.edge.id}
                                                type="button"
                                                className="studio-fork-option"
                                                data-chosen={isChosen || undefined}
                                                onClick={() => onChoose(fork, option)}
                                                title={`${fork.nodeId} → ${option.target.id}`}
                                            >
                                                {option.label}
                                            </button>
                                        );
                                    })}
                                    {chosen ? (
                                        <button
                                            type="button"
                                            className="studio-key studio-key-xs studio-key-icon"
                                            onClick={() => onClear(fork)}
                                            aria-label="Reopen this fork"
                                            title="Reopen this fork"
                                        >
                                            <XMarkIcon />
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ol>
        )}
    </section>
);

export default PathStrip;
