import { useState, type FC } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/Shadcn/Popover";
import { Button } from "@components/Shadcn/Button";
import CommentComposer from "./CommentsPanel/CommentComposer";
import { IconComment } from "../shared/icons";

interface JsonFieldCommentTriggerProps {
    path: string;
    isLoggedIn: boolean;
    onSubmit: (path: string, text: string) => Promise<boolean>;
    /** Called after the comment is successfully posted, so the caller can select the field and reveal it in the sidebar. */
    onPosted: (path: string) => void;
    /** Whether this field's popover is the currently-open one — owned by the caller so only one field stays open at a time. */
    open: boolean;
    /** Requests that this field's popover open/close — the caller is the single source of truth for `open` (and keeps the row's built-in copy icon mounted while open via pin/unpin). */
    onOpenChange: (open: boolean) => void;
}

/**
 * Icon-only, hover-revealed affordance rendered next to the JSON tree's built-in copy icon.
 * Reuses the same popover + comment-creation flow as the developer-guide heading comment
 * trigger (`HeadingCommentTrigger`), just anchored to a JSON path instead of a section id.
 *
 * `open` is fully controlled by the caller (no local open state here): the caller tracks a single
 * "which field is open" path, so switching fields is one state update — the old one's `open` prop
 * and the new one's flip in the same render, with no effect round-trip in between.
 */
const JsonFieldCommentTrigger: FC<JsonFieldCommentTriggerProps> = ({
    path,
    isLoggedIn,
    onSubmit,
    onPosted,
    open,
    onOpenChange,
}) => {
    const [text, setText] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOpenChange = (next: boolean) => {
        if (!next) setError(null);
        onOpenChange(next);
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        const comment = text.trim();
        if (!comment) return;
        setError(null);
        setIsSubmitting(true);
        const ok = await onSubmit(path, comment);
        setIsSubmitting(false);
        if (ok) {
            setText("");
            onOpenChange(false);
            onPosted(path);
        } else {
            setError("Failed to post comment");
        }
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    title="Add comment"
                    aria-label="Add comment to this field"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center rounded text-(--w-rjv-copied-color,currentColor)"
                >
                    <IconComment className="w-3.5 h-3.5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-80 max-h-[70vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-4 py-2.5 border-b border-slate-200 dark:border-border-default bg-slate-50/70 dark:bg-surface-muted/40">
                    <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Add Comment
                    </h3>
                    <p className="mt-1 text-xs font-mono text-slate-400 truncate" title={path}>
                        {path}
                    </p>
                </div>
                {isLoggedIn ? (
                    <>
                        <CommentComposer
                            value={text}
                            onChange={setText}
                            onSubmit={handleSubmit}
                            className="mb-0 border-0 shadow-none rounded-none"
                            textareaClassName="max-h-48 overflow-y-auto"
                        />
                        {error && <p className="px-4 pb-3 -mt-2 text-xs text-red-500">{error}</p>}
                    </>
                ) : (
                    <p className="px-4 py-5 text-sm text-slate-500 text-center">
                        Sign in to add comments.
                    </p>
                )}
            </PopoverContent>
        </Popover>
    );
};

export default JsonFieldCommentTrigger;
