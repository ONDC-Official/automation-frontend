import { useState } from "react";
import Editor from "@monaco-editor/react";
import { MdOutlineContentCopy } from "react-icons/md";
import { Step } from "./apiMethod";

const CodeBlock = ({ step }: { step: Step }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{ backgroundColor: "#2b2b2b" }} className="border rounded-lg">
      {/* Editor */}
      <div className="p-2">
        <div className="p-2 flex justify-between items-center">
          <h2 className="text-base font-semibold text-white">
            {step.title} – {step.code[activeTab].label}
          </h2>

          {/* Copy Button */}
          <button
            onClick={() =>
              navigator.clipboard.writeText(step.code[activeTab].content.trim())
            }
            className="text-white p-1 rounded hover:bg-gray-700 transition"
            title="Copy to clipboard"
          >
            <MdOutlineContentCopy size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-black rounded-lg p-2 mb-2">
          {step.code.map((c, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2 text-sm font-medium transition ${
                i === activeTab
                  ? "bg-[#2b2b2b] text-white font-bold rounded-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <Editor
          height="fit-content"
          defaultLanguage={step.code[activeTab].language}
          value={step.code[activeTab].content.trim()}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
          }}
          onMount={(editor) => {
            const updateHeight = () => {
              const contentHeight = editor.getContentHeight();
              editor.getDomNode()!.style.height = `${Math.min(
                contentHeight,
                300
              )}px`;
              editor.layout();
            };
            updateHeight();
            editor.onDidContentSizeChange(updateHeight);
          }}
        />
      </div>
    </div>
  );
};

export default CodeBlock;
