import {
    GROUP_IN,
    GROUP_OUT,
    type FlatGraph,
    type StudioEdge,
    type StudioGraph,
    type StudioGroup,
    type StudioNode,
    type UnresolvedWire,
} from "@pages/protocol-studio/ui/editor/types";

/** Whether an id names a group's boundary pin rather than a node. */
export const isBoundary = (id: string) => id === GROUP_IN || id === GROUP_OUT;

/** The graph `path` (group ids, top down) leads to; null if a step is not a group there. */
export const getGraphAt = (root: StudioGraph, path: readonly string[]): StudioGraph | null => {
    let graph = root;
    for (const id of path) {
        const group = graph.nodes.find((node) => node.id === id)?.group;
        if (!group) return null;
        graph = group.graph;
    }
    return graph;
};

/** `root` with the graph at `path` replaced by `fn` of it; unchanged if the path is broken. */
export const updateGraphAt = (
    root: StudioGraph,
    path: readonly string[],
    fn: (graph: StudioGraph) => StudioGraph
): StudioGraph => {
    if (path.length === 0) return fn(root);
    const [head, ...rest] = path;
    let found = false;
    const nodes = root.nodes.map((node) => {
        if (node.id !== head || !node.group) return node;
        found = true;
        return {
            ...node,
            group: { ...node.group, graph: updateGraphAt(node.group.graph, rest, fn) },
        };
    });
    return found ? { ...root, nodes } : root;
};

/** Every level, top down: the graph and the group it belongs to (undefined at the top). */
export const forEachLevel = (
    root: StudioGraph,
    fn: (graph: StudioGraph, groupId: string | undefined, path: string[]) => void,
    path: string[] = [],
    groupId?: string
) => {
    fn(root, groupId, path);
    for (const node of root.nodes) {
        if (node.group) forEachLevel(node.group.graph, fn, [...path, node.id], node.id);
    }
};

/** `fn` applied to every level's graph, top down. */
export const mapAllLevels = (
    root: StudioGraph,
    fn: (graph: StudioGraph) => StudioGraph
): StudioGraph => {
    const next = fn(root);
    return {
        ...next,
        nodes: next.nodes.map((node) =>
            node.group
                ? { ...node, group: { ...node.group, graph: mapAllLevels(node.group.graph, fn) } }
                : node
        ),
    };
};

/** Every node id at every level, group nodes included. */
export const getAllNodeIds = (root: StudioGraph): Set<string> => {
    const ids = new Set<string>();
    forEachLevel(root, (graph) => {
        for (const node of graph.nodes) ids.add(node.id);
    });
    return ids;
};

/** The node with this id, at whatever level, with the path to its level. */
export const findNode = (
    root: StudioGraph,
    nodeId: string
): { node: StudioNode; path: string[] } | null => {
    let found: { node: StudioNode; path: string[] } | null = null;
    forEachLevel(root, (graph, _groupId, path) => {
        if (found) return;
        const node = graph.nodes.find((n) => n.id === nodeId);
        if (node) found = { node, path };
    });
    return found;
};

/** The wire with this id, at whatever level, with the path to its level. */
export const findEdge = (
    root: StudioGraph,
    edgeId: string
): { edge: StudioEdge; path: string[] } | null => {
    let found: { edge: StudioEdge; path: string[] } | null = null;
    forEachLevel(root, (graph, _groupId, path) => {
        if (found) return;
        const edge = graph.edges.find((e) => e.id === edgeId);
        if (edge) found = { edge, path };
    });
    return found;
};

const sameNodeStructure = (a: StudioNode, b: StudioNode): boolean => {
    if (a === b) return true;
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof StudioNode>;
    for (const key of keys) {
        if (key === "position" || a[key] === b[key]) continue;
        if (key !== "group" || !a.group || !b.group) return false;
        const groupKeys = new Set([...Object.keys(a.group), ...Object.keys(b.group)]) as Set<
            keyof StudioGroup
        >;
        for (const groupKey of groupKeys) {
            if (groupKey === "graph") {
                if (!sameStructure(a.group.graph, b.group.graph)) return false;
            } else if (a.group[groupKey] !== b.group[groupKey]) return false;
        }
    }
    return true;
};

/**
 * Whether two graphs differ at most in where nodes sit, at every level:
 * the same nodes (all but `position` the same values), in the same order,
 * and the same wires. Shallow, by reference below that, which is what an
 * edit that only moves nodes leaves. What lets a drag skip everything
 * derived from the graph's structure.
 */
export const sameStructure = (a: StudioGraph, b: StudioGraph): boolean =>
    a === b ||
    (a.nodes.length === b.nodes.length &&
        a.edges.length === b.edges.length &&
        a.edges.every((edge, i) => edge === b.edges[i]) &&
        a.nodes.every((node, i) => sameNodeStructure(node, b.nodes[i])));

/** A working wire while boundaries are being resolved: a real end, a group node, or a group's boundary pin. */
type End = { node: string } | { group: string } | { boundaryIn: string } | { boundaryOut: string };

interface Work {
    edge: StudioEdge;
    from: End;
    to: End;
    /** The drawn wires this one joins, in order; one for a drawn wire. */
    raw: string[];
}

/** The first raw wire id that appears twice, if any. */
const getRepeat = (raw: readonly string[]) => {
    const seen = new Set<string>();
    for (const id of raw) {
        if (seen.has(id)) return id;
        seen.add(id);
    }
    return undefined;
};

/**
 * The protocol flattened: every API / decision node at every level, and every
 * wire with group boundaries resolved. An outer `a → G` joined with an inner
 * `$in → b` becomes `a → b`; an inner `c → $out` joined with an outer `G → d`
 * becomes `c → d`. Composite ids are `outer>inner` so they stay stable.
 * Group nodes themselves are not in `nodes`; `groupOf` says where a node sits.
 *
 * Resolution is a worklist: wires into a group are joined first, then wires
 * out of one, each with the group's `$in` / `$out` wires (indexed per group),
 * in the order they were drawn or joined. A join that would repeat a drawn
 * wire is a loop through pass-through groups; it is dropped and listed in
 * `unresolved`, so the walk always ends however the groups are wired.
 */
export const flattenGraph = (root: StudioGraph): FlatGraph => {
    const nodes: StudioNode[] = [];
    const groupOf = new Map<string, string>();
    const groups = new Set<string>();

    // Every working wire in the order it was drawn or joined; resolved ones
    // are marked rather than spliced out, so the order survives.
    const work: Work[] = [];
    const resolved = new Set<Work>();
    const joined = new Set<string>();
    const intoGroup: Work[] = [];
    const fromGroup: Work[] = [];
    const fromEntry = new Map<string, Work[]>();
    const intoExit = new Map<string, Work[]>();
    const unresolved = new Map<string, UnresolvedWire>();

    const index = (map: Map<string, Work[]>, group: string, w: Work) => {
        const list = map.get(group);
        if (list) list.push(w);
        else map.set(group, [w]);
    };
    const push = (w: Work) => {
        work.push(w);
        joined.add(w.edge.id);
        if ("group" in w.to) intoGroup.push(w);
        if ("group" in w.from) fromGroup.push(w);
        if ("boundaryIn" in w.from) index(fromEntry, w.from.boundaryIn, w);
        if ("boundaryOut" in w.to) index(intoExit, w.to.boundaryOut, w);
    };

    forEachLevel(root, (graph, groupId) => {
        for (const node of graph.nodes) {
            if (groupId) groupOf.set(node.id, groupId);
            if (node.group) groups.add(node.id);
            else nodes.push(node);
        }
        for (const edge of graph.edges) {
            const end = (id: string): End => {
                if (id === GROUP_IN) return { boundaryIn: groupId ?? "" };
                if (id === GROUP_OUT) return { boundaryOut: groupId ?? "" };
                if (groups.has(id) || graph.nodes.some((n) => n.id === id && n.group)) {
                    return { group: id };
                }
                return { node: id };
            };
            push({ edge, from: end(edge.from), to: end(edge.to), raw: [edge.id] });
        }
    });

    const join = (outer: Work, inner: Work, from: End, to: End, outerFirst: boolean) => {
        const [a, b] = outerFirst ? [outer, inner] : [inner, outer];
        const id = `${a.edge.id}>${b.edge.id}`;
        const raw = [...a.raw, ...b.raw];
        const repeat = getRepeat(raw);
        if (repeat !== undefined) {
            if (!unresolved.has(repeat)) unresolved.set(repeat, { edgeId: repeat, joined: id });
            return;
        }
        if (joined.has(id)) return;
        push({
            edge: {
                id,
                from: "node" in from ? from.node : a.edge.from,
                to: "node" in to ? to.node : b.edge.to,
                kind: outer.edge.kind,
                ...(a.edge.case !== undefined ? { case: a.edge.case } : {}),
                ...((a.edge.label ?? b.edge.label) ? { label: a.edge.label ?? b.edge.label } : {}),
                mandated: a.edge.mandated && b.edge.mandated,
            },
            from,
            to,
            raw,
        });
    };

    // The earliest unresolved wire in a queue; queues only grow at the end.
    const next = (queue: Work[], cursor: { at: number }) => {
        while (cursor.at < queue.length && resolved.has(queue[cursor.at])) cursor.at += 1;
        return queue[cursor.at];
    };
    const intoCursor = { at: 0 };
    const fromCursor = { at: 0 };
    // A group's open `$in` / `$out` wires, never the wire being resolved itself.
    const partners = (byGroup: Map<string, Work[]>, group: string, self: Work) =>
        (byGroup.get(group) ?? []).filter((w) => w !== self && !resolved.has(w));

    for (;;) {
        const into = next(intoGroup, intoCursor);
        if (into) {
            const group = (into.to as { group: string }).group;
            const inner = partners(fromEntry, group, into);
            resolved.add(into);
            for (const w of inner) join(into, w, into.from, w.to, true);
            continue;
        }
        const outOf = next(fromGroup, fromCursor);
        if (!outOf) break;
        const group = (outOf.from as { group: string }).group;
        const inner = partners(intoExit, group, outOf);
        resolved.add(outOf);
        for (const w of inner) join(outOf, w, w.from, outOf.to, false);
    }

    const byId = new Map(nodes.map((node) => [node.id, node]));
    const edges: StudioEdge[] = [];
    const seen = new Set<string>();
    for (const w of work) {
        if (resolved.has(w) || !("node" in w.from) || !("node" in w.to)) continue;
        if (!byId.has(w.from.node) || !byId.has(w.to.node) || seen.has(w.edge.id)) continue;
        seen.add(w.edge.id);
        edges.push(w.edge);
    }

    const out = new Map<string, StudioEdge[]>();
    const into = new Map<string, StudioEdge[]>();
    for (const node of nodes) {
        out.set(node.id, []);
        into.set(node.id, []);
    }
    for (const edge of edges) {
        out.get(edge.from)?.push(edge);
        into.get(edge.to)?.push(edge);
    }

    return {
        nodes,
        edges,
        byId,
        out,
        into,
        groupOf,
        ...(unresolved.size > 0 ? { unresolved: [...unresolved.values()] } : {}),
    };
};

/**
 * Whether a main-path wire leads into `node` on one level of the graph, as
 * `hasMainWireInto` counts it; a wire from a group's Entry pin counts, since
 * something outside leads in. What the editor checks before marking Start.
 */
export const hasMainWireIntoLevel = (graph: StudioGraph, node: StudioNode) =>
    node.kind !== "on_demand" &&
    graph.edges.some(
        (edge) =>
            edge.to === node.id &&
            edge.kind !== "on_demand" &&
            graph.nodes.find((n) => n.id === edge.from)?.kind !== "on_demand"
    );

/**
 * Whether a main-path wire leads into `node`, counted as the executor counts
 * it: on-demand wires, and wires into or out of on-demand nodes, don't.
 */
export const hasMainWireInto = (flat: FlatGraph, node: StudioNode) =>
    node.kind !== "on_demand" &&
    (flat.into.get(node.id) ?? []).some((edge) => {
        const from = flat.byId.get(edge.from);
        return edge.kind !== "on_demand" && !!from && from.kind !== "on_demand";
    });

/**
 * Where a run can start (never an on-demand node): the nodes marked Start
 * when any is, else every node no main-path wire leads into. The lib's
 * `getEntryNodesV2` follows the same rule.
 */
export const getEntryNodes = (flat: FlatGraph) => {
    const candidates = flat.nodes.filter((node) => node.kind !== "on_demand");
    const marked = candidates.filter((node) => node.start);
    return marked.length > 0 ? marked : candidates.filter((node) => !hasMainWireInto(flat, node));
};
