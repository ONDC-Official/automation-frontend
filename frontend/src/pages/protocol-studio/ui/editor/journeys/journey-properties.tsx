import { TrashIcon } from "@heroicons/react/24/outline";

import type { StudioJourneyActions } from "@pages/protocol-studio/hooks/use-studio-journeys";
import {
    canFinishAt,
    walkJourney,
    type WalkResult,
} from "@pages/protocol-studio/ui/editor/journeys/derive";
import {
    CheckField,
    PropSection,
    SelectField,
    splitList,
    TextField,
} from "@pages/protocol-studio/ui/editor/inspector/property-fields";
import type {
    FlatGraph,
    Fork,
    StudioJourney,
    StudioNode,
} from "@pages/protocol-studio/ui/editor/types";

export interface IJourneyInspectorProps {
    isHidden?: boolean;
    resizeHandleProps: React.HTMLAttributes<HTMLDivElement>;
    /** The journey shown; null in the interactive mode or with nothing selected. */
    journey: StudioJourney | null;
    openMode: boolean;
    flat: FlatGraph;
    forks: Fork[];
    walk: WalkResult | null;
    /** Nodes a journey can start at. */
    entries: StudioNode[];
    actions: StudioJourneyActions;
}

const NONE = "";

const chooserLabel = (fork: Fork) =>
    fork.chooser === "protocol"
        ? "protocol"
        : fork.chooser === "mixed"
          ? "BAP or BPP"
          : fork.chooser;

/**
 * The Journeys stage's right card: the journey's own fields, then a table of
 * every fork the protocol has — who chooses at run time, what this journey
 * chose (or expects, for a decision) — then the on-demand nodes it allows.
 */
export const JourneyInspectorCard = ({
    isHidden,
    resizeHandleProps,
    journey,
    openMode,
    flat,
    forks,
    walk,
    entries,
    actions,
}: IJourneyInspectorProps) => {
    const onPath = new Set(walk?.nodeIds ?? []);
    const onDemandNodes = flat.nodes.filter((node) => node.kind === "on_demand");
    const optionalNodes = flat.nodes.filter((node) => node.optional && node.kind !== "on_demand");

    let body;
    if (openMode) {
        body = (
            <div className="bp-props">
                <PropSection title="Interactive · open mode">
                    <p className="bp-props-note" style={{ gridColumn: "span 2" }}>
                        A run mode, not a preset. The mock follows the protocol; wherever it permits
                        more than one thing and the mock owns the next step, the UI asks the tester
                        which way to go. Where the counterparty owns the alternatives, the mock
                        simply waits for whichever arrives. Decisions decide from state on their
                        own.
                    </p>
                </PropSection>
                <PropSection title={`Forks the tester may be asked about · ${forks.length}`}>
                    <div className="studio-forks" style={{ gridColumn: "span 2" }}>
                        {forks.map((fork) => (
                            <div key={fork.key} className="studio-fork-row">
                                <span className="studio-mono">{fork.nodeId}</span>
                                <span className="studio-text-dim">
                                    {fork.kind === "decision"
                                        ? "decision · decides itself"
                                        : `${chooserLabel(fork)} chooses`}
                                </span>
                                <span className="studio-text-faint">
                                    {fork.options.map((o) => o.label).join(" / ")}
                                </span>
                            </div>
                        ))}
                        {forks.length === 0 ? (
                            <p className="bp-props-note">No forks on the protocol.</p>
                        ) : null}
                    </div>
                </PropSection>
            </div>
        );
    } else if (!journey) {
        body = (
            <p className="bp-props-empty">
                Pick a journey on the left, start a new one, or derive them from the protocol.
            </p>
        );
    } else {
        const update = (patch: Parameters<StudioJourneyActions["update"]>[1]) =>
            actions.update(journey.id, patch);
        // Where it may finish: the End nodes (and dead ends) on its path, walked to the end.
        const fullPath = walkJourney(flat, { ...journey, exit: undefined }).nodeIds;
        const finishes = [...new Set(fullPath)]
            .map((id) => flat.byId.get(id))
            .filter((node): node is StudioNode => !!node && canFinishAt(flat, node));
        body = (
            <div className="bp-props">
                <PropSection title="Journey">
                    <TextField
                        label="title"
                        value={journey.title}
                        wide
                        onChange={(title) => update({ title })}
                    />
                    <TextField label="id" value={journey.id} mono onChange={() => {}} />
                    <SelectField
                        label="entry"
                        hint="Where the run starts"
                        value={journey.entry}
                        options={[
                            ...(entries.some((n) => n.id === journey.entry)
                                ? []
                                : [
                                      {
                                          value: journey.entry,
                                          label: `${journey.entry} (not an entry)`,
                                      },
                                  ]),
                            ...entries.map((n) => ({ value: n.id, label: n.id })),
                        ]}
                        onChange={(entry) => update({ entry })}
                    />
                    <SelectField
                        label="finish at"
                        hint="An End node on its path; the run stops there"
                        value={journey.exit ?? NONE}
                        options={[
                            { value: NONE, label: "— run to the end —" },
                            ...(journey.exit === undefined ||
                            finishes.some((n) => n.id === journey.exit)
                                ? []
                                : [
                                      {
                                          value: journey.exit,
                                          label: `${journey.exit} (not an End on its path)`,
                                      },
                                  ]),
                            ...finishes.map((n) => ({
                                value: n.id,
                                label: n.end ? n.id : `${n.id} (the path ends)`,
                            })),
                        ]}
                        onChange={(exit) => update({ exit: exit === NONE ? undefined : exit })}
                    />
                    <TextField
                        label="description"
                        value={journey.description}
                        multiline
                        onChange={(description) => update({ description })}
                    />
                    <TextField
                        label="tags"
                        hint="Comma-separated, e.g. MANDATORY, NEGATIVE"
                        value={journey.tags.join(", ")}
                        placeholder="none"
                        onCommit={(text) => {
                            update({ tags: splitList(text) });
                            return null;
                        }}
                    />
                    <TextField
                        label="usecase"
                        value={journey.usecase ?? ""}
                        placeholder="any"
                        onChange={(usecase) => update({ usecase: usecase || undefined })}
                    />
                </PropSection>

                <PropSection title={`Forks · ${forks.length}`}>
                    <div className="studio-forks" style={{ gridColumn: "span 2" }}>
                        {forks.length === 0 ? (
                            <p className="bp-props-note">
                                The protocol has no forks: this journey is its only path.
                            </p>
                        ) : null}
                        {forks.map((fork) => {
                            const isDecision = fork.kind === "decision";
                            const value = isDecision
                                ? (journey.expects[fork.nodeId] ?? NONE)
                                : (journey.choices[fork.key] ?? NONE);
                            const reached = onPath.has(fork.nodeId);
                            return (
                                <div
                                    key={fork.key}
                                    className="studio-fork-row"
                                    data-off={reached ? undefined : true}
                                >
                                    <span
                                        className="studio-mono"
                                        title={
                                            reached
                                                ? "On this journey's path"
                                                : "Not reached by this journey"
                                        }
                                    >
                                        {fork.nodeId}
                                    </span>
                                    <span className="studio-text-dim">
                                        {isDecision
                                            ? "protocol decides · expected"
                                            : `${chooserLabel(fork)} chooses`}
                                    </span>
                                    <select
                                        className="bp-input"
                                        value={value}
                                        aria-label={`${fork.nodeId}: ${isDecision ? "expected case" : "chosen alternative"}`}
                                        onChange={(e) => {
                                            const next = e.target.value;
                                            if (next === NONE) actions.clear(journey.id, fork.key);
                                            else if (isDecision)
                                                actions.expect(journey.id, fork.nodeId, next);
                                            else actions.choose(journey.id, fork.key, next);
                                        }}
                                    >
                                        <option value={NONE}>
                                            {isDecision ? "— at run time —" : "— open —"}
                                        </option>
                                        {fork.options.map((option) => (
                                            <option
                                                key={option.edge.id}
                                                value={
                                                    isDecision
                                                        ? (option.edge.case ?? "")
                                                        : option.target.id
                                                }
                                            >
                                                {option.label} → {option.target.id}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            );
                        })}
                    </div>
                </PropSection>

                <PropSection title="Optional steps">
                    <div style={{ gridColumn: "span 2" }}>
                        {optionalNodes.length === 0 ? (
                            <p className="bp-props-note">
                                No optional nodes on the protocol. Mark a node optional in the
                                Protocol stage to let a journey skip it.
                            </p>
                        ) : (
                            optionalNodes.map((node) => (
                                <CheckField
                                    key={node.id}
                                    label={`skip ${node.id}`}
                                    hint={
                                        onPath.has(node.id)
                                            ? "On this journey's path: ticked, the run passes over it"
                                            : "Not on this journey's path"
                                    }
                                    checked={(journey.skips ?? []).includes(node.id)}
                                    onChange={() => actions.toggleSkip(journey.id, node.id)}
                                />
                            ))
                        )}
                    </div>
                </PropSection>

                <PropSection title="On demand">
                    <div style={{ gridColumn: "span 2" }}>
                        {onDemandNodes.length === 0 ? (
                            <p className="bp-props-note">No on-demand nodes on the protocol.</p>
                        ) : (
                            onDemandNodes.map((node) => (
                                <CheckField
                                    key={node.id}
                                    label={node.id}
                                    hint={
                                        walk?.onDemand.some((n) => n.id === node.id)
                                            ? "reachable from this path"
                                            : "not wired from this path"
                                    }
                                    checked={journey.onDemand.includes(node.id)}
                                    onChange={() => actions.toggleOnDemand(journey.id, node.id)}
                                />
                            ))
                        )}
                    </div>
                </PropSection>

                <PropSection title="Seeds">
                    <p className="bp-props-note" style={{ gridColumn: "span 2" }}>
                        Per-node payload overlays (COD vs PREPAID on the same path) will be edited
                        here. Reserved for now.
                    </p>
                </PropSection>

                <button
                    type="button"
                    className="studio-key studio-key-sm bp-props-delete"
                    onClick={() => actions.remove(journey.id)}
                >
                    <TrashIcon />
                    Delete journey
                </button>
            </div>
        );
    }

    return (
        <section
            className="studio-glass studio-inspector flex flex-col"
            aria-label="Journey"
            inert={isHidden}
        >
            <div
                className="studio-handle studio-handle-x"
                aria-label="Resize"
                title="Drag to resize · double-click to reset"
                {...resizeHandleProps}
            />
            <header className="flex items-center gap-3 px-4 pt-3 pb-2">
                <div className="min-w-0 flex-1">
                    <p className="studio-eyebrow">Journey</p>
                    <p className="studio-text-dim truncate text-[12px]">
                        {openMode
                            ? "Interactive · asked at run time"
                            : journey
                              ? `${journey.title || journey.id} · ${walk?.nodeIds.length ?? 0} steps`
                              : "Nothing selected"}
                    </p>
                </div>
                <span className="studio-badge">draft · saved locally</span>
            </header>
            <div className="studio-well bp-props-well m-3 mt-1 min-h-0 flex-1">{body}</div>
        </section>
    );
};

export default JourneyInspectorCard;
