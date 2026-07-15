import { useState, type FC } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/Shadcn/Popover";
import { Button } from "@/components/Shadcn/Button";
import { useAuth } from "@hooks/useAuth";
import { useCreateCommentMutation } from "@store/api";
import { commentScopeToCreatePayload, type CommentScope } from "@/types/comment-scope";
import CommentComposer from "../flowActionDetails/CommentsPanel/CommentComposer";
import { IconComment } from "../shared/icons";

interface HeadingCommentTriggerProps {
    sectionId: string;
    commentScope: CommentScope;
    /** Called after the comment is successfully posted, so the caller can select the section and reveal it in the sidebar. */
    onPosted: (sectionId: string) => void;
}

/** Hover-revealed heading affordance that opens a popover reusing the same comment-creation flow as the sidebar. */
const HeadingCommentTrigger: FC<HeadingCommentTriggerProps> = ({
    sectionId,
    commentScope,
    onPosted,
}) => {
    const { user } = useAuth();
    const isLoggedIn = Boolean(user);
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [createComment, { isLoading }] = useCreateCommentMutation();

    const handleSubmit = async () => {
        if (isLoading) return;
        const comment = text.trim();
        if (!comment) return;
        setError(null);
        try {
            await createComment(
                commentScopeToCreatePayload(commentScope, sectionId, comment)
            ).unwrap();
            setText("");
            setOpen(false);
            onPosted(sectionId);
        } catch {
            setError("Failed to post comment");
        }
    };

    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (!next) setError(null);
            }}
        >
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
