import type { ExecutionResult, MockPlaygroundConfigType } from "@ondc/automation-mock-runner";

import type { OpenAITool } from "../client/types";
import type { ProposeEditPayload } from "../hooks/use-pending-approvals";

export interface ApprovalOutcome {
    applied: boolean;
}

export interface ToolContext {
    config: MockPlaygroundConfigType | undefined;
    activeApi: string | undefined;
    terminalTail: ExecutionResult[];
    /** Unique id for the in-flight tool call. Lets write-tools key approvals. */
    toolCallId?: string;
    /** Bridge to the playground's step-write path. Only present in chat ctx. */
    updateStepMock?: (stepId: string, property: string, value: string) => void;
    /** Bridge to the human-in-the-loop approval queue. Only present in chat ctx. */
    requestApproval?: (
        toolCallId: string,
        payload?: ProposeEditPayload
    ) => Promise<ApprovalOutcome>;
}

export interface Tool<Args = unknown, Result = unknown> {
    name: string;
    description: OpenAITool;
    execute: (args: Args, ctx: ToolContext) => Promise<Result> | Result;
}

export interface ToolExecutionSuccess<Result = unknown> {
    ok: true;
    result: Result;
    resultText: string;
}

export interface ToolExecutionFailure {
    ok: false;
    errorText: string;
}

export type ToolExecutionOutcome<Result = unknown> =
    | ToolExecutionSuccess<Result>
    | ToolExecutionFailure;
