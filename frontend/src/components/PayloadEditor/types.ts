/**
 * Props for PayloadEditor component
 */
export interface PayloadEditorProps {
    /** Current payload value */
    payload: string;
    /** Whether validation is in progress */
    isLoading: boolean;
    /** Callback when payload changes */
    onPayloadChange: (value: string | undefined) => void;
    /** Callback when editor is mounted */
    onEditorMount: (editor: unknown) => void;
    /** Callback to trigger validation */
    onValidate: () => void;
    title: string;
    message: string;
}
