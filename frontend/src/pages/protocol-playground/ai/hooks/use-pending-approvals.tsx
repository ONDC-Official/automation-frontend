import {
    Context,
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from "react";
import { toast } from "sonner";

// Auto-reject if the user never responds. Without this, an ignored approval
// modal blocks the tool's await forever, which freezes the agent loop and
// keeps isStreaming=true with no way to recover except a page reload.
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

interface ApprovalEntry {
    resolve: (outcome: ApprovalOutcome) => void;
    payload?: ProposeEditPayload;
}

interface PendingApprovalsContextProps {
    isPending: (toolCallId: string) => boolean;
    pending: PendingApproval[];
    request: (toolCallId: string, payload?: ProposeEditPayload) => Promise<ApprovalOutcome>;
    resolve: (toolCallId: string, applied: boolean) => void;
    cancelAll: (applied?: boolean) => void;
}

export const PendingApprovalsContext: Context<PendingApprovalsContextProps> =
    createContext<PendingApprovalsContextProps>({
        isPending: () => false,
        pending: [],
        request: () => Promise.resolve({ applied: false }),
        resolve: () => {},
        cancelAll: () => {},
    });

export function usePendingApprovals() {
    return useContext(PendingApprovalsContext);
}

export function PendingApprovalsProvider({ children }: { children: ReactNode }) {
    const entriesRef = useRef<Map<string, ApprovalEntry>>(new Map());
    const [pending, setPending] = useState<PendingApproval[]>([]);

    const isPending = useCallback(
        (toolCallId: string) => pending.some((p) => p.toolCallId === toolCallId),
        [pending]
    );

    const finish = useCallback((toolCallId: string, applied: boolean) => {
        const entry = entriesRef.current.get(toolCallId);
        if (!entry) return;
        entriesRef.current.delete(toolCallId);
        setPending((prev) => prev.filter((p) => p.toolCallId !== toolCallId));
        entry.resolve({ applied });
    }, []);

    const request = useCallback(
        (toolCallId: string, payload?: ProposeEditPayload): Promise<ApprovalOutcome> => {
            return new Promise<ApprovalOutcome>((resolve) => {
                entriesRef.current.set(toolCallId, { resolve, payload });
                setPending((prev) => [...prev, { toolCallId, payload }]);
                setTimeout(() => {
                    if (!entriesRef.current.has(toolCallId)) return;
                    finish(toolCallId, false);
                    toast.warning("Approval timed out — proposed edit auto-rejected.");
                }, APPROVAL_TIMEOUT_MS);
            });
        },
        [finish]
    );

    const resolve = useCallback(
        (toolCallId: string, applied: boolean) => finish(toolCallId, applied),
        [finish]
    );

    const cancelAll = useCallback((applied = false) => {
        const ids = Array.from(entriesRef.current.keys());
        for (const id of ids) {
            const entry = entriesRef.current.get(id);
            entriesRef.current.delete(id);
            entry?.resolve({ applied });
        }
        setPending([]);
    }, []);

    const value = useMemo(
        () => ({ isPending, pending, request, resolve, cancelAll }),
        [isPending, pending, request, resolve, cancelAll]
    );

    return (
        <PendingApprovalsContext.Provider value={value}>
            {children}
        </PendingApprovalsContext.Provider>
    );
}
