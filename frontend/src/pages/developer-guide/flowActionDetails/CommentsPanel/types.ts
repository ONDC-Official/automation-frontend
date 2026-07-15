export type { CommentScope, FlowCommentScope, DocumentCommentScope } from "@/types/comment-scope";

export interface CommentReply {
    id: string;
    text: string;
    author: string;
    createdAt: number;
}

export interface CommentThread {
    id: string;
    path: string;
    text: string;
    author: string;
    createdAt: number;
    resolved: boolean;
    resolvedAt?: number;
    replies: CommentReply[];
}

export interface CommentsPanelProps {
    selectedPath: string | null;
    /** Explicit scope for API calls (preferred). */
    commentScope?: import("@/types/comment-scope").CommentScope;
    /** Legacy flow props — used when commentScope is omitted. */
    actionApi?: string;
    useCaseId?: string;
    flowId?: string;
    domain?: string;
    version?: string;
    /** Human-readable label for the selected anchor (e.g. section title). */
    selectionLabel?: string;
    /** Resolves a comment's anchor path to a human-readable label (e.g. section title), when available. */
    resolvePathLabel?: (path: string) => string | undefined;
    emptySelectionMessage?: string;
}
