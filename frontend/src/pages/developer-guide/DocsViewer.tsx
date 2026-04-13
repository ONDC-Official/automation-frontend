import { type FC, useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";

interface DocsViewerProps {
    docs: Record<string, string>;
}

function formatSlug(slug: string): string {
    return slug
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

const DocsViewer: FC<DocsViewerProps> = ({ docs }) => {
    const slugs = useMemo(() => Object.keys(docs), [docs]);
    const [activeSlug, setActiveSlug] = useState<string>(slugs[0] ?? "");

    const content = docs[activeSlug] ?? "";

    if (slugs.length === 0) {
        return (
            <div className="rounded-xl border border-slate-200 bg-slate-50 py-12 text-center">
                <p className="text-sm text-slate-400">No documentation available.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Doc tab selector */}
            {slugs.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 overflow-x-auto">
                    {slugs.map((slug) => (
                        <button
                            key={slug}
                            type="button"
                            onClick={() => setActiveSlug(slug)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                                activeSlug === slug
                                    ? "bg-white text-slate-800 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            {formatSlug(slug)}
                        </button>
                    ))}
                </div>
            )}

            {/* Markdown content */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="max-h-[700px] overflow-auto px-8 py-6">
                    <article className="prose prose-slate prose-sm max-w-none prose-headings:text-slate-900 prose-a:text-sky-600 prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-slate-800 prose-code:text-xs prose-pre:bg-slate-900 prose-pre:text-slate-100">
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </article>
                </div>
            </div>
        </div>
    );
};

export default DocsViewer;
