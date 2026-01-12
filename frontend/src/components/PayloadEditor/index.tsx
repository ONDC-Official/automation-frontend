/**
 * Payload Editor Component
 *
 * Provides a Monaco editor for editing JSON payloads with validation button
 * Supports both modal (overlay) and inline modes
 */

import { FC, useState } from "react";
import ReactDOM from "react-dom";
import Editor from "@monaco-editor/react";
import { PayloadEditorProps } from "./types";

export const EDITOR_CONFIG = {
  theme: "vs",
  language: "json",
  fontSize: 14,
  padding: { top: 16, bottom: 16 },
} as const;

/**
 * PayloadEditor component that renders a Monaco editor for JSON payload editing
 *
 * @param props - Component props
 * @returns JSX element
 */
const PayloadEditor: FC<PayloadEditorProps> = ({
  mode = "inline",
  payload: controlledPayload,
  isLoading = false,
  onPayloadChange,
  onEditorMount,
  onValidate,
  title = "Payload Editor",
  message = "",
  onAdd,
  buttonText = "Add",
}) => {
  // Internal state for modal mode
  const [internalPayload, setInternalPayload] = useState("");
  const [errorText, setErrorText] = useState("");

  // Use controlled payload if provided, otherwise use internal state
  const payload = controlledPayload !== undefined ? controlledPayload : internalPayload;
  const isModal = mode === "modal";

  const handlePayloadChange = (value: string | undefined) => {
    const newValue = value || "";
    if (isModal) {
      setInternalPayload(newValue);
      setErrorText(""); // Clear error on change
    } else if (onPayloadChange) {
      onPayloadChange(value);
    }
  };

  const handleAddClick = () => {
    if (!onAdd) return;

    let parsedText = null;
    try {
      parsedText = JSON.parse(payload);
      setErrorText("");
      onAdd(parsedText);
    } catch {
      setErrorText("Invalid json format");
    }
  };

  // Modal mode content
  if (isModal) {
    const modalContent = (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-3xl">
          <div className="flex items-center justify-between mb-4">
            <label className="text-lg font-semibold">Paste payload</label>
            {errorText && <p className="text-red-500 text-sm italic mt-1 w-full">{errorText}</p>}
            <button
              onClick={handleAddClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {buttonText}
            </button>
          </div>
          <div className="h-96">
            <Editor
              height="100%"
              value={payload}
              onChange={handlePayloadChange}
              defaultLanguage={EDITOR_CONFIG.language}
              theme={EDITOR_CONFIG.theme}
              options={{
                minimap: { enabled: false },
                padding: EDITOR_CONFIG.padding,
                fontSize: EDITOR_CONFIG.fontSize,
                lineNumbers: "on",
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
          </div>
        </div>
      </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
  }

  // Inline mode content
  return (
    <div className="w-3/5 flex flex-col p-6 space-y-4">
      <div className="flex-1 bg-white border border-sky-100 shadow-sm flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-sky-50 to-sky-100/50 px-6 py-4 border-b border-sky-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            {message && <p className="text-sm text-sky-700 mt-1">{message}</p>}
          </div>

          {onValidate && (
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
          )}
        </div>

        <div className="flex-1 min-h-0">
          <Editor
            theme={EDITOR_CONFIG.theme}
            height="100%"
            defaultLanguage={EDITOR_CONFIG.language}
            value={payload}
            onChange={handlePayloadChange}
            onMount={onEditorMount}
            options={{
              minimap: { enabled: false },
              padding: EDITOR_CONFIG.padding,
              fontSize: EDITOR_CONFIG.fontSize,
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
};

export default PayloadEditor;
