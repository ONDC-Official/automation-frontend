import React from "react";
import { Editor } from "@monaco-editor/react";
import { MdClose } from "react-icons/md";

interface JsonPathOutputPopupProps {
  jsonPath: string;
  output: any;
  onClose: () => void;
}

const JsonPathOutputPopup: React.FC<JsonPathOutputPopupProps> = ({
  jsonPath,
  output,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      <div className="relative bg-[#1e1e1e] rounded-xl shadow-2xl w-[80%] h-[70%] border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700 bg-gray-900/70">
          <div>
            <h2 className="text-lg font-semibold text-white">Output</h2>
            <p className="text-xs text-gray-400 font-mono">{jsonPath}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            title="Close"
          >
            <MdClose size={18} />
          </button>
        </div>

        {/* Monaco JSON Viewer */}
        <div className="h-full">
          <Editor
            height="calc(100% - 52px)"
            defaultLanguage="json"
            value={JSON.stringify(output, null, 2)}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              wordWrap: "on",
              fontSize: 14,
              scrollBeyondLastLine: false,
              padding: { top: 10, bottom: 10 },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default JsonPathOutputPopup;
