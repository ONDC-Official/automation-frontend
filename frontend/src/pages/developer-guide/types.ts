// ─── Developer Docs ───────────────────────────────────────────────────────────

export interface DocMeta {
    slug: string;
    label: string;
    shortDescription: string;
}

// ─── OpenAPI 3.0 Base Types ───────────────────────────────────────────────────

export interface OpenAPIInfo {
    title?: string;
    description?: string;
    version: string;
    domain?: string;
    "x-usecases"?: string[];
    "x-branch-name"?: string;
    "x-reporting"?: boolean;
}

export interface OpenAPISecurityScheme {
    type: string;
    in?: string;
    name?: string;
    description?: string;
}

export interface OpenAPISecurity {
    [key: string]: unknown[];
}

export interface OpenAPISchema {
    type?: string;
    description?: string;
    properties?: Record<string, unknown>;
    required?: string[];
    enum?: unknown[];
    allOf?: unknown[];
    oneOf?: unknown[];
    anyOf?: unknown[];
    items?: unknown;
    additionalProperties?: boolean | Record<string, unknown>;
    $ref?: string;
    [key: string]: unknown;
}

export interface OpenAPIRequestBody {
    content?: {
        [mediaType: string]: {
            schema?: OpenAPISchema;
        };
    };
}

export interface OpenAPIResponse {
    description?: string;
    content?: {
        [mediaType: string]: {
            schema?: OpenAPISchema;
        };
    };
    $ref?: string;
}

export interface OpenAPIPathItem {
    [method: string]: {
        tags?: string[];
        description?: string;
        requestBody?: OpenAPIRequestBody;
        responses?: {
            [statusCode: string]: OpenAPIResponse;
        };
        [key: string]: unknown;
    };
}

export interface OpenAPIComponents {
    securitySchemes?: {
        [key: string]: OpenAPISecurityScheme;
    };
    schemas?: {
        [key: string]: OpenAPISchema;
    };
    [key: string]: unknown;
}

// ─── Flow Types ───────────────────────────────────────────────────────────────

export interface MockExample {
    name?: string;
    description?: string;
    type?: string;
    payload?: unknown;
}

export interface FlowStep {
    summary?: string;
    api: string;
    action_id?: string;
    action_label?: string;
    responseFor?: string | null;
    unsolicited?: boolean;
    owner?: string;
    description?: string;
    details?: Array<{
        description?: string;
    }>;
    reference?: string;
    example?: {
        summary?: string;
        value?: unknown;
    };
    examples?: MockExample[];
    mock?: {
        examples?: MockExample[];
        generate?: string;
        validate?: string;
        requirements?: string;
        defaultPayload?: any;
        [key: string]: unknown;
    };
}

export interface FlowConfig {
    summary?: string;
    steps: FlowStep[];
    helperLib?: string;
    details?: Array<{ description?: string }>;
    reference?: string;
    [key: string]: unknown;
}

export interface FlowEntry {
    domain?: string;
    version?: string;
    type: string;
    flowId: string;
    usecase: string;
    tags: string[];
    description: string;
    config: FlowConfig;
}

// ─── Error Codes ──────────────────────────────────────────────────────────────

export interface ErrorCode {
    Event: string;
    Description: string;
    From: string;
    code: string | number;
}

export interface ErrorCodes {
    code: ErrorCode[];
}

// ─── Supported Actions ────────────────────────────────────────────────────────

export interface SupportedActions {
    supportedActions: Record<string, string[]>;
    apiProperties: Record<
        string,
        {
            async_predecessor: string | null;
            transaction_partner: string[];
        }
    >;
}

// ─── Validations ──────────────────────────────────────────────────────────────

export interface XValidationRule {
    _NAME_?: string;
    attr?: string;
    _RETURN_?: string | XValidationRule[];
    reg?: string[];
    valid?: string[];
    domain?: string[];
    version?: string[];
    action?: string[];
    search?: string[];
    _CONTINUE_?: string;
    optional_vars?: string[];
    [key: string]: unknown;
}

export interface XValidationTestGroup {
    _NAME_?: string;
    _DESCRIPTION_?: string;
    action?: string[];
    _RETURN_?: XValidationRule[];
    [key: string]: unknown;
}

// ─── Root Spec Type ───────────────────────────────────────────────────────────

export interface OpenAPISpecification {
    openapi: string;
    info: OpenAPIInfo;
    security?: OpenAPISecurity[];
    paths?: {
        [path: string]: OpenAPIPathItem;
    };
    components?: OpenAPIComponents;
    "x-flows"?: FlowEntry[];
    "x-attributes"?:
        | Array<{
              meta?: { use_case_id?: string };
              attribute_set?: Record<string, Record<string, unknown>>;
          }>
        | Record<string, { attribute_set?: Record<string, Record<string, unknown>> }>;
    "x-validations"?: Record<
        string,
        Record<string, XValidationTestGroup[]> | Record<string, unknown>
    >;
    "x-errorcodes"?: ErrorCodes;
    "x-supported-actions"?: SupportedActions;
    "x-docs"?: Record<string, string>;
    "x-changelog"?: ChangelogEntry[];
}

// ─── Validation Table (from API validationTable section) ─────────────────────

export interface ValidationTableRow {
    rowType: "group" | "leaf";
    name: string;
    group: string;
    scope: string;
    description: string;
    skipIf: string;
    errorCode: string;
    successCode: string;
}

export interface ValidationTableAction {
    action: string;
    codeName: string;
    numLeafTests: number;
    generated: string;
    rows: ValidationTableRow[];
}

export interface ValidationTableSection {
    domain?: string;
    version?: string;
    ingestedAt?: string;
    table: Record<string, ValidationTableAction>;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface BuildEntry {
    key: string;
    version: Array<{
        key: string;
        usecase: string[];
    }>;
}

// ─── Changelog Types ─────────────────────────────────────────────────────────

export type ChangeKind = "added" | "removed" | "modified";

export interface ChangeEntry {
    kind: ChangeKind;
    /** Dot-path to the changed item */
    path: string;
    summary: string;
    before?: string;
    after?: string;
}

export interface ChangeSection {
    section: string;
    label: string;
    totalChanges: number;
    entries: ChangeEntry[];
    truncated: boolean;
    truncatedCount: number;
}

export interface ChangelogEntry {
    domain?: string;
    version?: string;
    fromVersion: string;
    toVersion: string;
    branch?: string;
    totalChanges: number;
    generatedAt?: string;
    summary?: {
        totalChanges: number;
        sections: { section: string; label: string; count: number }[];
    };
    sections?: ChangeSection[];
    [key: string]: unknown;
}

export interface SpecResponse {
    meta?: Record<string, unknown> | null;
    flows?: FlowEntry[];
    attributes?: Array<{
        domain?: string;
        version?: string;
        useCaseId?: string;
        attributeSet?: Record<string, Record<string, unknown>>;
    }>;
    docs?: Array<{
        domain?: string;
        version?: string;
        slug: string;
        content: string;
        order?: number;
    }>;
    validations?: { validations?: unknown; [key: string]: unknown } | null;
    validationTable?: ValidationTableSection | null;
    changelog?: ChangelogEntry[];
}
