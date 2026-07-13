import { type FC, useMemo } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import GithubMarkdown from "@components/GithubMarkdown";
import { cn } from "@/lib/utils";
import { Button } from "@components/Shadcn/Button";
import GuideTabs from "./shared/components/GuideTabs";
import CommentsPanel from "./flowActionDetails/CommentsPanel";
import { useDocsSectionSelection } from "./DocsViewer/useDocsSectionSelection";
import { buildDocumentCommentScope } from "./DocsViewer/utils";

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
    } = useDocsSectionSelection({
        docSlugs: slugs,
        docs,
    });

    const content = docs[activeDocSlug] ?? "";
    const commentScope = useMemo(
        () =>
            useCaseId && activeDocSlug && domain && version
                ? buildDocumentCommentScope(domain, version, useCaseId, activeDocSlug)
                : undefined,
        [useCaseId, activeDocSlug, domain, version]
    );

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

                        <div className="flex-1 min-w-0 overflow-auto py-6 px-6">
                            <GithubMarkdown content={content} onSectionClick={selectSection} />
                        </div>
                    </div>
                </div>

                <div
                    className={cn(
                        "shrink-0 overflow-hidden transition-[max-width,margin-left,opacity] duration-300 ease-in-out",
                        rightPanelOpen
                            ? "max-w-80 ml-4 opacity-100"
                            : "max-w-0 ml-0 opacity-0 pointer-events-none"
                    )}
                >
                    <div className="w-80 h-full flex flex-col min-h-0 rounded-lg bg-white dark:bg-surface-elevated overflow-hidden">
                        <div className="flex-1 min-h-0 overflow-y-auto">
                            {commentScope && (
                                <CommentsPanel
                                    selectedPath={selectedSectionId}
                                    commentScope={commentScope}
                                    selectionLabel={selectedSectionLabel}
                                    emptySelectionMessage="Select a section to add comments."
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocsViewer;
