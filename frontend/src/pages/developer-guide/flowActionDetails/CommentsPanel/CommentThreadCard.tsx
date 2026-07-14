import { type FC } from "react";
import { IconDelete } from "../../shared/icons";
import { formatDateTime } from "../../shared/utils/formatDateTime";
import type { CommentThread } from "./types";
import { Button } from "@/components/Shadcn/Button";
import { Textarea } from "@/components/Shadcn/TextArea/text-area";

interface CommentThreadCardProps {
    thread: CommentThread;
    isLoggedIn: boolean;
    replyText: string;
    isReplying: boolean;
    onToggleResolved: (id: string) => void;
    onDelete: (id: string) => void;
    onStartReply: (id: string) => void;
    onCancelReply: () => void;
    onReplyTextChange: (id: string, value: string) => void;
    onSubmitReply: (id: string) => void;
    /** Show which key/path this comment is attached to (e.g. in an unfiltered "All Comments" list). */
    showPath?: boolean;
}

const CommentThreadCard: FC<CommentThreadCardProps> = ({
    thread,
    isLoggedIn,
    replyText,
    isReplying,
    onToggleResolved,
    onDelete,
    onStartReply,
    onCancelReply,
    onReplyTextChange,
    onSubmitReply,
    showPath = false,
}) => (
    <div
        className={`p-4 rounded-2xl border shadow-xs transition-all ${
            thread.resolved
                ? "bg-slate-50/80 dark:bg-surface-muted/80 border-slate-100"
                : "bg-white dark:bg-surface-elevated border-slate-200/80"
        }`}
    >
        {showPath && (
            <span className="inline-flex items-center px-2 py-0.5 mb-2 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-300 text-xs font-mono break-all">
                {thread.path}
            </span>
        )}
        <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap flex-1 min-w-0">
                {thread.text}
            </p>
            <div className="flex items-center gap-1 shrink-0 opacity-80 hover:opacity-100">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onToggleResolved(thread.id)}
                    disabled={!isLoggedIn}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={thread.resolved ? "Reopen" : "Resolve"}
                >
                    {thread.resolved ? (
                        <span className="text-[10px] font-medium uppercase text-emerald-600 dark:text-emerald-400">
                            Resolved
                        </span>
                    ) : (
                        <span className="text-[10px] font-medium uppercase">Resolve</span>
                    )}
                </Button>
                {isLoggedIn && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onDelete(thread.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                    >
                        <IconDelete className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-2">
            {thread.author} · {formatDateTime(thread.createdAt)}
        </p>

        {thread.replies.length > 0 && (
            <div className="mt-3 ml-2 pl-3 border-l-2 border-slate-100 space-y-2">
                {thread.replies.map((reply) => (
                    <div key={reply.id}>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {reply.text}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {reply.author} · {formatDateTime(reply.createdAt)}
                        </p>
                    </div>
                ))}
            </div>
        )}

        {!thread.resolved && (
            <div className="mt-3">
                {isReplying ? (
                    <div className="rounded-xl bg-slate-50/80 dark:bg-surface-muted/80 p-2">
                        <Textarea
                            value={replyText}
                            onChange={(e) => onReplyTextChange(thread.id, e.target.value)}
                            placeholder="Write a reply..."
                            rows={2}
                            className="w-full px-3 py-2 text-sm bg-white dark:bg-surface-elevated rounded-lg border-slate-200/80 shadow-none text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-sky-500/20 resize-none"
                            autoFocus
                        />
                        <div className="flex gap-2 mt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onSubmitReply(thread.id)}
                                disabled={!replyText.trim()}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 disabled:opacity-40"
                            >
                                Reply
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onCancelReply}
                                className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    isLoggedIn && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onStartReply(thread.id)}
                            className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
                        >
                            Reply
                        </Button>
                    )
                )}
            </div>
        )}
    </div>
);

export default CommentThreadCard;
