import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    getSessionProvenanceV2,
    type ForkV2,
    type GraphExecutorV2,
    type GraphNodeV2,
    type GraphSessionV2,
    type JourneyV2,
    type NextV2,
    type RecogniseResultV2,
    type StepRunV2,
} from "@ondc/automation-mock-runner";

import type { RunStatus, StudioJourney } from "@pages/protocol-studio/ui/editor/types";

/**
 * A journey said a decision would decide one way and `decide` went the other.
 * The journey cannot be reached with the session data the earlier steps
 * produced: an authoring problem (the data, `decide`, or the journey), not a
 * protocol error. The run stops here.
 */
export interface RunDeviation {
    nodeId: string;
    expected: string;
    actual: string;
}

/**
 * The protocol can't go on correctly: a repeat-until node ran its `max`
 * times without its exit condition holding. The run stopped there.
 */
export interface RunFailure {
    nodeId: string;
    reason: string;
}

/** Something the run is waiting on the tester for. */
export type RunPending =
    | { kind: "inputs"; node: GraphNodeV2; schema: unknown; extra?: boolean }
    | { kind: "form"; node: GraphNodeV2; html: string }
    | { kind: "fork"; fork: ForkV2 };

export interface StudioRun {
    /** A run exists (started, possibly finished). */
    active: boolean;
    journeyId: string | null;
    session: GraphSessionV2 | null;
    runs: StepRunV2[];
    status: Record<string, RunStatus>;
    next: NextV2 | null;
    pending: RunPending | null;
    busy: boolean;
    /** The code or graph changed since the run started: results may not match the editor. */
    stale: boolean;
    /** A decision decided against the journey's expectation; the run stopped there. */
    deviation: RunDeviation | null;
    /** A repeat-until node never met its exit condition; the run stopped there. */
    failure: RunFailure | null;
    /** The tester finished the run at an End node (`next.canEnd`). */
    finished: boolean;
    sessionData: Record<string, unknown>;
    /** Session key → the node that last wrote it. */
    provenance: Record<string, string>;
    /** Per node, what its last run saved (Inspector › Session › Last run). */
    lastSaved: Record<string, Record<string, unknown>>;
    /**
     * Per run index: would the payload this step produced have been recognised
     * as this step, had it arrived from a real counterparty? (The mock-session
     * path, replayed on the simulation's own output.)
     */
    recognitions: Record<number, RecogniseResultV2>;
    /** The run selected in the result panel. */
    selectedRun: StepRunV2 | null;
    /** Why Run is unavailable, or null when it can start. */
    blocked: string | null;
}

export interface StudioRunActions {
    /** Starts a run of a preset journey, or of open mode (`null`). */
    start: (journey: StudioJourney | null) => void;
    runNext: () => Promise<void>;
    /** Runs steps until `nodeId` has run (or something is pending / failed). */
    runTo: (nodeId: string) => Promise<void>;
    runAll: () => Promise<void>;
    /** Passes over the next step without running it (optional nodes only). */
    skip: () => Promise<void>;
    /** Open mode: picks an alternative at the pending fork and runs it. */
    choose: (forkKey: string, targetId: string) => Promise<void>;
    submitInputs: (data: Record<string, unknown>) => Promise<void>;
    submitForm: (data: Record<string, unknown>) => Promise<void>;
    cancelPending: () => void;
    /** Runs an on-demand node without moving the main path. */
    trigger: (nodeId: string) => Promise<void>;
    /** Finishes the run at the End node it is at, though wires lead on. */
    finish: () => void;
    reset: () => void;
    /** Resets with a fresh transaction_id. */
    newTransaction: () => void;
    selectRun: (index: number | null) => void;
}

interface RunState {
    journeyId: string | null;
    journey: JourneyV2 | null;
    session: GraphSessionV2 | null;
    runs: StepRunV2[];
    pending: RunPending | null;
    /** The executor the run started on. */
    executor: GraphExecutorV2 | null;
    transactionId: string | null;
    deviation: RunDeviation | null;
    failure: RunFailure | null;
    finished: boolean;
    recognitions: Record<number, RecogniseResultV2>;
}

const EMPTY: RunState = {
    journeyId: null,
    journey: null,
    session: null,
    runs: [],
    pending: null,
    executor: null,
    transactionId: null,
    deviation: null,
    failure: null,
    finished: false,
    recognitions: {},
};

const toJourneyV2 = (journey: StudioJourney): JourneyV2 => ({
    id: journey.id,
    title: journey.title,
    entry: journey.entry,
    choices: journey.choices,
    expects: journey.expects,
    onDemand: journey.onDemand,
    ...(journey.skips?.length ? { skips: journey.skips } : {}),
    ...(journey.exit ? { exit: journey.exit } : {}),
});

const hasInputs = (node: GraphNodeV2) => {
    const schema = node.inputs?.jsonSchema;
    return !!schema && typeof schema === "object" && Object.keys(schema as object).length > 0;
};

/** How many steps `runAll` may take before it stops (a cycle with no repeat cap). */
const RUN_ALL_LIMIT = 200;

export interface IUseStudioRunOptions {
    executor: GraphExecutorV2 | null;
    /** Why no run can start right now (compile problems …); null when it can. */
    blockedReason: string | null;
    log: (level: "info" | "success" | "warn" | "error", message: string) => void;
    decodeBase64: (encoded: string) => string;
}

/**
 * One simulated run of the protocol on the graph executor: v1's run loop
 * (`use-config-run.tsx`) driven by the graph. One `transaction_id` for the
 * whole run; each step runs the full pipeline; forks stop for the tester in
 * open mode and follow the journey's choices in a preset. Everything is in
 * memory and is dropped with the page.
 */
export const useStudioRun = ({
    executor,
    blockedReason,
    log,
    decodeBase64,
}: IUseStudioRunOptions): { run: StudioRun; actions: StudioRunActions } => {
    const [state, setState] = useState<RunState>(EMPTY);
    const [busy, setBusy] = useState(false);
    const [selected, setSelected] = useState<number | null>(null);
    // Synchronous view of the state for the async loops.
    const stateRef = useRef(state);
    stateRef.current = state;

    const commit = useCallback((patch: Partial<RunState>) => {
        const next = { ...stateRef.current, ...patch };
        stateRef.current = next;
        setState(next);
    }, []);

    /** Decides what to do about the next step: run it, or wait for the tester. */
    const step = useCallback(
        async (
            opts: { inputs?: Record<string, unknown>; formData?: Record<string, unknown> } = {}
        ): Promise<"ran" | "pending" | "end" | "failed"> => {
            const {
                executor: ex,
                session,
                journey,
                deviation,
                failure,
                finished,
            } = stateRef.current;
            if (!ex || !session || finished) return "end";
            if (deviation || failure) return "failed";
            const next = ex.next(session, journey);
            commit({ pending: null });
            if (next.failed) {
                const last = session.events.filter((e) => !e.extra).at(-1);
                commit({
                    failure: {
                        nodeId: last?.nodeId ?? "",
                        reason: next.reason ?? "The run cannot go on",
                    },
                });
                log("error", next.reason ?? "The run cannot go on");
                return "failed";
            }
            if (next.fork) {
                commit({ pending: { kind: "fork", fork: next.fork } });
                if (journey)
                    log("warn", `${journey.id}: fork at ${next.fork.nodeId} has no choice`);
                return "pending";
            }
            if (!next.auto) {
                if (next.reason) log("info", next.reason);
                return "end";
            }
            const node = next.auto;
            // A preset journey passes over the optional nodes it marked as skipped.
            if (node.optional && journey?.skips?.includes(node.id)) {
                const out = ex.skip(session, node.id);
                if (!out.run.ok) {
                    log("error", `${node.id}: ${out.run.error ?? "could not skip"}`);
                    return "failed";
                }
                const runs = [...stateRef.current.runs, out.run];
                commit({ session: out.session, runs });
                setSelected(runs.length - 1);
                log("info", `${node.id}: skipped (optional, per journey)`);
                return "ran";
            }
            if (node.kind === "form" && opts.formData === undefined) {
                commit({
                    pending: {
                        kind: "form",
                        node,
                        html: node.formHtml ? decodeBase64(node.formHtml) : "",
                    },
                });
                return "pending";
            }
            if (
                node.kind !== "form" &&
                node.kind !== "decision" &&
                opts.inputs === undefined &&
                hasInputs(node)
            ) {
                commit({ pending: { kind: "inputs", node, schema: node.inputs?.jsonSchema } });
                return "pending";
            }
            const out = await ex.runStep(session, node.id, opts);
            const runs = [...stateRef.current.runs, out.run];
            // What a mock session would have made of this payload, had it arrived.
            let recognitions = stateRef.current.recognitions;
            if (out.run.ok && node.kind !== "decision" && node.kind !== "form" && out.run.event) {
                const seen = await ex.recognise(session, out.run.event.payload, journey);
                recognitions = { ...recognitions, [runs.length - 1]: seen };
                if (seen.node?.id !== node.id) {
                    log(
                        "warn",
                        `${node.id}: its payload would ${
                            seen.reason === "ambiguous"
                                ? `be ambiguous between ${seen.matched.map((n) => n.id).join(", ")}`
                                : seen.reason === "none"
                                  ? "be recognised as no step"
                                  : `be recognised as ${seen.node?.id ?? "nothing"}`
                        } if it arrived from a real counterparty · check match`
                    );
                }
            }
            commit({ session: out.session, runs, recognitions });
            setSelected(runs.length - 1);
            if (out.run.ok && node.kind === "decision" && journey) {
                const expected = journey.expects[node.id];
                const actual = out.run.event?.case ?? "";
                if (expected !== undefined && expected !== actual) {
                    commit({ deviation: { nodeId: node.id, expected, actual } });
                    log(
                        "error",
                        `${node.id}: decided "${actual}" but journey "${journey.id}" expects "${expected}" · the journey can't be reached with this session data`
                    );
                    return "failed";
                }
            }
            if (out.run.ok) {
                const checks = [
                    out.run.requirements && !out.run.requirements.result?.valid
                        ? "requirements failed"
                        : null,
                    out.run.validate && !out.run.validate.result?.valid ? "validate failed" : null,
                ].filter(Boolean);
                const again =
                    out.run.event?.exitMet === false
                        ? " · exit condition not met yet, runs again"
                        : "";
                log(
                    checks.length ? "warn" : "success",
                    `${node.id}: ${node.kind === "decision" ? `decided ${out.run.event?.case}` : "sent"}${checks.length ? ` · ${checks.join(", ")}` : ""}${again}`
                );
                return "ran";
            }
            log("error", `${node.id}: ${out.run.error ?? "failed"}`);
            return "failed";
        },
        [commit, log, decodeBase64]
    );

    const guarded = useCallback(
        async (work: () => Promise<void>) => {
            if (busy) return;
            setBusy(true);
            try {
                await work();
            } finally {
                setBusy(false);
            }
        },
        [busy]
    );

    const start = useCallback(
        (journey: StudioJourney | null) => {
            if (!executor) return;
            const transactionId =
                stateRef.current.transactionId ?? executor.options.transactionData.transaction_id;
            const j = journey ? toJourneyV2(journey) : null;
            commit({
                journeyId: journey?.id ?? "$open",
                journey: j,
                session: executor.createSession({
                    transactionId,
                    mode: journey ? "journey" : "open",
                    journeyId: journey?.id,
                }),
                runs: [],
                pending: null,
                executor,
                transactionId,
                deviation: null,
                failure: null,
                finished: false,
                recognitions: {},
            });
            setSelected(null);
            log(
                "info",
                `Run started · ${journey ? journey.title : "open mode"} · tx ${transactionId}`
            );
        },
        [executor, commit, log]
    );

    const runNext = useCallback(() => guarded(async () => void (await step())), [guarded, step]);

    const runUntil = useCallback(
        (stop: (ranNodeId: string | null) => boolean) =>
            guarded(async () => {
                for (let i = 0; i < RUN_ALL_LIMIT; i += 1) {
                    const before = stateRef.current.runs.length;
                    const outcome = await step();
                    const ran = stateRef.current.runs[before]?.nodeId ?? null;
                    if (outcome !== "ran" || stop(ran)) return;
                }
                log("warn", `Stopped after ${RUN_ALL_LIMIT} steps`);
            }),
        [guarded, step, log]
    );

    const runTo = useCallback((nodeId: string) => runUntil((ran) => ran === nodeId), [runUntil]);
    const runAll = useCallback(() => runUntil(() => false), [runUntil]);

    const skip = useCallback(
        () =>
            guarded(async () => {
                const { executor: ex, session, journey } = stateRef.current;
                if (!ex || !session) return;
                const next = ex.next(session, journey);
                if (!next.auto) return;
                const out = ex.skip(session, next.auto.id);
                if (!out.run.ok) {
                    log("error", `${next.auto.id}: ${out.run.error ?? "could not skip"}`);
                    return;
                }
                const runs = [...stateRef.current.runs, out.run];
                commit({ session: out.session, runs, pending: null });
                setSelected(runs.length - 1);
                log("info", `${next.auto.id}: skipped (optional)`);
            }),
        [guarded, commit, log]
    );

    const choose = useCallback(
        (forkKey: string, targetId: string) =>
            guarded(async () => {
                const { executor: ex, session } = stateRef.current;
                if (!ex || !session) return;
                commit({ session: ex.decide(session, forkKey, targetId), pending: null });
                log("info", `${forkKey}: chose ${targetId}`);
                await step();
            }),
        [guarded, commit, log, step]
    );

    const runExtra = useCallback(
        async (nodeId: string, inputs?: Record<string, unknown>) => {
            const { executor: ex, session } = stateRef.current;
            if (!ex || !session) return;
            const out = await ex.runStep(session, nodeId, { extra: true, inputs });
            const runs = [...stateRef.current.runs, out.run];
            commit({ session: out.session, runs, pending: null });
            setSelected(runs.length - 1);
            log(
                out.run.ok ? "success" : "error",
                `${nodeId} (on demand): ${out.run.ok ? "sent" : out.run.error}`
            );
        },
        [commit, log]
    );

    const submitInputs = useCallback(
        (data: Record<string, unknown>) =>
            guarded(async () => {
                const pending = stateRef.current.pending;
                if (pending?.kind === "inputs" && pending.extra)
                    await runExtra(pending.node.id, data);
                else await step({ inputs: data });
            }),
        [guarded, step, runExtra]
    );
    const submitForm = useCallback(
        (data: Record<string, unknown>) =>
            guarded(async () => void (await step({ formData: data }))),
        [guarded, step]
    );
    const cancelPending = useCallback(() => commit({ pending: null }), [commit]);

    const trigger = useCallback(
        (nodeId: string) =>
            guarded(async () => {
                const { executor: ex, session } = stateRef.current;
                if (!ex || !session) return;
                const node = ex.getNode(nodeId);
                if (!node) return;
                if (hasInputs(node)) {
                    // The inputs prompt; its submit runs the node as an extra step.
                    commit({
                        pending: {
                            kind: "inputs",
                            node,
                            schema: node.inputs?.jsonSchema,
                            extra: true,
                        },
                    });
                    return;
                }
                await runExtra(nodeId);
            }),
        [guarded, commit, runExtra]
    );

    const finish = useCallback(() => {
        const { executor: ex, session, journey } = stateRef.current;
        if (!ex || !session || !ex.next(session, journey).canEnd) return;
        commit({ finished: true, pending: null });
        log("success", "Run finished at an End node");
    }, [commit, log]);

    const reset = useCallback(() => {
        commit({ ...EMPTY, transactionId: stateRef.current.transactionId });
        setSelected(null);
    }, [commit]);

    const newTransaction = useCallback(() => {
        const transactionId = uuidv4();
        commit({ ...EMPTY, transactionId });
        setSelected(null);
        log("info", `New transaction · ${transactionId}`);
    }, [commit, log]);

    // The executor changing under a run (code edited, graph changed) makes it stale.
    const stale = state.session !== null && state.executor !== null && state.executor !== executor;

    // Logged once, when it turns stale.
    useEffect(() => {
        if (stale) log("warn", "Code or graph changed since the run started · reset to re-run");
    }, [stale, log]);

    const run = useMemo<StudioRun>(() => {
        const ex = state.executor;
        const session = state.session;
        const status: Record<string, RunStatus> = {};
        for (const r of state.runs)
            status[r.nodeId] = r.skipped ? "skipped" : r.ok ? "done" : "failed";
        if (state.deviation) status[state.deviation.nodeId] = "failed";
        if (state.failure) status[state.failure.nodeId] = "failed";
        const next = ex && session ? ex.next(session, state.journey) : null;
        // The node about to run, even one that ran before (a repeat, a loop) — but not over a failure.
        if (
            next?.auto &&
            status[next.auto.id] !== "failed" &&
            !state.deviation &&
            !state.failure &&
            !state.finished
        ) {
            status[next.auto.id] = "running";
        }
        const lastSaved: Record<string, Record<string, unknown>> = {};
        for (const r of state.runs) if (r.ok) lastSaved[r.nodeId] = r.saved;
        return {
            active: session !== null,
            journeyId: state.journeyId,
            session,
            runs: state.runs,
            status,
            next,
            pending: state.pending,
            busy,
            stale,
            deviation: state.deviation,
            failure: state.failure,
            finished: state.finished,
            recognitions: state.recognitions,
            sessionData: ex && session ? ex.getSessionData(session) : {},
            provenance: session ? getSessionProvenanceV2(session) : {},
            lastSaved,
            selectedRun: selected !== null ? (state.runs[selected] ?? null) : null,
            blocked: executor ? null : (blockedReason ?? "The graph isn't ready to run"),
        };
    }, [state, busy, stale, selected, executor, blockedReason]);

    const actions = useMemo<StudioRunActions>(
        () => ({
            start,
            runNext,
            runTo,
            runAll,
            skip,
            choose,
            submitInputs,
            submitForm,
            cancelPending,
            trigger,
            finish,
            reset,
            newTransaction,
            selectRun: setSelected,
        }),
        [
            start,
            runNext,
            runTo,
            runAll,
            skip,
            choose,
            submitInputs,
            submitForm,
            cancelPending,
            trigger,
            finish,
            reset,
            newTransaction,
        ]
    );

    return { run, actions };
};

export default useStudioRun;
