export interface IJsonSchemaParameters {
    type?: string;
    properties?: Record<string, IJsonSchemaProperty>;
    required?: string[];
}

export interface IToolInspectorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export interface IJsonSchemaProperty {
    type?: string | string[];
    enum?: unknown[];
    default?: unknown;
}
