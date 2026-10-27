import { useCallback, useMemo, useRef, useState } from "react";

import {
    createGroupNode,
    getUniqueNodeId,
    inferEdgeKind,
    isUnpairedCallbackOf,
    makeEdgeId,
    NODE_ID_PATTERN,
    slugify,
} from "@pages/protocol-studio/ui/editor/graph/catalog";
import {
    findNode,
    flattenGraph,
    getAllNodeIds,
    getGraphAt,
    isBoundary,
    mapAllLevels,
    updateGraphAt,
} from "@pages/protocol-studio/ui/editor/graph/flatten";
import {
    getDecideTemplate,
    getFreeCase,
    syncDecideSignature,
} from "@pages/protocol-studio/ui/editor/graph/decision";
import {
    GROUP_IN,
    GROUP_OUT,
    type StudioEdge,
    type StudioGraph,
    type StudioGraphActions,
    type StudioNode,
} from "@pages/protocol-studio/ui/editor/types";

/** Points `responseFor` / `repeat.resetOn` that name `from` at `to` (null drops them). */
const repointNode = (node: StudioNode, from: string, to: string | null): StudioNode => {
    let next = node;
    if (node.responseFor === from) next = { ...next, responseFor: to };
    if (node.repeat?.resetOn === from) {
        const { resetOn: _dropped, ...repeat } = node.repeat;
        next = { ...next, repeat: to === null ? repeat : { ...repeat, resetOn: to } };
    }
    return next;
};

const repointAll = (root: StudioGraph, from: string, to: string | null) =>
    mapAllLevels(root, (graph) => ({
        ...graph,
        nodes: graph.nodes.map((node) => repointNode(node, from, to)),
    }));

/** One breadcrumb step: the top level, or a group entered. */
export interface GraphLevel {
    /** "" for the top level, else the group's id. */
    id: string;
    label: string;
}

const EMPTY: StudioGraph = { nodes: [], edges: [] };

/** The part of `path` that still leads somewhere in `root`: the deepest level that exists. */
const getLivePath = (root: StudioGraph, path: readonly string[]) => {
    const live: string[] = [];
    for (const id of path) {
        if (!getGraphAt(root, [...live, id])) break;
        live.push(id);
    }
    return live;
};

/** Undo steps kept; the oldest drop off. */
const HISTORY_LIMIT = 100;
/** Edits with the same key this close together are one undo step (a burst of typing, one drag). */
const COALESCE_MS = 1500;

interface GraphHistory {
    past: StudioGraph[];
    future: StudioGraph[];
    /** The coalescing key of the last edit, and when it landed. */
    lastKey: string | null;
    lastAt: number;
}

/** Undo / redo over the whole graph. In memory only: a reload starts with no history. */
export interface StudioGraphHistory {
    undo: () => boolean;
    redo: () => boolean;
    canUndo: boolean;
    canRedo: boolean;
}

/**
 * The protocol graph: nodes and the wires between them, with groups
 * (sub-protocols) nested inside group nodes. Editing happens one level at a
 * time: `graph` is the level the canvas shows (`path` = the groups entered,
 * top down) and every action applies there; `root` is the whole thing and
 * `flat` the whole thing with boundaries resolved. React state, seeded from
 * the local draft when there is one; the editor writes every change back to
 * the draft (see `persistence/studio-draft.ts`). The v2 config schema has no
 * graph yet.
 */
export const useStudioGraph = (initial: StudioGraph = EMPTY) => {
    const [root, setRoot] = useState<StudioGraph>(initial);
    const [path, setPath] = useState<string[]>([]);

    // A path whose group was deleted (or ungrouped) falls back to the deepest level that still exists.
    const livePath = useMemo(() => getLivePath(root, path), [root, path]);
    const graph = useMemo(() => getGraphAt(root, livePath) ?? root, [root, livePath]);
    const flat = useMemo(() => flattenGraph(root), [root]);
    const levels = useMemo<GraphLevel[]>(
        () => [
            { id: "", label: "Protocol" },
            ...livePath.map((id) => ({
                id,
                label: findNode(root, id)?.node.group?.name || id,
            })),
        ],
        [root, livePath]
    );

    // Read by edits that must answer synchronously (rename, connect).
    const rootRef = useRef(root);
    rootRef.current = root;
    const graphRef = useRef(graph);
    graphRef.current = graph;
    const pathRef = useRef(livePath);
    pathRef.current = livePath;

    const historyRef = useRef<GraphHistory>({ past: [], future: [], lastKey: null, lastAt: 0 });
    const [depth, setDepth] = useState({ past: 0, future: 0 });
    const syncDepth = useCallback(() => {
        const { past, future } = historyRef.current;
        setDepth({ past: past.length, future: future.length });
    }, []);

    /**
     * Every edit lands here and becomes an undo step. Edits passing the same
     * `coalesce` key in quick succession share one step. Computed against
     * `rootRef` (not inside a state updater) so StrictMode's double call of
     * updaters cannot record a step twice.
     */
    const updateRoot = useCallback(
        (recipe: (prev: StudioGraph) => StudioGraph, coalesce?: string) => {
            const prev = rootRef.current;
            const next = recipe(prev);
            if (next === prev) return;
            const history = historyRef.current;
            const now = Date.now();
            const merge =
                coalesce !== undefined &&
                history.lastKey === coalesce &&
                now - history.lastAt < COALESCE_MS &&
                history.past.length > 0;
            if (!merge) {
                history.past.push(prev);
                if (history.past.length > HISTORY_LIMIT) history.past.shift();
            }
            history.future = [];
            history.lastKey = coalesce ?? null;
            history.lastAt = now;
            rootRef.current = next;
            setRoot(next);
            syncDepth();
        },
        [syncDepth]
    );

    /** Edits the level the canvas shows. */
    const updateLevel = useCallback(
        (recipe: (prev: StudioGraph) => StudioGraph, coalesce?: string) =>
            updateRoot((prev) => updateGraphAt(prev, pathRef.current, recipe), coalesce),
        [updateRoot]
    );

    /** Steps `from` → `to`: the current graph goes onto `to`, the top of `from` becomes current. */
    const travel = useCallback(
        (direction: "undo" | "redo") => {
            const history = historyRef.current;
            const [from, to] =
                direction === "undo"
                    ? [history.past, history.future]
                    : [history.future, history.past];
            const next = from.pop();
            if (!next) return false;
            to.push(rootRef.current);
            history.lastKey = null;
            rootRef.current = next;
            setRoot(next);
            // A group the canvas showed may be gone: settle on the deepest level left, so a
            // later redo that brings the group back does not drop the canvas into it.
            setPath(getLivePath(next, pathRef.current));
            syncDepth();
            return true;
        },
        [syncDepth]
    );

    const history = useMemo<StudioGraphHistory>(
        () => ({
            undo: () => travel("undo"),
            redo: () => travel("redo"),
            canUndo: depth.past > 0,
            canRedo: depth.future > 0,
        }),
        [travel, depth]
    );

    const actions = useMemo<StudioGraphActions>(() => {
        const mapNode = (nodeId: string, fn: (node: StudioNode) => StudioNode, coalesce?: string) =>
            updateLevel(
                (prev) => ({
                    ...prev,
                    nodes: prev.nodes.map((node) => (node.id === nodeId ? fn(node) : node)),
                }),
                coalesce
            );

        const removeNodes = (nodeIds: readonly string[]) => {
            const gone = new Set(nodeIds);
            updateRoot((prev) =>
                nodeIds.reduce(
                    (root, nodeId) => repointAll(root, nodeId, null),
                    updateGraphAt(prev, pathRef.current, (level) => ({
                        nodes: level.nodes.filter((node) => !gone.has(node.id)),
                        edges: level.edges.filter(
                            (edge) => !gone.has(edge.from) && !gone.has(edge.to)
                        ),
                    }))
                )
            );
        };

        return {
            addFragment: (fragment) =>
                updateLevel((prev) => ({
                    nodes: [...prev.nodes, ...fragment.nodes],
                    edges: [...prev.edges, ...fragment.edges],
                })),

            updateNode: (nodeId, patch) =>
                mapNode(
                    nodeId,
                    (node) => ({ ...node, ...patch }),
                    `node:${nodeId}:${Object.keys(patch).sort().join(",")}`
                ),

            updateNodeFile: (nodeId, file, value) =>
                mapNode(
                    nodeId,
                    (node) => ({ ...node, files: { ...node.files, [file]: value } }),
                    `file:${nodeId}:${file}`
                ),

            updateNodeSaveData: (nodeId, saveData) =>
                mapNode(nodeId, (node) => ({ ...node, saveData }), `save:${nodeId}`),

            renameNode: (nodeId, nextId) => {
                const id = nextId.trim();
                if (id === nodeId) return null;
                if (id === "") return "An id is required";
                if (!NODE_ID_PATTERN.test(id)) return "Use letters, digits and _ . # - only";
                if (isBoundary(id)) return `"${id}" is reserved for a group's pins`;
                if (getAllNodeIds(rootRef.current).has(id))
                    return `"${id}" is already on the graph`;
                updateRoot((prev) =>
                    repointAll(
                        updateGraphAt(prev, pathRef.current, (level) => ({
                            nodes: level.nodes.map((node) =>
                                node.id === nodeId ? { ...node, id } : node
                            ),
                            edges: level.edges.map((edge) => ({
                                ...edge,
                                from: edge.from === nodeId ? id : edge.from,
                                to: edge.to === nodeId ? id : edge.to,
                            })),
                        })),
                        nodeId,
                        id
                    )
                );
                return null;
            },

            moveNodes: (positions, gesture) =>
                updateLevel(
                    (prev) => ({
                        ...prev,
                        nodes: prev.nodes.map((node) => {
                            const position = positions.get(node.id);
                            return position ? { ...node, position } : node;
                        }),
                    }),
                    gesture
                ),

            removeNode: (nodeId) => removeNodes([nodeId]),

            removeNodes,

            connect: (from, to, kind, branchCase) => {
                const { nodes, edges } = graphRef.current;
                const inGroup = pathRef.current.length > 0;
                const source = nodes.find((node) => node.id === from);
                const target = nodes.find((node) => node.id === to);
                const fromBoundary = inGroup && from === GROUP_IN;
                const toBoundary = inGroup && to === GROUP_OUT;
                if ((!source && !fromBoundary) || (!target && !toBoundary) || from === to) {
                    return null;
                }
                // A decision's pin holds one wire: wiring it again replaces that wire.
                if (source?.decision) {
                    const value = branchCase ?? getFreeCase(source, edges);
                    if (value === undefined) return null;
                    const edge: StudioEdge = {
                        id: makeEdgeId(),
                        from,
                        to,
                        kind: kind ?? "branch",
                        case: value,
                        mandated: true,
                    };
                    updateLevel((prev) => ({
                        ...prev,
                        edges: [
                            ...prev.edges.filter((e) => !(e.from === from && e.case === value)),
                            edge,
                        ],
                    }));
                    return edge;
                }
                if (edges.some((edge) => edge.from === from && edge.to === to)) return null;
                const edge: StudioEdge = {
                    id: makeEdgeId(),
                    from,
                    to,
                    kind: kind ?? (source && target ? inferEdgeKind(source, target) : "next"),
                    mandated: true,
                };
                // Wiring `select` into a lone `on_select` makes it select's response.
                const answers = source && target ? isUnpairedCallbackOf(source, target) : false;
                updateLevel((prev) => ({
                    nodes: answers
                        ? prev.nodes.map((node) =>
                              node.id === to ? { ...node, responseFor: from } : node
                          )
                        : prev.nodes,
                    edges: [...prev.edges, edge],
                }));
                return edge;
            },

            updateDecision: (nodeId, patch, renamed) =>
                updateLevel((prev) => {
                    const node = prev.nodes.find((n) => n.id === nodeId);
                    if (!node?.decision) return prev;
                    const { decide, ...before } = node.decision;
                    const after = { ...before, ...patch };
                    if (after.cases.length === 0) return prev;
                    // An untouched template is regenerated; edited code keeps
                    // its body, under a new return type.
                    const code =
                        decide === getDecideTemplate(before)
                            ? getDecideTemplate(after)
                            : syncDecideSignature(decide, after);
                    const live = new Set(after.cases);
                    return {
                        nodes: prev.nodes.map((n) =>
                            n.id === nodeId ? { ...n, decision: { ...after, decide: code } } : n
                        ),
                        edges: prev.edges.flatMap((edge) => {
                            if (edge.from !== nodeId || edge.case === undefined) return [edge];
                            const value =
                                renamed && edge.case === renamed[0] ? renamed[1] : edge.case;
                            return live.has(value) ? [{ ...edge, case: value }] : [];
                        }),
                    };
                }, `decision:${nodeId}`),

            updateEdge: (edgeId, patch) =>
                updateLevel(
                    (prev) => ({
                        ...prev,
                        edges: prev.edges.map((edge) =>
                            edge.id === edgeId ? { ...edge, ...patch } : edge
                        ),
                    }),
                    `edge:${edgeId}:${Object.keys(patch).sort().join(",")}`
                ),

            removeEdge: (edgeId) =>
                updateLevel((prev) => ({
                    ...prev,
                    edges: prev.edges.filter((edge) => edge.id !== edgeId),
                })),

            disconnectNode: (nodeId) =>
                updateLevel((prev) => ({
                    ...prev,
                    edges: prev.edges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId),
                })),

            groupNodes: (nodeIds, name, description) => {
                const level = graphRef.current;
                const members = new Set(
                    nodeIds.filter((id) => level.nodes.some((node) => node.id === id))
                );
                if (members.size === 0) return null;
                const id = getUniqueNodeId(slugify(name), getAllNodeIds(rootRef.current));
                const inside = level.nodes.filter((node) => members.has(node.id));
                const origin = {
                    x: Math.min(...inside.map((node) => node.position.x)),
                    y: Math.min(...inside.map((node) => node.position.y)),
                };
                const innerNodes = inside.map((node) => ({
                    ...node,
                    position: { x: node.position.x - origin.x, y: node.position.y - origin.y },
                }));
                const innerEdges: StudioEdge[] = [];
                const outerEdges: StudioEdge[] = [];
                const seenIn = new Set<string>();
                const seenOut = new Set<string>();
                for (const edge of level.edges) {
                    const fromIn = members.has(edge.from);
                    const toIn = members.has(edge.to);
                    if (fromIn && toIn) {
                        innerEdges.push(edge);
                    } else if (toIn) {
                        // Into the group: the outer wire keeps its kind, case and label; inside, Entry → node.
                        const key = `${edge.from}:${edge.case ?? ""}`;
                        if (!seenIn.has(key)) {
                            seenIn.add(key);
                            outerEdges.push({ ...edge, id: makeEdgeId(), to: id });
                        }
                        if (!innerEdges.some((e) => e.from === GROUP_IN && e.to === edge.to)) {
                            innerEdges.push({
                                id: makeEdgeId(),
                                from: GROUP_IN,
                                to: edge.to,
                                kind: "next",
                                mandated: true,
                            });
                        }
                    } else if (fromIn) {
                        // Out of the group: node → Exit inside (keeping a decision's case); outside, group → target.
                        if (!seenOut.has(edge.to)) {
                            seenOut.add(edge.to);
                            outerEdges.push({
                                id: makeEdgeId(),
                                from: id,
                                to: edge.to,
                                kind: edge.kind,
                                ...(edge.label ? { label: edge.label } : {}),
                                mandated: edge.mandated,
                            });
                        }
                        const key = `${edge.from}:${edge.case ?? ""}`;
                        if (
                            !innerEdges.some(
                                (e) => e.to === GROUP_OUT && `${e.from}:${e.case ?? ""}` === key
                            )
                        ) {
                            innerEdges.push({
                                id: makeEdgeId(),
                                from: edge.from,
                                to: GROUP_OUT,
                                kind: "next",
                                ...(edge.case !== undefined ? { case: edge.case } : {}),
                                mandated: true,
                            });
                        }
                    }
                }
                const groupNode = createGroupNode(id, origin, name, description, {
                    nodes: innerNodes,
                    edges: innerEdges,
                });
                updateLevel((prev) => ({
                    nodes: [...prev.nodes.filter((node) => !members.has(node.id)), groupNode],
                    edges: [
                        ...prev.edges.filter((e) => !members.has(e.from) && !members.has(e.to)),
                        ...outerEdges,
                    ],
                }));
                return id;
            },

            ungroup: (groupId) =>
                updateLevel((prev) => {
                    const groupNode = prev.nodes.find((node) => node.id === groupId);
                    const group = groupNode?.group;
                    if (!groupNode || !group) return prev;
                    const offset = groupNode.position;
                    const inner = group.graph;
                    const nodes = inner.nodes.map((node) => ({
                        ...node,
                        position: { x: node.position.x + offset.x, y: node.position.y + offset.y },
                    }));
                    const edges: StudioEdge[] = inner.edges.filter(
                        (e) => !isBoundary(e.from) && !isBoundary(e.to)
                    );
                    for (const outer of prev.edges) {
                        if (outer.to === groupId) {
                            for (const entry of inner.edges) {
                                if (entry.from !== GROUP_IN) continue;
                                edges.push({
                                    ...outer,
                                    id: makeEdgeId(),
                                    to: entry.to,
                                    ...((outer.label ?? entry.label)
                                        ? { label: outer.label ?? entry.label }
                                        : {}),
                                });
                            }
                        } else if (outer.from === groupId) {
                            for (const exit of inner.edges) {
                                if (exit.to !== GROUP_OUT) continue;
                                edges.push({
                                    id: makeEdgeId(),
                                    from: exit.from,
                                    to: outer.to,
                                    kind: outer.kind,
                                    ...(exit.case !== undefined ? { case: exit.case } : {}),
                                    ...((exit.label ?? outer.label)
                                        ? { label: exit.label ?? outer.label }
                                        : {}),
                                    mandated: outer.mandated && exit.mandated,
                                });
                            }
                        }
                    }
                    return {
                        nodes: [...prev.nodes.filter((node) => node.id !== groupId), ...nodes],
                        edges: [
                            ...prev.edges.filter((e) => e.from !== groupId && e.to !== groupId),
                            ...edges,
                        ],
                    };
                }),

            updateGroup: (groupId, patch) =>
                mapNode(
                    groupId,
                    (node) =>
                        node.group
                            ? {
                                  ...node,
                                  group: { ...node.group, ...patch },
                                  ...(patch.description !== undefined
                                      ? { description: patch.description }
                                      : {}),
                              }
                            : node,
                    `group:${groupId}:${Object.keys(patch).sort().join(",")}`
                ),

            enterGroup: (groupId) => {
                if (!graphRef.current.nodes.some((node) => node.id === groupId && node.group))
                    return;
                setPath([...pathRef.current, groupId]);
            },

            exitToLevel: (depth) => setPath(pathRef.current.slice(0, Math.max(0, depth))),

            openLevel: (next) => setPath(next),
        };
    }, [updateLevel, updateRoot]);

    return { root, graph, path: livePath, levels, flat, graphRef, rootRef, actions, history };
};

export default useStudioGraph;
