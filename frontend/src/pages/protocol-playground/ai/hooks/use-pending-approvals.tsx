import { useMemo, useSyncExternalStore } from "react";
import {
    cancelAllApprovals,
    getPendingApprovalsListSnapshot,
    isPendingApproval,
    requestApproval,
    resolveApproval,
    subscribePendingApprovals,
    type PendingApprovalsSnapshot,
} from "../stores/pending-approvals-store";

export type {
    ApprovalOutcome,
    PendingApproval,
    ProposeEditPayload,
} from "../stores/pending-approvals-store";

export function usePendingApprovals(): PendingApprovalsSnapshot {
    const pending = useSyncExternalStore(
        subscribePendingApprovals,
        getPendingApprovalsListSnapshot,
        getPendingApprovalsListSnapshot
    );

    return useMemo(
        () => ({
            pending,
            isPending: isPendingApproval,
            request: requestApproval,
            resolve: resolveApproval,
            cancelAll: cancelAllApprovals,
        }),
        [pending]
    );
}
