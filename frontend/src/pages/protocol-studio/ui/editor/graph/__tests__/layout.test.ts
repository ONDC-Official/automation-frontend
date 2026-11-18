import { createGroupNode, NO_FILES } from "@pages/protocol-studio/ui/editor/graph/catalog";
import { sameStructure } from "@pages/protocol-studio/ui/editor/graph/flatten";
import { buildGraph, reuseGraphData } from "@pages/protocol-studio/ui/editor/graph/layout";
import {
    GROUP_IN,
    type StudioGraph,
    type StudioNode,
} from "@pages/protocol-studio/ui/editor/types";

const node = (id: string, x = 0): StudioNode => ({
    id,
    api: id,
    owner: "BAP",
    kind: "request",
    responseFor: null,
    description: "",
    files: NO_FILES,
    position: { x, y: 0 },
});

const graph: StudioGraph = {
    nodes: [node("search"), node("select", 300)],
    edges: [{ id: "e1", from: "search", to: "select", kind: "next", mandated: true }],
};

const move = (g: StudioGraph, id: string, x: number): StudioGraph => ({
    ...g,
    nodes: g.nodes.map((n) => (n.id === id ? { ...n, position: { x, y: 0 } } : n)),
});

describe("reuseGraphData", () => {
    it("keeps the data of what didn't change, so memoised nodes skip rendering", () => {
        const first = buildGraph(graph, null);
        const moved = reuseGraphData(first, buildGraph(move(graph, "search", 40), null));
        const [search, select] = moved.nodes;
        // The moved node's StudioNode changed: new data. The other keeps its object.
        expect(search.data).not.toBe(first.nodes[0].data);
        expect(search.position).toEqual({ x: 40, y: 0 });
        expect(select.data).toBe(first.nodes[1].data);
        expect(moved.edges[0].data).toBe(first.edges[0].data);

        // A change to what a node shows gives it new data.
        const selected = reuseGraphData(
            moved,
            buildGraph(move(graph, "search", 40), {
                type: "node",
                id: "select",
            })
        );
        expect(selected.nodes[1].data).not.toBe(select.data);
        expect(selected.nodes[1].data.isSelected).toBe(true);
    });

    it("keeps a group's boundary pseudo-nodes while they stay put", () => {
        const inner: StudioGraph = {
            nodes: [node("cancel")],
            edges: [{ id: "e2", from: GROUP_IN, to: "cancel", kind: "next", mandated: true }],
        };
        const first = buildGraph(inner, null, { boundary: true });
        const again = reuseGraphData(first, buildGraph(inner, null, { boundary: true }));
        const entry = again.nodes.find((n) => n.id === GROUP_IN);
        expect(entry?.data).toBe(first.nodes.find((n) => n.id === GROUP_IN)?.data);
    });
});

describe("sameStructure", () => {
    it("ignores moves, at every level, and nothing else", () => {
        const group = createGroupNode("g", { x: 0, y: 0 }, "G", "d", graph);
        const root: StudioGraph = { nodes: [group], edges: [] };
        const movedInside: StudioGraph = {
            nodes: [{ ...group, group: { ...group.group!, graph: move(graph, "select", 9) } }],
            edges: [],
        };
        expect(sameStructure(root, movedInside)).toBe(true);
        expect(sameStructure(graph, move(graph, "search", 1))).toBe(true);
        expect(
            sameStructure(graph, {
                ...graph,
                nodes: [{ ...graph.nodes[0], description: "x" }, graph.nodes[1]],
            })
        ).toBe(false);
        expect(sameStructure(graph, { ...graph, edges: [] })).toBe(false);
        expect(
            sameStructure(root, {
                nodes: [{ ...group, group: { ...group.group!, name: "H" } }],
                edges: [],
            })
        ).toBe(false);
    });
});
