import type {
    GraphExecutorV2,
    JourneyV2,
    LiveGraphConfigV2,
    MockPlaygroundConfigV2Type,
} from "@ondc/automation-mock-runner";

import { ROUTES } from "@constants/routes";
import type { Flow, SequenceStep } from "@/types/flow-types";
import type { SessionCache } from "@/types/session-types";
import { walkJourney } from "@pages/protocol-studio/ui/editor/journeys/derive";
import type {
    FlatGraph,
    StudioGraph,
    StudioJourney,
    StudioNode,
} from "@pages/protocol-studio/ui/editor/types";
import { toJourneyV2 } from "@pages/protocol-studio/hooks/use-studio-run";

/** What the live page needs besides the executor's document: the layout and the journeys as Studio holds them. */
export interface LiveSessionViewV2 {
    /** The root graph with every node's `files` dropped (the compiled code is in `graph`). */
    root: StudioGraph;
    journeys: StudioJourney[];
}

export type StudioLiveConfig = LiveGraphConfigV2 & { view: LiveSessionViewV2 };

/** Why a journey cannot go live, or null when it can. */
export const getLiveBlocker = (flat: FlatGraph, journey: StudioJourney): string | null => {
    const walk = walkJourney(flat, journey);
    if (walk.end === "no-entry") return "Its entry is not on the graph";
    if (walk.end === "fork") return "A fork on its path has no choice";
    if (walk.nodeIds.length === 0) return "It has no steps";
    return null;
};

/** Layout only: `files` hold TypeScript sources the live page never shows. */
const stripFiles = (graph: StudioGraph): StudioGraph => ({
    ...graph,
    nodes: graph.nodes.map((node) => {
        const { files: _files, ...rest } = node;
        return {
            ...rest,
            files: {} as StudioNode["files"],
            ...(node.group
                ? { group: { ...node.group, graph: stripFiles(node.group.graph) } }
                : {}),
        };
    }),
});

/** The journey as a v1 flow: what session listings and the flow proxies expect to find. */
const toFlow = (flat: FlatGraph, journey: StudioJourney): Flow => {
    const walk = walkJourney(flat, journey);
    const sequence: SequenceStep[] = [];
    for (const step of walk.steps) {
        if (step.type !== "node" || step.skipped || step.node.kind === "decision") continue;
        const node = step.node;
        sequence.push({
            key: node.id,
            type: node.api,
            unsolicited: node.kind === "unsolicited",
            description: node.description,
            pair: null,
            owner: node.owner,
        });
    }
    return {
        id: journey.id,
        title: journey.title,
        description: journey.description ?? "",
        sequence,
        extraSequence: walk.onDemand.map((node) => ({
            key: node.id,
            type: node.api,
            unsolicited: false,
            description: node.description,
            pair: null,
            owner: node.owner,
        })),
    };
};

export interface IBuildStudioLiveSessionArgs {
    config: MockPlaygroundConfigV2Type;
    /** The compiled graph's executor: its graph, transaction data and helpers are what runs live. */
    executor: GraphExecutorV2;
    root: StudioGraph;
    flat: FlatGraph;
    journeys: StudioJourney[];
    subscriberUrl: string;
    role: "BAP" | "BPP";
}

/** The request body of `POST /sessions/studio`. */
export const buildStudioLiveSession = ({
    config,
    executor,
    root,
    flat,
    journeys,
    subscriberUrl,
    role,
}: IBuildStudioLiveSessionArgs): { sessionData: SessionCache; studioConfig: StudioLiveConfig } => {
    const journeysV2: JourneyV2[] = journeys.map(toJourneyV2);
    const studioConfig: StudioLiveConfig = {
        kind: "graph-v2-live",
        meta: config.meta,
        transaction_data: executor.options.transactionData,
        ...(executor.options.helperLib ? { helperLib: executor.options.helperLib } : {}),
        graph: executor.graph,
        journeys: journeysV2,
        view: { root: stripFiles(root), journeys },
    };
    const sessionData: SessionCache = {
        transactionIds: [],
        flowMap: {},
        subscriberUrl,
        npType: role,
        domain: config.meta.domain,
        version: config.meta.version,
        usecaseId: "PLAYGROUND-FLOW",
        env: "LOGGED-IN",
        sessionDifficulty: {
            sensitiveTTL: false,
            useGateway: false,
            stopAfterFirstNack: false,
            protocolValidations: true,
            timeValidations: true,
            headerValidaton: false,
            useGzip: false,
            encryptionValidation: false,
            useCare: false,
        },
        flowConfigs: Object.fromEntries(journeys.map((j) => [j.id, toFlow(flat, j)])),
        activeFlow: null,
    };
    return { sessionData, studioConfig };
};

/** The live page of a session, opened in a new tab like v1's `/flow-testing`. */
export const getLivePageUrl = (sessionId: string, subscriberUrl: string, role: "BAP" | "BPP") =>
    `${window.location.origin}${ROUTES.STUDIO_LIVE}?sessionId=${encodeURIComponent(sessionId)}&subscriberUrl=${encodeURIComponent(subscriberUrl)}&role=${role}`;
