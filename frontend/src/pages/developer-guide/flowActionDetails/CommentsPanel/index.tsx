import { type FC, useState, useCallback, useContext } from "react";
import * as commentsApi from "@services/developerGuideCommentsApi";
import { AuthContext } from "@/context/authContext";
import GuideAsyncPanel from "../../shared/components/GuideAsyncPanel";
import { EmptyState } from "../../shared/components/states";
import { useThreadedApi } from "../../shared/hooks/useThreadedApi";
import { IconComment } from "../../shared/icons";
import CommentComposer from "./CommentComposer";
import CommentThreadCard from "./CommentThreadCard";
import { buildThreadsFromApiList, generateCommentId } from "./utils";
import { DEFAULT_COMMENT_AUTHOR } from "./constants";
import type { CommentThread, CommentsPanelProps } from "./types";

const CommentsPanel: FC<CommentsPanelProps> = ({ selectedPath, actionApi, useCaseId, flowId }) => {
    const { user } = useContext(AuthContext);
    const isLoggedIn = Boolean(user);
    const useApi = Boolean(flowId && useCaseId);
    const [newCommentText, setNewCommentText] = useState("");
    const [replyTextByThreadId, setReplyTextByThreadId] = useState<Record<string, string>>({});
    const [replyingToId, setReplyingToId] = useState<string | null>(null);

    const {
        items: threads,
        setItems: setThreads,
        loading,
        error,
        mutate,
    } = useThreadedApi<CommentThread>({
        enabled: useApi,
        fetchItems: async () => {
            const res = await commentsApi.getComments({
                use_case_id: useCaseId!,
                flow_id: flowId!,
                action_id: actionApi,
            });
            const list = Array.isArray(res.data) ? res.data : [];
            return buildThreadsFromApiList(list);
        },
        deps: [flowId, useCaseId, actionApi],
    });

    const addComment = useCallback(async () => {
        if (!isLoggedIn) return;
        const path = selectedPath ?? "$";
        const text = newCommentText.trim();
        if (!text) return;

        if (useApi && flowId && useCaseId) {
            const ok = await mutate(
                () =>
                    commentsApi.createComment({
                        use_case_id: useCaseId,
                        flow_id: flowId,
                        action_id: actionApi,
                        json_path: path,
                        comment: text,
                    }),
                "Failed to post comment"
            );
            if (ok) setNewCommentText("");
        } else {
            const thread: CommentThread = {
                id: generateCommentId(),
                path,
                text,
                author: DEFAULT_COMMENT_AUTHOR,
                createdAt: Date.now(),
                resolved: false,
                replies: [],
            };
            setThreads((prev) => [thread, ...prev]);
            setNewCommentText("");
        }
    }, [
        isLoggedIn,
        selectedPath,
        newCommentText,
        useApi,
        flowId,
        useCaseId,
        actionApi,
        mutate,
        setThreads,
    ]);

    const addReply = useCallback(
        async (threadId: string) => {
            if (!isLoggedIn) return;
            const text = (replyTextByThreadId[threadId] ?? "").trim();
            if (!text) return;

            if (useApi && flowId && useCaseId) {
                const ok = await mutate(
                    () =>
                        commentsApi.replyToComment({
                            use_case_id: useCaseId,
                            flow_id: flowId,
                            action_id: actionApi,
                            json_path: selectedPath ?? "$",
                            comment: text,
                            parent_comment_id: threadId,
                        }),
                    "Failed to post reply"
                );
                if (!ok) return;
            } else {
                setThreads((prev) =>
                    prev.map((t) =>
                        t.id === threadId
                            ? {
                                  ...t,
                                  replies: [
                                      ...t.replies,
                                      {
                                          id: generateCommentId(),
                                          text,
                                          author: DEFAULT_COMMENT_AUTHOR,
                                          createdAt: Date.now(),
                                      },
                                  ],
                              }
                            : t
                    )
                );
            }
            setReplyTextByThreadId((prev) => ({ ...prev, [threadId]: "" }));
            setReplyingToId(null);
        },
        [
            isLoggedIn,
            replyTextByThreadId,
            useApi,
            flowId,
            useCaseId,
            actionApi,
            selectedPath,
            mutate,
            setThreads,
        ]
    );

    const toggleResolved = useCallback(
        async (threadId: string) => {
            if (!isLoggedIn) return;
            const thread = threads.find((t) => t.id === threadId);
            if (!thread) return;
            const newResolved = !thread.resolved;

            if (useApi && flowId && useCaseId) {
                await mutate(
                    () => commentsApi.resolveComment(threadId, newResolved),
                    "Failed to update comment"
                );
            } else {
                setThreads((prev) =>
                    prev.map((t) =>
                        t.id === threadId
                            ? {
                                  ...t,
                                  resolved: newResolved,
                                  resolvedAt: newResolved ? Date.now() : undefined,
                              }
                            : t
                    )
                );
            }
        },
        [isLoggedIn, threads, useApi, flowId, useCaseId, mutate, setThreads]
    );

    const deleteThread = useCallback(
        async (threadId: string) => {
            if (!isLoggedIn) return;
            if (useApi && flowId && useCaseId) {
                await mutate(() => commentsApi.deleteComment(threadId), "Failed to delete comment");
            } else {
                setThreads((prev) => prev.filter((t) => t.id !== threadId));
            }
        },
        [isLoggedIn, useApi, flowId, useCaseId, mutate, setThreads]
    );

    const handleReplyTextChange = useCallback((threadId: string, value: string) => {
        setReplyTextByThreadId((prev) => ({ ...prev, [threadId]: value }));
    }, []);

    const cancelReply = useCallback(() => {
        setReplyingToId(null);
    }, []);

    const filteredThreads = threads;
    const hasSelection = selectedPath != null;
    const selectPathEmptyState = (
        <EmptyState message="Select a key in the JSON tree to add comments." icon={IconComment} />
    );

    return (
        <GuideAsyncPanel title="Comments" loading={loading} error={error}>
            <>
                {hasSelection && (
                    <div className="flex items-center gap-2 mb-3 shrink-0 break-all">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-300 font-mono text-xs">
                            {selectedPath}
                        </span>
                    </div>
                )}

                {hasSelection && !isLoggedIn && (
                    <div className="shrink-0 mb-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                        <p className="text-sm text-slate-500">Sign in to add comments.</p>
                    </div>
                )}
                {hasSelection && isLoggedIn && (
                    <CommentComposer
                        value={newCommentText}
                        onChange={setNewCommentText}
                        onSubmit={addComment}
                    />
                )}

                {!hasSelection &&
                    filteredThreads.length === 0 &&
                    newCommentText === "" &&
                    selectPathEmptyState}

                <div className="flex-1 overflow-auto space-y-3 min-h-0">
                    {hasSelection && (
                        <div className="shrink-0 mb-4">
                            <p className="text-sm text-slate-700 mb-2 break-all">
                                Comments on{" "}
                                <span className="text-sky-600 dark:text-sky-400 font-mono normal-case">
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
                                            <CommentThreadCard
                                                key={thread.id}
                                                thread={thread}
                                                isLoggedIn={isLoggedIn}
                                                replyText={replyTextByThreadId[thread.id] ?? ""}
                                                isReplying={replyingToId === thread.id}
                                                onToggleResolved={toggleResolved}
                                                onDelete={deleteThread}
                                                onStartReply={setReplyingToId}
                                                onCancelReply={cancelReply}
                                                onReplyTextChange={handleReplyTextChange}
                                                onSubmitReply={addReply}
                                            />
                                        ))}
                                </div>
                            )}
                        </div>
                    )}

                    {filteredThreads.length > 0 && (
                        <>
                            <p className="text-sm text-slate-700">All Comments</p>
                            {filteredThreads.map((thread) => (
                                <CommentThreadCard
                                    key={thread.id}
                                    thread={thread}
                                    isLoggedIn={isLoggedIn}
                                    replyText={replyTextByThreadId[thread.id] ?? ""}
                                    isReplying={replyingToId === thread.id}
                                    onToggleResolved={toggleResolved}
                                    onDelete={deleteThread}
                                    onStartReply={setReplyingToId}
                                    onCancelReply={cancelReply}
                                    onReplyTextChange={handleReplyTextChange}
                                    onSubmitReply={addReply}
                                />
                            ))}

                            {!hasSelection && selectPathEmptyState}
                        </>
                    )}
                </div>
            </>
        </GuideAsyncPanel>
    );
};

export default CommentsPanel;
