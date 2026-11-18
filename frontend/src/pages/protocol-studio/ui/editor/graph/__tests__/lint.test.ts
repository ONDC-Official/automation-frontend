import { createGroupNode, NO_FILES } from "@pages/protocol-studio/ui/editor/graph/catalog";
import { flattenGraph } from "@pages/protocol-studio/ui/editor/graph/flatten";
import { countProblems, lintProtocol } from "@pages/protocol-studio/ui/editor/graph/lint";
import {
    GROUP_IN,
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

const lint = (graph: StudioGraph) => lintProtocol(graph, flattenGraph(graph));

describe("lintProtocol", () => {
    it("errors on a decision case with no wire", () => {
        const graph: StudioGraph = {
            nodes: [
                node("on_confirm", "callback"),
                node("sw", "decision", { decision: { cases: ["a", "b"], decide: "" } }),
                node("x", "unsolicited"),
            ],
            edges: [edge("on_confirm", "sw"), edge("sw", "x", { kind: "branch", case: "a" })],
        };
        const problems = lint(graph);
        expect(problems.filter((p) => p.level === "error").map((p) => p.message)).toEqual([
            expect.stringContaining("case “b” has no wire"),
        ]);
    });

    it("warns about unlabelled alternatives and callbacks without responseFor", () => {
        const graph: StudioGraph = {
            nodes: [
                node("select"),
                node("on_select", "callback"),
                node("on_select_2", "callback", { api: "on_select" }),
            ],
            edges: [
                edge("select", "on_select", { kind: "response", label: "in stock" }),
                edge("select", "on_select_2", { kind: "response" }),
            ],
        };
        const messages = lint(graph)
            .filter((p) => p.level === "warning")
            .map((p) => p.message);
        expect(messages).toEqual(
            expect.arrayContaining([
                expect.stringContaining("on_select is a callback but answers no request"),
                expect.stringContaining(
                    "select → on_select_2 is one of 2 alternatives but has no label"
                ),
            ])
        );
        expect(messages.some((m) => m.includes("select → on_select is one of"))).toBe(false);
    });

    it("asks a group for a name, a description and an Entry wire", () => {
        const empty = createGroupNode("g", { x: 0, y: 0 }, "", "");
        const unwired = createGroupNode("h", { x: 0, y: 0 }, "H", "has nodes", {
            nodes: [node("cancel")],
            edges: [],
        });
        const good = createGroupNode("k", { x: 0, y: 0 }, "K", "fine", {
            nodes: [node("cancel")],
            edges: [edge(GROUP_IN, "cancel")],
        });
        const problems = lint({ nodes: [empty, unwired, good], edges: [] });
        const warnings = problems.filter((p) => p.level === "warning").map((p) => p.nodeId);
        expect(warnings).toEqual(expect.arrayContaining(["g", "h"]));
        expect(warnings).not.toContain("k");
        expect(problems.some((p) => p.level === "info" && p.nodeId === "g")).toBe(true);
    });

    it("is quiet on a clean linear protocol", () => {
        const graph: StudioGraph = {
            nodes: [node("search"), node("on_search", "callback", { responseFor: "search" })],
            edges: [edge("search", "on_search", { kind: "response" })],
        };
        expect(countProblems(lint(graph))).toEqual({ errors: 0, warnings: 0 });
    });
});

describe("lintProtocol: start / end marks and repeat-until", () => {
    it("errors on a Start node that a wire leads into, and warns about unmarked roots", () => {
        const graph: StudioGraph = {
            nodes: [
                node("search"),
                node("on_search", "callback", { responseFor: "search", start: true }),
                node("status"),
            ],
            edges: [edge("search", "on_search", { kind: "response" })],
        };
        const problems = lint(graph);
        expect(problems.filter((p) => p.level === "error").map((p) => p.nodeId)).toEqual([
            "on_search",
        ]);
        // Some node is marked Start, so the other roots are never reached.
        expect(
            problems
                .filter((p) => p.level === "warning" && /isn't marked Start/.test(p.message))
                .map((p) => p.nodeId)
        ).toEqual(["search", "status"]);
    });

    it("counts only marked Start nodes as entries once any is marked", () => {
        const graph: StudioGraph = {
            nodes: [
                node("search", "request", { start: true }),
                node("on_search", "callback", { responseFor: "search" }),
            ],
            edges: [edge("search", "on_search", { kind: "response" })],
        };
        expect(countProblems(lint(graph))).toEqual({ errors: 0, warnings: 0 });
    });

    it("errors on a repeat-until node without an exit condition", () => {
        const graph: StudioGraph = {
            nodes: [
                node("confirm"),
                node("on_status", "unsolicited", { repeat: { max: 5, until: true } }),
                node("on_status_ok", "unsolicited", {
                    repeat: { max: 5, until: true },
                    files: { ...NO_FILES, exit: "function exit() { return true; }" },
                }),
            ],
            edges: [edge("confirm", "on_status"), edge("on_status", "on_status_ok")],
        };
        expect(
            lint(graph)
                .filter((p) => p.level === "error")
                .map((p) => p.nodeId)
        ).toEqual(["on_status"]);
    });
});
