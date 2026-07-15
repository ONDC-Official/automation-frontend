import { useCallback, useState } from "react";
import { useAuth } from "@hooks/useAuth";
import { useCreateCommentMutation } from "@store/api";
import { commentScopeToCreatePayload, type CommentScope } from "@/types/comment-scope";
import HeadingCommentTrigger from "../../DocsViewer/HeadingCommentTrigger";

interface UseInlineCommentHeadingParams {
    commentScope: CommentScope | undefined;
    selectSection: (sectionId: string) => void;
    setRightPanelOpen: (open: boolean) => void;
}

/**
 * Wires the hover-revealed heading "Comment" action into any doc-viewing surface that already
 * has section selection (`selectSection`) and a collapsible comments sidebar: selects/reveals
 * the section after a successful post, and bumps a key so the sidebar (which owns its own
 * fetched thread list, independent of this hook) remounts and picks up the new comment.
 *
 * Auth and the create-comment mutation are resolved once here (not inside each heading's
 * trigger) since a doc can render dozens of headings — one `useAuth`/`useCreateCommentMutation`
 * per heading means one RTK Query subscription per heading, which gets expensive to mount/unmount
 * on every page navigation.
 */
export function useInlineCommentHeading({
    commentScope,
    selectSection,
    setRightPanelOpen,
}: UseInlineCommentHeadingParams) {
    const { user } = useAuth();
    const isLoggedIn = Boolean(user);
    const [createComment] = useCreateCommentMutation();
    const [commentsRefreshKey, setCommentsRefreshKey] = useState(0);
    // Single source of truth for which heading's popover is open: `HeadingCommentTrigger`
    // is a fully controlled `open` prop, so switching headings is one state update that
    // closes the old one and opens the new one in the same render — no effect round-trip.
    const [openSectionId, setOpenSectionId] = useState<string | null>(null);

    const handleInlineCommentPosted = useCallback(
        (sectionId: string) => {
            selectSection(sectionId);
            setRightPanelOpen(true);
            setCommentsRefreshKey((key) => key + 1);
        },
        [selectSection, setRightPanelOpen]
    );

    const postComment = useCallback(
        async (sectionId: string, text: string) => {
            if (!commentScope) return false;
            try {
                await createComment(
                    commentScopeToCreatePayload(commentScope, sectionId, text)
                ).unwrap();
                return true;
            } catch {
                return false;
            }
        },
        [commentScope, createComment]
    );

    const renderHeadingAction = useCallback(
        (sectionId: string) =>
            commentScope ? (
                <HeadingCommentTrigger
                    sectionId={sectionId}
                    isLoggedIn={isLoggedIn}
                    onSubmit={postComment}
                    onPosted={handleInlineCommentPosted}
                    open={openSectionId === sectionId}
                    onOpenChange={(open) => setOpenSectionId(open ? sectionId : null)}
                />
            ) : null,
        [commentScope, isLoggedIn, postComment, handleInlineCommentPosted, openSectionId]
    );

    return { renderHeadingAction, commentsRefreshKey };
}
