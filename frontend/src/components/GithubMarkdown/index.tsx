import { type FC, useState, useEffect } from "react";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import type { Components } from "react-markdown";
import { useClipboard } from "@hooks/useClipboard";
import {
    DocumentDuplicateIcon,
    ArrowsPointingOutIcon,
    ArrowsPointingInIcon,
} from "@heroicons/react/24/outline";

interface GithubMarkdownProps {
    content: string;
}

// Recursively extracts text from React children for copy
function extractText(node: React.ReactNode): string {
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (React.isValidElement(node))
        return extractText((node.props as { children?: React.ReactNode }).children);
    if (Array.isArray(node)) return node.map(extractText).join("");
    return "";
}

// Extracts language from code child className (e.g. "language-json" → "json")
function extractLang(node: React.ReactNode): string {
    for (const child of React.Children.toArray(node)) {
        if (React.isValidElement(child)) {
            const cls = (child.props as { className?: string }).className ?? "";
            const m = /language-(\w+)/.exec(cls);
            if (m) return m[1];
        }
    }
    return "";
}

const PreBlock: FC<{ children?: React.ReactNode }> = ({ children }) => {
    const { copyToClipboard } = useClipboard();
    const [isFullscreen, setIsFullscreen] = useState(false);

    const lang = extractLang(children);
    const text = extractText(children).replace(/\n$/, "");

    const handleCopy = () => {
        void copyToClipboard(text);
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
                        {lang || "Text"}
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
                            ? "h-[calc(100vh-4rem)] overflow-auto bg-brand-light/30 px-4 py-4 text-sm leading-relaxed whitespace-pre text-foreground dark:bg-muted/70 [&_code]:text-inherit"
                            : "m-0 overflow-x-auto bg-brand-light/30 px-4 py-4 text-sm leading-relaxed whitespace-pre text-foreground dark:bg-muted/70 [&_code]:text-inherit"
                    }
                >
                    {children}
                </pre>
            </div>
        </>
    );
};

const components: Components = {
    pre({ children }) {
        return <PreBlock>{children}</PreBlock>;
    },
    code({ className, children }) {
        const str = String(children);

        // Block code
        if (className || str.includes("\n")) {
            return (
                <code className={`${className ?? ""} font-mono text-sm text-inherit`}>
                    {children}
                </code>
            );
        }

        // Inline code
        return (
            <code className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
                {children}
            </code>
        );
    },
    table({ children }) {
        return (
            <div className="my-4 overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">{children}</table>
            </div>
        );
    },
    thead({ children }) {
        return <thead className="bg-slate-50">{children}</thead>;
    },
    th({ children }) {
        return (
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 tracking-wider border-b border-slate-200">
                {children}
            </th>
        );
    },
    td({ children }) {
        return <td className="px-4 py-2.5 text-slate-700 border-b border-slate-100">{children}</td>;
    },
    tr({ children }) {
        return (
            <tr className="even:bg-slate-50 hover:bg-slate-100/60 transition-colors">{children}</tr>
        );
    },
    blockquote({ children }) {
        return (
            <blockquote className="my-4 pl-4 border-l-4 border-slate-300 bg-slate-50 py-3 pr-3 rounded-r-lg text-slate-600 italic">
                {children}
            </blockquote>
        );
    },
    h1({ children, id }) {
        return (
            <h1
                id={id}
                className="text-2xl font-bold text-slate-900 my-4 pb-2 border-b border-slate-200 scroll-mt-24"
            >
                {children}
            </h1>
        );
    },
    h2({ children, id }) {
        return (
            <h2
                id={id}
                className="text-xl font-semibold text-slate-800 mt-7 mb-2.5 pb-1.5 border-b border-slate-100 scroll-mt-24"
            >
                {children}
            </h2>
        );
    },
    h3({ children, id }) {
        return (
            <h3 id={id} className="text-base font-semibold text-slate-800 mt-5 mb-2 scroll-mt-24">
                {children}
            </h3>
        );
    },
    h4({ children, id }) {
        return (
            <h4 id={id} className="text-sm font-semibold text-slate-700 mt-4 mb-1.5 scroll-mt-24">
                {children}
            </h4>
        );
    },
    a({ children, href }) {
        const isExternal = href?.startsWith("http");
        return (
            <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="text-sky-600 hover:text-sky-800 hover:underline underline-offset-2 transition-colors"
            >
                {children}
            </a>
        );
    },
    ul({ children }) {
        return <ul className="my-3 ml-5 space-y-1 list-disc marker:text-slate-400">{children}</ul>;
    },
    ol({ children }) {
        return (
            <ol className="my-3 ml-5 space-y-1 list-decimal marker:text-slate-400">{children}</ol>
        );
    },
    li({ children }) {
        return <li className="text-slate-700 leading-relaxed pl-1">{children}</li>;
    },
    p({ children }) {
        return <p className="my-3 text-slate-700 leading-relaxed">{children}</p>;
    },
    hr() {
        return <hr className="my-6 border-slate-200" />;
    },
    img({ src, alt }) {
        return (
            <img
                src={src}
                alt={alt}
                className="my-4 max-w-full rounded-lg border border-slate-200"
            />
        );
    },
};

const GithubMarkdown: FC<GithubMarkdownProps> = ({ content }) => {
    return (
        <div className="github-markdown text-slate-800">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[
                    rehypeSlug,
                    [rehypeAutolinkHeadings, { behavior: "wrap" }],
                    rehypeHighlight,
                ]}
                components={components}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default GithubMarkdown;
