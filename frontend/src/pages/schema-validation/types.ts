/**
 * Type definitions for Schema Validation page
 */

/**
 * Structure of a domain version entry
 */
export interface DomainVersion {
    key: string;
}

/**
 * Structure of a domain entry
 */
export interface Domain {
    key: string;
    version: DomainVersion[];
}

/**
 * Active domain configuration structure
 */
export type ActiveDomainConfig = Record<string, Domain[]>;

/**
 * Payload context structure
 */
export interface PayloadContext {
    action?: string;
    domain?: string;
    version?: string;
    core_version?: string;
}

/**
 * Parsed payload structure
 */
export interface ParsedPayload {
    context?: PayloadContext;
    [key: string]: unknown;
}

/**
 * Validation response structure
 */
export interface ValidationResponse {
    error?: {
        message?: string;
    };
    [key: string]: unknown;
}

/**
 * Monaco Editor instance type
 */
export type MonacoEditor = {
    getDomNode: () => HTMLElement | null;
};

/**
 * Return type for the useSchemaValidation hook
 */
export interface UseSchemaValidationReturn {
    payload: string;
    isLoading: boolean;
    mdData: string;
    isSuccessResponse: boolean;
    isValidationOpen: boolean;
    isGuideOpen: boolean;
    activeDomain: ActiveDomainConfig;
    handlePayloadChange: (value: string | undefined) => void;
    verifyRequest: () => Promise<void>;
    handleEditorMount: (editor: unknown) => void;
}

/**
 * Props for ValidationResults component
 */
export interface ValidationResultsProps {
    /** Whether the panel is visible */
    isVisible: boolean;
    /** Whether validation was successful */
    isSuccess: boolean;
    /** Markdown content to display */
    markdownData: string;
}

/**
 * Props for InstructionsPanel component
 */
export interface InstructionsPanelProps {
    /** Whether the panel is visible */
    isVisible: boolean;
}
