import { useCallback, useMemo, useRef, useState } from "react";

import {
    inferEdgeKind,
    isUnpairedCallbackOf,
    makeEdgeId,
    NODE_ID_PATTERN,
} from "@pages/protocol-studio/ui/editor/graph/catalog";
import {
    getDecideTemplate,
    getFreeCase,
    syncDecideSignature,
} from "@pages/protocol-studio/ui/editor/graph/decision";
import type {
    StudioEdge,
    StudioGraph,
    StudioGraphActions,
    StudioNode,
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

/**
 * The protocol graph: nodes and the edges between them. React state only —
 * the v2 config schema has no graph yet, so nothing here is saved and a
 * refresh drops it (see TODO(persistence)).
 */
export const useStudioGraph = () => {
    const [graph, setGraph] = useState<StudioGraph>({ nodes: [], edges: [] });
    // Read by edits that must answer synchronously (rename, connect).
    const graphRef = useRef(graph);
    graphRef.current = graph;

    const update = useCallback((recipe: (prev: StudioGraph) => StudioGraph) => {
        setGraph((prev) => {
            const next = recipe(prev);
            graphRef.current = next;
            return next;
        });
    }, []);

    const actions = useMemo<StudioGraphActions>(() => {
        const mapNode = (nodeId: string, fn: (node: StudioNode) => StudioNode) =>
            update((prev) => ({
                ...prev,
                nodes: prev.nodes.map((node) => (node.id === nodeId ? fn(node) : node)),
            }));

        return {
            addFragment: (fragment) =>
                update((prev) => ({
                    nodes: [...prev.nodes, ...fragment.nodes],
                    edges: [...prev.edges, ...fragment.edges],
                })),

            updateNode: (nodeId, patch) => mapNode(nodeId, (node) => ({ ...node, ...patch })),

            updateNodeFile: (nodeId, file, value) =>
                mapNode(nodeId, (node) => ({ ...node, files: { ...node.files, [file]: value } })),

            renameNode: (nodeId, nextId) => {
                const id = nextId.trim();
                if (id === nodeId) return null;
                if (id === "") return "An id is required";
                if (!NODE_ID_PATTERN.test(id)) return "Use letters, digits and _ . # - only";
                if (graphRef.current.nodes.some((node) => node.id === id)) {
                    return `"${id}" is already on the graph`;
                }
                update((prev) => ({
                    nodes: prev.nodes.map((node) =>
                        repointNode(node.id === nodeId ? { ...node, id } : node, nodeId, id)
                    ),
                    edges: prev.edges.map((edge) => ({
                        ...edge,
                        from: edge.from === nodeId ? id : edge.from,
                        to: edge.to === nodeId ? id : edge.to,
                    })),
                }));
                return null;
            },

            moveNodes: (positions) =>
                update((prev) => ({
                    ...prev,
                    nodes: prev.nodes.map((node) => {
                        const position = positions.get(node.id);
                        return position ? { ...node, position } : node;
                    }),
                })),

            removeNode: (nodeId) =>
                update((prev) => ({
                    nodes: prev.nodes
                        .filter((node) => node.id !== nodeId)
                        .map((node) => repointNode(node, nodeId, null)),
                    edges: prev.edges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId),
                })),

            connect: (from, to, kind, branchCase) => {
                const { nodes, edges } = graphRef.current;
                const source = nodes.find((node) => node.id === from);
                const target = nodes.find((node) => node.id === to);
                if (!source || !target || from === to) return null;
                // A decision's pin holds one wire: wiring it again replaces that wire.
                if (source.decision) {
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
                    update((prev) => ({
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
                    kind: kind ?? inferEdgeKind(source, target),
                    mandated: true,
                };
                // Wiring `select` into a lone `on_select` makes it select's response.
                const answers = isUnpairedCallbackOf(source, target);
                update((prev) => ({
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
                update((prev) => {
                    const node = prev.nodes.find((n) => n.id === nodeId);
                    if (!node?.decision) return prev;
                    const { decide, ...before } = node.decision;
                    const after = { ...before, ...patch };
                    if (after.cases.length === 0) return prev;
                    // An untouched template is regenerated (its body depends on
                    // the mode); edited code keeps its body, under a new signature.
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
                }),

            updateEdge: (edgeId, patch) =>
                update((prev) => ({
                    ...prev,
                    edges: prev.edges.map((edge) =>
                        edge.id === edgeId ? { ...edge, ...patch } : edge
                    ),
                })),

            removeEdge: (edgeId) =>
                update((prev) => ({
                    ...prev,
                    edges: prev.edges.filter((edge) => edge.id !== edgeId),
                })),

            disconnectNode: (nodeId) =>
                update((prev) => ({
                    ...prev,
                    edges: prev.edges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId),
                })),
        };
    }, [update]);

    return { graph, graphRef, actions };
};

export default useStudioGraph;
