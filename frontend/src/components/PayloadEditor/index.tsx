/** Payload Editor Component **/
import { FC } from "react";
import Editor from "@monaco-editor/react";
import { PayloadEditorProps } from "./types";
import { EDITOR_CONFIG } from "./constants";

const PayloadEditor: FC<PayloadEditorProps> = ({
    payload,
    onPayloadChange,
    onEditorMount,
    footer,
    isFooterExpanded = false,
}) => (
    <div
        className={`flex-1 min-h-0 flex flex-col overflow-hidden ${
            isFooterExpanded ? "bg-red-50" : "bg-n-0"
        }`}
    >
        <div
            className={`relative overflow-hidden transition-all duration-300 ease-out ${
                isFooterExpanded ? "bg-red-50" : "bg-n-0"
            } ${
                isFooterExpanded
                    ? "max-h-0 min-h-0 flex-none opacity-0 pointer-events-none"
                    : "flex-1 min-h-0 h-full"
            }`}
        >
            <Editor
                theme={EDITOR_CONFIG.theme}
                height="100%"
                defaultLanguage={EDITOR_CONFIG.language}
                value={payload}
                onChange={onPayloadChange}
                onMount={onEditorMount}
                options={{
                    minimap: { enabled: false },
                    padding: EDITOR_CONFIG.padding,
                    fontSize: EDITOR_CONFIG.fontSize,
                    fontFamily: EDITOR_CONFIG.fontFamily,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: "on",
                    formatOnPaste: true,
                    formatOnType: true,
                    renderValidationDecorations: "on",
                    scrollbar: {
                        vertical: "visible",
                        horizontal: "visible",
                        useShadows: false,
                        verticalHasArrows: false,
                        horizontalHasArrows: false,
                    },
                }}
            />
        </div>

        {footer && (
            <div
                className={
                    isFooterExpanded
                        ? "flex-1 min-h-0 flex flex-col overflow-hidden h-full bg-red-50"
                        : "shrink-0"
                }
            >
                {footer}
            </div>
        )}
    </div>
);

export default PayloadEditor;
