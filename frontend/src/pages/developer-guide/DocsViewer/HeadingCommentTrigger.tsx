import { useState, type FC } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/Shadcn/Popover";
import { Button } from "@/components/Shadcn/Button";
import CommentComposer from "../flowActionDetails/CommentsPanel/CommentComposer";
import { IconComment } from "../shared/icons";

interface HeadingCommentTriggerProps {
    sectionId: string;
    isLoggedIn: boolean;
    onSubmit: (sectionId: string, text: string) => Promise<boolean>;
    /** Called after the comment is successfully posted, so the caller can select the section and reveal it in the sidebar. */
    onPosted: (sectionId: string) => void;
    /** Whether this heading's popover is the currently-open one — owned by the caller so only one heading stays open at a time. */
    open: boolean;
    /** Requests that this heading's popover open/close — the caller is the single source of truth for `open`. */
    onOpenChange: (open: boolean) => void;
}

/**
 * Hover-revealed heading affordance that opens a popover reusing the same comment-creation flow
 * as the sidebar. Auth state and the create-comment mutation live one level up (shared across
 * every heading on the page) rather than here, since this renders once per heading — submitting
 * state stays local (rather than the mutation hook's own `isLoading`) so posting from one
 * heading doesn't change `onSubmit`'s identity and force every other heading to remount.
 *
 * `open` is fully controlled by the caller (no local open state here): the caller tracks a single
 * "which heading is open" id, so switching headings is one state update — the old one's `open`
 * prop and the new one's flip in the same render, with no effect round-trip in between.
 */
const HeadingCommentTrigger: FC<HeadingCommentTriggerProps> = ({
    sectionId,
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
        const ok = await onSubmit(sectionId, comment);
        setIsSubmitting(false);
        if (ok) {
            setText("");
            onOpenChange(false);
            onPosted(sectionId);
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
                    title="Add comment"
                    aria-label="Add comment to this section"
                    className="inline-flex items-center gap-1 h-6 pl-1.5 pr-2 rounded-full text-xs font-medium bg-sky-500/10 border border-sky-500/20 text-sky-600 hover:bg-sky-500 hover:text-white hover:border-sky-500 dark:bg-sky-500/15 dark:border-sky-500/30 dark:text-sky-300 dark:hover:bg-sky-500 dark:hover:text-white shadow-sm transition-colors"
                >
                    <IconComment className="w-3.5 h-3.5" />
                    Comment
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80 max-h-[70vh] overflow-y-auto">
                <div className="px-4 py-2.5 border-b border-slate-200 dark:border-border-default bg-slate-50/70 dark:bg-surface-muted/40">
                    <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Add Comment
                    </h3>
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

export default HeadingCommentTrigger;
