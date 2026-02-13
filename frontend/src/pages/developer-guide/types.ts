export interface OpenAPIInfo {
    title: string;
    description: string;
    version: string;
    domain: string;
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
    mock?: {
        examples?: MockExample[];
    };
}

export interface Flow {
    summary?: string;
    meta?: {
        use_case_id?: string;
        domain?: string;
        flowId?: string;
        description?: string;
        [key: string]: unknown;
    };
    details?: Array<{
        description?: string;
    }>;
    reference?: string;
    steps: FlowStep[];
    /** Use case for x-attributes lookup; also read from meta.use_case_id when present */
    useCaseId?: string;
}

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

export interface OpenAPISpecification {
    openapi: string;
    info: OpenAPIInfo;
    security?: OpenAPISecurity[];
    paths: {
        [path: string]: OpenAPIPathItem;
    };
    components?: OpenAPIComponents;
    "x-flows"?: Flow[];
    "x-enum"?: Record<string, Record<string, unknown>>;
    "x-tags"?: Record<string, Record<string, unknown>>;
    /** Attribute definitions keyed by use_case_id (array form) or legacy record keyed by useCaseId */
    "x-attributes"?:
        | Array<{
              meta?: { use_case_id?: string };
              attribute_set?: Record<string, Record<string, unknown>>;
          }>
        | Record<string, { attribute_set?: Record<string, Record<string, unknown>> }>;
    /** Validation tests keyed by _TESTS_ then by action name */
    "x-validations"?: Record<string, Record<string, XValidationTestGroup[]>>;
}
