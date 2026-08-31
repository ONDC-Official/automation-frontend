import { FC, useState, useCallback, useEffect, ComponentProps, MouseEvent, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { DocumentDuplicateIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useClipboard } from "@hooks/useClipboard";
import { cn } from "@/lib/utils";
import GuideTabs, { type GuideTabItem } from "../shared/components/GuideTabs";
import GuideTabFade from "../shared/components/GuideTabFade";
import JsonViewer from "@pages/protocol-playground/ui/Json-path-extractor";
import { SelectedType } from "@pages/protocol-playground/ui/types";
import type { OpenAPISpecification, ValidationTableAction } from "../types";
import { getActionAttributes, getValidationsForAction } from "./schemaAttributes";
import AttributesPanel from "./AttributesPanel";
import CommentsPanel from "./CommentsPanel";
import NotesPanel from "./NotesPanel";
import { getLeafRowsForApi, getValueAtPath, type RawTableAction } from "./attributePanelUtils";
import { Button } from "@components/Shadcn/Button";
import { TooltipHint } from "@components/Shadcn/Tooltip";
import { resolveCommentScope } from "@/types/comment-scope";
import { useInlineCommentJsonField } from "./useInlineCommentJsonField";

type RightPanelTab = "attributes" | "comments" | "notes";

const RIGHT_PANEL_TABS: GuideTabItem<RightPanelTab>[] = [
    { id: "attributes", label: "Details" },
    { id: "comments", label: "Comments" },
    { id: "notes", label: "Notes" },
];

interface FlowActionDetailsProps {
    exampleValue: object;
    /** action_id from step (for display, comments/notes keys). */
    actionApi: string;
    /** api from step (search, on_search, etc.) — used for x-attributes attribute_set lookup. */
    stepApi?: string;
    spec: OpenAPISpecification | null | undefined;
    useCaseId?: string;
    flowId?: string;
    domain?: string;
    version?: string;
    /** Validation table data keyed by action name. Loaded lazily from API. */
    validationTableData?: Record<string, ValidationTableAction> | null;
    /** When true, the JSON viewer and details panel use a 70/30 width split. */
    isFullscreen?: boolean;
}

const FlowActionDetails: FC<FlowActionDetailsProps> = ({
    exampleValue,
    actionApi,
    stepApi,
    spec,
    useCaseId,
    flowId,
    domain,
    version,
    validationTableData,
    isFullscreen = false,
}) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [rightPanelTab, setRightPanelTabState] = useState<RightPanelTab>(() => {
        const p = searchParams.get("panel");
        return p === "comments" || p === "notes" ? (p as RightPanelTab) : "attributes";
    });
    const [selectedPath, setSelectedPathState] = useState<string | null>(
        () => searchParams.get("attr") ?? null
    );
    const [rightPanelOpen, setRightPanelOpen] = useState(false);
    const { copyToClipboard } = useClipboard();

    useEffect(() => {
        const attr = searchParams.get("attr");
        setSelectedPathState(attr);
    }, [searchParams]);

    useEffect(() => {
        const panel = searchParams.get("panel");
        setRightPanelTabState(
            panel === "comments" || panel === "notes" ? (panel as RightPanelTab) : "attributes"
        );
    }, [searchParams]);

    const setRightPanelTab = useCallback(
        (tab: RightPanelTab) => {
            setRightPanelTabState(tab);
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    next.set("panel", tab);
                    return next;
                },
                { replace: true }
            );
        },
        [setSearchParams]
    );

    const selectPath = useCallback(
        (path: string) => {
            setSelectedPathState(path);
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    next.set("attr", path);
                    return next;
                },
                { replace: true }
            );
        },
        [setSearchParams]
    );

    const handleKeyClick = useCallback(
        (path: string, _k: string, e: MouseEvent) => {
            e.stopPropagation();
            selectPath(path);
        },
        [selectPath]
    );

    const commentScope = useMemo(
        () => resolveCommentScope(undefined, { useCaseId, flowId, actionApi, domain, version }),
        [useCaseId, flowId, actionApi, domain, version]
    );

    const handleFieldCommentPosted = useCallback(() => {
        setRightPanelOpen(true);
        setRightPanelTab("comments");
    }, [setRightPanelTab]);

    const { renderFieldCommentAction, commentsRefreshKey } = useInlineCommentJsonField({
        commentScope: commentScope ?? undefined,
        selectPath,
        onPosted: handleFieldCommentPosted,
    });

    const isSelected = useCallback(
        (path: string) => ({
            status: selectedPath === path,
            type: selectedPath === path ? SelectedType.SaveData : null,
        }),
        [selectedPath]
    );

    const valueAtPath = useMemo(
        () => (selectedPath ? getValueAtPath(exampleValue, selectedPath) : undefined),
        [exampleValue, selectedPath]
    );

    const apiForAttributes = stepApi ?? actionApi;

    const rawTableRows = useMemo(
        () =>
            validationTableData
                ? getLeafRowsForApi(
                      validationTableData as Record<string, RawTableAction>,
                      apiForAttributes
                  )
                : [],
        [validationTableData, apiForAttributes]
    );

    const attributes = useMemo(
        () =>
            selectedPath
                ? getActionAttributes(spec, apiForAttributes, selectedPath, valueAtPath, useCaseId)
                : null,
        [selectedPath, spec, apiForAttributes, valueAtPath, useCaseId]
    );

    const validations = useMemo(
        () => getValidationsForAction(spec, apiForAttributes, selectedPath ?? undefined),
        [spec, apiForAttributes, selectedPath]
    );

    const root = (
        <div
            className={cn(
                "items-stretch h-full",
                isFullscreen && rightPanelOpen ? "grid grid-cols-[7fr_3fr] gap-4" : "flex"
            )}
        >
            {/* Section 2 — JSON viewer; panel toggle lives in the toolbar's right action group */}
            <div
                className={cn(
                    "flex flex-col min-h-0 overflow-hidden border border-slate-200 dark:border-border-default rounded-lg bg-white dark:bg-surface-elevated relative",
                    isFullscreen && rightPanelOpen ? "min-w-0" : "flex-1 min-w-0"
                )}
            >
                <div className="flex-1 min-h-0 overflow-auto p-2 relative group">
                    <JsonViewer
                        data={exampleValue as ComponentProps<typeof JsonViewer>["data"]}
                        isSelected={isSelected}
                        handleKeyClick={handleKeyClick}
                        renderFieldCommentAction={renderFieldCommentAction}
                        toolbarEnd={
                            <TooltipHint
                                content={rightPanelOpen ? "Expand panel" : "Collapse panel"}
                                side="bottom"
                            >
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-slate-700 hover:bg-white/70 dark:text-n-20 dark:hover:bg-surface-muted dark:hover:text-n-60"
                                    onClick={() => setRightPanelOpen((v) => !v)}
                                    aria-label={rightPanelOpen ? "Expand panel" : "Collapse panel"}
                                >
                                    <ChevronRightIcon
                                        className={cn(
                                            "size-4 transition-transform duration-300 ease-in-out motion-reduce:transition-none",
                                            rightPanelOpen ? "" : "rotate-180"
                                        )}
                                    />
                                </Button>
                            </TooltipHint>
                        }
                    />
                    <Button
                        variant="default"
                        onClick={() => void copyToClipboard(JSON.stringify(exampleValue, null, 2))}
                        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 px-4 py-2 text-white text-sm rounded-lg shadow-lg"
                    >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                        Copy
                    </Button>
                </div>
            </div>

            {/* Section 3 — outer wrapper max-width transitions (inner stays fixed-width → no content reflow → no jerk) */}
            <div
                className={cn(
                    "overflow-hidden transition-[max-width,margin-left,opacity] duration-300 ease-in-out motion-reduce:transition-none",
                    isFullscreen
                        ? rightPanelOpen
                            ? "min-w-0 opacity-100"
                            : "w-0 max-w-0 opacity-0 pointer-events-none"
                        : cn(
                              "shrink-0",
                              rightPanelOpen
                                  ? "max-w-80 ml-4 opacity-100"
                                  : "max-w-0 ml-0 opacity-0 pointer-events-none"
                          )
                )}
            >
                <div
                    className={cn(
                        "h-full flex flex-col min-h-0 border border-slate-200 dark:border-border-default rounded-lg bg-white dark:bg-surface-elevated shadow-sm overflow-hidden",
                        isFullscreen ? "w-full" : "w-80"
                    )}
                >
                    <div className="px-4 pt-3 pb-2 shrink-0">
                        <GuideTabs<RightPanelTab>
                            tabs={RIGHT_PANEL_TABS}
                            active={rightPanelTab}
                            onChange={setRightPanelTab}
                        />
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        <GuideTabFade
                            activeKey={rightPanelTab}
                            tabOrder={RIGHT_PANEL_TABS.map((tab) => tab.id)}
                            className="h-full"
                        >
                            {rightPanelTab === "attributes" && (
                                <AttributesPanel
                                    attributes={attributes}
                                    validations={validations}
                                    rawTableRows={rawTableRows}
                                    spec={spec}
                                    actionApi={actionApi}
                                    stepApi={stepApi}
                                    useCaseId={useCaseId}
                                />
                            )}
                            {rightPanelTab === "comments" && (
                                <CommentsPanel
                                    key={commentsRefreshKey}
                                    selectedPath={selectedPath}
                                    actionApi={actionApi}
                                    useCaseId={useCaseId}
                                    flowId={flowId}
                                    domain={domain}
                                    version={version}
                                />
                            )}
                            {rightPanelTab === "notes" && (
                                <NotesPanel
                                    selectedPath={selectedPath}
                                    actionApi={actionApi}
                                    useCaseId={useCaseId}
                                    flowId={flowId}
                                    domain={domain}
                                    version={version}
                                />
                            )}
                        </GuideTabFade>
                    </div>
                </div>
            </div>
        </div>
    );

    return root;
};

export default FlowActionDetails;
