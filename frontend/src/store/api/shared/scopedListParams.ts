// Shared by notes/comments RTK endpoints: both list by the composite
// use_case_id+flow_id+action_id key, not a single field — a flat "LIST" id
// would invalidate every action's notes/comments on any one action's change.
export interface IScopedListParams {
    use_case_id?: string;
    flow_id?: string;
    action_id?: string;
}

export const buildScopedListId = (params: IScopedListParams) =>
    `LIST-${params.use_case_id ?? ""}-${params.flow_id ?? ""}-${params.action_id ?? ""}`;

export const buildScopedListUrl = (baseUrl: string, params: IScopedListParams) => {
    const search = new URLSearchParams();
    if (params.use_case_id) search.set("use_case_id", params.use_case_id);
    if (params.flow_id) search.set("flow_id", params.flow_id);
    if (params.action_id) search.set("action_id", params.action_id);
    const query = search.toString();
    return query ? `${baseUrl}?${query}` : baseUrl;
};
