import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import {
    getSessionProvenanceV2,
    MockRunnerV2,
    type GraphNodeV2,
    type NextV2,
    type ProtocolGraphV2,
} from "@ondc/automation-mock-runner";

import {
    useGetStudioLiveStatusQuery,
    useProceedStudioLiveFlowMutation,
    useStartStudioLiveFlowMutation,
    type IStudioLiveActionResponse,
    type IStudioLiveStatus,
} from "@store/api";
import type {
    RunPending,
    StudioRun,
    StudioRunActions,
} from "@pages/protocol-studio/hooks/use-studio-run";
import type { RunStatus, StudioJourney } from "@pages/protocol-studio/ui/editor/types";

/** How often a live run is read back from the mock service. */
const POLL_MS = 3000;

export interface IUseLiveRunOptions {
    sessionId: string;
    journey: StudioJourney | null;
    /** The transaction the session maps this journey to, if it was started. */
    transactionId: string | null;
    /** The compiled graph the mock runs: nodes for prompts and on-demand buttons. */
    graph: ProtocolGraphV2;
    /** The journey was started: on the mock's transaction, or listening for the participant's. */
    onStarted: (journeyId: string, started: LiveStart) => void;
    /** Read the run back every few seconds (default true); false reads it once. */
    poll?: boolean;
    /** The tester's step-through setting, sent with every start and proceed. */
    stepThrough?: boolean;
}

/**
 * How a journey started. The mock opened it: the transaction is the mock's, known
 * now. The participant opens it: the transaction is theirs, unknown until their
 * first request reaches the api-service, which then maps it on the session's flowMap.
 */
export type LiveStart = { transactionId: string } | { awaiting: string };

/** Something that went wrong on a live run, as the page shows it: what, and why. */
export interface LiveProblem {
    key: string;
    title: string;
    detail: string;
    at?: string;
}

/** The reason an API call failed, from whatever shape the error has. */
export const describeError = (error: unknown): string => {
    const e = error as { status?: number; message?: unknown; data?: unknown } | null;
    const pick = (v: unknown): string | null => {
        if (!v) return null;
        if (typeof v === "string") return v;
        const o = v as { message?: unknown; error?: unknown; code?: unknown };
        if (typeof o.message === "string") return o.code ? `${o.code}: ${o.message}` : o.message;
        if (o.error) return pick(o.error);
        return JSON.stringify(v).slice(0, 300);
    };
    const why = pick(e?.message) ?? pick(e?.data) ?? "no details";
    if (e?.status === undefined || e?.status === null)
        return `The workbench backend did not answer · ${why}`;
    return `HTTP ${e.status} · ${why}`;
};

export interface IUseLiveRunResult {
    run: StudioRun;
    actions: StudioRunActions;
    /** The mock service's status of the run, as read: exchanges, rejected payloads, logs. */
    live: IStudioLiveStatus | null;
    /** Opens the inputs / form prompt again after the tester closed it. */
    reopenPending: () => void;
    /** The tester submitted the prompt the run is at; the mock has not moved on yet. */
    inputsSent: boolean;
    /** Step-through: send the payload the run is paused before. */
    runStep: () => void;
    /** Pushes a changed step-through setting to the open run. */
    applyStepThrough: (value: boolean) => void;
    /** What went wrong, newest first: failed actions, an unreadable run, refused deliveries. */
    problems: LiveProblem[];
}

/**
 * A live run as the Studio panels read it: the mock service's state for one
 * journey's transaction, polled, mapped onto the same `StudioRun` /
 * `StudioRunActions` the simulation produces — so the Flow preview, Run
 * result, Session panel and run dialog render it unchanged. The run is driven
 * server-side by the lib's graph driver, the same rules as the simulation.
 */
export const useLiveRun = ({
    sessionId,
    journey,
    transactionId,
    graph,
    onStarted,
    poll = true,
    stepThrough = false,
}: IUseLiveRunOptions): IUseLiveRunResult => {
    const [selected, setSelected] = useState<number | null>(null);
    const [prompt, setPrompt] = useState<RunPending | null>(null);
    // A prompt the tester closed stays closed until the run moves on.
    const [dismissed, setDismissed] = useState<string | null>(null);
    // The prompt the tester submitted (not cancelled), until the run moves past it.
    const [submitted, setSubmitted] = useState<string | null>(null);
    const [startLive, { isLoading: starting }] = useStartStudioLiveFlowMutation();
    const [proceedLive, { isLoading: proceeding }] = useProceedStudioLiveFlowMutation();

    const [actionProblem, setActionProblem] = useState<LiveProblem | null>(null);
    const {
        data: status,
        error: statusError,
        refetch,
    } = useGetStudioLiveStatusQuery(
        { sessionId, transactionId: transactionId ?? "" },
        {
            skip: !transactionId,
            pollingInterval: poll ? POLL_MS : 0,
            // Keep reading while the tab is in the background: with `testing`, the other
            // side's tab drives this run, and a stale read is what kept prompts stuck open.
            skipPollingIfUnfocused: false,
        }
    );
    // A status read for another transaction (the journey just changed) is not this run's.
    const live = status && status.transactionId === transactionId ? status : null;

    const nodes = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph]);

    // A new transaction is a new run. Its prompt is not cleared here: a start that both
    // names the transaction and asks for inputs sets the prompt in the same tick.
    useEffect(() => {
        setSelected(null);
        setDismissed(null);
    }, [transactionId]);

    const answer = useCallback(
        (res: IStudioLiveActionResponse) => {
            const node = res.inputs ? nodes.get(res.inputs.nodeId) : undefined;
            if (res.inputs && node)
                setPrompt({
                    kind: "inputs",
                    node,
                    schema: res.inputs.schema,
                    ...(res.inputs.extra ? { extra: true } : {}),
                });
        },
        [nodes]
    );

    /**
     * Runs an action on the mock and reads the run back at once (not at the next poll),
     * so the page reflects it immediately. A refusal or failure stays on the page as a
     * problem, with the reason, until the next action succeeds.
     */
    const call = useCallback(
        async (
            what: string,
            work: () => Promise<IStudioLiveActionResponse>
        ): Promise<IStudioLiveActionResponse | null> => {
            let res: IStudioLiveActionResponse | null = null;
            try {
                res = await work();
                if (res.success) setActionProblem(null);
                else {
                    setActionProblem({
                        key: "action",
                        title: `${what} was refused`,
                        detail: res.message,
                        at: new Date().toISOString(),
                    });
                    toast.error(`${what} was refused`);
                }
                answer(res);
            } catch (error) {
                setActionProblem({
                    key: "action",
                    title: `${what} failed`,
                    detail: describeError(error),
                    at: new Date().toISOString(),
                });
                toast.error(`${what} failed`);
            }
            if (transactionId) void refetch();
            return res;
        },
        [answer, refetch, transactionId]
    );

    const start = useCallback(
        (j: StudioJourney | null) => {
            if (!j) return;
            setPrompt(null);
            void call("Starting the journey", async () => {
                // Offered as v1's /flow/new does; the mock keeps it only when it opens the
                // journey. When the participant opens it, no id is assigned here at all.
                const res = await startLive({
                    sessionId,
                    journeyId: j.id,
                    transactionId: uuidv4(),
                    stepThrough,
                }).unwrap();
                if (res.success && res.transactionId)
                    onStarted(j.id, { transactionId: res.transactionId });
                else if (res.success && res.awaiting) {
                    onStarted(j.id, { awaiting: res.awaiting.api });
                    toast.info(`Listening for your ${res.awaiting.api}`);
                }
                return res;
            });
        },
        [call, startLive, sessionId, onStarted, stepThrough]
    );

    const proceed = useCallback(
        (args: {
            inputs?: Record<string, unknown>;
            formData?: Record<string, unknown>;
            triggerExtra?: string;
            finish?: boolean;
            settingsOnly?: boolean;
            stepThrough?: boolean;
        }) =>
            transactionId
                ? call(
                      args.settingsOnly
                          ? "Saving step-through"
                          : args.inputs
                            ? "Running the step"
                            : args.formData
                              ? "Submitting the form"
                              : args.triggerExtra
                                ? `Triggering ${args.triggerExtra}`
                                : args.finish
                                  ? "Finishing the journey"
                                  : "Running the next step",
                      () => proceedLive({ sessionId, transactionId, stepThrough, ...args }).unwrap()
                  )
                : Promise.resolve(null),
        [call, proceedLive, sessionId, transactionId, stepThrough]
    );

    // What the run waits on the tester for: a prompt the mock answered with, or the plan.
    const planPending = useMemo<RunPending | null>(() => {
        const plan = live?.plan;
        if (!plan || (plan.kind !== "inputs" && plan.kind !== "form")) return null;
        const node = nodes.get(plan.nodeId);
        if (!node) return null;
        return plan.kind === "inputs"
            ? { kind: "inputs", node, schema: plan.schema }
            : {
                  kind: "form",
                  node,
                  html: node.formHtml ? MockRunnerV2.decodeBase64(node.formHtml) : "",
              };
    }, [live?.plan, nodes]);
    // A prompt is the same prompt while the run stays at that step: kind, node, steps run.
    const runsSoFar = live?.state.runs.length ?? 0;
    const keyOf = (p: RunPending | null) =>
        p ? `${p.kind}:${p.kind === "fork" ? "" : p.node.id}:${runsSoFar}` : null;
    const pendingKey = keyOf(planPending);
    const pending = prompt ?? (pendingKey && pendingKey !== dismissed ? planPending : null);
    // The key of what is on screen: a prompt the mock answered with may come before any read.
    const shownKey = keyOf(pending);

    const run = useMemo<StudioRun>(() => {
        const state = live?.state ?? null;
        const session = state?.session ?? null;
        const runs = state?.runs ?? [];
        const plan = live?.plan;
        const autoId =
            plan && "nodeId" in plan && plan.kind !== "fork" && plan.kind !== "failed"
                ? plan.nodeId
                : undefined;
        const auto: GraphNodeV2 | null = autoId ? (nodes.get(autoId) ?? null) : null;
        const next: NextV2 | null = live
            ? {
                  auto,
                  fork: null,
                  onDemand: live.next.onDemand
                      .map((id) => nodes.get(id))
                      .filter((n): n is GraphNodeV2 => !!n),
                  end: live.next.end,
                  canEnd: live.next.canEnd,
                  ...(plan?.kind === "failed"
                      ? {
                            failed: true,
                            reason: plan.reason,
                            ...(plan.cause ? { cause: plan.cause } : {}),
                        }
                      : {}),
              }
            : null;
        const lastSaved: Record<string, Record<string, unknown>> = {};
        for (const r of runs) if (r.ok) lastSaved[r.nodeId] = r.saved;
        return {
            active: session !== null,
            journeyId: journey?.id ?? null,
            session,
            runs,
            status: (live?.status ?? {}) as Record<string, RunStatus>,
            next,
            pending,
            busy: starting || proceeding || !!live?.working,
            stale: false,
            deviation: state?.deviation ?? null,
            failure: state?.failure ?? null,
            finished: state?.finished ?? false,
            sessionData: live?.sessionData ?? {},
            provenance: session ? getSessionProvenanceV2(session) : {},
            lastSaved,
            recognitions: state?.recognitions ?? {},
            selectedRun: selected !== null ? (runs[selected] ?? null) : null,
            blocked: journey ? null : "Pick a journey",
        };
    }, [live, nodes, journey, pending, starting, proceeding, selected]);

    const actions = useMemo<StudioRunActions>(() => {
        const idle = async () => undefined;
        return {
            start,
            newTransaction: () => start(journey),
            reset: () => start(journey),
            // A submitted prompt closes at once and stays closed: the last read still shows
            // the step waiting for it until the mock moves on. If the mock refuses, it comes
            // back for another try, with the reason on the page.
            submitInputs: async (data) => {
                const extra = pending?.kind === "inputs" && pending.extra ? pending.node.id : null;
                setPrompt(null);
                setDismissed(shownKey);
                setSubmitted(shownKey);
                const res = await proceed(
                    extra ? { inputs: data, triggerExtra: extra } : { inputs: data }
                );
                if (!res?.success) {
                    setDismissed(null);
                    setSubmitted(null);
                }
            },
            submitForm: async (data) => {
                setPrompt(null);
                setDismissed(shownKey);
                setSubmitted(shownKey);
                const res = await proceed({ formData: data });
                if (!res?.success) {
                    setDismissed(null);
                    setSubmitted(null);
                }
            },
            cancelPending: () => {
                setPrompt(null);
                setDismissed(shownKey);
            },
            trigger: async (nodeId) => {
                await proceed({ triggerExtra: nodeId });
            },
            finish: () => void proceed({ finish: true }),
            selectRun: setSelected,
            // The mock service runs the steps; the tester never steps a live run by hand.
            runNext: idle,
            runTo: idle,
            runAll: idle,
            skip: idle,
            choose: idle,
        };
    }, [start, journey, pending, proceed, shownKey]);

    const reopenPending = useCallback(() => setDismissed(null), []);
    /** Step-through: has the mock send the payload it is paused before. */
    const runStep = useCallback(() => void proceed({}), [proceed]);
    /**
     * Tells the open run's mock the step-through setting changed. Turned off while
     * paused, the run carries on by itself.
     */
    const applyStepThrough = useCallback(
        (value: boolean) => void proceed({ settingsOnly: true, stepThrough: value }),
        [proceed]
    );

    const problems = useMemo<LiveProblem[]>(() => {
        const list: LiveProblem[] = [];
        if (actionProblem) list.push(actionProblem);
        if (statusError && transactionId)
            list.push({
                key: "status",
                title: `The run on transaction ${transactionId} cannot be read`,
                detail: describeError(statusError),
            });
        // What the api-service refused or failed on, since the last payload it took.
        const logs = live?.logs ?? [];
        const lastOk = logs.map((l) => l.level).lastIndexOf("success");
        logs.slice(lastOk + 1)
            .filter((l) => l.level === "error")
            .slice(-3)
            .reverse()
            .forEach((l, i) =>
                list.push({
                    key: `log-${i}`,
                    title: "The run reported an error",
                    detail: l.message,
                    at: l.ts,
                })
            );
        return list;
    }, [actionProblem, statusError, transactionId, live?.logs]);

    const inputsSent = !!pendingKey && pendingKey === submitted;

    return {
        run,
        actions,
        live,
        reopenPending,
        problems,
        inputsSent,
        runStep,
        applyStepThrough,
    };
};
