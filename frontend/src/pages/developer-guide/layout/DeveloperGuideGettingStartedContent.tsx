import { FC, useMemo } from "react";
// import { ChevronRightIcon } from "@heroicons/react/24/outline";
import gettingStartedContent from "../landing/getting-started.md?raw";
import MdFileRender from "@components/MdFileRender";
// import { Button } from "@components/Shadcn/Button";
// import { cn } from "@/lib/utils";
// Comments feature: enabled only under Flow → Example Payload (domain > usecase > version).
// import { buildGeneralDocCommentScope } from "@/types/comment-scope";
// import CommentsPanel from "../flowActionDetails/CommentsPanel";
import { useDocsSectionSelection } from "../DocsViewer/useDocsSectionSelection";
// import { useInlineCommentHeading } from "../shared/hooks/useInlineCommentHeading";

const GETTING_STARTED_SLUG = "getting-started";

const DeveloperGuideGettingStartedContent: FC = () => {
    const mdData = useMemo(() => gettingStartedContent.replace(/^#\s+.+\n+/, ""), []);

    const docSlugs = useMemo(() => [GETTING_STARTED_SLUG], []);
    const docsRecord = useMemo(() => ({ [GETTING_STARTED_SLUG]: mdData }), [mdData]);
    const {
        // selectedSectionId,
        // selectedSectionLabel,
        selectSection,
        // rightPanelOpen,
        // setRightPanelOpen,
        // toc,
        // tocOffset,
    } = useDocsSectionSelection({ docSlugs, docs: docsRecord });

    // const resolveSectionLabel = useCallback(
    //     (sectionId: string) => toc.find((entry) => entry.id === sectionId)?.text,
    //     [toc]
    // );

    // const commentScope = useMemo(() => buildGeneralDocCommentScope(GETTING_STARTED_SLUG), []);
    // const { renderHeadingAction, commentsRefreshKey } = useInlineCommentHeading({
    //     commentScope,
    //     selectSection,
    //     setRightPanelOpen,
    // });

    return (
        <div className="p-4">
            <div className="shrink-0 flex gap-2 px-2 py-1 bg-alert-50 items-center mb-2">
                <span className="text-alert-500 text-[12px] font-semibold">Tip: </span>
                <span className="text-[12px] font-regular text-n-300">
                    Use Filter navigation in the sidebar to quickly find a domain, use case, or
                    documentation page.
                </span>
            </div>
            <div className="flex gap-6 items-stretch min-h-[60vh]">
                <div className="flex-1 min-w-0 relative">
                    {/* Comments panel toggle — disabled outside Flow → Example Payload */}
                    {/* <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setRightPanelOpen(!rightPanelOpen)}
                        title={rightPanelOpen ? "Collapse comments panel" : "Expand comments panel"}
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
                    </Button> */}
                    <MdFileRender
                        variant="guide"
                        title="Getting Started"
                        description="This section helps you quickly understand how to explore ONDC protocol flows, starting with the LAMF use case."
                        mdData={mdData}
                        showTableOfContents={false}
                        onSectionClick={selectSection}
                        // renderHeadingAction={renderHeadingAction}
                    />
                </div>
                {/* Comments sidebar — disabled outside Flow → Example Payload */}
                {/* <div
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
                </div> */}
            </div>
        </div>
    );
};

export default DeveloperGuideGettingStartedContent;
