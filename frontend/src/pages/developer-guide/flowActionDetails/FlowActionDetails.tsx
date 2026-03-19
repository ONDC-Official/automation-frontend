import { FC, useState, useCallback, ComponentProps, MouseEvent, useMemo } from "react";
import { FaCopy } from "react-icons/fa";
import { FiList, FiMessageSquare, FiFileText } from "react-icons/fi";
import { SegmentedTabs, type TabItem } from "@components/ui/SegmentedTabs";
import JsonViewer from "@pages/protocol-playground/ui/Json-path-extractor";
import { SelectedType } from "@pages/protocol-playground/ui/session-data-tab";
import type { OpenAPISpecification } from "../types";
import { getActionAttributes, getValidationsForAction } from "./schemaAttributes";
import AttributesPanel from "./AttributesPanel";
import CommentsPanel from "./CommentsPanel";
import NotesPanel from "./NotesPanel";
import rawTableData from "../raw_table.json";
import { getLeafRowsForApi, type RawTableAction } from "./attributePanelUtils";

type RightPanelTab = "attributes" | "comments" | "notes";

const RIGHT_PANEL_TABS: TabItem<RightPanelTab>[] = [
    { id: "attributes", label: "Attributes", icon: FiList },
    { id: "comments", label: "Comments", icon: FiMessageSquare },
    { id: "notes", label: "Notes", icon: FiFileText },
];

function getValueAtPath(obj: unknown, path: string): unknown {
    const parts = path
        .replace(/^\$\.?/, "")
        .split(".")
        .filter(Boolean);
    let cur: unknown = obj;
    for (const p of parts) {
        if (cur == null || typeof cur !== "object") return undefined;
        cur = (cur as Record<string, unknown>)[p];
    }
    return cur;
}

interface FlowActionDetailsProps {
    exampleValue: object;
    /** action_id from step (for display, comments/notes keys). */
    actionApi: string;
    /** api from step (search, on_search, etc.) — used for x-attributes attribute_set lookup. */
    stepApi?: string;
    spec: OpenAPISpecification | null | undefined;
    useCaseId?: string;
    flowId?: string;
}

const FlowActionDetails: FC<FlowActionDetailsProps> = ({
    exampleValue,
    actionApi,
    stepApi,
    spec,
    useCaseId,
    flowId,
}) => {
    const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>("attributes");
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    const handleKeyClick = useCallback((path: string, _k: string, e: MouseEvent) => {
        e.stopPropagation();
        setSelectedPath(path);
    }, []);

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
        () => getLeafRowsForApi(rawTableData as Record<string, RawTableAction>, apiForAttributes),
        [apiForAttributes]
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
        <div className="flex flex-col h-full rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="flex-1 flex min-h-0">
                <div className="w-full flex flex-col min-w-0 border-r border-slate-200">
                    <div className="flex-1 min-h-0 overflow-auto p-4 relative group">
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
                            onClick={() =>
                                void navigator.clipboard.writeText(
                                    JSON.stringify(exampleValue, null, 2)
                                )
                            }
                            className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg shadow-lg"
                        >
                            <FaCopy className="w-4 h-4" />
                            Copy
                        </button>
                    </div>
                </div>
                <div className="w-1/2 flex flex-col min-h-0 bg-slate-50/60 border-l border-slate-200">
                    <div className="px-4 pt-3 pb-2 border-b border-slate-200 bg-white/80 shrink-0">
                        <SegmentedTabs<RightPanelTab>
                            tabs={RIGHT_PANEL_TABS}
                            active={rightPanelTab}
                            onChange={setRightPanelTab}
                        />
                    </div>
                    <div className="flex-1 min-h-0 overflow-hidden p-4">
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
            <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col">
                <div className="flex justify-end gap-2 px-4 py-2.5 border-b border-slate-200 bg-white shadow-sm">
                    <button
                        type="button"
                        onClick={() => setExpanded(false)}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
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
