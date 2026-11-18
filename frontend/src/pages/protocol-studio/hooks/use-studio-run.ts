import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    chooseV2,
    createGraphRunV2,
    finishV2,
    getRunStatusV2,
    getSessionProvenanceV2,
    skipNextV2,
    stepV2,
    triggerV2,
    type DriverLogV2,
    type ForkV2,
    type GraphRunStateV2,
    type GraphExecutorV2,
    type GraphNodeV2,
    type GraphSessionV2,
    type JourneyV2,
    type NextV2,
    type RecogniseResultV2,
    type RunFailureCauseV2,
    type StepOutcomeV2,
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
 * The protocol can't go on correctly; the run stopped there. `cause` is the
 * rule it broke: a repeat-until node never met its exit condition (`exit`),
 * a decision led into a node past its `repeat.max` (`repeat`), a decision
 * returned a case with no wire (`no-wire`), or a step's requirements didn't
 * hold (`requirements`). Absent on a run stored before causes existed.
 */
export interface RunFailure {
    nodeId: string;
    reason: string;
    cause?: RunFailureCauseV2;
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
    /** The run itself, as the lib's driver keeps it (null before Run). */
    graphRun: GraphRunStateV2 | null;
    pending: RunPending | null;
    /** The executor the run started on. */
    executor: GraphExecutorV2 | null;
    transactionId: string | null;
}

const EMPTY: RunState = {
    journeyId: null,
    journey: null,
    graphRun: null,
    pending: null,
    executor: null,
    transactionId: null,
};

export const toJourneyV2 = (journey: StudioJourney): JourneyV2 => ({
    id: journey.id,
    title: journey.title,
    entry: journey.entry,
    choices: journey.choices,
    expects: journey.expects,
    onDemand: journey.onDemand,
    ...(journey.skips?.length ? { skips: journey.skips } : {}),
    ...(journey.exit ? { exit: journey.exit } : {}),
});

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
 * open mode and follow the journey's choices in a preset. The rules of a run
 * live in the lib's driver (`stepV2` …), shared with the mock service; this
 * hook plays both sides and keeps the run in memory, dropped with the page.
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

    const writeLogs = useCallback(
        (logs: DriverLogV2[]) => {
            for (const entry of logs) log(entry.level, entry.message);
        },
        [log]
    );

    /** Commits a driver result: the new run state, its logs, the latest run selected. */
    const apply = useCallback(
        (graphRun: GraphRunStateV2, logs: DriverLogV2[], patch: Partial<RunState> = {}) => {
            const before = stateRef.current.graphRun?.runs.length ?? 0;
            commit({ graphRun, ...patch });
            if (graphRun.runs.length > before) setSelected(graphRun.runs.length - 1);
            writeLogs(logs);
        },
        [commit, writeLogs]
    );

    /** Decides what to do about the next step: run it, or wait for the tester. */
    const step = useCallback(
        async (
            opts: { inputs?: Record<string, unknown>; formData?: Record<string, unknown> } = {}
        ): Promise<StepOutcomeV2> => {
            const { executor: ex, graphRun, journey } = stateRef.current;
            if (!ex || !graphRun) return "end";
            commit({ pending: null });
            const out = await stepV2(ex, graphRun, journey, { plays: "both", ...opts });
            const plan = out.plan;
            const pending: RunPending | null =
                out.outcome !== "pending"
                    ? null
                    : plan.kind === "fork"
                      ? { kind: "fork", fork: plan.fork }
                      : plan.kind === "form"
                        ? {
                              kind: "form",
                              node: plan.node,
                              html: plan.node.formHtml ? decodeBase64(plan.node.formHtml) : "",
                          }
                        : plan.kind === "inputs"
                          ? { kind: "inputs", node: plan.node, schema: plan.schema }
                          : null;
            apply(out.state, out.logs, { pending });
            return out.outcome;
        },
        [commit, apply, decodeBase64]
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
                graphRun: createGraphRunV2(executor, { transactionId, journey: j }),
                pending: null,
                executor,
                transactionId,
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
                    const before = stateRef.current.graphRun?.runs.length ?? 0;
                    const outcome = await step();
                    const ran = stateRef.current.graphRun?.runs[before]?.nodeId ?? null;
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
                const { executor: ex, graphRun, journey } = stateRef.current;
                if (!ex || !graphRun) return;
                const out = skipNextV2(ex, graphRun, journey);
                apply(out.state, out.logs, out.run ? { pending: null } : {});
            }),
        [guarded, apply]
    );

    const choose = useCallback(
        (forkKey: string, targetId: string) =>
            guarded(async () => {
                const { executor: ex, graphRun } = stateRef.current;
                if (!ex || !graphRun) return;
                commit({ graphRun: chooseV2(ex, graphRun, forkKey, targetId), pending: null });
                log("info", `${forkKey}: chose ${targetId}`);
                await step();
            }),
        [guarded, commit, log, step]
    );

    const runExtra = useCallback(
        async (nodeId: string, inputs?: Record<string, unknown>) => {
            const { executor: ex, graphRun } = stateRef.current;
            if (!ex || !graphRun) return;
            const out = await triggerV2(ex, graphRun, nodeId, inputs);
            if (out.pending?.kind === "inputs") {
                commit({
                    pending: {
                        kind: "inputs",
                        node: out.pending.node,
                        schema: out.pending.schema,
                        extra: true,
                    },
                });
                return;
            }
            apply(out.state, out.logs, { pending: null });
        },
        [commit, apply]
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

    // The inputs prompt (when the node has inputs); its submit runs the node as an extra step.
    const trigger = useCallback(
        (nodeId: string) => guarded(async () => runExtra(nodeId)),
        [guarded, runExtra]
    );

    const finish = useCallback(() => {
        const { executor: ex, graphRun, journey } = stateRef.current;
        if (!ex || !graphRun) return;
        const done = finishV2(ex, graphRun, journey);
        if (!done) return;
        commit({ graphRun: done, pending: null });
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
    const stale = state.graphRun !== null && state.executor !== null && state.executor !== executor;

    // Logged once, when it turns stale.
    useEffect(() => {
        if (stale) log("warn", "Code or graph changed since the run started · reset to re-run");
    }, [stale, log]);

    const run = useMemo<StudioRun>(() => {
        const ex = state.executor;
        const graphRun = state.graphRun;
        const session = graphRun?.session ?? null;
        const runs = graphRun?.runs ?? [];
        const status: Record<string, RunStatus> =
            ex && graphRun ? getRunStatusV2(ex, graphRun, state.journey, "both") : {};
        const next = ex && session ? ex.next(session, state.journey) : null;
        const lastSaved: Record<string, Record<string, unknown>> = {};
        for (const r of runs) if (r.ok) lastSaved[r.nodeId] = r.saved;
        return {
            active: session !== null,
            journeyId: state.journeyId,
            session,
            runs,
            status,
            next,
            pending: state.pending,
            busy,
            stale,
            deviation: graphRun?.deviation ?? null,
            failure: graphRun?.failure ?? null,
            finished: graphRun?.finished ?? false,
            recognitions: graphRun?.recognitions ?? {},
            sessionData: ex && session ? ex.getSessionData(session) : {},
            provenance: session ? getSessionProvenanceV2(session) : {},
            lastSaved,
            selectedRun: selected !== null ? (runs[selected] ?? null) : null,
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
