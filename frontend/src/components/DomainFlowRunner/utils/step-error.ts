import type { MappedStep } from "@/types/flow-state-type";

/**
 * When the workbench rejects the participant's on_X response, it sends the paired X request
 * again with an `error` block, so X's request count climbs to 2+. The error therefore lives in
 * the LAST request of that step, and it is about the step's pair (the participant's payload).
 */

export interface ErroredStep {
    actionId: string;
    /** Action whose request count went up, e.g. "init". */
    actionType: string;
    /** Action the error is about — the participant's payload, e.g. "on_init". */
    pairLabel: string;
    /** Payload id of the last request (the one carrying the error). */
    lastPayloadId: string;
    /** All request payload ids of the step, oldest first. */
    payloadIds: string[];
    /** 1-based number of the last request, e.g. 2 for "request #2". */
    requestNumber: number;
}

export interface RequestError {
    code: string;
    message: string;
}

/** Action type of the step's pair, falling back to on_<action> / <action without on_>. */
export function pairLabel(step: MappedStep, sequence: MappedStep[]): string {
    const pair = step.pairActionId
        ? sequence.find((s) => s.actionId === step.pairActionId)
        : undefined;
    if (pair?.actionType) return pair.actionType;
    return step.actionType.startsWith("on_") ? step.actionType.slice(3) : `on_${step.actionType}`;
}

/** Completed API steps whose request count is 2 or more. */
export function findErroredSteps(sequence: MappedStep[] | undefined): ErroredStep[] {
    if (!sequence) return [];
    const result: ErroredStep[] = [];
    for (const step of sequence) {
        const history = step.payloads;
        if (step.status !== "COMPLETE" || history?.entryType !== "API") continue;
        const payloadIds = history.payloads.map((p) => p.payloadId).filter(Boolean);
        if (payloadIds.length < 2) continue;
        result.push({
            actionId: step.actionId,
            actionType: step.actionType,
            pairLabel: pairLabel(step, sequence),
            lastPayloadId: payloadIds[payloadIds.length - 1],
            payloadIds,
            requestNumber: payloadIds.length,
        });
    }
    return result;
}

/** `error.code` / `error.message` from a request body, or null when it carries no error. */
export function extractRequestError(req: unknown): RequestError | null {
    if (!req || typeof req !== "object") return null;
    const error = (req as { error?: unknown }).error;
    if (!error || typeof error !== "object") return null;
    const { code, message } = error as { code?: unknown; message?: unknown };
    const text = typeof message === "string" ? message.trim() : "";
    const codeText = typeof code === "string" || typeof code === "number" ? String(code) : "";
    if (!text && !codeText) return null;
    return { code: codeText, message: text || "No error message provided" };
}
