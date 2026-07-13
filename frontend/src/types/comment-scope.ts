/**
 * Comment/note scope for developer-guide.
 *
 * Uniqueness includes domain + version so the same usecase across protocol
 * versions (e.g. Ride Hailing 2.0.1 vs 2.1.0) does not share threads.
 *
 * Until automation-user-management accepts `domain`/`version` as separate
 * fields, uniqueness is encoded into the wire `use_case_id` via
 * {@link toWireUseCaseId}. When the backend lands, switch the payload helpers
 * to send domain/version explicitly and use the raw usecase id.
 */

export type FlowCommentScope = {
    kind: "flow";
    domain: string;
    version: string;
    use_case_id: string;
    flow_id: string;
    action_id: string;
};

export type DocumentCommentScope = {
    kind: "document";
    domain: string;
    version: string;
    use_case_id: string;
    document_slug: string;
};

export type CommentScope = FlowCommentScope | DocumentCommentScope;

const SCOPE_SEP = "|";

/** Encodes domain + version into use_case_id for the current backend wire format. */
export function toWireUseCaseId(domain: string, version: string, useCaseId: string): string {
    return `${domain}${SCOPE_SEP}${version}${SCOPE_SEP}${useCaseId}`;
}

export function buildFlowCommentScope(
    domain: string,
    version: string,
    useCaseId: string,
    flowId: string,
    actionId: string
): FlowCommentScope {
    return {
        kind: "flow",
        domain,
        version,
        use_case_id: useCaseId,
        flow_id: flowId,
        action_id: actionId,
    };
}

export function buildDocumentCommentScope(
    domain: string,
    version: string,
    useCaseId: string,
    documentSlug: string
): DocumentCommentScope {
    return {
        kind: "document",
        domain,
        version,
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
    /** Present for FE cache/deps; omitted from wire query until backend supports it. */
    domain?: string;
    version?: string;
}

function wireUseCaseIdFromScope(scope: CommentScope): string {
    return toWireUseCaseId(scope.domain, scope.version, scope.use_case_id);
}

export function commentScopeToListParams(scope: CommentScope): CommentListParams {
    const use_case_id = wireUseCaseIdFromScope(scope);
    if (scope.kind === "flow") {
        return {
            use_case_id,
            flow_id: scope.flow_id,
            action_id: scope.action_id,
            domain: scope.domain,
            version: scope.version,
        };
    }
    return {
        use_case_id,
        document_slug: scope.document_slug,
        domain: scope.domain,
        version: scope.version,
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
    /** Present for FE typing; omitted from wire body until backend supports it. */
    domain?: string;
    version?: string;
}

/**
 * Builds the create body for the current backend.
 * Domain/version uniqueness is encoded into use_case_id; do not send domain/version
 * as separate keys (DisallowUnknownFields on the API).
 */
export function commentScopeToCreatePayload(
    scope: CommentScope,
    anchor: string,
    comment: string
): CommentCreatePayload {
    const use_case_id = wireUseCaseIdFromScope(scope);
    if (scope.kind === "flow") {
        return {
            use_case_id,
            flow_id: scope.flow_id,
            action_id: scope.action_id,
            json_path: anchor,
            comment,
        };
    }
    return {
        use_case_id,
        document_slug: scope.document_slug,
        section_id: anchor,
        comment,
    };
}

export function buildCommentListCacheId(scope: CommentScope): string {
    const useCase = wireUseCaseIdFromScope(scope);
    if (scope.kind === "flow") {
        return `LIST-${useCase}-${scope.flow_id}-${scope.action_id}`;
    }
    return `LIST-${useCase}-doc-${scope.document_slug}`;
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

export interface ResolveCommentScopeLegacyProps {
    useCaseId?: string;
    flowId?: string;
    actionApi?: string;
    domain?: string;
    version?: string;
}

/** Resolves explicit scope or legacy flow props into a CommentScope. */
export function resolveCommentScope(
    commentScope: CommentScope | undefined,
    legacy: ResolveCommentScopeLegacyProps
): CommentScope | null {
    if (commentScope) return commentScope;
    const { useCaseId, flowId, actionApi, domain, version } = legacy;
    if (useCaseId && flowId && actionApi && domain && version) {
        return buildFlowCommentScope(domain, version, useCaseId, flowId, actionApi);
    }
    return null;
}
