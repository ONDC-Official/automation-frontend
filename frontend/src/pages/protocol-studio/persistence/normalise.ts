import type { StudioGraph, StudioJourney } from "@pages/protocol-studio/ui/editor/types";

/** A node as an older Studio may have written it: today's fields, plus the retired ones. */
type LegacyNode = Record<string, unknown> & {
    kind?: unknown;
    api?: unknown;
    switch?: unknown;
    decision?: unknown;
    group?: { graph?: unknown } & Record<string, unknown>;
};

const normaliseNode = (raw: LegacyNode): LegacyNode => {
    // Retired 2026-10-27: free JSON nothing ever read.
    const { guard: _guard, effects: _effects, switch: legacySwitch, ...node } = raw;
    // Renamed 2026-10-27: a `switch` node is a `decision` node.
    if (node.kind === "switch") node.kind = "decision";
    if (node.api === "switch") node.api = "decision";
    if (legacySwitch !== undefined && node.decision === undefined) node.decision = legacySwitch;
    if (node.group && typeof node.group === "object") {
        node.group = { ...node.group, graph: normaliseStudioGraph(node.group.graph) };
    }
    return node;
};

/**
 * A graph written by any Studio version, in today's shape: `switch` nodes
 * become `decision` nodes and the retired `guard` / `effects` fields are
 * dropped, at every group level. Pure; a graph already current comes back
 * equal. Applied wherever a graph comes in from outside the running editor
 * (the persisted draft, a pasted fragment).
 */
export function normaliseStudioGraph(graph: unknown): StudioGraph {
    const g = (graph ?? {}) as { nodes?: unknown; edges?: unknown };
    const nodes = Array.isArray(g.nodes) ? (g.nodes as LegacyNode[]) : [];
    const edges = Array.isArray(g.edges) ? g.edges : [];
    return { nodes: nodes.map(normaliseNode), edges } as unknown as StudioGraph;
}

/** Journeys in today's shape: a decision's fork key ends `:decision`, not `:switch`. */
export const normaliseStudioJourneys = (journeys: unknown): StudioJourney[] =>
    (Array.isArray(journeys) ? (journeys as StudioJourney[]) : []).map((journey) => ({
        ...journey,
        choices: Object.fromEntries(
            Object.entries(journey.choices ?? {}).map(([key, value]) => [
                key.replace(/:switch$/, ":decision"),
                value,
            ])
        ),
    }));
