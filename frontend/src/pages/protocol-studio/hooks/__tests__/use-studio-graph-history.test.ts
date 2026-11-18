import { act, renderHook } from "@testing-library/react";

import { useStudioGraph } from "@pages/protocol-studio/hooks/use-studio-graph";
import { useStudioJourneys } from "@pages/protocol-studio/hooks/use-studio-journeys";
import { createJourney } from "@pages/protocol-studio/ui/editor/journeys/derive";
import { NO_FILES } from "@pages/protocol-studio/ui/editor/graph/catalog";
import type { NodeKind, StudioEdge, StudioNode } from "@pages/protocol-studio/ui/editor/types";

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
const edge = (from: string, to: string): StudioEdge => ({
    id: `e${++n}`,
    from,
    to,
    kind: "next",
    mandated: true,
});

/** search → on_search → select, as one undo step. */
const seed = () => {
    const { result } = renderHook(() => useStudioGraph());
    act(() =>
        result.current.actions.addFragment({
            nodes: [
                node("search"),
                node("on_search", "callback", 300),
                node("select", "request", 600),
            ],
            edges: [edge("search", "on_search"), edge("on_search", "select")],
        })
    );
    return result;
};

const ids = (result: ReturnType<typeof seed>) => result.current.graph.nodes.map((x) => x.id);

describe("useStudioGraph history", () => {
    let now = 0;
    beforeEach(() => {
        now = 1_000_000;
        jest.spyOn(Date, "now").mockImplementation(() => now);
    });
    afterEach(() => jest.restoreAllMocks());

    it("starts empty, and undoes / redoes an edit", () => {
        const { result } = renderHook(() => useStudioGraph());
        expect(result.current.history.canUndo).toBe(false);
        expect(result.current.history.canRedo).toBe(false);
        act(() => result.current.actions.addFragment({ nodes: [node("search")], edges: [] }));
        expect(result.current.history.canUndo).toBe(true);

        let done = false;
        act(() => {
            done = result.current.history.undo();
        });
        expect(done).toBe(true);
        expect(result.current.graph.nodes).toHaveLength(0);
        expect(result.current.history.canRedo).toBe(true);

        act(() => {
            result.current.history.redo();
        });
        expect(result.current.graph.nodes.map((x) => x.id)).toEqual(["search"]);
        expect(result.current.history.canRedo).toBe(false);
    });

    it("undoes removes, connects, renames and groups, one step each", () => {
        const result = seed();
        act(() => result.current.actions.removeNode("select"));
        expect(ids(result)).toEqual(["search", "on_search"]);
        act(() => {
            result.current.history.undo();
        });
        expect(ids(result)).toEqual(["search", "on_search", "select"]);
        expect(result.current.graph.edges).toHaveLength(2);

        act(() => {
            result.current.actions.connect("search", "select");
        });
        expect(result.current.graph.edges).toHaveLength(3);
        act(() => {
            result.current.history.undo();
        });
        expect(result.current.graph.edges).toHaveLength(2);

        act(() => {
            result.current.actions.renameNode("select", "select_1");
        });
        expect(ids(result)).toContain("select_1");
        act(() => {
            result.current.history.undo();
        });
        expect(ids(result)).toContain("select");
        expect(result.current.graph.edges.some((e) => e.to === "select")).toBe(true);

        act(() => {
            result.current.actions.groupNodes(["on_search", "select"], "Discovery", "d");
        });
        expect(ids(result)).toEqual(["search", "discovery"]);
        act(() => {
            result.current.history.undo();
        });
        expect(ids(result)).toEqual(["search", "on_search", "select"]);
    });

    it("replays a rename's journey renames: back on undo, forward on redo", () => {
        const onRenames = jest.fn();
        const { result } = renderHook(() => useStudioGraph(undefined, { onRenames }));
        act(() =>
            result.current.actions.addFragment({
                nodes: [node("search"), node("select", "request", 300)],
                edges: [edge("search", "select")],
            })
        );
        act(() => {
            result.current.actions.renameNode("select", "select_1");
        });
        // The edit itself reports nothing: whoever made it applies its renames.
        expect(onRenames).not.toHaveBeenCalled();

        act(() => {
            result.current.history.undo();
        });
        expect(onRenames).toHaveBeenLastCalledWith([
            { type: "node", from: "select_1", to: "select" },
        ]);
        act(() => {
            result.current.history.redo();
        });
        expect(onRenames).toHaveBeenLastCalledWith([
            { type: "node", from: "select", to: "select_1" },
        ]);
        expect(result.current.graph.nodes.map((x) => x.id)).toEqual(["search", "select_1"]);

        // Steps without renames replay none.
        onRenames.mockClear();
        act(() => result.current.actions.addFragment({ nodes: [node("init")], edges: [] }));
        act(() => {
            result.current.history.undo();
        });
        expect(onRenames).not.toHaveBeenCalled();
    });

    it("keeps journeys on a renamed node through undo and redo, wired as the editor wires them", () => {
        const { result } = renderHook(() => {
            const journeys = useStudioJourneys([
                createJourney("happy", "Happy", "search", { choices: { search: "select" } }),
            ]);
            const graph = useStudioGraph(
                {
                    nodes: [node("search"), node("select", "request", 300)],
                    edges: [edge("search", "select")],
                },
                { onRenames: journeys.actions.applyRenames }
            );
            return { journeys, graph };
        });
        const happy = () => result.current.journeys.journeys[0];
        act(() => {
            if (result.current.graph.actions.renameNode("select", "pick") === null) {
                result.current.journeys.actions.applyRenames([
                    { type: "node", from: "select", to: "pick" },
                ]);
            }
        });
        expect(happy().choices).toEqual({ search: "pick" });
        act(() => {
            result.current.graph.history.undo();
        });
        expect(happy().choices).toEqual({ search: "select" });
        act(() => {
            result.current.graph.history.redo();
        });
        expect(happy().choices).toEqual({ search: "pick" });
    });

    it("keeps a burst of case renames on one step and undoes them last first", () => {
        const onRenames = jest.fn();
        const { result } = renderHook(() => useStudioGraph(undefined, { onRenames }));
        act(() =>
            result.current.actions.addFragment({
                nodes: [
                    {
                        ...node("pay", "decision"),
                        decision: { cases: ["a", "b"], decide: "" },
                    },
                ],
                edges: [],
            })
        );
        for (const [from, to] of [
            ["a", "ab"],
            ["ab", "abc"],
        ]) {
            now += 200;
            act(() =>
                result.current.actions.updateDecision("pay", { cases: [to, "b"] }, [from, to])
            );
        }
        act(() => {
            result.current.history.undo();
        });
        expect(result.current.graph.nodes[0].decision?.cases).toEqual(["a", "b"]);
        expect(onRenames).toHaveBeenLastCalledWith([
            { type: "case", nodeId: "pay", from: "abc", to: "ab" },
            { type: "case", nodeId: "pay", from: "ab", to: "a" },
        ]);
    });

    it("removes several nodes as one step", () => {
        const result = seed();
        act(() => result.current.actions.removeNodes(["on_search", "select"]));
        expect(ids(result)).toEqual(["search"]);
        expect(result.current.graph.edges).toHaveLength(0);
        act(() => {
            result.current.history.undo();
        });
        expect(ids(result)).toEqual(["search", "on_search", "select"]);
        expect(result.current.graph.edges).toHaveLength(2);
    });

    it("coalesces a burst of typing in one file into one step", () => {
        const result = seed();
        for (const text of ["a", "ab", "abc"]) {
            now += 200;
            act(() => result.current.actions.updateNodeFile("search", "generate", text));
        }
        // A pause long enough starts a new step.
        now += 5_000;
        act(() => result.current.actions.updateNodeFile("search", "generate", "abcd"));

        act(() => {
            result.current.history.undo();
        });
        expect(result.current.graph.nodes[0].files.generate).toBe("abc");
        act(() => {
            result.current.history.undo();
        });
        expect(result.current.graph.nodes[0].files.generate).toBe(NO_FILES.generate);
    });

    it("keeps typing in different files apart", () => {
        const result = seed();
        act(() => result.current.actions.updateNodeFile("search", "generate", "g"));
        act(() => result.current.actions.updateNodeFile("search", "validate", "v"));
        act(() => {
            result.current.history.undo();
        });
        expect(result.current.graph.nodes[0].files.generate).toBe("g");
        expect(result.current.graph.nodes[0].files.validate).toBe(NO_FILES.validate);
    });

    it("makes one drag one step, and a tidy-up another", () => {
        const result = seed();
        for (let x = 10; x <= 50; x += 10) {
            now += 16;
            act(() =>
                result.current.actions.moveNodes(new Map([["search", { x, y: 0 }]]), "drag:1")
            );
        }
        act(() => result.current.actions.moveNodes(new Map([["search", { x: 900, y: 0 }]])));
        expect(result.current.graph.nodes[0].position.x).toBe(900);
        act(() => {
            result.current.history.undo();
        });
        expect(result.current.graph.nodes[0].position.x).toBe(50);
        act(() => {
            result.current.history.undo();
        });
        expect(result.current.graph.nodes[0].position.x).toBe(0);
    });

    it("keeps flat (and the structure) through moves, at any level, and not through edits", () => {
        const result = seed();
        act(() => {
            result.current.actions.groupNodes(["select"], "Pick", "p");
        });
        const { flat, structure } = result.current;
        now += 16;
        act(() => result.current.actions.moveNodes(new Map([["search", { x: 40, y: 8 }]])));
        expect(result.current.root).not.toBe(structure);
        expect(result.current.flat).toBe(flat);
        expect(result.current.structure).toBe(structure);

        // A move inside a group keeps them too.
        act(() => result.current.actions.enterGroup("pick"));
        act(() => result.current.actions.moveNodes(new Map([["select", { x: 99, y: 99 }]])));
        expect(result.current.flat).toBe(flat);

        // Anything but a move is a new structure.
        act(() => result.current.actions.updateNodeFile("select", "generate", "changed"));
        expect(result.current.flat).not.toBe(flat);
        expect(result.current.structure).toBe(result.current.root);
    });

    it("drops the redo future on a new edit", () => {
        const result = seed();
        act(() => result.current.actions.removeNode("select"));
        act(() => {
            result.current.history.undo();
        });
        expect(result.current.history.canRedo).toBe(true);
        act(() => result.current.actions.removeNode("search"));
        expect(result.current.history.canRedo).toBe(false);
        let done = true;
        act(() => {
            done = result.current.history.redo();
        });
        expect(done).toBe(false);
    });

    it("keeps at most 100 steps", () => {
        const { result } = renderHook(() => useStudioGraph());
        for (let i = 0; i < 120; i += 1) {
            act(() => result.current.actions.addFragment({ nodes: [node(`n${i}`)], edges: [] }));
        }
        let undone = 0;
        act(() => {
            while (result.current.history.undo()) undone += 1;
        });
        expect(undone).toBe(100);
        expect(result.current.graph.nodes).toHaveLength(20);
    });

    it("leaves navigation out of history, and falls back a level when undo removes the group shown", () => {
        const result = seed();
        act(() => {
            result.current.actions.groupNodes(["on_search", "select"], "Discovery", "d");
        });
        act(() => result.current.actions.enterGroup("discovery"));
        expect(result.current.path).toEqual(["discovery"]);
        act(() => {
            result.current.history.undo();
        });
        expect(result.current.path).toEqual([]);
        expect(ids(result)).toEqual(["search", "on_search", "select"]);
        // Redo brings the group back; the path was never an edit.
        act(() => {
            result.current.history.redo();
        });
        expect(ids(result)).toEqual(["search", "discovery"]);
    });
});
