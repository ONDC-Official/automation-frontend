import type { XYPosition } from "@xyflow/react";

import { getUniqueNodeId, makeEdgeId } from "@pages/protocol-studio/ui/editor/graph/catalog";
import {
    forEachLevel,
    getAllNodeIds,
    isBoundary,
    mapAllLevels,
} from "@pages/protocol-studio/ui/editor/graph/flatten";
import { normaliseStudioGraph } from "@pages/protocol-studio/persistence/normalise";
import type { StudioGraph, StudioNode } from "@pages/protocol-studio/ui/editor/types";

/** Marks clipboard text as Studio nodes, so pasting anything else is left alone. */
export const FRAGMENT_FORMAT = "ondc-studio/graph-fragment";
export const FRAGMENT_VERSION = 1;

/**
 * The nodes `ids` of `level` and the wires between them, deep-copied (a
 * group brings its whole inner graph). Wires to nodes outside the selection
 * are left behind.
 */
export const copyFragment = (level: StudioGraph, ids: readonly string[]): StudioGraph => {
    const picked = new Set(ids);
    // The graph is plain JSON (the draft persists it), so a JSON round trip is a deep copy.
    return JSON.parse(
        JSON.stringify({
            nodes: level.nodes.filter((node) => picked.has(node.id)),
            edges: level.edges.filter((edge) => picked.has(edge.from) && picked.has(edge.to)),
        })
    ) as StudioGraph;
};

export const serializeFragment = (fragment: StudioGraph) =>
    JSON.stringify({ format: FRAGMENT_FORMAT, version: FRAGMENT_VERSION, ...fragment });

const isNodeLike = (value: unknown): value is StudioNode => {
    if (typeof value !== "object" || value === null) return false;
    const node = value as Partial<StudioNode>;
    return (
        typeof node.id === "string" &&
        typeof node.api === "string" &&
        typeof node.position?.x === "number" &&
        typeof node.position?.y === "number"
    );
};

/** Clipboard text back into a fragment; null for anything Studio did not copy. */
export const parseFragment = (text: string): StudioGraph | null => {
    if (!text.includes(FRAGMENT_FORMAT)) return null;
    let data: unknown;
    try {
        data = JSON.parse(text);
    } catch {
        return null;
    }
    if (typeof data !== "object" || data === null) return null;
    const { format, version, nodes, edges } = data as Record<string, unknown>;
    if (format !== FRAGMENT_FORMAT || version !== FRAGMENT_VERSION) return null;
    if (!Array.isArray(nodes) || !Array.isArray(edges) || nodes.length === 0) return null;
    if (!nodes.every(isNodeLike)) return null;
    // A fragment copied in a tab still running an older Studio.
    return normaliseStudioGraph({ nodes, edges });
};

/** Where a pasted fragment goes: its top-left corner at `at`, or moved by `offset`. */
export type FragmentPlacement = { at: XYPosition } | { offset: XYPosition };

/**
 * A copied fragment made ready to add to `root`. Node ids at every level are
 * made unique across the whole tree (`search` → `search_2` while `search`
 * exists), and every wire gets a fresh id; wires and `responseFor` /
 * `repeat.resetOn` follow the renames. A pointer to a node that was not
 * copied is kept when that node is on the graph, dropped when it is not (a
 * paste from another tab). Group pins (`$in` / `$out`) stay as they are.
 * `ids` are the new top-level node ids, to select after pasting.
 */
export const instantiateFragment = (
    fragment: StudioGraph,
    root: StudioGraph,
    placement: FragmentPlacement
): { fragment: StudioGraph; ids: string[] } => {
    const existing = getAllNodeIds(root);
    const used = new Set(existing);
    const idOf = new Map<string, string>();
    forEachLevel(fragment, (level) => {
        for (const node of level.nodes) {
            // A copy of `search_2` is `search_3`, not `search_2_2`.
            const id = used.has(node.id)
                ? getUniqueNodeId(node.id.replace(/_\d+$/, "") || node.id, used)
                : node.id;
            used.add(id);
            idOf.set(node.id, id);
        }
    });

    const pointTo = (ref: string) => idOf.get(ref) ?? (existing.has(ref) ? ref : null);
    const repoint = (node: StudioNode): StudioNode => {
        let next: StudioNode = {
            ...node,
            id: idOf.get(node.id) ?? node.id,
            responseFor: node.responseFor ? pointTo(node.responseFor) : null,
        };
        const resetOn = node.repeat?.resetOn;
        if (node.repeat && resetOn !== undefined) {
            const target = pointTo(resetOn);
            const { resetOn: _dropped, ...repeat } = node.repeat;
            next = { ...next, repeat: target === null ? repeat : { ...repeat, resetOn: target } };
        }
        return next;
    };
    const endpoint = (id: string) => (isBoundary(id) ? id : (idOf.get(id) ?? id));

    const renamed = mapAllLevels(fragment, (level) => ({
        nodes: level.nodes.map(repoint),
        edges: level.edges.map((edge) => ({
            ...edge,
            id: makeEdgeId(),
            from: endpoint(edge.from),
            to: endpoint(edge.to),
        })),
    }));

    // Only the top level moves: positions inside a group are relative to it.
    const shift =
        "offset" in placement
            ? placement.offset
            : {
                  x: placement.at.x - Math.min(...renamed.nodes.map((node) => node.position.x)),
                  y: placement.at.y - Math.min(...renamed.nodes.map((node) => node.position.y)),
              };
    const nodes = renamed.nodes.map((node) => ({
        ...node,
        position: { x: node.position.x + shift.x, y: node.position.y + shift.y },
    }));

    return { fragment: { nodes, edges: renamed.edges }, ids: nodes.map((node) => node.id) };
};
