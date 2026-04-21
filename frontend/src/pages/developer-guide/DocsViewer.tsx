import { type FC, useState, useMemo } from "react";
import GithubMarkdown from "@components/GithubMarkdown";
import TableOfContents from "@components/TableOfContents";

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
        <div className="flex flex-col gap-3">
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

            {/* Content area split: TOC left + scrollable content right */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex h-[700px]">
                {/* TOC sidebar — scrolls within its own column */}
                <div className="w-52 flex-shrink-0 border-r border-slate-200 overflow-y-auto bg-slate-50/50 p-3">
                    <TableOfContents content={content} />
                </div>

                {/* Markdown content — scrolls independently */}
                <div className="flex-1 overflow-auto px-8 py-6">
                    <GithubMarkdown content={content} />
                </div>
            </div>
        </div>
    );
};

export default DocsViewer;
