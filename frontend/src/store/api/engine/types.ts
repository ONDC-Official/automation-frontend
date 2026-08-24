import type { FlowMap } from "@/types/flow-state-type";

/**
 * What an `ondc-mcp` engine serves at `/ui/api`.
 *
 * ## The one that matters: `map` is a `FlowMap`
 *
 * Not a coincidence and not a conversion. `ondc-mcp`'s flow engine is a
 * near-verbatim port of the workbench mapper this app's step renderer was
 * written against, so it produces the same `MappedStep` shape and serves it
 * before projecting it into anything smaller. That is why `getOrderedSteps` and
 * the paired step cards work against it unchanged.
 *
 * The engine has a test that transcribes `flow-state-type.ts` literally and
 * asserts its JSON satisfies it, because this contract breaks **silently**: a
 * field it stops sending renders an empty step list here, and the obvious
 * conclusion is that the engine is broken. If you change the types in
 * `flow-state-type.ts`, that test is the other half of the change.
 */

export type McpNpType = "BAP" | "BPP";

export type McpFlowStatus = "IN_PROGRESS" | "COMPLETE" | "BLOCKED" | "NOT_STARTED";

export type McpOutcome =
    | "SENT"
    | "DRAFTED"
    | "READY"
    | "INPUT_REQUIRED"
    | "FORM_PENDING"
    | "WAITING"
    | "COMPLETE"
    | "BLOCKED";

export interface McpSession {
    session_id: string;
    created_at: string;
    expires_at: string;
    np: {
        subscriber_url: string;
        subscriber_id?: string;
        type: McpNpType;
    };
    /** The side the engine plays — always the opposite of `np.type`. */
    mock_role: McpNpType;
    build: { domain: string; version: string; usecase: string };
    interaction_mode: "llm_auto" | "manual";
    auto_advance: boolean;
    /** The URI the participant sends its callbacks to. */
    callback_url: string;
}

export interface McpFlowSummary {
    flow_id: string;
    description: string;
    tags: string[];
    step_count: number;
    actions: string[];
    mock_steps: number;
    np_steps: number;
    form_steps: number;
    has_extra_sequence: boolean;
}

export interface McpRun {
    flow_id: string;
    /** Null until the flow's first action crosses the wire — see the engine. */
    transaction_id: string | null;
    attempt: number;
    started_at: string;
    auto_advance: boolean;
    flow_status?: McpFlowStatus;
    steps_total?: number;
    steps_complete?: number;
    next_outcome?: McpOutcome;
    next_message?: string;
    /** Set when this one run could not be read; the others still rendered. */
    error?: string;
}

export interface McpSessionResponse {
    session: McpSession;
    /** Every flow published for the build, whether or not a run exists. */
    flows: McpFlowSummary[];
    runs: McpRun[];
    transaction_ids: string[];
    /** Journal position, so a stream can start exactly where this read stopped. */
    seq: number;
}

export interface McpFlowResponse {
    transaction_id: string | null;
    flow_id: string;
    flow_status: McpFlowStatus;
    mock_role: McpNpType;
    attempt: number;
    abandoned?: { at: string; attempt: number; reason?: string };
    seq: number;
    attention?: { kind: string; message: string; step_key?: string; at: string };
    next: {
        outcome: McpOutcome;
        message: string;
        step_key?: string;
        action?: string;
        expected_action?: string;
        reason?: string;
    };
    reference_data_keys: string[];
    map: FlowMap;
}

export interface McpPayloadResponse {
    payload_id: string;
    transaction_id: string;
    action: string;
    direction: "outbound" | "inbound";
    message_id: string;
    timestamp: string;
    http_status?: number;
    /** The protocol payload that crossed the wire, in whichever direction. */
    req: unknown;
    /** The synchronous ACK/NACK exchanged for it. */
    res: { response: unknown };
}

export interface McpDataResponse {
    transaction_id: string;
    data: Record<string, unknown>;
}

/** One line of the engine's session journal. */
export interface McpEvent {
    seq: number;
    at: string;
    kind: string;
    flow_id?: string;
    transaction_id?: string;
    action?: string;
    ack?: "ACK" | "NACK";
    nack_code?: string;
    payload_id?: string;
    overrides?: string[];
    summary: string;
}

export interface McpEventsResponse {
    events: McpEvent[];
    seq: number;
}
