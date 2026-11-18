import type { GraphSelection, StudioGraph } from "@pages/protocol-studio/ui/editor/types";

/** The node ids a selection holds: none, one, or several. */
export const getSelectedNodeIds = (selection: GraphSelection): string[] =>
    selection?.type === "node" ? [selection.id] : selection?.type === "nodes" ? selection.ids : [];

/** A selection of `ids`: nothing, one node, or several. */
export const selectNodeIds = (ids: readonly string[]): GraphSelection => {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return null;
    if (unique.length === 1) return { type: "node", id: unique[0] };
    return { type: "nodes", ids: unique };
};

/**
 * What of `selection` is still on `level`: a node or edge that was deleted,
 * renamed away or is on another level is no longer selected. Unchanged
 * selections come back as the same object, so memoised views stay put.
 */
export const getLiveSelection = (selection: GraphSelection, level: StudioGraph): GraphSelection => {
    if (!selection) return null;
    if (selection.type === "edge") {
        return level.edges.some((e) => e.id === selection.id) ? selection : null;
    }
    const ids = getSelectedNodeIds(selection);
    const live = ids.filter((id) => level.nodes.some((n) => n.id === id));
    return live.length === ids.length ? selection : selectNodeIds(live);
};
