/**
 * Props for PayloadEditor component
 */
export interface PayloadEditorProps {
  /** Render mode: 'modal' for overlay modal, 'inline' for regular component */
  mode?: "modal" | "inline";
  /** Current payload value (required for inline mode, optional for modal) */
  payload?: string;
  /** Whether validation is in progress (for inline mode) */
  isLoading?: boolean;
  /** Callback when payload changes (for inline mode) */
  onPayloadChange?: (value: string | undefined) => void;
  /** Callback when editor is mounted (for inline mode) */
  onEditorMount?: (editor: unknown) => void;
  /** Callback to trigger validation (for inline mode) */
  onValidate?: () => void;
  /** Title text (for inline mode) */
  title?: string;
  /** Message text (for inline mode) */
  message?: string;
  /** Callback when Add button is clicked in modal mode - receives parsed JSON */
  onAdd?: (parsedPayload: unknown) => void;
  /** Button text for modal mode (default: "Add") */
  buttonText?: string;
}
