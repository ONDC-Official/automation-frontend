/**
 * Payload Editor Component
 *
 * Provides a Monaco editor for editing JSON payloads with validation button
 */

import { FC } from "react";
import Editor from "@monaco-editor/react";
import { PayloadEditorProps } from "./types";

export const EDITOR_CONFIG = {
    theme: "vs",
    language: "json",
    fontSize: 14,
    padding: { top: 16, bottom: 16 },
    fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace",
} as const;

/**
 * PayloadEditor component that renders a Monaco editor for JSON payload editing
 *
 * @param props - Component props
 * @returns JSX element
 */
const PayloadEditor: FC<PayloadEditorProps> = ({
    payload,
    isLoading,
    onPayloadChange,
    onEditorMount,
    onValidate,
    title,
    message,
}) => (
    <div className="w-3/5 flex flex-col p-6 space-y-4">
        <div className="flex-1 bg-white border border-sky-100 shadow-sm flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-sky-50 to-sky-100/50 px-6 py-4 border-b border-sky-100 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    <p className="text-sm text-sky-700 mt-1">{message}</p>
                </div>

                <button
                    className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 
                       text-white font-semibold px-5 py-2 transition-all duration-300 
                       disabled:opacity-50 disabled:cursor-not-allowed min-w-32 shadow-md 
                       hover:shadow-lg transform hover:scale-105 active:scale-95"
                    onClick={onValidate}
                    disabled={payload === "" || isLoading}
                >
                    {isLoading ? (
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 rounded-full border-white border-t-transparent animate-spin-slow"></div>
                            <span>Validating...</span>
                        </div>
                    ) : (
                        "Validate"
                    )}
                </button>
            </div>

            <div className="flex-1 min-h-0">
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
        </div>
    </div>
);

export default PayloadEditor;
