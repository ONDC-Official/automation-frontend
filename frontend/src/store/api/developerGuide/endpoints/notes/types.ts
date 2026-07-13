export interface INotePayload {
    use_case_id?: string;
    flow_id?: string;
    action_id?: string;
    json_path?: string;
    note: string;
    /** Ready for backend; not sent on the wire until user-management accepts it. */
    domain?: string;
    version?: string;
}

export interface INoteResponse {
    _id: string;
    use_case_id?: string;
    flow_id?: string;
    action_id?: string;
    json_path?: string;
    note?: string;
    created_at?: string;
    updated_at?: string;
    domain?: string;
    version?: string;
}

export interface INotesListParams {
    use_case_id?: string;
    flow_id?: string;
    action_id?: string;
    domain?: string;
    version?: string;
}
