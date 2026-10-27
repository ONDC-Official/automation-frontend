import { act, renderHook } from "@testing-library/react";

import { useStudioGraph } from "@pages/protocol-studio/hooks/use-studio-graph";
import { NO_FILES } from "@pages/protocol-studio/ui/editor/graph/catalog";
import { getAllNodeIds } from "@pages/protocol-studio/ui/editor/graph/flatten";
import {
    GROUP_IN,
    GROUP_OUT,
    type NodeKind,
    type StudioEdge,
    type StudioNode,
} from "@pages/protocol-studio/ui/editor/types";

const node = (id: string, kind: NodeKind = "request", x = 0): StudioNode => ({
    id,
    api: id,
    owner: kind === "request" ? "BAP" : "BPP",
    kind,
    responseFor: null,
    description: "",
    files: NO_FILES,
    position: { x, y: 0 },
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

/** on_confirm → cancel → on_cancel → on_update, with on_confirm also → status (an alternative). */
const seed = () => {
    const { result } = renderHook(() => useStudioGraph());
    act(() =>
        result.current.actions.addFragment({
            nodes: [
                node("on_confirm", "callback", 0),
                node("cancel", "request", 300),
                node("on_cancel", "callback", 600),
                node("on_update", "unsolicited", 900),
                node("status", "request", 300),
            ],
            edges: [
                edge("on_confirm", "cancel", { label: "buyer cancels" }),
                edge("cancel", "on_cancel", { kind: "response" }),
                edge("on_cancel", "on_update"),
                edge("on_confirm", "status", { label: "asks for status" }),
            ],
        })
    );
    return result;
};

describe("useStudioGraph groups", () => {
    it("groups nodes, re-pointing crossing wires at the group and its boundary pins", () => {
        const result = seed();
        let id: string | null = null;
        act(() => {
            id = result.current.actions.groupNodes(
                ["cancel", "on_cancel"],
                "Cancellation",
                "Buyer cancels the order"
            );
        });
        expect(id).toBe("cancellation");
        const level = result.current.graph;
        expect(level.nodes.map((n) => n.id).sort()).toEqual([
            "cancellation",
            "on_confirm",
            "on_update",
            "status",
        ]);
        const group = level.nodes.find((n) => n.id === "cancellation")?.group;
        expect(group?.name).toBe("Cancellation");
        expect(group?.graph.nodes.map((n) => n.id)).toEqual(["cancel", "on_cancel"]);
        // Inside: Entry → cancel, cancel → on_cancel, on_cancel → Exit.
        expect(group?.graph.edges.map((e) => `${e.from}>${e.to}`).sort()).toEqual(
            [`${GROUP_IN}>cancel`, "cancel>on_cancel", `on_cancel>${GROUP_OUT}`].sort()
        );
        // Outside: on_confirm → group keeps its label; group → on_update.
        const outer = level.edges.map((e) => `${e.from}>${e.to}`).sort();
        expect(outer).toEqual(
            ["cancellation>on_update", "on_confirm>cancellation", "on_confirm>status"].sort()
        );
        expect(level.edges.find((e) => e.to === "cancellation")?.label).toBe("buyer cancels");
        // Flat view is unchanged in substance.
        expect(result.current.flat.edges.map((e) => `${e.from}>${e.to}`).sort()).toEqual(
            [
                "cancel>on_cancel",
                "on_cancel>on_update",
                "on_confirm>cancel",
                "on_confirm>status",
            ].sort()
        );
        expect(result.current.flat.groupOf.get("cancel")).toBe("cancellation");
    });

    it("keeps ids unique across levels and ungroups back to the same flat wiring", () => {
        const result = seed();
        act(() => {
            result.current.actions.groupNodes(["cancel", "on_cancel"], "Cancellation", "d");
        });
        expect(getAllNodeIds(result.current.root).size).toBe(6);
        // A rename into a name used inside the group is refused.
        let error: string | null = null;
        act(() => {
            error = result.current.actions.renameNode("status", "cancel");
        });
        expect(error).toMatch(/already on the graph/);

        const before = result.current.flat.edges.map((e) => `${e.from}>${e.to}`).sort();
        act(() => result.current.actions.ungroup("cancellation"));
        expect(result.current.graph.nodes.map((n) => n.id).sort()).toEqual(
            ["cancel", "on_cancel", "on_confirm", "on_update", "status"].sort()
        );
        expect(result.current.graph.edges.map((e) => `${e.from}>${e.to}`).sort()).toEqual(before);
        expect(result.current.graph.edges.find((e) => e.to === "cancel")?.label).toBe(
            "buyer cancels"
        );
    });

    it("enters and leaves a group, editing the level shown", () => {
        const result = seed();
        act(() => {
            result.current.actions.groupNodes(["cancel", "on_cancel"], "Cancellation", "d");
        });
        act(() => result.current.actions.enterGroup("cancellation"));
        expect(result.current.path).toEqual(["cancellation"]);
        expect(result.current.levels.map((l) => l.label)).toEqual(["Protocol", "Cancellation"]);
        expect(result.current.graph.nodes.map((n) => n.id)).toEqual(["cancel", "on_cancel"]);

        // Wiring from the Entry inside the group.
        act(() => {
            result.current.actions.addFragment({
                nodes: [node("on_cancel_2", "callback")],
                edges: [],
            });
        });
        act(() => {
            result.current.actions.connect("cancel", "on_cancel_2");
        });
        expect(result.current.graph.edges.filter((e) => e.from === "cancel")).toHaveLength(2);

        act(() => result.current.actions.exitToLevel(0));
        expect(result.current.path).toEqual([]);
        expect(result.current.graph.nodes.some((n) => n.id === "cancellation")).toBe(true);

        // Deleting the group while inside it falls back to the top level.
        act(() => result.current.actions.enterGroup("cancellation"));
        act(() => result.current.actions.exitToLevel(0));
        act(() => result.current.actions.removeNode("cancellation"));
        expect(result.current.graph.nodes.map((n) => n.id).sort()).toEqual([
            "on_confirm",
            "on_update",
            "status",
        ]);
    });
});
