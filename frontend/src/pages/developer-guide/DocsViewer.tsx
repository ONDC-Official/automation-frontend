import { type FC, useState, useMemo } from "react";
import GithubMarkdown from "@components/GithubMarkdown";
import TableOfContents from "@components/TableOfContents";
import GuideCard from "./shared/components/GuideCard";
import GuideTabs from "./shared/components/GuideTabs";

interface DocsViewerProps {
    docs: Record<string, string>;
}

function formatSlug(slug: string): string {
    return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
                <GuideTabs
                    active={activeSlug}
                    onChange={setActiveSlug}
                    tabs={slugs.map((slug) => ({ id: slug, label: formatSlug(slug) }))}
                />
            )}

            {/* Content area split: TOC left + scrollable content right */}
            <GuideCard rounded="2xl" className="flex h-[700px]">
                {/* TOC sidebar — scrolls within its own column */}
                <div className="w-52 shrink-0 border-r border-slate-200 overflow-y-auto bg-slate-50/50 p-3">
                    <TableOfContents content={content} />
                </div>

                {/* Markdown content — scrolls independently */}
                <div className="flex-1 overflow-auto px-8 py-6">
                    <GithubMarkdown content={content} />
                </div>
            </GuideCard>
        </div>
    );
};

export default DocsViewer;
