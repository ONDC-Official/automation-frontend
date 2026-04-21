import { type FC, useState } from "react";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import type { Components } from "react-markdown";
import "highlight.js/styles/github-dark.css";

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
    const [copied, setCopied] = useState(false);
    const lang = extractLang(children);
    const text = extractText(children).replace(/\n$/, "");

    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="relative my-4 rounded-lg overflow-hidden border border-slate-700 shadow-sm">
            <div className="flex items-center justify-between bg-[#161b22] px-4 py-1.5 border-b border-slate-700">
                <span className="text-[11px] font-mono text-slate-400 tracking-wider">
                    {lang || "text"}
                </span>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="text-[11px] text-slate-400 hover:text-white transition-colors px-2 py-0.5 rounded hover:bg-slate-700"
                >
                    {copied ? "Copied!" : "Copy"}
                </button>
            </div>
            <pre className="overflow-x-auto bg-[#0d1117] px-4 py-4 m-0 text-sm leading-relaxed whitespace-pre">
                {children}
            </pre>
        </div>
    );
};

const components: Components = {
    pre({ children }) {
        return <PreBlock>{children}</PreBlock>;
    },
    code({ className, children }) {
        const str = String(children);
        // Block code: has a language class OR content spans multiple lines (ASCII art, plain blocks)
        if (className || str.includes("\n")) {
            return (
                <code className={`${className ?? ""} font-mono text-sm text-slate-200`}>
                    {children}
                </code>
            );
        }
        // Inline code
        return (
            <code className="px-1.5 py-0.5 rounded text-[0.85em] font-mono bg-slate-100 text-slate-800 border border-slate-200">
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
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                {children}
            </th>
        );
    },
    td({ children }) {
        return (
            <td className="px-4 py-2.5 text-slate-700 border-b border-slate-100">{children}</td>
        );
    },
    tr({ children }) {
        return <tr className="even:bg-slate-50 hover:bg-slate-100/60 transition-colors">{children}</tr>;
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
                className="text-2xl font-bold text-slate-900 mt-8 mb-3 pb-2 border-b border-slate-200 scroll-mt-24"
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
            <h4
                id={id}
                className="text-sm font-semibold text-slate-700 mt-4 mb-1.5 scroll-mt-24"
            >
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
                className="text-sky-600 hover:text-sky-800 underline underline-offset-2 transition-colors"
            >
                {children}
            </a>
        );
    },
    ul({ children }) {
        return (
            <ul className="my-3 ml-5 space-y-1 list-disc marker:text-slate-400">{children}</ul>
        );
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
