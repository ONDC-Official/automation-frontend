import { createGroupNode, NO_FILES } from "@pages/protocol-studio/ui/editor/graph/catalog";
import {
    copyFragment,
    instantiateFragment,
    parseFragment,
    serializeFragment,
} from "@pages/protocol-studio/ui/editor/graph/clipboard";
import { getAllNodeIds } from "@pages/protocol-studio/ui/editor/graph/flatten";
import {
    GROUP_IN,
    GROUP_OUT,
    type NodeKind,
    type StudioEdge,
    type StudioGraph,
    type StudioNode,
} from "@pages/protocol-studio/ui/editor/types";

const node = (
    id: string,
    kind: NodeKind = "request",
    extra: Partial<StudioNode> = {}
): StudioNode => ({
    id,
    api: id,
    owner: kind === "request" ? "BAP" : "BPP",
    kind,
    responseFor: null,
    description: "",
    files: NO_FILES,
    position: { x: 0, y: 0 },
    ...extra,
});

let n = 0;
const edge = (from: string, to: string, extra: Partial<StudioEdge> = {}): StudioEdge => ({
    id: `e${++n}`,
    from,
    to,
    kind: "next",
    mandated: true,
    ...extra,
});

/** search → on_search → select → on_select, with on_* answering their requests. */
const graph: StudioGraph = {
    nodes: [
        node("search", "request", { position: { x: 100, y: 50 } }),
        node("on_search", "callback", { responseFor: "search", position: { x: 400, y: 120 } }),
        node("select", "request", { position: { x: 700, y: 50 } }),
        node("on_select", "callback", { responseFor: "select", position: { x: 1000, y: 120 } }),
    ],
    edges: [
        edge("search", "on_search", { kind: "response" }),
        edge("on_search", "select"),
        edge("select", "on_select", { kind: "response" }),
    ],
};

const wires = (g: StudioGraph) => g.edges.map((e) => `${e.from}>${e.to}`).sort();

describe("graph clipboard", () => {
    it("copies the selected nodes and only the wires between them", () => {
        const copied = copyFragment(graph, ["on_search", "select"]);
        expect(copied.nodes.map((x) => x.id)).toEqual(["on_search", "select"]);
        expect(wires(copied)).toEqual(["on_search>select"]);
        // A deep copy: editing it leaves the graph alone.
        copied.nodes[0].position.x = -1;
        expect(graph.nodes[1].position.x).toBe(400);
    });

    it("renames pasted nodes, rewires them, and gives every wire a fresh id", () => {
        const copied = copyFragment(graph, ["search", "on_search"]);
        const { fragment, ids } = instantiateFragment(copied, graph, { offset: { x: 32, y: 32 } });
        expect(ids).toEqual(["search_2", "on_search_2"]);
        expect(wires(fragment)).toEqual(["search_2>on_search_2"]);
        expect(fragment.edges[0].kind).toBe("response");
        expect(graph.edges.map((e) => e.id)).not.toContain(fragment.edges[0].id);
        // responseFor follows a copied target.
        expect(fragment.nodes[1].responseFor).toBe("search_2");
        expect(fragment.nodes[0].position).toEqual({ x: 132, y: 82 });
    });

    it("numbers a copy of a copy on from the base id", () => {
        const level: StudioGraph = { nodes: [node("search"), node("search_2")], edges: [] };
        const { ids } = instantiateFragment(copyFragment(level, ["search_2"]), level, {
            offset: { x: 0, y: 0 },
        });
        expect(ids).toEqual(["search_3"]);
    });

    it("keeps a pointer to a node left behind, and drops one to a node that is not there", () => {
        const copied = copyFragment(graph, ["on_select"]);
        expect(
            instantiateFragment(copied, graph, { offset: { x: 0, y: 0 } }).fragment.nodes[0]
                .responseFor
        ).toBe("select");
        const elsewhere: StudioGraph = { nodes: [], edges: [] };
        const pasted = instantiateFragment(copied, elsewhere, { offset: { x: 0, y: 0 } });
        // Pasted where its original id is free, it keeps it.
        expect(pasted.ids).toEqual(["on_select"]);
        expect(pasted.fragment.nodes[0].responseFor).toBeNull();
    });

    it("rewrites repeat.resetOn like responseFor", () => {
        const level: StudioGraph = {
            nodes: [
                node("status"),
                node("on_status", "callback", { repeat: { max: 3, resetOn: "status" } }),
            ],
            edges: [],
        };
        const both = instantiateFragment(copyFragment(level, ["status", "on_status"]), level, {
            offset: { x: 0, y: 0 },
        });
        expect(both.fragment.nodes[1].repeat).toEqual({ max: 3, resetOn: "status_2" });
        const alone = instantiateFragment(
            copyFragment(level, ["on_status"]),
            { nodes: [], edges: [] },
            {
                offset: { x: 0, y: 0 },
            }
        );
        expect(alone.fragment.nodes[0].repeat).toEqual({ max: 3 });
    });

    it("places the fragment's top-left corner at a point", () => {
        const copied = copyFragment(graph, ["on_search", "select"]);
        const { fragment } = instantiateFragment(copied, graph, { at: { x: 0, y: 0 } });
        expect(fragment.nodes.map((x) => x.position)).toEqual([
            { x: 0, y: 70 },
            { x: 300, y: 0 },
        ]);
    });

    it("copies a group whole, with inner ids unique across the tree and its pins kept", () => {
        const inner: StudioGraph = {
            nodes: [node("cancel"), node("on_cancel", "callback", { responseFor: "cancel" })],
            edges: [
                edge(GROUP_IN, "cancel"),
                edge("cancel", "on_cancel"),
                edge("on_cancel", GROUP_OUT),
            ],
        };
        const root: StudioGraph = {
            nodes: [
                node("confirm"),
                createGroupNode("cancellation", { x: 300, y: 0 }, "Cancellation", "d", inner),
            ],
            edges: [edge("confirm", "cancellation")],
        };
        const { fragment, ids } = instantiateFragment(copyFragment(root, ["cancellation"]), root, {
            offset: { x: 32, y: 32 },
        });
        expect(ids).toEqual(["cancellation_2"]);
        const group = fragment.nodes[0].group;
        expect(group?.graph.nodes.map((x) => x.id)).toEqual(["cancel_2", "on_cancel_2"]);
        expect(wires(group!.graph)).toEqual(
            [`${GROUP_IN}>cancel_2`, "cancel_2>on_cancel_2", `on_cancel_2>${GROUP_OUT}`].sort()
        );
        expect(group?.graph.nodes[1].responseFor).toBe("cancel_2");
        // Inner positions stay relative to the group.
        expect(group?.graph.nodes[0].position).toEqual({ x: 0, y: 0 });

        const merged: StudioGraph = {
            nodes: [...root.nodes, ...fragment.nodes],
            edges: root.edges,
        };
        expect(getAllNodeIds(merged).size).toBe(7);
    });

    it("round-trips through clipboard text and ignores anything else", () => {
        const copied = copyFragment(graph, ["search", "on_search"]);
        expect(parseFragment(serializeFragment(copied))).toEqual(copied);
        expect(parseFragment("search")).toBeNull();
        expect(parseFragment('{"nodes":[],"edges":[]}')).toBeNull();
        expect(
            parseFragment(
                '{"format":"ondc-studio/graph-fragment","version":99,"nodes":[],"edges":[]}'
            )
        ).toBeNull();
        expect(
            parseFragment(
                '{"format":"ondc-studio/graph-fragment","version":1,"nodes":[{"id":1}],"edges":[]}'
            )
        ).toBeNull();
    });
});
