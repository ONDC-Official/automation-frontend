import { FC, useState, useCallback, useEffect, useContext } from "react";
import * as commentsApi from "@services/developerGuideCommentsApi";
import type { CommentResponse } from "@services/developerGuideCommentsApi";
import Loader from "@/components/ui/mini-components/loader";
import { UserContext } from "@context/userContext";

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

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_AUTHOR = "You";

function formatDateTime(ts: number): string {
    const d = new Date(ts);
    const dateStr = d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
    const timeStr = d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
    });
    return `${dateStr}, ${timeStr}`;
}

function apiCommentToThread(r: CommentResponse): CommentThread {
    return {
        id: r._id,
        path: r.json_path ?? "$",
        text: r.comment ?? "",
        author: r.user?.username ?? DEFAULT_AUTHOR,
        createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
        resolved: r.resolved ?? false,
        replies: (r.replies ?? []).map((reply) => ({
            id: reply._id,
            text: reply.comment ?? "",
            author: r.user?.username ?? DEFAULT_AUTHOR,
            createdAt: reply.created_at ? new Date(reply.created_at).getTime() : Date.now(),
        })),
    };
}

interface CommentsPanelProps {
    selectedPath: string | null;
    actionApi: string;
    useCaseId?: string;
    flowId?: string;
}

const CommentsPanel: FC<CommentsPanelProps> = ({ selectedPath, actionApi, useCaseId, flowId }) => {
    const { isLoggedIn } = useContext(UserContext);
    const useApi = Boolean(flowId && useCaseId);
    const [threads, setThreads] = useState<CommentThread[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newCommentText, setNewCommentText] = useState("");
    const [replyTextByThreadId, setReplyTextByThreadId] = useState<Record<string, string>>({});
    const [replyingToId, setReplyingToId] = useState<string | null>(null);

    const fetchComments = useCallback(
        async (showLoader = true) => {
            if (!useApi || !flowId || !useCaseId) return;
            if (showLoader) setLoading(true);
            setError(null);
            try {
                const res = await commentsApi.getComments({
                    use_case_id: useCaseId,
                    flow_id: flowId,
                    action_id: actionApi,
                });
                const list = Array.isArray(res.data) ? res.data : [];

                // separate parents and replies
                const parents = list.filter((r) => !r.parent_comment_id);
                const replies = list.filter((r) => r.parent_comment_id);

                const threads = parents.map((r) => {
                    const threadReplies = replies.filter((rep) => rep.parent_comment_id === r._id);
                    return {
                        ...apiCommentToThread(r),
                        replies: threadReplies.map((rep) => ({
                            id: rep._id,
                            text: rep.comment ?? "",
                            author: DEFAULT_AUTHOR,
                            createdAt: rep.created_at
                                ? new Date(rep.created_at).getTime()
                                : Date.now(),
                        })),
                    };
                });

                setThreads(threads);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load comments");
            } finally {
                if (showLoader) setLoading(false);
            }
        },
        [useApi, flowId, useCaseId, actionApi]
    );

    useEffect(() => {
        if (useApi) {
            void fetchComments();
        }
    }, [actionApi, useCaseId, flowId, useApi, fetchComments]);

    const persist = useCallback(
        (next: CommentThread[]) => {
            setThreads(next);
        },
        [actionApi, useCaseId, useApi]
    );

    const addComment = useCallback(async () => {
        if (!isLoggedIn) return;
        const path = selectedPath ?? "$";
        const text = newCommentText.trim();
        if (!text) return;

        if (useApi && flowId && useCaseId) {
            setError(null);
            try {
                await commentsApi.createComment({
                    use_case_id: useCaseId,
                    flow_id: flowId,
                    action_id: actionApi,
                    json_path: path,
                    comment: text,
                });
                await fetchComments();
                setNewCommentText("");
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to post comment");
            }
        } else {
            const thread: CommentThread = {
                id: generateId(),
                path,
                text,
                author: DEFAULT_AUTHOR,
                createdAt: Date.now(),
                resolved: false,
                replies: [],
            };
            persist([thread, ...threads]);
            setNewCommentText("");
        }
    }, [
        isLoggedIn,
        selectedPath,
        newCommentText,
        threads,
        persist,
        useApi,
        flowId,
        useCaseId,
        actionApi,
        fetchComments,
    ]);

    const addReply = useCallback(
        async (threadId: string) => {
            if (!isLoggedIn) return;
            const text = (replyTextByThreadId[threadId] ?? "").trim();
            if (!text) return;

            if (useApi && flowId && useCaseId) {
                setError(null);
                try {
                    await commentsApi.replyToComment({
                        use_case_id: useCaseId,
                        flow_id: flowId,
                        action_id: actionApi,
                        json_path: selectedPath ?? "$",
                        comment: text,
                        parent_comment_id: threadId,
                    });
                    await fetchComments(false);
                    setReplyTextByThreadId((prev) => ({ ...prev, [threadId]: "" }));
                    setReplyingToId(null);
                } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to post reply");
                }
            } else {
                const next = threads.map((t) => {
                    if (t.id !== threadId) return t;
                    return {
                        ...t,
                        replies: [
                            ...t.replies,
                            {
                                id: generateId(),
                                text,
                                author: DEFAULT_AUTHOR,
                                createdAt: Date.now(),
                            },
                        ],
                    };
                });
                persist(next);
                setReplyTextByThreadId((prev) => ({ ...prev, [threadId]: "" }));
                setReplyingToId(null);
            }
        },
        [
            isLoggedIn,
            threads,
            replyTextByThreadId,
            persist,
            useApi,
            flowId,
            useCaseId,
            actionApi, // 👈 this was missing
            selectedPath,
            fetchComments,
        ]
    );

    const toggleResolved = useCallback(
        async (threadId: string) => {
            const thread = threads.find((t) => t.id === threadId);
            if (!thread) return;
            const newResolved = !thread.resolved;

            if (useApi && flowId && useCaseId) {
                setError(null);
                try {
                    await commentsApi.resolveComment(threadId, newResolved);
                    await fetchComments(false);
                } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to update comment");
                }
            } else {
                const next = threads.map((t) => {
                    if (t.id !== threadId) return t;
                    return {
                        ...t,
                        resolved: newResolved,
                        resolvedAt: newResolved ? Date.now() : undefined,
                    };
                });
                persist(next);
            }
        },
        [threads, persist, useApi, flowId, useCaseId, actionApi, fetchComments]
    );

    const deleteThread = useCallback(
        async (threadId: string) => {
            if (useApi && flowId && useCaseId) {
                setError(null);
                try {
                    await commentsApi.deleteComment(threadId);
                    await fetchComments();
                } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to delete comment");
                }
            } else {
                persist(threads.filter((t) => t.id !== threadId));
            }
        },
        [threads, persist, useApi, flowId, useCaseId, actionApi, fetchComments]
    );

    const filteredThreads = threads;
    const hasSelection = selectedPath != null;

    if (!isLoggedIn) {
        return (
            <div className="h-full flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
                    <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0">
                        Comments
                    </h3>
                </div>
                <div className="flex-1 min-h-0 overflow-auto p-4 flex items-center justify-center">
                    <p className="text-sm text-slate-500">Please login to view comments.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
                <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0">
                    Comments
                </h3>
            </div>
            <div className="flex-1 min-h-0 overflow-auto p-4">
                {error && (
                    <div className="shrink-0 mb-3 px-3 py-2 rounded-xl bg-red-50 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="h-full shrink-0 mb-3 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm">
                        <Loader />
                    </div>
                ) : (
                    <>
                        {/* Minimal header */}
                        {hasSelection && (
                            <div className="flex items-center gap-2 mb-3 shrink-0 break-all">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-700 font-mono text-xs">
                                    {selectedPath}
                                </span>
                            </div>
                        )}

                        {/* Add comment — floating card (only when logged in) */}
                        {hasSelection && !isLoggedIn && (
                            <div className="shrink-0 mb-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                                <p className="text-sm text-slate-500">Sign in to add comments.</p>
                            </div>
                        )}
                        {hasSelection && isLoggedIn && (
                            <div className="shrink-0 mb-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                                <textarea
                                    value={newCommentText}
                                    onChange={(e) => setNewCommentText(e.target.value)}
                                    placeholder="Write a comment..."
                                    rows={2}
                                    className="w-full px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-slate-50/80 rounded-xl border-0 focus:ring-2 focus:ring-sky-500/20 focus:bg-white resize-none transition-colors"
                                />
                                <div className="flex justify-end mt-2">
                                    <button
                                        type="button"
                                        onClick={addComment}
                                        disabled={!newCommentText.trim()}
                                        className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-xl hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        Post
                                    </button>
                                </div>
                            </div>
                        )}

                        {!hasSelection && filteredThreads.length === 0 && newCommentText === "" && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                                    <svg
                                        className="w-6 h-6 text-slate-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                        />
                                    </svg>
                                </div>
                                <p className="text-sm text-slate-500">
                                    Select a key in the JSON tree to add comments.
                                </p>
                            </div>
                        )}

                        {/* Thread list — floating cards */}
                        <div className="flex-1 overflow-auto space-y-3 min-h-0">
                            {/* Comments for selected path */}
                            {hasSelection && (
                                <div className="shrink-0 mb-4">
                                    <p className="text-sm text-slate-700 mb-2 break-all">
                                        Comments on{" "}
                                        <span className="text-sky-600 font-mono normal-case">
                                            {selectedPath}
                                        </span>
                                    </p>
                                    {threads.filter((t) => t.path === selectedPath).length === 0 ? (
                                        <p className="text-sm text-slate-400 py-2">
                                            No comments on this path yet.
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {threads
                                                .filter((t) => t.path === selectedPath)
                                                .map((thread) => (
                                                    <div
                                                        key={thread.id}
                                                        className={`p-4 rounded-2xl border shadow-sm transition-all ${
                                                            thread.resolved
                                                                ? "bg-slate-50/80 border-slate-100"
                                                                : "bg-white border-slate-200/80"
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap flex-1 min-w-0">
                                                                {thread.text}
                                                            </p>
                                                            <div className="flex items-center gap-1 shrink-0 opacity-80 hover:opacity-100">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        toggleResolved(thread.id)
                                                                    }
                                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-500/10 transition-colors"
                                                                    title={
                                                                        thread.resolved
                                                                            ? "Reopen"
                                                                            : "Resolve"
                                                                    }
                                                                >
                                                                    {thread.resolved ? (
                                                                        <span className="text-[10px] font-medium uppercase text-emerald-600">
                                                                            Resolved
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[10px] font-medium uppercase">
                                                                            Resolve
                                                                        </span>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        deleteThread(thread.id)
                                                                    }
                                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <svg
                                                                        className="w-4 h-4"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        stroke="currentColor"
                                                                        strokeWidth={2}
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-emerald-700 mt-2">
                                                            {thread.author} ·{" "}
                                                            {formatDateTime(thread.createdAt)}
                                                        </p>

                                                        {thread.replies.length > 0 && (
                                                            <div className="mt-3 ml-2 pl-3 border-l-2 border-slate-100 space-y-2">
                                                                {thread.replies.map((reply) => (
                                                                    <div key={reply.id}>
                                                                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                                            {reply.text}
                                                                        </p>
                                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                                            {reply.author} ·{" "}
                                                                            {formatDateTime(
                                                                                reply.createdAt
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {!thread.resolved && (
                                                            <div className="mt-3">
                                                                {replyingToId === thread.id ? (
                                                                    <div className="rounded-xl bg-slate-50/80 p-2">
                                                                        <textarea
                                                                            value={
                                                                                replyTextByThreadId[
                                                                                    thread.id
                                                                                ] ?? ""
                                                                            }
                                                                            onChange={(e) =>
                                                                                setReplyTextByThreadId(
                                                                                    (prev) => ({
                                                                                        ...prev,
                                                                                        [thread.id]:
                                                                                            e.target
                                                                                                .value,
                                                                                    })
                                                                                )
                                                                            }
                                                                            placeholder="Write a reply..."
                                                                            rows={2}
                                                                            className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-200/80 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-sky-500/20 resize-none"
                                                                            autoFocus
                                                                        />
                                                                        <div className="flex gap-2 mt-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    addReply(
                                                                                        thread.id
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    !(
                                                                                        replyTextByThreadId[
                                                                                            thread
                                                                                                .id
                                                                                        ] ?? ""
                                                                                    ).trim()
                                                                                }
                                                                                className="px-3 py-1.5 text-xs font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 disabled:opacity-40"
                                                                            >
                                                                                Reply
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setReplyingToId(
                                                                                        null
                                                                                    );
                                                                                    setReplyTextByThreadId(
                                                                                        (prev) => {
                                                                                            const next =
                                                                                                {
                                                                                                    ...prev,
                                                                                                };
                                                                                            delete next[
                                                                                                thread
                                                                                                    .id
                                                                                            ];
                                                                                            return next;
                                                                                        }
                                                                                    );
                                                                                }}
                                                                                className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setReplyingToId(
                                                                                thread.id
                                                                            )
                                                                        }
                                                                        disabled={!isLoggedIn}
                                                                        className="text-xs font-medium text-sky-600 hover:text-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        Reply
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {filteredThreads.length > 0 && (
                                <>
                                    <p className="text-sm text-slate-700">All Comments</p>
                                    {filteredThreads.map((thread) => (
                                        <div
                                            key={thread.id}
                                            className={`p-4 rounded-2xl border shadow-sm transition-all ${
                                                thread.resolved
                                                    ? "bg-slate-50/80 border-slate-100"
                                                    : "bg-white border-slate-200/80"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap flex-1 min-w-0">
                                                    {thread.text}
                                                </p>
                                                <div className="flex items-center gap-1 shrink-0 opacity-80 hover:opacity-100">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleResolved(thread.id)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-500/10 transition-colors"
                                                        title={
                                                            thread.resolved ? "Reopen" : "Resolve"
                                                        }
                                                    >
                                                        {thread.resolved ? (
                                                            <span className="text-[10px] font-medium uppercase text-emerald-600">
                                                                Resolved
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-medium uppercase">
                                                                Resolve
                                                            </span>
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteThread(thread.id)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-emerald-700 mt-2">
                                                {thread.author} · {formatDateTime(thread.createdAt)}
                                            </p>

                                            {/* Replies */}
                                            {thread.replies.length > 0 && (
                                                <div className="mt-3 ml-2 pl-3 border-l-2 border-slate-100 space-y-2">
                                                    {thread.replies.map((reply) => (
                                                        <div key={reply.id}>
                                                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                                {reply.text}
                                                            </p>
                                                            <p className="text-xs text-slate-400 mt-0.5">
                                                                {reply.author} ·{" "}
                                                                {formatDateTime(reply.createdAt)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Reply */}
                                            {!thread.resolved && (
                                                <div className="mt-3">
                                                    {replyingToId === thread.id ? (
                                                        <div className="rounded-xl bg-slate-50/80 p-2">
                                                            <textarea
                                                                value={
                                                                    replyTextByThreadId[
                                                                        thread.id
                                                                    ] ?? ""
                                                                }
                                                                onChange={(e) =>
                                                                    setReplyTextByThreadId(
                                                                        (prev) => ({
                                                                            ...prev,
                                                                            [thread.id]:
                                                                                e.target.value,
                                                                        })
                                                                    )
                                                                }
                                                                placeholder="Write a reply..."
                                                                rows={2}
                                                                className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-200/80 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-sky-500/20 resize-none"
                                                                autoFocus
                                                            />
                                                            <div className="flex gap-2 mt-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        addReply(thread.id)
                                                                    }
                                                                    disabled={
                                                                        !(
                                                                            replyTextByThreadId[
                                                                                thread.id
                                                                            ] ?? ""
                                                                        ).trim()
                                                                    }
                                                                    className="px-3 py-1.5 text-xs font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 disabled:opacity-40"
                                                                >
                                                                    Reply
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setReplyingToId(null);
                                                                        setReplyTextByThreadId(
                                                                            (prev) => {
                                                                                const next = {
                                                                                    ...prev,
                                                                                };
                                                                                delete next[
                                                                                    thread.id
                                                                                ];
                                                                                return next;
                                                                            }
                                                                        );
                                                                    }}
                                                                    className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setReplyingToId(thread.id)
                                                            }
                                                            disabled={!isLoggedIn}
                                                            className="text-xs font-medium text-sky-600 hover:text-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Reply
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {!hasSelection && (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                                                <svg
                                                    className="w-6 h-6 text-slate-400"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={1.5}
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                                    />
                                                </svg>
                                            </div>
                                            <p className="text-sm text-slate-500">
                                                Select a key in the JSON tree to add comments.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CommentsPanel;
