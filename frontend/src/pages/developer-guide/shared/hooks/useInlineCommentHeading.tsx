import { useCallback, useState } from "react";
import type { CommentScope } from "@/types/comment-scope";
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
 */
export function useInlineCommentHeading({
    commentScope,
    selectSection,
    setRightPanelOpen,
}: UseInlineCommentHeadingParams) {
    const [commentsRefreshKey, setCommentsRefreshKey] = useState(0);

    const handleInlineCommentPosted = useCallback(
        (sectionId: string) => {
            selectSection(sectionId);
            setRightPanelOpen(true);
            setCommentsRefreshKey((key) => key + 1);
        },
        [selectSection, setRightPanelOpen]
    );

    const renderHeadingAction = useCallback(
        (sectionId: string) =>
            commentScope ? (
                <HeadingCommentTrigger
                    sectionId={sectionId}
                    commentScope={commentScope}
                    onPosted={handleInlineCommentPosted}
                />
            ) : null,
        [commentScope, handleInlineCommentPosted]
    );

    return { renderHeadingAction, commentsRefreshKey };
}
