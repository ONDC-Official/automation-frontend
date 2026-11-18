import {
    hasInputsV2,
    type GraphNodeV2,
    type RunFailureCauseV2,
    type StepRunV2,
} from "@ondc/automation-mock-runner";

import type { IStudioLiveExchange, IStudioLiveStatus } from "@store/api";
import type { WalkResult } from "@pages/protocol-studio/ui/editor/journeys/derive";
import { getFailureTitle } from "@pages/protocol-studio/ui/editor/journeys/failure";
import type { NodeKind, NodeOwner, StudioNode } from "@pages/protocol-studio/ui/editor/types";

/**
 * What a step card says about its node, in v1's vocabulary: the
 * participant's ACK / NACK once it ran, SENDING while the mock produces it,
 * WAITING while the participant owes it, INPUT REQUIRED while the tester does.
 * `done` ran but has no sync response on record (yet).
 */
export type LiveStepState =
    | "ack"
    | "nack"
    | "done"
    | "failed"
    | "sending"
    | "waiting"
    | "input"
    | "paused"
    | "skipped"
    | "pending";

/** One time the node ran: its step result and the sync exchange of its payload. */
export interface LiveCall {
    /** Index into the run's `state.runs`. */
    runIndex: number;
    run: StepRunV2;
    exchange: IStudioLiveExchange | null;
}

export interface LiveStep {
    nodeId: string;
    /** 1-based position on the journey's path; null for steps off the path. */
    number: number | null;
    api: string;
    /** The node id, when it says more than the api (e.g. `on_select_oos`). */
    label: string | null;
    description: string;
    owner: NodeOwner;
    kind: NodeKind;
    /** The participant sends this step; otherwise the mock does. */
    youSend: boolean;
    /** The tester enters inputs before the mock sends it. */
    inputs: boolean;
    form: boolean;
    optional: boolean;
    /** The journey passes over this optional step. */
    journeySkips: boolean;
    repeats: boolean;
    onDemand: boolean;
    /** The name of the group the node sits in. */
    group: string | null;
    /** The alternative the journey takes into this step, e.g. "out of stock". */
    via: string | null;
    state: LiveStepState;
    calls: LiveCall[];
    /** ISO time of the last call. */
    time: string | null;
}

export type LiveRow =
    | { type: "pair"; key: string; first: LiveStep; second: LiveStep | null }
    | {
          type: "decision";
          key: string;
          nodeId: string;
          /** The case the journey expects. */
          expected: string | null;
          /** The case the protocol took, once the decision ran. */
          taken: string | null;
          deviated: boolean;
      };

export interface LiveModel {
    rows: LiveRow[];
    /** Steps that ran off the journey's path: on-demand triggers and the like. */
    extra: LiveStep[];
    /** Every step card, path and extra, by node id. */
    steps: Map<string, LiveStep>;
    /** Path steps that ran or were passed over, of all path steps. */
    progress: { done: number; total: number };
}

export interface IBuildLiveModelArgs {
    walk: WalkResult;
    /** The compiled graph's nodes: they carry `inputs`, which the view's nodes do not. */
    graphNodes: Map<string, GraphNodeV2>;
    /** Node id → the name of the group it sits in. */
    groupNames: Map<string, string>;
    /** The participant's role. */
    role: NodeOwner;
    /** The run as the mock service reports it; null before the journey started. */
    status: IStudioLiveStatus | null;
}

const exchangeKey = (run: StepRunV2) =>
    run.event ? `${run.event.api}::${run.event.messageId}` : null;

const stateOf = (
    nodeId: string,
    calls: LiveCall[],
    status: IStudioLiveStatus | null
): LiveStepState => {
    if (!status) return "pending";
    const plan = status.plan;
    if ((plan.kind === "inputs" || plan.kind === "form") && plan.nodeId === nodeId) return "input";
    if (status.paused === nodeId) return "paused";
    const node = status.status[nodeId];
    if (node === "running") return "sending";
    if (node === "awaiting") return "waiting";
    if (node === "skipped") return "skipped";
    if (node === "failed") return "failed";
    const last = calls[calls.length - 1];
    if (!last) return "pending";
    if (!last.run.ok) return "failed";
    const ack = last.exchange?.ack;
    if (ack === "NACK") return "nack";
    if (ack === "ACK") return "ack";
    // The mock answers ACK to every payload it takes from the participant.
    return last.run.event?.direction === "in" ? "ack" : "done";
};

/**
 * The live page's picture of one journey's run: the journey's path as cards
 * (a request paired with the callback that answers it, like v1's step rows),
 * decisions as thin dividers, and the steps that ran off the path. Pure, so
 * the page and tests build the same thing.
 */
export const buildLiveModel = ({
    walk,
    graphNodes,
    groupNames,
    role,
    status,
}: IBuildLiveModelArgs): LiveModel => {
    const runs = status?.state.runs ?? [];
    const exchanges = status?.exchanges ?? {};
    const callsOf = new Map<string, LiveCall[]>();
    runs.forEach((run, runIndex) => {
        if (run.skipped) return;
        const key = exchangeKey(run);
        const list = callsOf.get(run.nodeId) ?? [];
        list.push({ runIndex, run, exchange: (key && exchanges[key]) || null });
        callsOf.set(run.nodeId, list);
    });

    const steps = new Map<string, LiveStep>();
    const makeStep = (
        node: StudioNode,
        extra: { number: number | null; journeySkips?: boolean; via?: string | null }
    ): LiveStep => {
        const compiled = graphNodes.get(node.id);
        const calls = callsOf.get(node.id) ?? [];
        const youSend = node.owner === role;
        const step: LiveStep = {
            nodeId: node.id,
            number: extra.number,
            api: node.api,
            label: node.id !== node.api ? node.id : null,
            description: node.description,
            owner: node.owner,
            kind: node.kind,
            youSend,
            inputs: !youSend && !!compiled && hasInputsV2(compiled),
            form: node.kind === "form",
            optional: !!node.optional,
            journeySkips: !!extra.journeySkips,
            repeats: !!node.repeat?.until,
            onDemand: node.kind === "on_demand",
            group: groupNames.get(node.id) ?? null,
            via: extra.via ?? null,
            state: stateOf(node.id, calls, status),
            calls,
            time: calls.length ? (calls[calls.length - 1].run.event?.ts ?? null) : null,
        };
        steps.set(node.id, step);
        return step;
    };

    const rows: LiveRow[] = [];
    let number = 0;
    let done = 0;
    let total = 0;
    let open: Extract<LiveRow, { type: "pair" }> | null = null;
    let via: string | null = null;
    for (const item of walk.steps) {
        if (item.type === "fork") {
            // An alternative's label names the step it leads to; a decision is drawn as a row.
            if (item.fork.kind === "alternatives") via = item.chosen?.label ?? null;
            continue;
        }
        const node = item.node;
        if (node.kind === "decision") {
            open = null;
            const decided = [...(callsOf.get(node.id) ?? [])].pop();
            const fork = walk.steps.find(
                (s) => s.type === "fork" && s.fork.nodeId === node.id && s.fork.kind === "decision"
            );
            const deviation = status?.state.deviation;
            rows.push({
                type: "decision",
                key: `decision:${node.id}:${item.index}`,
                nodeId: node.id,
                expected: fork?.type === "fork" ? (fork.chosen?.label ?? null) : null,
                taken: decided?.run.event?.case ?? null,
                deviated: deviation?.nodeId === node.id,
            });
            continue;
        }
        number += 1;
        const step =
            steps.get(node.id) ?? makeStep(node, { number, journeySkips: item.skipped, via });
        via = null;
        total += 1;
        if (step.calls.length || step.state === "skipped") done += 1;
        // A callback right after the request it answers shares the request's row.
        const answers =
            node.responseFor === open?.first.nodeId ||
            (item.via?.kind === "response" && item.via.from === open?.first.nodeId);
        if (open && !open.second && answers) {
            open.second = step;
            open = null;
            continue;
        }
        open = { type: "pair", key: `pair:${node.id}:${item.index}`, first: step, second: null };
        rows.push(open);
    }

    const extra: LiveStep[] = [];
    const extraNodes = new Map(walk.onDemand.map((n) => [n.id, n]));
    for (const nodeId of callsOf.keys()) {
        if (steps.has(nodeId)) continue;
        const node = extraNodes.get(nodeId);
        if (!node) {
            const compiled = graphNodes.get(nodeId);
            if (!compiled) continue;
            extra.push(
                makeStep(
                    {
                        id: compiled.id,
                        api: compiled.api,
                        owner: compiled.owner,
                        kind: compiled.kind as NodeKind,
                        responseFor: compiled.responseFor ?? null,
                        description: compiled.description ?? "",
                        files: {} as StudioNode["files"],
                        position: { x: 0, y: 0 },
                    },
                    { number: null }
                )
            );
            continue;
        }
        extra.push(makeStep(node, { number: null }));
    }

    return { rows, extra, steps, progress: { done, total } };
};

/** Node id → the name of the group it sits in, through every level. */
export const getGroupNames = (graph: {
    nodes: { id: string; group?: { name: string; graph: unknown } }[];
}): Map<string, string> => {
    const names = new Map<string, string>();
    const visit = (g: typeof graph, name: string | null) => {
        for (const node of g.nodes) {
            if (node.group) visit(node.group.graph as typeof graph, node.group.name);
            else if (name) names.set(node.id, name);
        }
    };
    visit(graph, null);
    return names;
};

/** What the journey's run is doing, for the card header. */
export type LiveJourneyState =
    | "not-started"
    | "working"
    | "waiting"
    | "input"
    | "finished"
    | "failed"
    | "deviated"
    | "paused"
    | "idle";

export const getJourneyState = (
    status: IStudioLiveStatus | null,
    model: LiveModel
): LiveJourneyState => {
    if (!status) return "not-started";
    const { state, plan } = status;
    if (state.deviation) return "deviated";
    if (state.failure || plan.kind === "failed") return "failed";
    if (state.finished || plan.kind === "end" || plan.kind === "stopped") return "finished";
    if (plan.kind === "inputs" || plan.kind === "form") return "input";
    if (status.working) return "working";
    if (status.paused) return "paused";
    if (plan.kind === "await") return "waiting";
    return [...model.steps.values()].some((s) => s.state === "waiting") ? "waiting" : "idle";
};

/**
 * The journeys a tag filter keeps, as v1 filters flows: any selected tag
 * matches. Journeys in `keep` (the open one, any with a run) always stay, so a
 * filter never hides a run in progress.
 */
export const filterJourneys = <J extends { id: string; tags?: string[] }>(
    journeys: J[],
    tags: string[],
    keep: Set<string> = new Set()
): J[] =>
    tags.length
        ? journeys.filter((j) => keep.has(j.id) || (j.tags ?? []).some((t) => tags.includes(t)))
        : journeys;

/** The one line at the top of an open journey: what happens next, and who does it. */
export interface LiveNextUp {
    tone: "neutral" | "brand" | "alert" | "success" | "error" | "purple";
    /** Lead-in before the api, e.g. "Waiting for your NP to send". */
    text: string;
    /** The api the line is about, drawn as code. */
    api: string | null;
    /** Trailing detail, e.g. a failure reason. */
    detail?: string;
    /** A failed run: the rule it broke (`exit`, `repeat`, `no-wire`, `requirements`). */
    cause?: RunFailureCauseV2;
    /** The tester can act on it: reopen the inputs / form prompt, or run the paused step. */
    action?: "inputs" | "step";
}

const apiOf = (model: LiveModel, nodeId: string | undefined): string | null =>
    nodeId ? (model.steps.get(nodeId)?.api ?? nodeId) : null;

export const getNextUp = ({
    status,
    model,
    journeyState,
    awaiting,
    inputsSent = false,
}: {
    status: IStudioLiveStatus | null;
    model: LiveModel;
    journeyState: LiveJourneyState;
    /** The request the participant must send to open the journey, while none has arrived. */
    awaiting: string | null;
    /** The tester submitted the inputs / form the run is at; the mock has yet to move on. */
    inputsSent?: boolean;
}): LiveNextUp => {
    const plan = status?.plan;
    const planNode = plan && "nodeId" in plan ? plan.nodeId : undefined;
    const { done, total } = model.progress;
    switch (journeyState) {
        case "not-started": {
            if (awaiting)
                return {
                    tone: "alert",
                    text: "Listening · send",
                    api: awaiting,
                    detail: "from your NP to start the run",
                };
            const first = model.rows.find((r) => r.type === "pair");
            const step = first?.type === "pair" ? first.first : null;
            return {
                tone: "neutral",
                text: step?.youSend
                    ? "Start the journey, then send"
                    : "Start the journey: the mock sends",
                api: step?.api ?? null,
                detail: step?.youSend ? "from your NP" : "first",
            };
        }
        case "input":
            if (inputsSent)
                return {
                    tone: "brand",
                    text: "Inputs sent · the mock is sending",
                    api: apiOf(model, planNode),
                };
            return {
                tone: "brand",
                text: plan?.kind === "form" ? "Fill in the form for" : "Inputs needed before",
                api: apiOf(model, planNode),
                action: "inputs",
            };
        case "paused":
            return {
                tone: "brand",
                text: "Paused · the mock sends",
                api: apiOf(model, status?.paused ?? undefined),
                detail: "when you run the step",
                action: "step",
            };
        case "working":
            return {
                tone: "brand",
                text: "The mock is sending",
                api: plan?.kind === "run" ? apiOf(model, planNode) : null,
            };
        case "waiting": {
            const waitingFor =
                plan?.kind === "await"
                    ? apiOf(model, planNode)
                    : ([...model.steps.values()].find((s) => s.state === "waiting")?.api ?? null);
            return { tone: "alert", text: "Waiting for your NP to send", api: waitingFor };
        }
        case "finished":
            return {
                tone: "success",
                text: "Journey finished",
                api: null,
                detail: `${done} of ${total} steps`,
            };
        case "failed": {
            // Worded as the editor's Flow preview words it, by the rule the run broke.
            const failure = status?.state.failure;
            const cause = failure?.cause ?? (plan?.kind === "failed" ? plan.cause : undefined);
            return {
                tone: "error",
                text: cause ? `${getFailureTitle(cause)} at` : "Failed at",
                api: apiOf(model, failure?.nodeId ?? planNode),
                detail: failure?.reason ?? (plan?.kind === "failed" ? plan.reason : undefined),
                ...(cause ? { cause } : {}),
            };
        }
        case "deviated": {
            const deviation = status?.state.deviation;
            return {
                tone: "purple",
                text: "Deviated at",
                api: deviation?.nodeId ?? null,
                detail: deviation
                    ? `expected ${deviation.expected}, took ${deviation.actual}`
                    : undefined,
            };
        }
        default:
            if (plan?.kind === "run")
                return {
                    tone: "brand",
                    text: "The mock sends",
                    api: apiOf(model, planNode),
                    detail: "next",
                };
            if (plan?.kind === "fork")
                return { tone: "neutral", text: "Choosing a path at", api: planNode ?? null };
            if (plan?.kind === "end")
                return {
                    tone: "neutral",
                    text: plan.canEnd
                        ? "Nothing left to run · finish the journey"
                        : "Nothing left to run",
                    api: null,
                    detail: plan.reason,
                };
            return {
                tone: "neutral",
                text: "Running",
                api: null,
                detail: `${done} of ${total} steps`,
            };
    }
};
