import { type FC, useCallback, useMemo } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import GithubMarkdown from "@components/GithubMarkdown";
import { cn } from "@/lib/utils";
import { Button } from "@components/Shadcn/Button";
import { stripRedundantMarkdownHorizontalRules } from "@utils/markdownToc";
import GuideTabs from "./shared/components/GuideTabs";
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
    const slugs = useMemo(() => Object.keys(docs), [docs]);

    const {
        activeDocSlug,
        setActiveDocSlug,
        selectedSectionId,
        selectedSectionLabel,
        selectSection,
        rightPanelOpen,
        setRightPanelOpen,
        toc,
        tocOffset,
    } = useDocsSectionSelection({
        docSlugs: slugs,
        docs,
    });

    const resolveSectionLabel = useCallback(
        (sectionId: string) => toc.find((entry) => entry.id === sectionId)?.text,
        [toc]
    );

    const content = docs[activeDocSlug] ?? "";
    // Domain docs often use `# Section` + `---` while GithubMarkdown already draws
    // border-b on headings — strip those rules so they don't stack as a double line.
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
            {slugs.length > 1 && (
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
                        className="absolute top-5 right-3 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-white dark:bg-surface-elevated border border-slate-200 dark:border-border-default shadow-sm hover:bg-slate-50 dark:hover:bg-surface-muted transition-colors"
                    >
                        <ChevronRightIcon
                            className={cn(
                                "w-3 h-3 text-slate-400 transition-transform duration-300 ease-in-out",
                                rightPanelOpen ? "" : "rotate-180"
                            )}
                        />
                    </Button>

                    <div className="flex flex-1 min-h-0 overflow-hidden">
                        {/* <TableOfContents
                            content={content}
                            className="hidden lg:block w-56 shrink-0 self-start sticky overflow-y-auto border-r border-slate-200 dark:border-border-default p-3"
                            style={{
                                top: tocOffset,
                                maxHeight: `calc(100vh - ${tocOffset}px)`,
                            }}
                            offset={tocOffset}
                            onSectionClick={selectSection}
                            activeSectionId={selectedSectionId}
                        /> */}

                        {/*
                          Domains like LAMF use `# Title` + `---` + `# 1. Overview` (both h1).
                          Stripping heading-adjacent --- leaves h1+h1; space them so Overview
                          isn't glued to the title rule. Scoped to DocsViewer only.
                        */}
                        <div
                            className={cn(
                                "flex-1 min-w-0 overflow-auto py-8 px-6",
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
                        </div>
                    </div>
                </div>

                <div
                    className={cn(
                        "shrink-0 self-start sticky overflow-hidden transition-[max-width,margin-left,opacity] duration-300 ease-in-out",
                        rightPanelOpen
                            ? "max-w-80 ml-4 opacity-100"
                            : "max-w-0 ml-0 opacity-0 pointer-events-none"
                    )}
                    style={{ top: tocOffset, height: `calc(100vh - ${tocOffset}px)` }}
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
