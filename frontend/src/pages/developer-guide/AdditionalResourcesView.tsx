import { useMemo, useRef, useState, type FC } from "react";
import GithubMarkdown from "@components/GithubMarkdown";
import { scrollToSectionWithOffset } from "@components/TableOfContents/scrollToSection";
import { stripRedundantMarkdownHorizontalRules } from "@utils/markdownToc";
import {
    PinnedPageIndex,
    PageIndexList,
    buildDocIndexGroups,
} from "./shared/components/PinnedPageIndex";

interface AdditionalResourcesViewProps {
    docs: Record<string, string>;
}

/** Any sticky header/tab strip the page scrolls under, so a clicked anchor lands
 * just below it instead of underneath it. Matches `useDocsSectionSelection`'s offset. */
const TOC_TOP = 100;

/** Each doc shows only its first two `##` sections in the index — a quick-scan
 * outline per doc rather than a full mirror of every section. */
const MAX_SECTIONS_PER_DOC = 2;

/**
 * Renders the "Additional Resources" docs — reference links and supplementary
 * material kept out of the Use Case Brief tab — as sections of one single page,
 * in the order given by `docs` (see `resolveAdditionalResourcesDocs`), rather than
 * as separate tabs.
 */
const AdditionalResourcesView: FC<AdditionalResourcesViewProps> = ({ docs }) => {
    const slugs = useMemo(() => Object.keys(docs), [docs]);
    const [activeId, setActiveId] = useState("");
    const contentRef = useRef<HTMLDivElement>(null);

    const indexGroups = useMemo(
        () => buildDocIndexGroups(docs, slugs, MAX_SECTIONS_PER_DOC),
        [slugs, docs]
    );

    if (slugs.length === 0) return null;

    const handleSectionClick = (id: string) => {
        setActiveId(id);
        scrollToSectionWithOffset(id, TOC_TOP, true);
    };

    return (
        <div className="flex flex-col gap-3 py-6">
            <div className="flex items-start gap-6">
                <div
                    ref={contentRef}
                    className="min-h-[60vh] flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-border-default bg-white dark:bg-surface-elevated p-4 flex flex-col gap-10"
                >
                    {slugs.map((slug) => {
                        const displayContent = stripRedundantMarkdownHorizontalRules(
                            docs[slug] ?? ""
                        );
                        return (
                            <section key={slug}>
                                <GithubMarkdown content={displayContent} />
                            </section>
                        );
                    })}
                </div>

                {indexGroups.length > 0 && (
                    <PinnedPageIndex
                        topOffset={TOC_TOP}
                        boundaryRef={contentRef}
                        className="hidden lg:block w-64 shrink-0 self-start"
                    >
                        <PageIndexList
                            groups={indexGroups}
                            activeId={activeId}
                            onItemClick={handleSectionClick}
                        />
                    </PinnedPageIndex>
                )}
            </div>
        </div>
    );
};

export default AdditionalResourcesView;
