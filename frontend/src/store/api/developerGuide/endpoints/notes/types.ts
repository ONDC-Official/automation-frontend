export interface INotePayload {
    use_case_id?: string;
    flow_id?: string;
    action_id?: string;
    json_path?: string;
    note: string;
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
}

export interface INotesListParams {
    use_case_id?: string;
    flow_id?: string;
    action_id?: string;
}
