import { FC, useCallback } from "react";
import { FaRobot, FaCopy, FaCheck } from "react-icons/fa";
import { AI_PROMPT } from "@pages/auth-header/overview/data";
import { useClipboard } from "@hooks/useClipboard";

const AIPromptGenerator: FC = () => {
    const { copied, copyToClipboard } = useClipboard();

    const handleCopy = useCallback(() => {
        copyToClipboard(AI_PROMPT);
    }, [copyToClipboard]);

    return (
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                        <FaRobot className="text-violet-600 text-xl" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">
                            Generate for Your Tech Stack
                        </h3>
                        <p className="text-sm text-gray-600">
                            Copy this prompt to ChatGPT, Gemini, Claude, or any LLM
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                    type="button"
                    aria-label="Copy AI prompt to clipboard"
                >
                    {copied ? (
                        <>
                            <FaCheck />
                            Copied!
                        </>
                    ) : (
                        <>
                            <FaCopy />
                            Copy Prompt
                        </>
                    )}
                </button>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 max-h-80 overflow-y-auto">
                <pre className="text-gray-300 text-sm font-mono whitespace-pre-wrap">
                    {AI_PROMPT}
                </pre>
            </div>

            <div className="mt-4 bg-violet-100 border border-violet-300 rounded-lg p-3">
                <p className="text-sm text-violet-800">
                    <strong>💡 Tip:</strong> Replace{" "}
                    <code className="bg-violet-200 px-1 rounded">[YOUR_LANGUAGE/FRAMEWORK]</code>{" "}
                    with your preferred tech stack (e.g., "Rust", "C#/.NET", "Ruby on Rails",
                    "Kotlin", "Swift") before pasting to the AI.
                </p>
            </div>
        </div>
    );
};

export default AIPromptGenerator;
