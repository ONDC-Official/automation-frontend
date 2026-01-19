import React, { useState } from "react";
import { codeSnippets, LanguageKey } from "./code-snippets";
import { FaCopy, FaCheck } from "react-icons/fa";
import Editor from "@monaco-editor/react";

const CodeSnippets: React.FC = () => {
    const [selectedLang, setSelectedLang] = useState<LanguageKey>("python");
    const [showGenerate, setShowGenerate] = useState(true);
    const [copied, setCopied] = useState(false);

    const languages = Object.keys(codeSnippets) as LanguageKey[];
    const currentSnippet = codeSnippets[selectedLang];
    const currentCode = showGenerate ? currentSnippet.generate : currentSnippet.verify;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(currentCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-4">
            {/* Language Tabs */}
            <div className="flex flex-wrap gap-2">
                {languages.map((lang) => (
                    <button
                        key={lang}
                        onClick={() => setSelectedLang(lang)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            selectedLang === lang
                                ? "bg-sky-600 text-white shadow-md"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        {codeSnippets[lang].label}
                    </button>
                ))}
            </div>

            {/* Function Toggle */}
            <div className="flex gap-2">
                <button
                    onClick={() => setShowGenerate(true)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        showGenerate
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                    Generate Header
                </button>
                <button
                    onClick={() => setShowGenerate(false)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        !showGenerate
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                    Verify Header
                </button>
            </div>

            {/* Code Editor */}
            <div className="relative bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                    <span className="text-gray-300 text-sm font-medium">
                        {currentSnippet.label} - {showGenerate ? "Generate" : "Verify"} Header
                    </span>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 text-sm transition-colors"
                    >
                        {copied ? (
                            <>
                                <FaCheck className="text-green-400" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <FaCopy />
                                Copy Code
                            </>
                        )}
                    </button>
                </div>
                <Editor
                    height="500px"
                    language={currentSnippet.language}
                    value={currentCode}
                    theme="vs-dark"
                    options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        padding: { top: 16 },
                    }}
                />
            </div>

            {/* Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                    <strong>Note:</strong> These code snippets use the following cryptographic
                    libraries:
                </p>
                <ul className="text-amber-700 text-sm mt-2 list-disc list-inside">
                    <li>
                        <strong>Python:</strong> PyNaCl (nacl)
                    </li>
                    <li>
                        <strong>Go:</strong> golang.org/x/crypto/blake2b, crypto/ed25519
                    </li>
                    <li>
                        <strong>Java:</strong> BouncyCastle
                    </li>
                    <li>
                        <strong>Node.js:</strong> libsodium-wrappers
                    </li>
                    <li>
                        <strong>PHP:</strong> sodium extension
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default CodeSnippets;
