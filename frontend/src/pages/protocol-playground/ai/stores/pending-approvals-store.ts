import { toast } from "sonner";

const APPROVAL_TIMEOUT_MS = 120_000;

export interface ApprovalOutcome {
    applied: boolean;
}

export interface ProposeEditPayload {
    step_id: string;
    file: "generate" | "validate" | "requirements" | "formHtml";
    new_code: string;
    rationale: string;
}

export interface PendingApproval {
    toolCallId: string;
    payload?: ProposeEditPayload;
}

export interface PendingApprovalsSnapshot {
    pending: PendingApproval[];
    isPending: (toolCallId: string) => boolean;
    request: (toolCallId: string, payload?: ProposeEditPayload) => Promise<ApprovalOutcome>;
    resolve: (toolCallId: string, applied: boolean) => void;
    cancelAll: (applied?: boolean) => void;
}

interface ApprovalEntry {
    resolve: (outcome: ApprovalOutcome) => void;
    payload?: ProposeEditPayload;
}

const entries = new Map<string, ApprovalEntry>();
let pending: PendingApproval[] = [];
const listeners = new Set<() => void>();

let storeVersion = 0;
let cachedPendingVersion = -1;
let cachedPending: PendingApproval[] = [];

function emit() {
    storeVersion += 1;
    listeners.forEach((listener) => listener());
}

function getPendingListSnapshot(): PendingApproval[] {
    if (cachedPendingVersion !== storeVersion) {
        cachedPendingVersion = storeVersion;
        cachedPending = pending;
    }
    return cachedPending;
}

function finish(toolCallId: string, applied: boolean) {
    const entry = entries.get(toolCallId);
    if (!entry) return;
    entries.delete(toolCallId);
    pending = pending.filter((item) => item.toolCallId !== toolCallId);
    emit();
    entry.resolve({ applied });
}

export function isPendingApproval(toolCallId: string) {
    return pending.some((item) => item.toolCallId === toolCallId);
}

export function requestApproval(
    toolCallId: string,
    payload?: ProposeEditPayload
): Promise<ApprovalOutcome> {
    return new Promise<ApprovalOutcome>((resolvePromise) => {
        entries.set(toolCallId, { resolve: resolvePromise, payload });
        pending = [...pending, { toolCallId, payload }];
        emit();
        setTimeout(() => {
            if (!entries.has(toolCallId)) return;
            finish(toolCallId, false);
            toast.warning("Approval timed out — proposed edit auto-rejected.");
        }, APPROVAL_TIMEOUT_MS);
    });
}

export function resolveApproval(toolCallId: string, applied: boolean) {
    finish(toolCallId, applied);
}

export function cancelAllApprovals(applied = false) {
    const ids = Array.from(entries.keys());
    for (const id of ids) {
        const entry = entries.get(id);
        entries.delete(id);
        entry?.resolve({ applied });
    }
    pending = [];
    emit();
}

export function subscribePendingApprovals(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function getPendingApprovalsListSnapshot() {
    return getPendingListSnapshot();
}
