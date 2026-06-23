import { FC, useCallback } from "react";
import { ClipboardDocumentIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/Shadcn/Button";
import { AI_PROMPT } from "@pages/auth-header/overview/data";
import { useClipboard } from "@hooks/useClipboard";

const AIPromptGenerator: FC = () => {
    const { copyToClipboard } = useClipboard();

    const handleCopy = useCallback(() => {
        copyToClipboard(AI_PROMPT);
    }, [copyToClipboard]);

    return (
        <div className="rounded-xl border border-n-40 bg-brand-light p-6 dark:border-n-60 dark:bg-brand-normal/10">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-n-40 bg-white dark:border-n-60 dark:bg-surface-elevated">
                        <SparklesIcon className="h-5 w-5 text-brand-normal" aria-hidden />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-n-900 dark:text-n-0">
                            Generate for Your Tech Stack
                        </h3>
                        <p className="text-body-2 text-n-300 dark:text-n-60">
                            Copy this prompt to ChatGPT, Gemini, Claude, or any LLM
                        </p>
                    </div>
                </div>
                <Button
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0 gap-2"
                    aria-label="Copy AI prompt to clipboard"
                >
                    <ClipboardDocumentIcon className="h-5 w-5" />
                    Copy Prompt
                </Button>
            </div>

            <div className="max-h-80 overflow-y-auto rounded-lg bg-n-900 p-4 dark:bg-black">
                <pre className="whitespace-pre-wrap font-mono text-body-2 text-n-60">
                    {AI_PROMPT}
                </pre>
            </div>

            <div className="mt-4 rounded-lg border border-n-40 bg-white p-3 dark:border-n-60 dark:bg-surface-elevated">
                <p className="text-body-2 text-n-300 dark:text-n-60">
                    <strong className="text-n-900 dark:text-n-0">💡 Tip:</strong> Replace{" "}
                    <code className="rounded bg-n-20 px-1 text-n-900 dark:bg-surface-muted dark:text-n-0">
                        [YOUR_LANGUAGE/FRAMEWORK]
                    </code>{" "}
                    with your preferred tech stack (e.g., "Rust", "C#/.NET", "Ruby on Rails",
                    "Kotlin", "Swift") before pasting to the AI.
                </p>
            </div>
        </div>
    );
};

export default AIPromptGenerator;
