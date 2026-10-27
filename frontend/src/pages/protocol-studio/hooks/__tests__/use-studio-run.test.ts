import { act, renderHook } from "@testing-library/react";
import type {
    GraphExecutorV2,
    GraphNodeV2,
    GraphSessionV2,
    NextV2,
    StepRunV2,
} from "@ondc/automation-mock-runner";

import { useStudioRun } from "@pages/protocol-studio/hooks/use-studio-run";
import type { StudioJourney } from "@pages/protocol-studio/ui/editor/types";

// A scripted executor: a linear search → on_search with an inputs prompt on
// search and a fork after on_search. Enough to drive the hook's state machine
// without a sandbox.
const nodes: Record<string, GraphNodeV2> = {
    search: {
        id: "search",
        api: "search",
        owner: "BAP",
        kind: "request",
        inputs: { jsonSchema: { type: "object", properties: { city: { type: "string" } } } },
    },
    on_search: {
        id: "on_search",
        api: "on_search",
        owner: "BPP",
        kind: "callback",
        responseFor: "search",
        optional: true,
    },
    select_a: { id: "select_a", api: "select", owner: "BAP", kind: "request" },
    // A decision after select_a whose decide always says "yes".
    sw: { id: "sw", api: "decision", owner: "BAP", kind: "decision", cases: ["yes", "no"] },
    select_b: { id: "select_b", api: "select", owner: "BAP", kind: "request" },
    status: { id: "status", api: "status", owner: "BAP", kind: "on_demand" },
};

const makeExecutor = () => {
    const ex = {
        options: { transactionData: { transaction_id: "tx-seed" } },
        getNode: (id: string) => nodes[id],
        createSession: ({
            transactionId,
            mode,
        }: {
            transactionId?: string;
            mode: "journey" | "open";
        }) =>
            ({
                transactionId: transactionId ?? "fresh",
                mode,
                events: [],
                decisions: {},
                counters: {},
            }) as GraphSessionV2,
        getSessionData: (session: GraphSessionV2) =>
            Object.assign({}, ...session.events.map((e) => e.saved)) as Record<string, unknown>,
        decide: (session: GraphSessionV2, key: string, target: string) => ({
            ...session,
            decisions: { ...session.decisions, [key]: target },
        }),
        next: (
            session: GraphSessionV2,
            journey: { choices: Record<string, string> } | null
        ): NextV2 => {
            const main = session.events.filter((e) => !e.extra);
            const last = main[main.length - 1]?.nodeId;
            const base: Pick<NextV2, "fork" | "onDemand" | "end"> = {
                fork: null,
                onDemand: [nodes.status],
                end: false,
            };
            if (!last) return { ...base, auto: nodes.search };
            if (last === "search") return { ...base, auto: nodes.on_search };
            if (last === "select_a") return { ...base, auto: nodes.sw };
            if (last === "on_search") {
                const chosen = journey?.choices.on_search ?? session.decisions.on_search;
                if (chosen) return { ...base, auto: nodes[chosen] };
                return {
                    ...base,
                    auto: null,
                    fork: {
                        key: "on_search",
                        nodeId: "on_search",
                        options: [
                            {
                                edge: {
                                    id: "a",
                                    from: "on_search",
                                    to: "select_a",
                                    kind: "next",
                                    label: "A",
                                },
                                target: nodes.select_a,
                            },
                            {
                                edge: {
                                    id: "b",
                                    from: "on_search",
                                    to: "select_b",
                                    kind: "next",
                                    label: "B",
                                },
                                target: nodes.select_b,
                            },
                        ],
                    },
                };
            }
            return { ...base, auto: null, end: true };
        },
        // Recognition is the lib's business; here every payload is its own step.
        recognise: async (_session: GraphSessionV2, payload: unknown) => {
            const action = (payload as { context?: { action?: string } })?.context?.action;
            const node = Object.values(nodes).find((n) => n.api === action) ?? null;
            return {
                node,
                matched: node ? [node] : [],
                candidates: node ? [node] : [],
                skipped: [],
                checks: [],
            };
        },
        skip: (
            session: GraphSessionV2,
            nodeId: string
        ): { run: StepRunV2; session: GraphSessionV2 } => {
            const node = nodes[nodeId];
            if (!node.optional) {
                return {
                    run: { nodeId, kind: node.kind, saved: {}, ok: false, error: "not optional" },
                    session,
                };
            }
            const event = {
                id: `${nodeId}::skipped::t`,
                nodeId,
                api: node.api,
                kind: node.kind,
                direction: "out" as const,
                payload: null,
                messageId: "",
                ts: "t",
                saved: {},
                status: "SKIPPED" as const,
            };
            return {
                run: { nodeId, kind: node.kind, saved: {}, event, ok: true, skipped: true },
                session: { ...session, events: [...session.events, event] },
            };
        },
        runStep: async (
            session: GraphSessionV2,
            nodeId: string,
            opts: { inputs?: unknown; extra?: boolean } = {}
        ): Promise<{ run: StepRunV2; session: GraphSessionV2 }> => {
            const isDecision = nodes[nodeId].kind === "decision";
            const event = {
                id: `${nodeId}::m::t`,
                nodeId,
                api: nodes[nodeId].api,
                kind: nodes[nodeId].kind,
                direction: "out" as const,
                payload: isDecision
                    ? { case: "yes" }
                    : {
                          context: {
                              transaction_id: session.transactionId,
                              action: nodes[nodeId].api,
                          },
                          inputs: opts.inputs,
                      },
                messageId: isDecision ? "" : "m",
                ts: "t",
                ...(isDecision ? { case: "yes" } : {}),
                saved: isDecision ? {} : { [`${nodeId}_ran`]: true },
                ...(opts.extra ? { extra: true } : {}),
                status: "SUCCESS" as const,
            };
            return {
                run: { nodeId, kind: nodes[nodeId].kind, saved: event.saved, event, ok: true },
                session: { ...session, events: [...session.events, event] },
            };
        },
    };
    return ex as unknown as GraphExecutorV2;
};

const journey: StudioJourney = {
    id: "j",
    title: "J",
    description: "",
    tags: [],
    entry: "search",
    choices: { on_search: "select_b" },
    expects: {},
    onDemand: ["status"],
};

const setup = (executor: GraphExecutorV2 | null = makeExecutor()) => {
    const log = jest.fn();
    const hook = renderHook(() =>
        useStudioRun({
            executor,
            blockedReason: executor ? null : "no graph",
            log,
            decodeBase64: (s) => s,
        })
    );
    return { ...hook, log };
};

describe("useStudioRun", () => {
    it("is blocked without an executor", () => {
        const { result } = setup(null);
        expect(result.current.run.blocked).toBe("no graph");
        expect(result.current.run.active).toBe(false);
    });

    it("runs a preset journey: asks for inputs, follows the choice, ends", async () => {
        const { result } = setup();
        act(() => result.current.actions.start(journey));
        expect(result.current.run.session?.transactionId).toBe("tx-seed");
        expect(result.current.run.status.search).toBe("running");

        await act(() => result.current.actions.runNext());
        expect(result.current.run.pending).toMatchObject({
            kind: "inputs",
            node: { id: "search" },
        });

        await act(() => result.current.actions.submitInputs({ city: "BLR" }));
        expect(result.current.run.runs.map((r) => r.nodeId)).toEqual(["search"]);
        expect((result.current.run.runs[0].event?.payload as { inputs: unknown }).inputs).toEqual({
            city: "BLR",
        });

        await act(() => result.current.actions.runAll());
        expect(result.current.run.runs.map((r) => r.nodeId)).toEqual([
            "search",
            "on_search",
            "select_b",
        ]);
        expect(result.current.run.next?.end).toBe(true);
        expect(result.current.run.status).toEqual({
            search: "done",
            on_search: "done",
            select_b: "done",
        });
        expect(result.current.run.sessionData).toEqual({
            search_ran: true,
            on_search_ran: true,
            select_b_ran: true,
        });
        expect(result.current.run.lastSaved.on_search).toEqual({ on_search_ran: true });
        expect(result.current.run.selectedRun?.nodeId).toBe("select_b");
    });

    it("stops at a fork in open mode and runs the chosen alternative", async () => {
        const { result } = setup();
        act(() => result.current.actions.start(null));
        await act(() => result.current.actions.runNext());
        await act(() => result.current.actions.submitInputs({}));
        await act(() => result.current.actions.runAll());
        expect(result.current.run.pending).toMatchObject({
            kind: "fork",
            fork: { key: "on_search" },
        });
        expect(result.current.run.runs.map((r) => r.nodeId)).toEqual(["search", "on_search"]);

        await act(() => result.current.actions.choose("on_search", "select_a"));
        expect(result.current.run.pending).toBeNull();
        expect(result.current.run.runs.map((r) => r.nodeId)).toEqual([
            "search",
            "on_search",
            "select_a",
        ]);
    });

    it("runs on-demand nodes as extra steps and resets keeping the transaction id", async () => {
        const { result } = setup();
        act(() => result.current.actions.start(journey));
        await act(() => result.current.actions.trigger("status"));
        expect(result.current.run.runs.map((r) => r.nodeId)).toEqual(["status"]);
        expect(result.current.run.runs[0].event?.extra).toBe(true);
        // The main path hasn't moved.
        expect(result.current.run.next?.auto?.id).toBe("search");

        act(() => result.current.actions.reset());
        expect(result.current.run.active).toBe(false);
        act(() => result.current.actions.start(journey));
        expect(result.current.run.session?.transactionId).toBe("tx-seed");

        act(() => result.current.actions.newTransaction());
        act(() => result.current.actions.start(journey));
        expect(result.current.run.session?.transactionId).not.toBe("tx-seed");
    });

    it("skips an optional step on request, and a journey's skips automatically", async () => {
        const { result } = setup();
        act(() => result.current.actions.start(null));
        await act(() => result.current.actions.runNext());
        await act(() => result.current.actions.submitInputs({}));
        // on_search is optional: the next step may be passed over.
        expect(result.current.run.next?.auto).toMatchObject({ id: "on_search", optional: true });
        await act(() => result.current.actions.skip());
        expect(result.current.run.runs.map((r) => [r.nodeId, r.skipped ?? false])).toEqual([
            ["search", false],
            ["on_search", true],
        ]);
        expect(result.current.run.status.on_search).toBe("skipped");
        expect(result.current.run.sessionData).toEqual({ search_ran: true });
        // The path moved on: the fork after on_search is what comes next.
        expect(result.current.run.next?.fork).toMatchObject({ key: "on_search" });

        // A preset journey that skips on_search needs no click.
        const { result: preset } = setup();
        act(() => preset.current.actions.start({ ...journey, skips: ["on_search"] }));
        await act(() => preset.current.actions.runNext());
        await act(() => preset.current.actions.submitInputs({}));
        await act(() => preset.current.actions.runAll());
        expect(preset.current.run.runs.map((r) => r.nodeId)).toEqual([
            "search",
            "on_search",
            "select_b",
        ]);
        expect(preset.current.run.runs[1].skipped).toBe(true);
        expect(preset.current.run.next?.end).toBe(true);
    });

    it("stops a journey whose expected decision case the data does not produce", async () => {
        const { result, log } = setup();
        act(() =>
            result.current.actions.start({
                ...journey,
                choices: { on_search: "select_a" },
                expects: { sw: "no" },
            })
        );
        await act(() => result.current.actions.runNext());
        await act(() => result.current.actions.submitInputs({}));
        await act(() => result.current.actions.runAll());
        expect(result.current.run.runs.map((r) => r.nodeId)).toEqual([
            "search",
            "on_search",
            "select_a",
            "sw",
        ]);
        expect(result.current.run.deviation).toEqual({
            nodeId: "sw",
            expected: "no",
            actual: "yes",
        });
        expect(result.current.run.status.sw).toBe("failed");
        expect(log).toHaveBeenCalledWith("error", expect.stringMatching(/expects "no"/));
        // Nothing runs past the deviation.
        await act(() => result.current.actions.runNext());
        expect(result.current.run.runs).toHaveLength(4);

        // The same journey expecting what decide returns runs through.
        const { result: fine } = setup();
        act(() =>
            fine.current.actions.start({
                ...journey,
                choices: { on_search: "select_a" },
                expects: { sw: "yes" },
            })
        );
        await act(() => fine.current.actions.runNext());
        await act(() => fine.current.actions.submitInputs({}));
        await act(() => fine.current.actions.runAll());
        expect(fine.current.run.deviation).toBeNull();
        expect(fine.current.run.runs.map((r) => r.nodeId)).toEqual([
            "search",
            "on_search",
            "select_a",
            "sw",
        ]);
    });

    it("marks the run stale when the executor changes", () => {
        const first = makeExecutor();
        const log = jest.fn();
        const { result, rerender } = renderHook(
            ({ executor }: { executor: GraphExecutorV2 }) =>
                useStudioRun({ executor, blockedReason: null, log, decodeBase64: (s) => s }),
            { initialProps: { executor: first } }
        );
        act(() => result.current.actions.start(journey));
        expect(result.current.run.stale).toBe(false);
        rerender({ executor: makeExecutor() });
        expect(result.current.run.stale).toBe(true);
        expect(log).toHaveBeenCalledWith(
            "warn",
            expect.stringMatching(/changed since the run started/)
        );
    });
});

/** The scripted executor, with `next` overridden once on_search has run. */
const afterOnSearch = (next: NextV2) => {
    const ex = makeExecutor() as unknown as { next: (s: GraphSessionV2, j: null) => NextV2 };
    const base = ex.next;
    ex.next = (session, j) => {
        const main = session.events.filter((e) => !e.extra);
        return main.at(-1)?.nodeId === "on_search" ? next : base(session, j);
    };
    return ex as unknown as GraphExecutorV2;
};

describe("useStudioRun: repeat-until and End nodes", () => {
    it("stops when a repeat-until node runs out of runs before its exit condition", async () => {
        const reason = 'The exit condition of "on_search" was not met after 2 runs';
        const { result, log } = setup(
            afterOnSearch({ auto: null, fork: null, onDemand: [], end: true, failed: true, reason })
        );
        act(() => result.current.actions.start(null));
        await act(() => result.current.actions.runNext());
        await act(() => result.current.actions.submitInputs({}));
        await act(() => result.current.actions.runAll());
        expect(result.current.run.failure).toEqual({ nodeId: "on_search", reason });
        expect(result.current.run.status.on_search).toBe("failed");
        expect(log).toHaveBeenCalledWith("error", reason);
        await act(() => result.current.actions.runNext());
        expect(result.current.run.runs).toHaveLength(2);
    });

    it("shows a repeating node as running again, and finishes at an End node", async () => {
        const { result, log } = setup(
            afterOnSearch({
                auto: nodes.on_search,
                fork: null,
                onDemand: [],
                end: false,
                canEnd: true,
            })
        );
        act(() => result.current.actions.start(null));
        await act(() => result.current.actions.runNext());
        await act(() => result.current.actions.submitInputs({}));
        await act(() => result.current.actions.runNext());
        // on_search ran and comes next again.
        expect(result.current.run.runs.map((r) => r.nodeId)).toEqual(["search", "on_search"]);
        expect(result.current.run.status.on_search).toBe("running");
        expect(result.current.run.next?.canEnd).toBe(true);
        act(() => result.current.actions.finish());
        expect(result.current.run.finished).toBe(true);
        expect(result.current.run.status.on_search).toBe("done");
        expect(log).toHaveBeenCalledWith(
            "success",
            expect.stringMatching(/finished at an End node/)
        );
        await act(() => result.current.actions.runNext());
        expect(result.current.run.runs.map((r) => r.nodeId)).toEqual(["search", "on_search"]);
    });
});
