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
    actionApi: string;
    useCaseId?: string;
    flowId?: string;
}
