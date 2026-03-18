import { developerGuideCommentsApiClient } from "./apiClient";
import { API_ROUTES } from "./apiRoutes";
import type { ApiResponse } from "./apiClient";

export interface CommentPayload {
    use_case_id?: string;
    flow_id?: string;
    action_id?: string;
    json_path?: string;
    comment: string;
}

export interface CommentResponse {
    _id: string;
    use_case_id?: string;
    flow_id?: string;
    action_id?: string;
    json_path?: string;
    comment?: string;
    resolved?: boolean;
    parent_comment_id?: string;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
    replies?: ReplyResponse[];
    user?: {
        email: string;
        username: string;
    };
}

export interface ReplyPayload {
    use_case_id?: string;
    flow_id?: string;
    action_id?: string;
    json_path?: string;
    comment: string;
    parent_comment_id: string;
}

export interface ReplyResponse {
    _id: string;
    comment?: string;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
}

export async function getComments(params: {
    use_case_id?: string;
    flow_id?: string;
    action_id?: string;
}): Promise<ApiResponse<CommentResponse[]>> {
    const search = new URLSearchParams();
    if (params.use_case_id) search.set("use_case_id", params.use_case_id);
    if (params.flow_id) search.set("flow_id", params.flow_id);
    if (params.action_id) search.set("action_id", params.action_id);
    const query = search.toString();
    const url = query ? `${API_ROUTES.COMMENTS.BASE}?${query}` : API_ROUTES.COMMENTS.BASE;
    return developerGuideCommentsApiClient.get<CommentResponse[]>(url, {});
}

export async function createComment(
    payload: CommentPayload
): Promise<ApiResponse<CommentResponse>> {
    return developerGuideCommentsApiClient.post<CommentResponse>(
        API_ROUTES.COMMENTS.BASE,
        payload,
        {}
    );
}

export async function resolveComment(
    commentId: string,
    resolved: boolean
): Promise<ApiResponse<CommentResponse>> {
    return developerGuideCommentsApiClient.put<CommentResponse>(
        API_ROUTES.COMMENTS.RESOLVE(commentId),
        { resolved },
        {}
    );
}

export async function getCommentById(commentId: string): Promise<ApiResponse<CommentResponse>> {
    return developerGuideCommentsApiClient.get<CommentResponse>(
        API_ROUTES.COMMENTS.BY_ID(commentId),
        {}
    );
}

export async function deleteComment(commentId: string): Promise<ApiResponse<unknown>> {
    return developerGuideCommentsApiClient.delete(API_ROUTES.COMMENTS.BY_ID(commentId), {});
}

export async function replyToComment(payload: ReplyPayload): Promise<ApiResponse<CommentResponse>> {
    return developerGuideCommentsApiClient.post<CommentResponse>(
        API_ROUTES.COMMENTS.BASE,
        payload,
        {}
    );
}
