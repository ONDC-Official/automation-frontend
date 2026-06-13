/**
 * Props for PayloadEditor component
 */
import type { ReactNode } from "react";

export interface PayloadEditorProps {
    /** Current payload value */
    payload: string;
    /** Callback when payload changes */
    onPayloadChange: (value: string | undefined) => void;
    /** Callback when editor is mounted */
    onEditorMount: (editor: unknown, monaco: unknown) => void;
    /** Optional footer content rendered below the editor inside the card */
    footer?: ReactNode;
    /** Whether the footer panel is expanded (shrinks editor area instead of overlapping) */
    isFooterExpanded?: boolean;
}
