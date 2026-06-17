/**
 * Props for PayloadEditor component
 */
import type { editor as MonacoEditor } from "monaco-editor";
import type { BeforeMount, OnMount } from "@monaco-editor/react";
import type { IParsedValidationError } from "@/pages/schema-validation/types";

export interface ICodeEditorProps {
    value?: string;
    defaultValue?: string;
    language?: string;
    readOnly?: boolean;
    onChange?: (value: string | undefined) => void;
    onMount?: OnMount;
    beforeMount?: BeforeMount;
    editorKey?: string;
    path?: string;
    options?: MonacoEditor.IStandaloneEditorConstructionOptions;
    className?: string;
}

export interface IPayloadEditorProps {
    /** Current payload value */
    payload: string;
    /** Callback when payload changes */
    onPayloadChange: (value: string | undefined) => void;
    /** Callback when editor is mounted */
    onEditorMount: (editor: unknown, monaco: unknown) => void;
    /** Parsed validation errors */
    validationErrors: IParsedValidationError[];
    /** Whether validation has been run at least once */
    isValidationVisible: boolean;
    /** Whether the payload passed validation */
    isSuccessResponse: boolean;
    /** Whether the full error list is expanded */
    isErrorsExpanded: boolean;
    /** Expands the error panel to show all errors */
    onExpandValidationErrors: () => void;
    /** Collapses the expanded error panel */
    onCollapseValidationErrors: () => void;
}

export interface IValidationErrorsPanelProps {
    /** Whether validation has been run at least once */
    isVisible: boolean;
    /** Whether the payload passed validation */
    isSuccess: boolean;
    /** Parsed validation errors */
    errors: IParsedValidationError[];
    /** Whether the full error list is expanded */
    isExpanded: boolean;
    /** Expands the error panel to show all errors */
    onExpand: () => void;
    /** Collapses the expanded error panel */
    onCollapse: () => void;
}

export interface IErrorItemProps {
    error: IParsedValidationError;
}
