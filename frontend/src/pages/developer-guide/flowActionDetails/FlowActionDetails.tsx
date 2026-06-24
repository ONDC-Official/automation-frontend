import { FC, useState, useCallback, ComponentProps, MouseEvent, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { DocumentDuplicateIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useClipboard } from "@hooks/useClipboard";
import { cn } from "@/lib/utils";
import GuideTabs, { type GuideTabItem } from "../shared/components/GuideTabs";
import JsonViewer from "@pages/protocol-playground/ui/Json-path-extractor";
import { SelectedType } from "@pages/protocol-playground/ui/types";
import type { OpenAPISpecification, ValidationTableAction } from "../types";
import { getActionAttributes, getValidationsForAction } from "./schemaAttributes";
import AttributesPanel from "./AttributesPanel";
import CommentsPanel from "./CommentsPanel";
import NotesPanel from "./NotesPanel";
import { getLeafRowsForApi, getValueAtPath, type RawTableAction } from "./attributePanelUtils";

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
    /** Validation table data keyed by action name. Loaded lazily from API. */
    validationTableData?: Record<string, ValidationTableAction> | null;
}

const FlowActionDetails: FC<FlowActionDetailsProps> = ({
    exampleValue,
    actionApi,
    stepApi,
    spec,
    useCaseId,
    flowId,
    validationTableData,
}) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [rightPanelTab, setRightPanelTabState] = useState<RightPanelTab>(() => {
        const p = searchParams.get("panel");
        return p === "comments" || p === "notes" ? (p as RightPanelTab) : "attributes";
    });
    const [selectedPath, setSelectedPathState] = useState<string | null>(
        () => searchParams.get("attr") ?? null
    );
    const [expanded, setExpanded] = useState(false);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
    const { copyToClipboard } = useClipboard();

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

    const handleKeyClick = useCallback(
        (path: string, _k: string, e: MouseEvent) => {
            e.stopPropagation();
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
        <div className="flex items-stretch h-full">
            {/* Section 2 — JSON viewer; toggle floats inside at top-right */}
            <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden border border-slate-200 dark:border-border-default rounded-lg bg-white dark:bg-surface-elevated relative">
                <button
                    onClick={() => setRightPanelOpen((v) => !v)}
                    title={rightPanelOpen ? "Collapse details panel" : "Expand details panel"}
                    aria-label={rightPanelOpen ? "Collapse details panel" : "Expand details panel"}
                    className="absolute top-3 right-3 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-white dark:bg-surface-elevated border border-slate-200 dark:border-border-default shadow-sm hover:bg-slate-50 dark:hover:bg-surface-muted transition-colors"
                >
                    <ChevronRightIcon
                        className={cn(
                            "w-3 h-3 text-slate-400 transition-transform duration-300 ease-in-out",
                            rightPanelOpen ? "" : "rotate-180"
                        )}
                    />
                </button>
                <div className="flex-1 min-h-0 overflow-auto p-2 relative group">
                    <JsonViewer
                        data={exampleValue as ComponentProps<typeof JsonViewer>["data"]}
                        isSelected={isSelected}
                        handleKeyClick={handleKeyClick}
                        onExpand={() => setExpanded(true)}
                        isExpanded={expanded}
                        onCollapse={() => setExpanded(false)}
                    />
                    <button
                        type="button"
                        onClick={() => void copyToClipboard(JSON.stringify(exampleValue, null, 2))}
                        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg shadow-lg"
                    >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                        Copy
                    </button>
                </div>
            </div>

            {/* Section 3 — outer wrapper max-width transitions (inner stays fixed-width → no content reflow → no jerk) */}
            <div
                className={cn(
                    "shrink-0 overflow-hidden transition-[max-width,margin-left,opacity] duration-300 ease-in-out",
                    rightPanelOpen
                        ? "max-w-80 ml-4 opacity-100"
                        : "max-w-0 ml-0 opacity-0 pointer-events-none"
                )}
            >
                <div className="w-80 h-full flex flex-col min-h-0 border border-slate-200 dark:border-border-default rounded-lg bg-white dark:bg-surface-elevated shadow-sm overflow-hidden">
                    <div className="px-4 pt-3 pb-2 shrink-0">
                        <GuideTabs<RightPanelTab>
                            tabs={RIGHT_PANEL_TABS}
                            active={rightPanelTab}
                            onChange={setRightPanelTab}
                        />
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        {rightPanelTab === "attributes" && (
                            <AttributesPanel
                                attributes={attributes}
                                validations={validations}
                                rawTableRows={rawTableRows}
                                spec={spec}
                                actionApi={actionApi}
                                stepApi={stepApi}
                                useCaseId={useCaseId}
                                isExpanded={expanded}
                            />
                        )}
                        {rightPanelTab === "comments" && (
                            <CommentsPanel
                                selectedPath={selectedPath}
                                actionApi={actionApi}
                                useCaseId={useCaseId}
                                flowId={flowId}
                            />
                        )}
                        {rightPanelTab === "notes" && (
                            <NotesPanel
                                selectedPath={selectedPath}
                                actionApi={actionApi}
                                useCaseId={useCaseId}
                                flowId={flowId}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    if (expanded) {
        return (
            <div className="fixed inset-0 z-50 bg-slate-100 dark:bg-surface-page flex flex-col">
                <div className="flex justify-end gap-2 px-4 py-2.5 border-b border-slate-200 bg-white dark:bg-surface-elevated shadow-xs">
                    <button
                        type="button"
                        onClick={() => setExpanded(false)}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 dark:bg-surface-muted rounded-lg hover:bg-slate-300 dark:hover:bg-surface-elevated transition-colors focus:outline-hidden focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
                    >
                        Exit fullscreen
                    </button>
                </div>
                <div className="flex-1 min-h-0 p-6 overflow-auto flex items-center justify-center">
                    <div className="h-full w-full mx-20">{root}</div>
                </div>
            </div>
        );
    }
    return root;
};

export default FlowActionDetails;
