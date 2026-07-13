export interface ICommentPayload {
    use_case_id?: string;
    flow_id?: string;
    action_id?: string;
    json_path?: string;
    document_slug?: string;
    section_id?: string;
    comment: string;
    /** Ready for backend; not sent on the wire until user-management accepts it. */
    domain?: string;
    version?: string;
}

export interface ICommentResponse {
    _id: string;
    use_case_id?: string;
    flow_id?: string;
    action_id?: string;
    json_path?: string;
    document_slug?: string;
    section_id?: string;
    comment?: string;
    resolved?: boolean;
    parent_comment_id?: string;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
    replies?: IReplyResponse[];
    domain?: string;
    version?: string;
    user?: {
        email: string;
        username: string;
    };
}

export interface IReplyPayload {
    use_case_id?: string;
    flow_id?: string;
    action_id?: string;
    document_slug?: string;
    comment: string;
    parent_comment_id: string;
    domain?: string;
    version?: string;
}

export interface IReplyResponse {
    _id: string;
    comment?: string;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
}

export interface ICommentsListParams {
    use_case_id?: string;
    flow_id?: string;
    action_id?: string;
    document_slug?: string;
    domain?: string;
    version?: string;
}
