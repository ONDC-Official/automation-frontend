import type { DriverLogV2, GraphRunStateV2, NodeRunStatusV2 } from "@ondc/automation-mock-runner";
// Raw shape of a single form field descriptor as returned by the API. The UI-specific
// `FormConfigType` (widget variants, RJSF schema, etc.) is owned by the form renderer,
// not the API layer — callers cast into it at the point of consumption.
export type IFlowFormFieldConfig = Record<string, unknown>;

export interface IFlowResponse {
    inputs?: IFlowFormFieldConfig[];
    // Playground mock returns these from /flows/proceed (actUponFlow → sendSuccess). HTTP is
    // always 200, so callers must inspect `success` to know whether the action actually dispatched.
    success?: boolean;
    message?: string;
    jobIds?: string[];
    [key: string]: unknown;
}

export interface IActionsResponse {
    actions: string[];
}

export interface RouteResponse {
    geometry: [number, number][]; // [lat, lng] points, road-following
    distance: number; // metres
    duration: number; // seconds
}

export interface GeocodeResult {
    name: string;
    lat: number;
    lng: number;
}

/** What a public ride-tracking token resolves to (`GET /flow/track-context`). */
export interface TrackContextResponse {
    session_id: string;
    transaction_id: string;
    domain: string;
    version: string;
}

/** What the mock service answers to new / proceed on a Protocol Studio live session. */
export interface IStudioLiveActionResponse {
    success: boolean;
    message: string;
    transactionId?: string;
    jobIds?: string[];
    /** The step waits for tester inputs. */
    inputs?: { nodeId: string; schema: unknown; extra?: boolean };
    /**
     * The participant opens the journey, so it has no transaction yet: the session's
     * flowMap names it once the participant's first request reaches the api-service.
     */
    awaiting?: { nodeId: string; api: string };
}

/** One payload's sync exchange on a Protocol Studio live run. */
export interface IStudioLiveExchange {
    payloadId: string;
    ack: string;
    response: unknown;
    timestamp: string;
}

/** `GET /flow/current-state` for a Protocol Studio live session (engine graph-v2). */
export interface IStudioLiveStatus {
    engine: "graph-v2";
    sessionId: string;
    journeyId: string;
    transactionId: string;
    /** The side the mock plays. */
    plays: "BAP" | "BPP" | "both";
    /** The mock is running steps right now. */
    working: boolean;
    state: GraphRunStateV2;
    status: Record<string, NodeRunStatusV2>;
    plan:
        | { kind: "run" | "skip" | "form"; nodeId: string }
        | { kind: "inputs"; nodeId: string; schema: unknown }
        | { kind: "await"; nodeId: string; candidates: string[] }
        | { kind: "fork"; nodeId: string; options: string[] }
        | { kind: "end"; canEnd: boolean; reason?: string }
        | { kind: "failed"; nodeId: string; reason: string }
        | { kind: "stopped"; reason: string };
    next: { end: boolean; canEnd: boolean; onDemand: string[] };
    sessionData: Record<string, unknown>;
    /** `${action}::${messageId}` → the participant's sync ACK / NACK. */
    acks: Record<string, string>;
    /**
     * `${action}::${messageId}` → the sync exchange the api-service recorded for
     * that payload: the participant's response to what the mock sent, the mock's
     * to what the participant sent. Absent from mock services before it was added.
     */
    exchanges?: Record<string, IStudioLiveExchange>;
    rejected: {
        ts: string;
        action?: string;
        messageId?: string;
        reason: string;
        payload: unknown;
    }[];
    logs: (DriverLogV2 & { ts: string })[];
    /** The session's step-through setting (absent from mock services before it was added). */
    stepThrough?: boolean;
    /** Step-through holds the run before this node's payload until Run step. */
    paused?: string | null;
    /** What the api-service made of each payload the mock sent (also merged into `logs`). */
    deliveries?: (DriverLogV2 & { ts: string; action: string; statusCode?: number })[];
}
