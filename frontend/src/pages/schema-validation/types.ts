export type IEditorRange = {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
};

export interface IDomainVersion {
    key: string;
}

export type MonacoModule = typeof import("monaco-editor");

/**
 * Structure of a domain entry
 */
export interface IDomain {
    key: string;
    version: IDomainVersion[];
}

/**
 * Active domain configuration structure
 */
export type IActiveDomainConfig = Record<string, IDomain[]>;

/**
 * Payload context structure
 */
export interface IPayloadContext {
    action?: string;
    domain?: string;
    version?: string;
    core_version?: string;
}

/**
 * Parsed payload structure
 */
export interface IParsedPayload {
    context?: IPayloadContext;
    [key: string]: unknown;
}

/**
 * Validation response structure
 */
export interface IValidationResponse {
    error?: {
        message?: string;
    };
    [key: string]: unknown;
}

/**
 * Monaco Editor instance type
 */
export type IMonacoEditor = {
    getDomNode: () => HTMLElement | null;
};

/**
 * Return type for the useSchemaValidation hook
 */
export interface IUseSchemaValidationReturn {
    payload: string;
    isLoading: boolean;
    validationErrors: IParsedValidationError[];
    isSuccessResponse: boolean;
    isValidationVisible: boolean;
    isErrorsExpanded: boolean;
    activeDomain: IActiveDomainConfig;
    handlePayloadChange: (value: string | undefined) => void;
    verifyRequest: () => Promise<void>;
    handleEditorMount: (editor: unknown, monaco: unknown) => void;
    expandValidationErrors: () => void;
    collapseValidationErrors: () => void;
}

export interface ISchemaGuideStepDefinition {
    key: string;
    label: string;
    description?: string;
    descriptionType?: "text" | "code";
}

/**
 * Result of a client-side validation step before the API call.
 */
export type IValidationResult<T> =
    | { ok: true; value: T }
    | { ok: false; errors: IParsedValidationError[] };

/**
 * Structured validation error parsed from API markdown responses.
 */
export interface IParsedValidationError {
    /** Validation rule code, e.g. PAYMENT_REQUIRED_TYPE */
    code: string;
    /** JSON path associated with the error */
    path: string;
    /** Human-readable error message */
    message: string;
    /** Optional property key for schema errors such as additionalProperties */
    propertyKey?: string;
}
