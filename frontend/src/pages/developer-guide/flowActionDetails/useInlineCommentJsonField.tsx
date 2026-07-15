import { useCallback, useState } from "react";
import { useAuth } from "@hooks/useAuth";
import { useCreateCommentMutation } from "@store/api";
import { commentScopeToCreatePayload, type CommentScope } from "@/types/comment-scope";
import type { RowHoverActions } from "@pages/protocol-playground/ui/Json-path-extractor";
import JsonFieldCommentTrigger from "./JsonFieldCommentTrigger";

interface UseInlineCommentJsonFieldParams {
    commentScope: CommentScope | undefined;
    /** Selects the field's path so the sidebar Comments/Details tabs pick up the same context. */
    selectPath: (path: string) => void;
    /** Called after a successful post, in addition to `selectPath` (e.g. switch to + open the Comments tab). */
    onPosted?: (path: string) => void;
}

/**
 * Wires the hover-revealed JSON-field "Comment" icon (next to the tree's built-in copy icon)
 * into the Example Payload viewer. Mirrors `useInlineCommentHeading` — same popover-based
 * comment-creation flow, anchored to a JSON path instead of a heading/section id.
 */
export function useInlineCommentJsonField({
    commentScope,
    selectPath,
    onPosted,
}: UseInlineCommentJsonFieldParams) {
    const { user } = useAuth();
    const isLoggedIn = Boolean(user);
    const [createComment] = useCreateCommentMutation();
    const [commentsRefreshKey, setCommentsRefreshKey] = useState(0);
    // Single source of truth for which field's popover is open: `JsonFieldCommentTrigger` is a
    // fully controlled `open` prop, so switching fields is one state update that closes the old
    // one and opens the new one in the same render — no effect round-trip.
    const [openPath, setOpenPath] = useState<string | null>(null);

    const handleInlineCommentPosted = useCallback(
        (path: string) => {
            selectPath(path);
            setCommentsRefreshKey((key) => key + 1);
            onPosted?.(path);
        },
        [selectPath, onPosted]
    );

    const postComment = useCallback(
        async (path: string, text: string) => {
            if (!commentScope) return false;
            try {
                await createComment(commentScopeToCreatePayload(commentScope, path, text)).unwrap();
                return true;
            } catch {
                return false;
            }
        },
        [commentScope, createComment]
    );

    const renderFieldCommentAction = useCallback(
        (path: string, rowHover: RowHoverActions) =>
            commentScope ? (
                <JsonFieldCommentTrigger
                    path={path}
                    isLoggedIn={isLoggedIn}
                    onSubmit={postComment}
                    onPosted={handleInlineCommentPosted}
                    open={openPath === path}
                    onOpenChange={(open) => {
                        if (open) rowHover.pin();
                        else rowHover.unpin();
                        setOpenPath(open ? path : null);
                    }}
                />
            ) : null,
        [commentScope, isLoggedIn, postComment, handleInlineCommentPosted, openPath]
    );

    return { renderFieldCommentAction, commentsRefreshKey };
}
