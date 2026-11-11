import type { GraphNodeV2, StepRunV2 } from "@ondc/automation-mock-runner";

import type { IStudioLiveStatus } from "@store/api";
import {
    buildLiveModel,
    filterJourneys,
    getGroupNames,
    getJourneyState,
    getNextUp,
    type LiveRow,
    type LiveStep,
} from "@pages/protocol-studio/live/live-steps";
import { createGroupNode, NO_FILES } from "@pages/protocol-studio/ui/editor/graph/catalog";
import { flattenGraph } from "@pages/protocol-studio/ui/editor/graph/flatten";
import { walkJourney } from "@pages/protocol-studio/ui/editor/journeys/derive";
import type {
    NodeKind,
    NodeOwner,
    StudioEdge,
    StudioGraph,
    StudioJourney,
    StudioNode,
} from "@pages/protocol-studio/ui/editor/types";

const node = (
    id: string,
    kind: NodeKind = "request",
    owner: NodeOwner = kind === "request" || kind === "on_demand" ? "BAP" : "BPP",
    extra: Partial<StudioNode> = {}
): StudioNode => ({
    id,
    api: id,
    owner,
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

/**
 * search → on_search → pay { A → select → on_select (repeats) | B → cancel }
 *   on_search --on_demand--> status
 */
const protocol = (): StudioGraph => {
    n = 0;
    return {
        nodes: [
            node("search"),
            node("on_search", "callback"),
            node("pay", "decision", "BPP", { decision: { cases: ["A", "B"], decide: "" } }),
            node("select"),
            node("on_select", "callback", "BPP", {
                responseFor: "select",
                repeat: { max: 3, until: true },
                optional: true,
            }),
            node("cancel"),
            node("status", "on_demand"),
        ],
        edges: [
            edge("search", "on_search", { kind: "response" }),
            edge("on_search", "pay"),
            edge("pay", "select", { kind: "branch", case: "A" }),
            edge("pay", "cancel", { kind: "branch", case: "B" }),
            edge("select", "on_select", { kind: "response" }),
            edge("on_search", "status", { kind: "on_demand" }),
        ],
    };
};

const journey: StudioJourney = {
    id: "j",
    title: "J",
    description: "",
    tags: [],
    entry: "search",
    choices: {},
    expects: { pay: "A" },
    onDemand: ["status"],
};

const graphNodes = new Map<string, GraphNodeV2>([
    [
        "search",
        {
            id: "search",
            api: "search",
            owner: "BAP",
            kind: "request",
            inputs: { jsonSchema: { type: "object" } },
        } as unknown as GraphNodeV2,
    ],
]);

const runOf = (
    nodeId: string,
    api: string,
    messageId: string,
    patch: Partial<StepRunV2> & { direction?: "in" | "out"; case?: string } = {}
): StepRunV2 => {
    const { direction = "out", case: decided, ...rest } = patch;
    return {
        nodeId,
        kind: "request",
        saved: {},
        ok: true,
        event: {
            id: `${nodeId}::${messageId}`,
            nodeId,
            api,
            kind: "request",
            direction,
            payload: { context: { action: api, message_id: messageId } },
            messageId,
            ts: "2026-11-02T10:00:00.000Z",
            saved: {},
            status: "SUCCESS",
            ...(decided ? { case: decided } : {}),
        },
        ...rest,
    } as StepRunV2;
};

const statusOf = (patch: Partial<IStudioLiveStatus>): IStudioLiveStatus => ({
    engine: "graph-v2",
    sessionId: "s",
    journeyId: "j",
    transactionId: "tx",
    plays: "BAP",
    working: false,
    state: {
        session: {} as IStudioLiveStatus["state"]["session"],
        runs: [],
        recognitions: {},
        deviation: null,
        failure: null,
        finished: false,
    },
    status: {},
    plan: { kind: "await", nodeId: "on_search", candidates: ["on_search"] },
    next: { end: false, canEnd: false, onDemand: [] },
    sessionData: {},
    acks: {},
    exchanges: {},
    rejected: [],
    logs: [],
    ...patch,
});

const build = (status: IStudioLiveStatus | null, root = protocol()) => {
    const flat = flattenGraph(root);
    return buildLiveModel({
        walk: walkJourney(flat, journey),
        graphNodes,
        groupNames: getGroupNames(root),
        role: "BPP",
        status,
    });
};

const shape = (rows: LiveRow[]) =>
    rows.map((row) =>
        row.type === "pair"
            ? [row.first.nodeId, row.second?.nodeId ?? null]
            : ["decision", row.nodeId, row.expected, row.taken]
    );
const step = (model: ReturnType<typeof build>, id: string): LiveStep => model.steps.get(id)!;

describe("buildLiveModel", () => {
    it("pairs each request with its callback and draws a decision as a divider", () => {
        const model = build(null);
        expect(shape(model.rows)).toEqual([
            ["search", "on_search"],
            ["decision", "pay", "A", null],
            ["select", "on_select"],
        ]);
        expect(model.progress).toEqual({ done: 0, total: 4 });
        expect([...model.steps.values()].every((s) => s.state === "pending")).toBe(true);
    });

    it("tags who sends each step and how it runs", () => {
        const model = build(null);
        const search = step(model, "search");
        expect(search).toMatchObject({ number: 1, youSend: false, inputs: true, owner: "BAP" });
        expect(step(model, "on_search")).toMatchObject({ youSend: true, inputs: false });
        expect(step(model, "on_select")).toMatchObject({
            number: 4,
            repeats: true,
            optional: true,
        });
    });

    it("reads each step's status in v1's vocabulary, with ACK / NACK from the exchanges", () => {
        const runs = [
            runOf("search", "search", "m1"),
            runOf("on_search", "on_search", "m1", { direction: "in" }),
            runOf("pay", "pay", "d1", { kind: "decision", case: "A" }),
            runOf("select", "select", "m2"),
        ];
        const exchange = (ack: string) => ({
            payloadId: "p",
            ack,
            response: { message: { ack: { status: ack } } },
            timestamp: "",
        });
        const model = build(
            statusOf({
                state: { ...statusOf({}).state, runs },
                status: {
                    search: "done",
                    on_search: "done",
                    select: "done",
                    on_select: "awaiting",
                },
                exchanges: { "search::m1": exchange("ACK"), "select::m2": exchange("NACK") },
            })
        );
        expect(step(model, "search").state).toBe("ack");
        // What the participant sent: the mock took it, so it ACKed.
        expect(step(model, "on_search").state).toBe("ack");
        expect(step(model, "select").state).toBe("nack");
        expect(step(model, "select").calls[0].exchange?.ack).toBe("NACK");
        expect(step(model, "on_select").state).toBe("waiting");
        expect(shape(model.rows)[1]).toEqual(["decision", "pay", "A", "A"]);
        expect(model.progress).toEqual({ done: 3, total: 4 });
    });

    it("counts a repeating step's calls and asks for inputs while the tester owes them", () => {
        const runs = [runOf("on_select", "on_select", "a"), runOf("on_select", "on_select", "b")];
        const model = build(
            statusOf({
                state: { ...statusOf({}).state, runs },
                status: { on_select: "done" },
                plan: { kind: "inputs", nodeId: "search", schema: {} },
            })
        );
        expect(step(model, "on_select").calls).toHaveLength(2);
        expect(step(model, "on_select").state).toBe("done");
        expect(step(model, "search").state).toBe("input");
    });

    it("lists steps that ran off the path, and marks a deviated decision", () => {
        const model = build(
            statusOf({
                state: {
                    ...statusOf({}).state,
                    runs: [runOf("status", "status", "x")],
                    deviation: { nodeId: "pay", expected: "A", actual: "B" },
                },
            })
        );
        expect(model.extra.map((s) => [s.nodeId, s.onDemand])).toEqual([["status", true]]);
        const decision = model.rows[1];
        expect(decision.type === "decision" && decision.deviated).toBe(true);
    });

    it("names the group a step sits in", () => {
        const root: StudioGraph = {
            nodes: [createGroupNode("checkout", { x: 0, y: 0 }, "Checkout", "", protocol())],
            edges: [],
        };
        expect(getGroupNames(root).get("select")).toBe("Checkout");
    });
});

describe("getJourneyState", () => {
    it("says what the run is doing", () => {
        const model = build(null);
        expect(getJourneyState(null, model)).toBe("not-started");
        expect(getJourneyState(statusOf({}), model)).toBe("waiting");
        expect(
            getJourneyState(statusOf({ working: true, plan: { kind: "run", nodeId: "x" } }), model)
        ).toBe("working");
        expect(getJourneyState(statusOf({ plan: { kind: "end", canEnd: false } }), model)).toBe(
            "finished"
        );
        expect(
            getJourneyState(
                statusOf({
                    state: {
                        ...statusOf({}).state,
                        deviation: { nodeId: "pay", expected: "A", actual: "B" },
                    },
                }),
                model
            )
        ).toBe("deviated");
    });
});

describe("getNextUp", () => {
    const next = (status: IStudioLiveStatus | null, awaiting: string | null = null) => {
        const model = build(status);
        return getNextUp({
            status,
            model,
            journeyState: getJourneyState(status, model),
            awaiting,
        });
    };

    it("says who opens a journey that has not started", () => {
        // The participant is the BPP here, so the mock sends the first search.
        expect(next(null)).toMatchObject({ tone: "neutral", api: "search" });
        expect(next(null).text).toMatch(/mock sends/);
        expect(next(null, "search")).toMatchObject({ tone: "alert", api: "search" });
    });

    it("names the step the run waits on and offers the inputs prompt", () => {
        expect(next(statusOf({}))).toMatchObject({ tone: "alert", api: "on_search" });
        const inputs = next(statusOf({ plan: { kind: "inputs", nodeId: "search", schema: {} } }));
        expect(inputs).toMatchObject({ tone: "brand", api: "search", action: "inputs" });
        const sent = getNextUp({
            status: statusOf({ plan: { kind: "inputs", nodeId: "search", schema: {} } }),
            model: build(null),
            journeyState: "input",
            awaiting: null,
            inputsSent: true,
        });
        expect(sent).toMatchObject({ tone: "brand", api: "search" });
        expect(sent.action).toBeUndefined();
        expect(
            next(statusOf({ working: true, plan: { kind: "run", nodeId: "select" } }))
        ).toMatchObject({ tone: "brand", api: "select" });
    });

    it("offers Run step while step-through holds the mock's next payload", () => {
        const paused = statusOf({
            plan: { kind: "run", nodeId: "select" },
            stepThrough: true,
            paused: "select",
        });
        const model = build(paused);
        expect(getJourneyState(paused, model)).toBe("paused");
        expect(model.steps.get("select")?.state).toBe("paused");
        expect(next(paused)).toMatchObject({ tone: "brand", api: "select", action: "step" });
        // While the mock sends it, the run is working, not paused.
        expect(getJourneyState({ ...paused, working: true }, model)).toBe("working");
    });

    it("ends on how the run ended", () => {
        expect(next(statusOf({ plan: { kind: "end", canEnd: false } }))).toMatchObject({
            tone: "success",
            detail: "0 of 4 steps",
        });
        const failed = next(
            statusOf({
                state: {
                    ...statusOf({}).state,
                    failure: { nodeId: "select", reason: "generate threw" },
                },
            })
        );
        expect(failed).toMatchObject({ tone: "error", api: "select", detail: "generate threw" });
        const deviated = next(
            statusOf({
                state: {
                    ...statusOf({}).state,
                    deviation: { nodeId: "pay", expected: "A", actual: "B" },
                },
            })
        );
        expect(deviated).toMatchObject({ tone: "purple", detail: "expected A, took B" });
    });
});

describe("filterJourneys", () => {
    const journeys = [
        { id: "a", tags: ["MANDATORY"] },
        { id: "b", tags: ["NEGATIVE"] },
        { id: "c", tags: [] },
    ];

    it("keeps every journey without a filter, and any tag match with one", () => {
        expect(filterJourneys(journeys, [])).toBe(journeys);
        expect(filterJourneys(journeys, ["MANDATORY", "NEGATIVE"]).map((j) => j.id)).toEqual([
            "a",
            "b",
        ]);
    });

    it("never hides a journey it is told to keep", () => {
        expect(filterJourneys(journeys, ["NEGATIVE"], new Set(["c"])).map((j) => j.id)).toEqual([
            "b",
            "c",
        ]);
    });
});
