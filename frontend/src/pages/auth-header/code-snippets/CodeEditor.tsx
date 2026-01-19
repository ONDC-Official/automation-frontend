import { FC } from "react";
import { FaCopy, FaCheck } from "react-icons/fa";
import Editor from "@monaco-editor/react";
import { codeSnippets } from "@pages/auth-header/code-snippets/data";
import { CodeEditorProps } from "@pages/auth-header/code-snippets/types";

const EDITOR_HEIGHT = "500px";
const EDITOR_OPTIONS = {
    readOnly: true,
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: "on" as const,
    scrollBeyondLastLine: false,
    wordWrap: "on" as const,
    padding: { top: 16 },
};

const CodeEditor: FC<CodeEditorProps> = ({
    code,
    language,
    selectedLang,
    functionType,
    copied,
    onCopy,
}) => {
    const functionLabel = functionType === "generate" ? "Generate" : "Verify";
    const editorTitle = `${codeSnippets[selectedLang].label} - ${functionLabel} Header`;

    return (
        <div className="relative bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <span className="text-gray-300 text-sm font-medium">{editorTitle}</span>
                <button
                    onClick={onCopy}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 text-sm transition-colors"
                    aria-label={copied ? "Code copied to clipboard" : "Copy code to clipboard"}
                >
                    {copied ? (
                        <>
                            <FaCheck className="text-green-400" aria-hidden="true" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <FaCopy aria-hidden="true" />
                            Copy Code
                        </>
                    )}
                </button>
            </div>
            <Editor
                height={EDITOR_HEIGHT}
                language={language}
                value={code}
                theme="vs-dark"
                options={EDITOR_OPTIONS}
            />
        </div>
    );
};

export default CodeEditor;
