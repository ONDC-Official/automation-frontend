import { getEntryNodes } from "@pages/protocol-studio/ui/editor/graph/flatten";
import type {
    FlatGraph,
    Fork,
    ForkOption,
    JourneyStep,
    NodeOwner,
    ProtocolProblem,
    StudioEdge,
    StudioJourney,
    StudioNode,
} from "@pages/protocol-studio/ui/editor/types";

/**
 * Journeys are *derived* from the protocol graph. The graph says what the
 * protocol permits; a journey resolves every place it permits more than one
 * thing. Everything here is pure, so the Journeys stage, the Review stage and
 * the tests share one reading of the graph.
 */

/** The fork key a journey's `choices` is indexed by. */
export const getForkKey = (nodeId: string, kind: Fork["kind"]) =>
    kind === "decision" ? `${nodeId}:decision` : nodeId;

/** What an option is called: the wire's label, else the decision case, else the target's id. */
export const getOptionLabel = (edge: StudioEdge, target: StudioNode) =>
    edge.label?.trim() || edge.case || target.id;

/** Wires a run follows: everything but on-demand wires, which are fired by the tester. */
const isPathEdge = (edge: StudioEdge) => edge.kind !== "on_demand";

const chooserOf = (node: StudioNode, options: ForkOption[]): Fork["chooser"] => {
    if (node.decision) return "protocol";
    const owners = new Set<NodeOwner>(options.map((option) => option.target.owner));
    return owners.size === 1 ? [...owners][0] : "mixed";
};

/** The fork at `node`, if its Then pin (or decision) leads more than one way. */
export const getForkAt = (flat: FlatGraph, node: StudioNode): Fork | null => {
    const wires = (flat.out.get(node.id) ?? []).filter(isPathEdge);
    if (!node.decision && wires.length < 2) return null;
    if (node.decision && wires.length === 0) return null;
    const options: ForkOption[] = [];
    for (const edge of wires) {
        const target = flat.byId.get(edge.to);
        if (target) options.push({ edge, target, label: getOptionLabel(edge, target) });
    }
    if (options.length === 0) return null;
    const kind: Fork["kind"] = node.decision ? "decision" : "alternatives";
    return {
        key: getForkKey(node.id, kind),
        nodeId: node.id,
        kind,
        chooser: chooserOf(node, options),
        options,
    };
};

/** Every fork on the protocol, in graph order. */
export const getForks = (flat: FlatGraph): Fork[] =>
    flat.nodes.map((node) => getForkAt(flat, node)).filter((fork): fork is Fork => fork !== null);

/** How a walk ended. */
export type WalkEnd = "end" | "fork" | "cycle" | "limit" | "no-entry";

export interface WalkResult {
    steps: JourneyStep[];
    /** Nodes on the path, in order. */
    nodeIds: string[];
    /** Wires followed. */
    edgeIds: Set<string>;
    /** The fork the walk stopped at, still unresolved. */
    pending: Fork | null;
    /** on_demand nodes reachable from the path. */
    onDemand: StudioNode[];
    end: WalkEnd;
}

/** Most steps a walk takes before giving up: longer is a loop the repeat caps missed. */
const STEP_LIMIT = 200;

/** How often a repeating node may appear on one preview path. */
const UNBOUNDED_PREVIEW_REPEATS = 2;

const visitsAllowed = (node: StudioNode) =>
    node.repeat
        ? node.repeat.max === "unbounded"
            ? UNBOUNDED_PREVIEW_REPEATS
            : node.repeat.max
        : 1;

/** Whether a journey may finish at `node`: it is marked End, or no path wire leaves it. */
export const canFinishAt = (flat: FlatGraph, node: StudioNode) =>
    !!node.end || !(flat.out.get(node.id) ?? []).some(isPathEdge);

/**
 * Walks the protocol from the journey's entry, following single wires,
 * `choices` at forks of alternatives and `expects` at decisions, until the
 * protocol ends, the journey's `exit` is reached, or a fork is still open. A
 * repeat-until node is one step (it repeats in place, not along a wire).
 * On-demand wires are set aside and reported, never followed. Group
 * boundaries are already resolved in `flat`.
 */
export const walkJourney = (
    flat: FlatGraph,
    journey: Pick<StudioJourney, "entry" | "choices" | "expects"> &
        Partial<Pick<StudioJourney, "skips" | "exit">>
): WalkResult => {
    const skips = new Set(journey.skips ?? []);
    const steps: JourneyStep[] = [];
    const nodeIds: string[] = [];
    const edgeIds = new Set<string>();
    const onDemand = new Map<string, StudioNode>();
    const visits = new Map<string, number>();
    let node = flat.byId.get(journey.entry);
    if (!node) return { steps, nodeIds, edgeIds, pending: null, onDemand: [], end: "no-entry" };

    let via: StudioEdge | undefined;
    let end: WalkEnd = "end";
    let pending: Fork | null = null;
    for (let index = 0; ; index += 1) {
        if (index >= STEP_LIMIT) {
            end = "limit";
            break;
        }
        const seen = (visits.get(node.id) ?? 0) + 1;
        if (seen > visitsAllowed(node)) {
            end = "cycle";
            break;
        }
        visits.set(node.id, seen);
        steps.push({
            type: "node",
            node,
            via,
            index: steps.length,
            // Only an optional node can be skipped; a stale entry for a mandatory one is ignored.
            ...(node.optional && skips.has(node.id) ? { skipped: true } : {}),
            ...(node.repeat?.until ? { repeats: true } : {}),
        });
        nodeIds.push(node.id);

        const wires = flat.out.get(node.id) ?? [];
        for (const edge of wires) {
            if (edge.kind !== "on_demand") continue;
            const target = flat.byId.get(edge.to);
            if (target) onDemand.set(target.id, target);
        }
        // The journey finishes here, whatever follows.
        if (journey.exit === node.id) break;

        const fork = getForkAt(flat, node);
        let next: StudioEdge | undefined;
        if (fork) {
            const want =
                fork.kind === "decision"
                    ? fork.options.find((o) => o.edge.case === journey.expects[node!.id])
                    : fork.options.find((o) => o.target.id === journey.choices[fork.key]);
            steps.push({ type: "fork", fork, chosen: want, index: steps.length });
            if (!want) {
                pending = fork;
                end = "fork";
                break;
            }
            next = want.edge;
        } else {
            next = wires.find(isPathEdge);
        }
        if (!next) break;
        const target = flat.byId.get(next.to);
        if (!target) break;
        edgeIds.add(next.id);
        via = next;
        node = target;
    }

    return { steps, nodeIds, edgeIds, pending, onDemand: [...onDemand.values()], end };
};

export interface JourneyCandidate {
    /** The node sequence, for de-duplication. */
    key: string;
    title: string;
    choices: Record<string, string>;
    expects: Record<string, string>;
    nodeIds: string[];
    end: WalkEnd;
}

/** A title from the options a path took: `out of stock · PREPAID`, or `Main path`. */
export const proposeTitle = (walk: WalkResult) => {
    const parts: string[] = [];
    for (const step of walk.steps) {
        if (step.type === "fork" && step.chosen) parts.push(step.chosen.label.replace(/^on_/, ""));
    }
    return parts.length > 0 ? parts.join(" · ") : "Main path";
};

/**
 * Every way through the protocol from `entry`: each fork of alternatives and
 * each decision case fans the search out. Bounded by `limit` so a large graph
 * yields a first page rather than hanging. Paths ending at a repeat cap are
 * kept (they are still complete journeys up to that point).
 */
export const enumeratePaths = (
    flat: FlatGraph,
    entry: string,
    { limit = 50 }: { limit?: number } = {}
): { candidates: JourneyCandidate[]; truncated: boolean } => {
    const candidates: JourneyCandidate[] = [];
    const seen = new Set<string>();
    let truncated = false;

    const explore = (choices: Record<string, string>, expects: Record<string, string>) => {
        if (candidates.length >= limit) {
            truncated = true;
            return;
        }
        const walk = walkJourney(flat, { entry, choices, expects });
        if (walk.pending) {
            for (const option of walk.pending.options) {
                // Options still to explore once the page is full: the result is a first page.
                if (candidates.length >= limit) {
                    truncated = true;
                    return;
                }
                if (walk.pending.kind === "decision") {
                    if (option.edge.case === undefined) continue;
                    explore(choices, { ...expects, [walk.pending.nodeId]: option.edge.case });
                } else {
                    explore({ ...choices, [walk.pending.key]: option.target.id }, expects);
                }
            }
            return;
        }
        const key = walk.nodeIds.join(">");
        if (seen.has(key)) return;
        seen.add(key);
        candidates.push({
            key,
            title: proposeTitle(walk),
            choices,
            expects,
            nodeIds: walk.nodeIds,
            end: walk.end,
        });
    };

    explore({}, {});
    return { candidates, truncated };
};

export interface Coverage {
    /** Journeys visiting each node. */
    byNode: Map<string, string[]>;
    /** Journeys following each wire. */
    byEdge: Map<string, string[]>;
    /** Options of forks no journey takes. */
    uncovered: { fork: Fork; option: ForkOption }[];
    /** Nodes no journey visits. */
    unvisited: StudioNode[];
}

/** Which journeys exercise which parts of the protocol. */
export const getCoverage = (flat: FlatGraph, journeys: StudioJourney[]): Coverage => {
    const byNode = new Map<string, string[]>();
    const byEdge = new Map<string, string[]>();
    for (const journey of journeys) {
        const walk = walkJourney(flat, journey);
        for (const id of walk.nodeIds) byNode.set(id, [...(byNode.get(id) ?? []), journey.id]);
        for (const id of walk.edgeIds) byEdge.set(id, [...(byEdge.get(id) ?? []), journey.id]);
    }
    const uncovered: Coverage["uncovered"] = [];
    for (const fork of getForks(flat)) {
        for (const option of fork.options) {
            if (!byEdge.has(option.edge.id)) uncovered.push({ fork, option });
        }
    }
    const unvisited = flat.nodes.filter(
        (node) => !byNode.has(node.id) && node.kind !== "on_demand"
    );
    return { byNode, byEdge, uncovered, unvisited };
};

/** Problems with the journeys as they stand. */
export const lintJourneys = (flat: FlatGraph, journeys: StudioJourney[]): ProtocolProblem[] => {
    const problems: ProtocolProblem[] = [];
    const add = (problem: Omit<ProtocolProblem, "id">) =>
        problems.push({ id: `journey:${problem.journeyId ?? ""}:${problems.length}`, ...problem });
    const keys = new Map<string, string>();
    for (const journey of journeys) {
        const walk = walkJourney(flat, journey);
        if (walk.end === "no-entry") {
            add({
                level: "error",
                message: `Journey “${journey.title}”: its entry ${journey.entry} is not on the protocol`,
                journeyId: journey.id,
            });
            continue;
        }
        if (walk.pending) {
            add({
                level: "warning",
                message: `Journey “${journey.title}” stops at ${walk.pending.nodeId}: pick one of its ${walk.pending.options.length} ${walk.pending.kind === "decision" ? "cases" : "alternatives"}`,
                journeyId: journey.id,
                nodeId: walk.pending.nodeId,
            });
        }
        if (journey.exit !== undefined && !walk.nodeIds.includes(journey.exit)) {
            add({
                level: "warning",
                message: `Journey “${journey.title}” finishes at ${journey.exit}, which is not on its path — it runs to the end instead`,
                journeyId: journey.id,
                nodeId: flat.byId.has(journey.exit) ? journey.exit : undefined,
            });
        } else if (journey.exit !== undefined) {
            const exit = flat.byId.get(journey.exit);
            if (exit && !canFinishAt(flat, exit)) {
                add({
                    level: "warning",
                    message: `Journey “${journey.title}” finishes at ${journey.exit}, which isn't marked End — mark it, if a transaction may stop there`,
                    journeyId: journey.id,
                    nodeId: exit.id,
                });
            }
        }
        if (walk.end === "cycle" || walk.end === "limit") {
            add({
                level: "info",
                message: `Journey “${journey.title}” loops; the preview stops at the repeat cap`,
                journeyId: journey.id,
            });
        }
        if (!journey.title.trim()) {
            add({
                level: "warning",
                message: `Journey ${journey.id} has no title`,
                journeyId: journey.id,
            });
        }
        for (const nodeId of journey.skips ?? []) {
            const node = flat.byId.get(nodeId);
            if (!node) continue;
            if (!node.optional) {
                add({
                    level: "warning",
                    message: `Journey “${journey.title}” skips ${nodeId}, which is not optional: the skip is ignored`,
                    journeyId: journey.id,
                    nodeId,
                });
            }
        }
        const key = walk.nodeIds.join(">");
        const other = keys.get(key);
        if (other && !walk.pending) {
            add({
                level: "info",
                message: `Journey “${journey.title}” walks the same path as “${other}”`,
                journeyId: journey.id,
            });
        } else keys.set(key, journey.title);
    }
    if (journeys.length > 0) {
        const coverage = getCoverage(flat, journeys);
        for (const { fork, option } of coverage.uncovered) {
            add({
                level: "warning",
                message: `No journey takes ${fork.nodeId} → ${option.target.id} (${option.label})`,
                nodeId: fork.nodeId,
                edgeId: option.edge.id,
            });
        }
    }
    return problems;
};

/** A slug no other journey has: `out_of_stock`, `out_of_stock_2`, … */
export const getJourneyId = (title: string, taken: ReadonlySet<string>) => {
    const base =
        title
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "") || "journey";
    if (!taken.has(base)) return base;
    let n = 2;
    while (taken.has(`${base}_${n}`)) n += 1;
    return `${base}_${n}`;
};

/** The node a new journey starts at: the first entry (nothing wires into it), preferring a request. */
export const getDefaultEntry = (flat: FlatGraph): StudioNode | undefined => {
    const entries = getEntryNodes(flat).filter((node) => node.kind !== "on_demand");
    return entries.find((node) => node.kind === "request") ?? entries[0] ?? flat.nodes[0];
};

export const createJourney = (
    id: string,
    title: string,
    entry: string,
    extra: Partial<StudioJourney> = {}
): StudioJourney => ({
    id,
    title,
    description: "",
    tags: [],
    entry,
    choices: {},
    expects: {},
    onDemand: [],
    ...extra,
});
