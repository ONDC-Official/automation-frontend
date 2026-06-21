import type { CommentResponse } from "@services/developerGuideCommentsApi";
import { generateLocalId } from "../../shared/utils/generateLocalId";
import { DEFAULT_COMMENT_AUTHOR } from "./constants";
import type { CommentThread } from "./types";

export const generateCommentId = generateLocalId;

/** Builds threads from a flat API list by pairing replies (`parent_comment_id`) to their parent comment. */
export function buildThreadsFromApiList(list: CommentResponse[]): CommentThread[] {
    const parents = list.filter((r) => !r.parent_comment_id);
    const replies = list.filter((r) => r.parent_comment_id);

    return parents.map((r) => {
        const threadReplies = replies.filter((rep) => rep.parent_comment_id === r._id);
        return {
            id: r._id,
            path: r.json_path ?? "$",
            text: r.comment ?? "",
            author: r.user?.username ?? DEFAULT_COMMENT_AUTHOR,
            createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
            resolved: r.resolved ?? false,
            replies: threadReplies.map((rep) => ({
                id: rep._id,
                text: rep.comment ?? "",
                author: DEFAULT_COMMENT_AUTHOR,
                createdAt: rep.created_at ? new Date(rep.created_at).getTime() : Date.now(),
            })),
        };
    });
}
