import { createGroupNode, NO_FILES } from "@pages/protocol-studio/ui/editor/graph/catalog";
import { flattenGraph, getEntryNodes } from "@pages/protocol-studio/ui/editor/graph/flatten";
import {
    enumeratePaths,
    getCoverage,
    getForks,
    lintJourneys,
    proposeTitle,
    walkJourney,
} from "@pages/protocol-studio/ui/editor/journeys/derive";
import {
    GROUP_IN,
    GROUP_OUT,
    type NodeKind,
    type NodeOwner,
    type StudioEdge,
    type StudioGraph,
    type StudioJourney,
    type StudioNode,
} from "@pages/protocol-studio/ui/editor/types";

const node = (
    id: string,
    kind: NodeKind = "request",
    owner: NodeOwner = kind === "request" || kind === "on_demand" ? "BAP" : "BPP",
    extra: Partial<StudioNode> = {}
): StudioNode => ({
    id,
    api: id.replace(/_\w+$/, "").replace(/_oos$/, ""),
    owner,
    kind,
    responseFor: null,
    description: "",
    files: NO_FILES,
    position: { x: 0, y: 0 },
    ...extra,
});

const decisionNode = (id: string, cases: string[]): StudioNode =>
    node(id, "decision", "BPP", { decision: { cases, decide: "" } });

let n = 0;
const edge = (from: string, to: string, extra: Partial<StudioEdge> = {}): StudioEdge => ({
    id: `e${++n}`,
    from,
    to,
    kind: "next",
    mandated: true,
    ...extra,
});

/**
 * search → on_search → select → { on_select "in stock" | on_select_oos "out of stock" }
 *   on_select → init → on_init → confirm → on_confirm → pay_decision { PREPAID → on_status_paid | COD → on_status_cod }
 *   on_select_oos → (end)
 *   on_confirm --on_demand--> status
 */
const protocol = (): StudioGraph => {
    n = 0;
    return {
        nodes: [
            node("search"),
            node("on_search", "callback"),
            node("select"),
            node("on_select", "callback", "BPP", { responseFor: "select" }),
            node("on_select_oos", "callback", "BPP", { responseFor: "select", api: "on_select" }),
            node("init"),
            node("on_init", "callback"),
            node("confirm"),
            node("on_confirm", "callback"),
            decisionNode("pay_decision", ["PREPAID", "COD"]),
            node("on_status_paid", "unsolicited", "BPP", { api: "on_status" }),
            node("on_status_cod", "unsolicited", "BPP", { api: "on_status" }),
            node("status", "on_demand"),
        ],
        edges: [
            edge("search", "on_search", { kind: "response" }),
            edge("on_search", "select"),
            edge("select", "on_select", { kind: "response", label: "in stock" }),
            edge("select", "on_select_oos", { kind: "response", label: "out of stock" }),
            edge("on_select", "init"),
            edge("init", "on_init", { kind: "response" }),
            edge("on_init", "confirm"),
            edge("confirm", "on_confirm", { kind: "response" }),
            edge("on_confirm", "pay_decision"),
            edge("pay_decision", "on_status_paid", { kind: "branch", case: "PREPAID" }),
            edge("pay_decision", "on_status_cod", { kind: "branch", case: "COD" }),
            edge("on_confirm", "status", { kind: "on_demand" }),
        ],
    };
};

const journey = (extra: Partial<StudioJourney>): StudioJourney => ({
    id: "j",
    title: "J",
    description: "",
    tags: [],
    entry: "search",
    choices: {},
    expects: {},
    onDemand: [],
    ...extra,
});

describe("getForks", () => {
    it("finds alternatives (≥2 wires out of a pin) and decisions, with who chooses", () => {
        const forks = getForks(flattenGraph(protocol()));
        expect(forks.map((f) => [f.key, f.kind, f.chooser])).toEqual([
            ["select", "alternatives", "BPP"],
            ["pay_decision:decision", "decision", "protocol"],
        ]);
        expect(forks[0].options.map((o) => o.label)).toEqual(["in stock", "out of stock"]);
        expect(forks[1].options.map((o) => o.label)).toEqual(["PREPAID", "COD"]);
    });

    it("does not count on_demand wires as alternatives", () => {
        const flat = flattenGraph(protocol());
        expect(getForks(flat).some((f) => f.nodeId === "on_confirm")).toBe(false);
    });
});

describe("walkJourney", () => {
    it("stops at the first unresolved fork and reports it", () => {
        const walk = walkJourney(flattenGraph(protocol()), journey({}));
        expect(walk.nodeIds).toEqual(["search", "on_search", "select"]);
        expect(walk.end).toBe("fork");
        expect(walk.pending?.key).toBe("select");
    });

    it("follows choices and expectations to the end, setting on_demand aside", () => {
        const walk = walkJourney(
            flattenGraph(protocol()),
            journey({ choices: { select: "on_select" }, expects: { pay_decision: "PREPAID" } })
        );
        expect(walk.end).toBe("end");
        expect(walk.nodeIds).toEqual([
            "search",
            "on_search",
            "select",
            "on_select",
            "init",
            "on_init",
            "confirm",
            "on_confirm",
            "pay_decision",
            "on_status_paid",
        ]);
        expect(walk.onDemand.map((node) => node.id)).toEqual(["status"]);
        expect(walk.steps.filter((s) => s.type === "fork")).toHaveLength(2);
    });

    it("ends a short path where the protocol ends", () => {
        const walk = walkJourney(
            flattenGraph(protocol()),
            journey({ choices: { select: "on_select_oos" } })
        );
        expect(walk.end).toBe("end");
        expect(walk.nodeIds.at(-1)).toBe("on_select_oos");
    });

    it("guards against cycles using the repeat cap", () => {
        n = 0;
        const graph: StudioGraph = {
            nodes: [
                node("status", "request", "BAP", { repeat: { max: 3 } }),
                node("on_status", "callback", "BPP", { repeat: { max: 3 } }),
            ],
            edges: [edge("status", "on_status", { kind: "response" }), edge("on_status", "status")],
        };
        const walk = walkJourney(flattenGraph(graph), journey({ entry: "status" }));
        expect(walk.end).toBe("cycle");
        expect(walk.nodeIds.filter((id) => id === "status")).toHaveLength(3);
        // A node without `repeat` is visited once: the cap trips on the second lap.
        const once = walkJourney(
            flattenGraph({ ...graph, nodes: [graph.nodes[0], node("on_status", "callback")] }),
            journey({ entry: "status" })
        );
        expect(once.nodeIds).toEqual(["status", "on_status", "status"]);
    });

    it("reports a missing entry", () => {
        expect(walkJourney(flattenGraph(protocol()), journey({ entry: "nope" })).end).toBe(
            "no-entry"
        );
    });
});

describe("enumeratePaths", () => {
    it("fans out over alternatives and decision cases with titles from the labels", () => {
        const { candidates, truncated } = enumeratePaths(flattenGraph(protocol()), "search");
        expect(truncated).toBe(false);
        expect(candidates.map((c) => c.title).sort()).toEqual(
            ["in stock · COD", "in stock · PREPAID", "out of stock"].sort()
        );
        const oos = candidates.find((c) => c.title === "out of stock");
        expect(oos?.choices).toEqual({ select: "on_select_oos" });
        expect(oos?.expects).toEqual({});
    });

    it("respects the limit", () => {
        const { candidates, truncated } = enumeratePaths(flattenGraph(protocol()), "search", {
            limit: 1,
        });
        expect(candidates).toHaveLength(1);
        expect(truncated).toBe(true);
    });

    it("names a fork-free protocol Main path", () => {
        n = 0;
        const graph: StudioGraph = {
            nodes: [node("search"), node("on_search", "callback")],
            edges: [edge("search", "on_search", { kind: "response" })],
        };
        const walk = walkJourney(flattenGraph(graph), journey({}));
        expect(proposeTitle(walk)).toBe("Main path");
    });
});

describe("getCoverage / lintJourneys", () => {
    it("lists the alternatives no journey takes and the nodes none visits", () => {
        const flat = flattenGraph(protocol());
        const journeys = [
            journey({
                id: "a",
                choices: { select: "on_select" },
                expects: { pay_decision: "COD" },
            }),
        ];
        const coverage = getCoverage(flat, journeys);
        expect(coverage.uncovered.map((u) => u.option.label)).toEqual(["out of stock", "PREPAID"]);
        expect(coverage.unvisited.map((node) => node.id)).toEqual([
            "on_select_oos",
            "on_status_paid",
        ]);
        const problems = lintJourneys(flat, journeys);
        expect(problems.filter((p) => p.level === "warning")).toHaveLength(2);
    });

    it("warns about a journey stopping at a fork", () => {
        const flat = flattenGraph(protocol());
        const problems = lintJourneys(flat, [journey({ title: "Open" })]);
        expect(
            problems.some((p) => p.level === "warning" && p.message.includes("stops at select"))
        ).toBe(true);
    });
});

describe("groups in journeys", () => {
    it("walks through a group as if it were flat", () => {
        n = 0;
        const inner: StudioGraph = {
            nodes: [node("cancel"), node("on_cancel", "callback")],
            edges: [
                edge(GROUP_IN, "cancel"),
                edge("cancel", "on_cancel", { kind: "response" }),
                edge("on_cancel", GROUP_OUT),
            ],
        };
        const graph: StudioGraph = {
            nodes: [
                node("on_confirm", "callback"),
                createGroupNode(
                    "cancellation",
                    { x: 0, y: 0 },
                    "Cancellation",
                    "Buyer cancels",
                    inner
                ),
                node("on_update", "unsolicited"),
            ],
            edges: [edge("on_confirm", "cancellation"), edge("cancellation", "on_update")],
        };
        const flat = flattenGraph(graph);
        expect(flat.nodes.map((node) => node.id)).toEqual([
            "on_confirm",
            "on_update",
            "cancel",
            "on_cancel",
        ]);
        expect(flat.groupOf.get("cancel")).toBe("cancellation");
        const walk = walkJourney(flat, journey({ entry: "on_confirm" }));
        expect(walk.nodeIds).toEqual(["on_confirm", "cancel", "on_cancel", "on_update"]);
        // Composite wires keep the raw ids they are made of.
        expect([...walk.edgeIds].every((id) => id.includes(">") || /^e\d+$/.test(id))).toBe(true);
    });
});

describe("start / end marks and repeat-until in journeys", () => {
    it("takes the marked Start nodes as the entries once any is marked", () => {
        const flat = flattenGraph(protocol());
        expect(getEntryNodes(flat).map((n) => n.id)).toEqual(["search"]);
        const marked = flattenGraph({
            ...protocol(),
            nodes: protocol().nodes.map((nd) => (nd.id === "search" ? { ...nd, start: true } : nd)),
        });
        expect(getEntryNodes(marked).map((n) => n.id)).toEqual(["search"]);
    });

    it("finishes at the journey's exit and flags a repeat-until node as one repeating step", () => {
        const graph = protocol();
        const flat = flattenGraph({
            ...graph,
            nodes: graph.nodes.map((nd) =>
                nd.id === "on_confirm"
                    ? { ...nd, end: true }
                    : nd.id === "on_select"
                      ? { ...nd, repeat: { max: 3, until: true } }
                      : nd
            ),
        });
        const j = journey({ choices: { select: "on_select" }, exit: "on_confirm" });
        const walk = walkJourney(flat, j);
        expect(walk.end).toBe("end");
        expect(walk.nodeIds.at(-1)).toBe("on_confirm");
        expect(walk.nodeIds.filter((id) => id === "on_select")).toHaveLength(1);
        expect(
            walk.steps.find((s) => s.type === "node" && s.node.id === "on_select")
        ).toMatchObject({ repeats: true });
        expect(lintJourneys(flat, [j]).filter((p) => /finishes at/.test(p.message))).toEqual([]);
    });

    it("warns when the journey's exit is off its path or not an End node", () => {
        const flat = flattenGraph(protocol());
        const off = journey({ choices: { select: "on_select_oos" }, exit: "confirm" });
        expect(lintJourneys(flat, [off]).map((p) => p.message)).toContainEqual(
            expect.stringContaining("which is not on its path")
        );
        const notEnd = journey({ choices: { select: "on_select" }, exit: "init" });
        expect(lintJourneys(flat, [notEnd]).map((p) => p.message)).toContainEqual(
            expect.stringContaining("isn't marked End")
        );
    });
});
