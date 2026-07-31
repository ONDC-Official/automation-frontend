import { type FC, useCallback, useMemo } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import GithubMarkdown from "@components/GithubMarkdown";
import { cn } from "@/lib/utils";
import { Button } from "@components/Shadcn/Button";
import { stripRedundantMarkdownHorizontalRules } from "@utils/markdownToc";
import GuideTabs from "./shared/components/GuideTabs";
import GuideTabFade from "./shared/components/GuideTabFade";
import CommentsPanel from "./flowActionDetails/CommentsPanel";
import { useDocsSectionSelection } from "./DocsViewer/useDocsSectionSelection";
import { buildDocumentCommentScope } from "./DocsViewer/utils";
import { useInlineCommentHeading } from "./shared/hooks/useInlineCommentHeading";

interface DocsViewerProps {
    docs: Record<string, string>;
    useCaseId: string;
    domain: string;
    version: string;
}

function formatSlug(slug: string): string {
    return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const DocsViewer: FC<DocsViewerProps> = ({ docs, useCaseId, domain, version }) => {
    /**
     * Frontend filter check to ensure "Release Notes" and "References" (including spelling variations)
     * are excluded from the documentation tabs and details pane for all domains/use cases.
     */
    const filteredDocs = useMemo(() => {
        if (!docs) return {};
        return Object.keys(docs).reduce<Record<string, string>>((acc, key) => {
            const normalized = key.toLowerCase().replace(/[-_]/g, " ").trim();
            if (
                normalized !== "release notes" &&
                normalized !== "references" &&
                normalized !== "refrences"
            ) {
                acc[key] = docs[key];
            }
            return acc;
        }, {});
    }, [docs]);

    const slugs = useMemo(() => Object.keys(filteredDocs), [filteredDocs]);

    const {
        activeDocSlug,
        setActiveDocSlug,
        selectedSectionId,
        selectedSectionLabel,
        selectSection,
        rightPanelOpen,
        setRightPanelOpen,
        toc,
    } = useDocsSectionSelection({
        docSlugs: slugs,
        docs: filteredDocs,
    });

    const resolveSectionLabel = useCallback(
        (sectionId: string) => toc.find((entry) => entry.id === sectionId)?.text,
        [toc]
    );

    const content = filteredDocs[activeDocSlug] ?? "";
    // Domain docs often use `# Section` + `---` — strip those so they don't leave
    // uneven empty gaps under titles.
    const displayContent = useMemo(() => stripRedundantMarkdownHorizontalRules(content), [content]);
    const commentScope = useMemo(
        () =>
            useCaseId && activeDocSlug && domain && version
                ? buildDocumentCommentScope(domain, version, useCaseId, activeDocSlug)
                : undefined,
        [useCaseId, activeDocSlug, domain, version]
    );

    const { renderHeadingAction, commentsRefreshKey } = useInlineCommentHeading({
        commentScope,
        selectSection,
        setRightPanelOpen,
    });

    if (slugs.length === 0) {
        return (
            <div className="rounded-xl border border-slate-200 bg-slate-50 py-12 text-center">
                <p className="text-sm text-slate-400">No documentation available.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {slugs.length >= 1 && (
                <GuideTabs
                    active={activeDocSlug}
                    onChange={setActiveDocSlug}
                    tabs={slugs.map((slug) => ({ id: slug, label: formatSlug(slug) }))}
                />
            )}

            <div className="flex items-stretch min-h-[60vh]">
                <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden border border-slate-200 dark:border-border-default rounded-lg bg-white dark:bg-surface-elevated relative">
                    <Button
                        variant="ghost"
                        onClick={() => setRightPanelOpen(!rightPanelOpen)}
                        title={rightPanelOpen ? "Collapse comments panel" : "Expand comments panel"}
                        aria-label={
                            rightPanelOpen ? "Collapse comments panel" : "Expand comments panel"
                        }
                        className="absolute top-5 right-3 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-white dark:bg-surface-elevated border border-slate-200 dark:border-border-default shadow-sm hover:bg-slate-50 dark:hover:bg-surface-muted transition-none"
                    >
                        <ChevronRightIcon
                            className={cn(
                                "w-3 h-3 text-slate-400 transition-transform duration-300 ease-in-out motion-reduce:transition-none",
                                rightPanelOpen ? "" : "rotate-180"
                            )}
                        />
                    </Button>

                    <div className="flex flex-1 min-h-0 overflow-hidden">
                        {/*
                          Domains like LAMF use `# Title` + `---` + `# 1. Overview` (both h1).
                          Stripping heading-adjacent --- leaves h1+h1; space them so Overview
                          isn't glued to the title rule. Scoped to DocsViewer only.
                        */}
                        <GuideTabFade
                            activeKey={activeDocSlug}
                            tabOrder={slugs}
                            className={cn(
                                "flex-1 min-w-0 overflow-auto p-4",
                                "[&_h1+h1]:mt-2"
                                // "[&_h1+h2]:mt-8",
                                // "[&_h2+h2]:mt-8"
                            )}
                        >
                            <GithubMarkdown
                                content={displayContent}
                                onSectionClick={selectSection}
                                renderHeadingAction={renderHeadingAction}
                            />
                        </GuideTabFade>
                    </div>
                </div>

                {/* Stretch with the content card — sticky+top is wrong here because GuideTabFade's overflow-hidden becomes the sticky containing block and offsets the panel downward. */}
                <div
                    className={cn(
                        "shrink-0 overflow-hidden transition-[max-width,margin-left,opacity] duration-300 ease-in-out",
                        rightPanelOpen
                            ? "max-w-80 ml-4 opacity-100"
                            : "max-w-0 ml-0 opacity-0 pointer-events-none"
                    )}
                >
                    <div className="w-80 h-full">
                        {commentScope && (
                            <CommentsPanel
                                key={commentsRefreshKey}
                                selectedPath={selectedSectionId}
                                commentScope={commentScope}
                                selectionLabel={selectedSectionLabel}
                                resolvePathLabel={resolveSectionLabel}
                                emptySelectionMessage="Select a section to add comments."
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocsViewer;
