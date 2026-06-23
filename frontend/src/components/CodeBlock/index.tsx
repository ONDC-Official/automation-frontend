import { FC, ReactNode, useEffect, useState } from "react";
import {
    DocumentDuplicateIcon,
    ArrowsPointingOutIcon,
    ArrowsPointingInIcon,
} from "@heroicons/react/24/outline";
import { useClipboard } from "@hooks/useClipboard";

interface CodeBlockProps {
    code: string;
    language?: string;
    wrap?: boolean;
    maxHeightClass?: string;
    children?: ReactNode;
}

const CodeBlock: FC<CodeBlockProps> = ({
    code,
    language,
    wrap = false,
    maxHeightClass,
    children,
}) => {
    const { copyToClipboard } = useClipboard();
    const [isFullscreen, setIsFullscreen] = useState(false);

    const handleCopy = () => {
        void copyToClipboard(code);
    };

    useEffect(() => {
        if (!isFullscreen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsFullscreen(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isFullscreen]);

    const whitespaceClass = wrap ? "whitespace-pre-wrap" : "whitespace-pre";

    return (
        <>
            {isFullscreen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50"
                    onClick={() => setIsFullscreen(false)}
                />
            )}

            <div
                className={
                    isFullscreen
                        ? "fixed inset-4 z-50 overflow-hidden rounded-lg border border-border bg-background shadow-xl"
                        : "relative my-4 overflow-hidden rounded-lg"
                }
            >
                <div className="flex items-center justify-between bg-brand-light px-4 py-1.5 dark:bg-muted">
                    <span className="font-mono text-body-2 font-semibold tracking-wider text-foreground">
                        {language || "Text"}
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="flex items-center gap-1 rounded px-2 py-0.5 text-body-2 font-semibold text-foreground transition-colors hover:bg-slate-700 hover:text-white"
                        >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                            Copy
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsFullscreen((v) => !v)}
                            className="rounded p-1 text-foreground transition-colors hover:bg-slate-700 hover:text-white"
                            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                        >
                            {isFullscreen ? (
                                <ArrowsPointingInIcon className="h-4 w-4" />
                            ) : (
                                <ArrowsPointingOutIcon className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>

                <pre
                    className={
                        isFullscreen
                            ? `h-[calc(100vh-4rem)] overflow-auto bg-brand-light/30 px-4 py-4 text-sm leading-relaxed ${whitespaceClass} text-foreground dark:bg-muted/70 [&_code]:text-inherit`
                            : `m-0 overflow-x-auto bg-brand-light/30 px-4 py-4 text-sm leading-relaxed ${whitespaceClass} text-foreground dark:bg-muted/70 [&_code]:text-inherit ${
                                  maxHeightClass ? `${maxHeightClass} overflow-y-auto` : ""
                              }`
                    }
                >
                    {children ?? code}
                </pre>
            </div>
        </>
    );
};

export default CodeBlock;
