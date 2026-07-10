export type FlowCommentScope = {
    kind: "flow";
    use_case_id: string;
    flow_id: string;
    action_id: string;
};

export type DocumentCommentScope = {
    kind: "document";
    use_case_id: string;
    document_slug: string;
};

export type CommentScope = FlowCommentScope | DocumentCommentScope;

export function buildFlowCommentScope(
    useCaseId: string,
    flowId: string,
    actionId: string
): FlowCommentScope {
    return {
        kind: "flow",
        use_case_id: useCaseId,
        flow_id: flowId,
        action_id: actionId,
    };
}

export function buildDocumentCommentScope(
    useCaseId: string,
    documentSlug: string
): DocumentCommentScope {
    return {
        kind: "document",
        use_case_id: useCaseId,
        document_slug: documentSlug,
    };
}

export function isFlowCommentScope(scope: CommentScope): scope is FlowCommentScope {
    return scope.kind === "flow";
}

export interface CommentListParams {
    use_case_id?: string;
    flow_id?: string;
    action_id?: string;
    document_slug?: string;
}

export function commentScopeToListParams(scope: CommentScope): CommentListParams {
    if (scope.kind === "flow") {
        return {
            use_case_id: scope.use_case_id,
            flow_id: scope.flow_id,
            action_id: scope.action_id,
        };
    }
    return {
        use_case_id: scope.use_case_id,
        document_slug: scope.document_slug,
    };
}

export interface CommentCreatePayload {
    use_case_id?: string;
    flow_id?: string;
    action_id?: string;
    json_path?: string;
    document_slug?: string;
    section_id?: string;
    comment: string;
}

export function commentScopeToCreatePayload(
    scope: CommentScope,
    anchor: string,
    comment: string
): CommentCreatePayload {
    if (scope.kind === "flow") {
        return {
            use_case_id: scope.use_case_id,
            flow_id: scope.flow_id,
            action_id: scope.action_id,
            json_path: anchor,
            comment,
        };
    }
    return {
        use_case_id: scope.use_case_id,
        document_slug: scope.document_slug,
        section_id: anchor,
        comment,
    };
}

export function buildCommentListCacheId(scope: CommentScope): string {
    if (scope.kind === "flow") {
        return `LIST-${scope.use_case_id}-${scope.flow_id}-${scope.action_id}`;
    }
    return `LIST-${scope.use_case_id}-doc-${scope.document_slug}`;
}

export function buildCommentListUrl(baseUrl: string, scope: CommentScope): string {
    const params = commentScopeToListParams(scope);
    const search = new URLSearchParams();
    if (params.use_case_id) search.set("use_case_id", params.use_case_id);
    if (params.flow_id) search.set("flow_id", params.flow_id);
    if (params.action_id) search.set("action_id", params.action_id);
    if (params.document_slug) search.set("document_slug", params.document_slug);
    const query = search.toString();
    return query ? `${baseUrl}?${query}` : baseUrl;
}

/** Resolves explicit scope or legacy flow props into a CommentScope. */
export function resolveCommentScope(
    commentScope: CommentScope | undefined,
    useCaseId: string | undefined,
    flowId: string | undefined,
    actionApi: string | undefined
): CommentScope | null {
    if (commentScope) return commentScope;
    if (useCaseId && flowId && actionApi) {
        return buildFlowCommentScope(useCaseId, flowId, actionApi);
    }
    return null;
}
