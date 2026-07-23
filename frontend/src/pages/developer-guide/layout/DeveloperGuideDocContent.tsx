import { FC, useMemo } from "react";
// import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useParams } from "react-router-dom";
import { useGetGithubDocContentQuery } from "@store/api";
import GithubMarkdown from "@components/GithubMarkdown";
import TableOfContents from "@components/TableOfContents";
// import { Button } from "@components/Shadcn/Button";
// import { cn } from "@/lib/utils";
import {
    stripMarkdownTableOfContents,
    stripRedundantMarkdownHorizontalRules,
} from "@utils/markdownToc";
// Comments feature: enabled only under Flow → Example Payload (domain > usecase > version).
// import { buildGeneralDocCommentScope } from "@/types/comment-scope";
import { docUsesSidebarSections } from "./docsWithSidebarSections";
// import CommentsPanel from "../flowActionDetails/CommentsPanel";
import { useDocsSectionSelection } from "../DocsViewer/useDocsSectionSelection";
import GuideContentSkeleton from "../shared/components/GuideContentSkeleton";
// import { useInlineCommentHeading } from "../shared/hooks/useInlineCommentHeading";

const DeveloperGuideDocContent: FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const usesSidebarSections = docUsesSidebarSections(slug);

    const {
        data: content = "",
        isLoading,
        isError,
    } = useGetGithubDocContentQuery(slug ?? "", { skip: !slug });

    const docSlugs = useMemo(() => (slug ? [slug] : []), [slug]);
    const docsRecord = useMemo(() => (slug ? { [slug]: content } : {}), [slug, content]);
    const {
        selectedSectionId,
        // selectedSectionLabel,
        selectSection,
        // rightPanelOpen,
        // setRightPanelOpen,
        // toc,
        tocOffset,
    } = useDocsSectionSelection({ docSlugs, docs: docsRecord });

    // const resolveSectionLabel = useCallback(
    //     (sectionId: string) => toc.find((entry) => entry.id === sectionId)?.text,
    //     [toc]
    // );

    // const commentScope = useMemo(
    //     () => (slug ? buildGeneralDocCommentScope(slug) : undefined),
    //     [slug]
    // );
    // const { renderHeadingAction, commentsRefreshKey } = useInlineCommentHeading({
    //     commentScope,
    //     selectSection,
    //     setRightPanelOpen,
    // });

    // GitHub md often uses `# Title` / `## Section` + `---` — strip heading-adjacent
    // rules so they don't leave empty vertical gaps under titles.
    const displayContent = useMemo(() => {
        const withoutToc = usesSidebarSections ? stripMarkdownTableOfContents(content) : content;
        return stripRedundantMarkdownHorizontalRules(withoutToc);
    }, [content, usesSidebarSections]);

    if (isLoading) {
        return <GuideContentSkeleton />;
    }

    if (isError) {
        return (
            <div className="p-4 py-16 text-center">
                <p className="text-slate-500 text-sm">
                    Failed to load documentation. Refresh the page to try again.
                </p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex gap-6 items-stretch min-h-[60vh]">
                {!usesSidebarSections && (
                    <TableOfContents
                        content={content}
                        className="hidden xl:block w-56 shrink-0 self-start sticky overflow-y-auto"
                        style={{
                            top: tocOffset,
                            maxHeight: `calc(100vh - ${tocOffset}px)`,
                        }}
                        offset={tocOffset}
                        onSectionClick={selectSection}
                        activeSectionId={selectedSectionId}
                    />
                )}
                <div className="flex-1 min-w-0 relative">
                    {/* Comments panel toggle — disabled outside Flow → Example Payload */}
                    {/* {commentScope && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setRightPanelOpen(!rightPanelOpen)}
                            title={
                                rightPanelOpen ? "Collapse comments panel" : "Expand comments panel"
                            }
                            aria-label={
                                rightPanelOpen ? "Collapse comments panel" : "Expand comments panel"
                            }
                            className="absolute top-0 right-0 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-white dark:bg-surface-elevated border border-slate-200 dark:border-border-default shadow-sm hover:bg-slate-50 dark:hover:bg-surface-muted transition-colors"
                        >
                            <ChevronRightIcon
                                className={cn(
                                    "w-3 h-3 text-slate-400 transition-transform duration-300 ease-in-out",
                                    rightPanelOpen ? "" : "rotate-180"
                                )}
                            />
                        </Button>
                    )} */}
                    {/* Doc-route only: GitHub md uses --- dividers that stack with heading border-b. */}
                    <div
                        className={[
                            "max-w-none",
                            // Avoid double rule under title (h1 border-b + following ---)
                            "[&_h1:has(+hr)]:border-b-0!",
                            "[&_h1:has(+hr)]:pb-0!",
                            // Equalize space above/below ## titles between --- and border-b
                            "[&_hr:has(+h2)]:mt-8!",
                            "[&_hr:has(+h2)]:mb-0!",
                            "[&_hr+h2]:mt-0!",
                            "[&_hr+h2]:pt-3!",
                            "[&_hr+h2]:pb-3!",
                        ].join(" ")}
                    >
                        <GithubMarkdown
                            content={displayContent}
                            onSectionClick={selectSection}
                            // renderHeadingAction={renderHeadingAction}
                        />
                    </div>
                </div>
                {/* Comments sidebar — disabled outside Flow → Example Payload */}
                {/* {commentScope && (
                    <div
                        className={cn(
                            "shrink-0 self-start sticky overflow-hidden transition-[max-width,opacity] duration-300 ease-in-out",
                            rightPanelOpen
                                ? "max-w-80 opacity-100"
                                : "max-w-0 opacity-0 pointer-events-none"
                        )}
                        style={{ top: tocOffset, height: `calc(100vh - ${tocOffset}px)` }}
                    >
                        <div className="w-80 h-full">
                            <CommentsPanel
                                key={commentsRefreshKey}
                                selectedPath={selectedSectionId}
                                commentScope={commentScope}
                                selectionLabel={selectedSectionLabel}
                                resolvePathLabel={resolveSectionLabel}
                                emptySelectionMessage="Select a section to add comments."
                            />
                        </div>
                    </div>
                )} */}
            </div>
        </div>
    );
};

export default DeveloperGuideDocContent;
