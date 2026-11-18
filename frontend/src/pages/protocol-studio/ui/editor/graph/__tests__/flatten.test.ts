import { createGroupNode, NO_FILES } from "@pages/protocol-studio/ui/editor/graph/catalog";
import { flattenGraph } from "@pages/protocol-studio/ui/editor/graph/flatten";
import { lintProtocol } from "@pages/protocol-studio/ui/editor/graph/lint";
import {
    GROUP_IN,
    GROUP_OUT,
    type StudioEdge,
    type StudioGraph,
    type StudioNode,
} from "@pages/protocol-studio/ui/editor/types";

const node = (id: string): StudioNode => ({
    id,
    api: id,
    owner: "BAP",
    kind: "request",
    responseFor: null,
    description: "",
    files: NO_FILES,
    position: { x: 0, y: 0 },
});

const edge = (id: string, from: string, to: string): StudioEdge => ({
    id,
    from,
    to,
    kind: "next",
    mandated: true,
});

const group = (id: string, graph: StudioGraph) =>
    createGroupNode(id, { x: 0, y: 0 }, id, `group ${id}`, graph);

const pairs = (graph: StudioGraph) =>
    flattenGraph(graph).edges.map((e) => [e.from, e.to] as [string, string]);

describe("flattenGraph", () => {
    it("joins a wire into a group with its Entry wires, and out of it with its Exit wires", () => {
        const graph: StudioGraph = {
            nodes: [
                node("a"),
                group("g", {
                    nodes: [node("x")],
                    edges: [edge("in", GROUP_IN, "x"), edge("out", "x", GROUP_OUT)],
                }),
                node("b"),
            ],
            edges: [edge("ag", "a", "g"), edge("gb", "g", "b")],
        };
        const flat = flattenGraph(graph);
        expect(flat.edges.map((e) => [e.id, e.from, e.to])).toEqual([
            ["ag>in", "a", "x"],
            ["out>gb", "x", "b"],
        ]);
        expect(flat.groupOf.get("x")).toBe("g");
        expect(flat.unresolved).toBeUndefined();
    });

    it("loses no wire across 60 chained groups", () => {
        const COUNT = 60;
        const nodes: StudioNode[] = [node("start")];
        const edges: StudioEdge[] = [edge("sg1", "start", "g1")];
        for (let i = 1; i <= COUNT; i += 1) {
            nodes.push(
                group(`g${i}`, {
                    nodes: [node(`x${i}`)],
                    edges: [edge(`in${i}`, GROUP_IN, `x${i}`), edge(`out${i}`, `x${i}`, GROUP_OUT)],
                })
            );
            edges.push(
                i < COUNT
                    ? edge(`g${i}g${i + 1}`, `g${i}`, `g${i + 1}`)
                    : edge(`g${i}end`, `g${i}`, "end")
            );
        }
        nodes.push(node("end"));
        const result = pairs({ nodes, edges });

        const expected: [string, string][] = [["start", "x1"]];
        for (let i = 1; i < COUNT; i += 1) expected.push([`x${i}`, `x${i + 1}`]);
        expected.push([`x${COUNT}`, "end"]);
        expect(result).toHaveLength(COUNT + 1);
        expect(result).toEqual(expect.arrayContaining(expected));
    });

    it("resolves groups nested inside groups", () => {
        const inner = group("h", {
            nodes: [node("c")],
            edges: [edge("h-in", GROUP_IN, "c"), edge("h-out", "c", GROUP_OUT)],
        });
        const graph: StudioGraph = {
            nodes: [
                node("a"),
                group("g", {
                    nodes: [inner],
                    edges: [edge("g-in", GROUP_IN, "h"), edge("g-out", "h", GROUP_OUT)],
                }),
                node("b"),
            ],
            edges: [edge("ag", "a", "g"), edge("gb", "g", "b")],
        };
        const flat = flattenGraph(graph);
        expect(flat.edges.map((e) => [e.id, e.from, e.to])).toEqual([
            ["ag>g-in>h-in", "a", "c"],
            ["h-out>g-out>gb", "c", "b"],
        ]);
        expect(flat.groupOf.get("c")).toBe("h");
        expect(flat.groupOf.get("h")).toBe("g");
        expect(flat.unresolved).toBeUndefined();
    });

    it("keeps a loop over a real node", () => {
        const graph: StudioGraph = {
            nodes: [
                node("a"),
                group("g", {
                    nodes: [node("x")],
                    edges: [edge("in", GROUP_IN, "x"), edge("out", "x", GROUP_OUT)],
                }),
            ],
            edges: [edge("ag", "a", "g"), edge("ga", "g", "a")],
        };
        const flat = flattenGraph(graph);
        expect(flat.edges.map((e) => [e.from, e.to])).toEqual([
            ["a", "x"],
            ["x", "a"],
        ]);
        expect(flat.unresolved).toBeUndefined();
    });

    it("stops on a group wired to itself through a pass-through", () => {
        const graph: StudioGraph = {
            nodes: [group("g", { nodes: [], edges: [edge("pass", GROUP_IN, GROUP_OUT)] })],
            edges: [edge("gg", "g", "g")],
        };
        const flat = flattenGraph(graph);
        expect(flat.edges).toEqual([]);
        expect(flat.unresolved?.map((wire) => wire.edgeId)).toEqual(["pass"]);
    });

    it("surfaces a pass-through cycle between groups as a lint error on a wire", () => {
        const pass = (id: string) =>
            group(id, { nodes: [], edges: [edge(`${id}-pass`, GROUP_IN, GROUP_OUT)] });
        const graph: StudioGraph = {
            nodes: [node("a"), pass("g"), pass("h"), node("b")],
            edges: [
                edge("ag", "a", "g"),
                edge("gh", "g", "h"),
                edge("hg", "h", "g"),
                edge("hb", "h", "b"),
            ],
        };
        const flat = flattenGraph(graph);
        // The way through still resolves: a → g → h → b.
        expect(flat.edges.map((e) => [e.from, e.to])).toContainEqual(["a", "b"]);
        expect(flat.unresolved?.length).toBeGreaterThan(0);

        const errors = lintProtocol(graph, flat).filter((p) => p.level === "error");
        expect(errors.length).toBe(flat.unresolved?.length);
        const raw = new Set(graph.edges.map((e) => e.id).concat("g-pass", "h-pass"));
        for (const problem of errors) {
            expect(problem.edgeId).toBeDefined();
            expect(raw.has(problem.edgeId as string)).toBe(true);
            expect(problem.message).toMatch(/loops back to itself/);
        }
    });
});
