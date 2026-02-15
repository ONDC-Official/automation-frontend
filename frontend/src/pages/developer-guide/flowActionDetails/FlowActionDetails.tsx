import { FC, useState, useCallback, useEffect, ComponentProps, MouseEvent } from "react";
import { FaCopy } from "react-icons/fa";
import { FiEdit2, FiMaximize2 } from "react-icons/fi";
import Tabs from "@components/ui/mini-components/tabs";
import JsonViewer from "@pages/protocol-playground/ui/Json-path-extractor";
import { SelectedType } from "@pages/protocol-playground/ui/session-data-tab";
import type { OpenAPISpecification } from "../types";
import { getActionAttributes, getValidationsForAction } from "./schemaAttributes";
import AttributesPanel from "./AttributesPanel";

const TAB_OPTIONS = [
    { key: "documentation", label: "Documentation" },
    { key: "ai-driven", label: "Ai Driven" },
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
    actionApi: string;
    spec: OpenAPISpecification | null | undefined;
    useCaseId?: string;
    /** Owner from the step (not from attribute). */
    stepOwner?: string;
}

const FlowActionDetails: FC<FlowActionDetailsProps> = ({
    exampleValue,
    actionApi,
    spec,
    useCaseId,
    stepOwner,
}) => {
    const [activeTab, setActiveTab] = useState("documentation");
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editedValue, setEditedValue] = useState<object>(() =>
        JSON.parse(JSON.stringify(exampleValue))
    );
    const [rawEditText, setRawEditText] = useState("");
    const [editError, setEditError] = useState<string | null>(null);

    useEffect(() => {
        setEditedValue(JSON.parse(JSON.stringify(exampleValue)));
    }, [exampleValue]);

    const applyEdit = useCallback(() => {
        try {
            const parsed = JSON.parse(rawEditText) as object;
            setEditedValue(parsed);
            setEditError(null);
            setEditMode(false);
        } catch (err) {
            setEditError(err instanceof Error ? err.message : "Invalid JSON");
        }
    }, [rawEditText]);

    const startEdit = useCallback(() => {
        setRawEditText(JSON.stringify(editedValue, null, 2));
        setEditError(null);
        setEditMode(true);
    }, [editedValue]);

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

    const valueAtPath = selectedPath ? getValueAtPath(editedValue, selectedPath) : undefined;

    const attributes = selectedPath
        ? getActionAttributes(spec, actionApi, selectedPath, valueAtPath, useCaseId)
        : null;
    const validations = selectedPath ? getValidationsForAction(spec, actionApi, selectedPath) : [];

    const root = (
        <div className="flex flex-col h-full rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-slate-200 bg-slate-50/70 shrink-0">
                <Tabs
                    options={TAB_OPTIONS}
                    defaultTab="documentation"
                    onSelectOption={setActiveTab}
                />
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() =>
                            void navigator.clipboard.writeText(JSON.stringify(editedValue, null, 2))
                        }
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-1"
                        title="Copy JSON"
                    >
                        <FaCopy className="w-4 h-4" />
                    </button>
                    {editMode ? (
                        <>
                            <button
                                type="button"
                                onClick={applyEdit}
                                className="px-3 py-1.5 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-1"
                                title="Apply edit"
                            >
                                Apply
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditMode(false);
                                    setEditError(null);
                                }}
                                className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
                                title="Cancel edit"
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={startEdit}
                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-1"
                            title="Edit JSON"
                        >
                            <FiEdit2 className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setExpanded((e) => !e)}
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-1"
                        title={expanded ? "Exit fullscreen" : "Expand"}
                    >
                        <FiMaximize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="flex-1 flex min-h-0">
                {activeTab === "documentation" && (
                    <>
                        <div
                            className={`flex-1 flex flex-col min-w-0 border-r border-slate-200 ${expanded ? "" : "max-w-xl"}`}
                        >
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-100/60 text-xs text-slate-600">
                                {editMode
                                    ? "Edit JSON below, then click Apply to update the tree."
                                    : "Click any key in the tree to see schema and validations in the right panel."}
                            </div>
                            <div className="flex-1 min-h-0 overflow-auto bg-slate-900 p-4">
                                {editMode ? (
                                    <div className="flex flex-col h-full gap-2">
                                        <textarea
                                            value={rawEditText}
                                            onChange={(e) => {
                                                setRawEditText(e.target.value);
                                                setEditError(null);
                                            }}
                                            className="flex-1 min-h-[200px] w-full font-mono text-sm text-slate-200 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 resize-none"
                                            spellCheck={false}
                                        />
                                        {editError && (
                                            <div className="text-red-400 text-xs">{editError}</div>
                                        )}
                                    </div>
                                ) : (
                                    <JsonViewer
                                        data={
                                            editedValue as ComponentProps<typeof JsonViewer>["data"]
                                        }
                                        isSelected={isSelected}
                                        handleKeyClick={handleKeyClick}
                                    />
                                )}
                            </div>
                        </div>
                        <div
                            className={`shrink-0 flex flex-col min-h-0 p-4 bg-slate-50/60 border-l border-slate-200 ${expanded ? "w-[600px]" : "w-[420px]"}`}
                        >
                            <AttributesPanel
                                attributes={attributes}
                                stepOwner={stepOwner}
                                validations={validations}
                                spec={spec}
                                actionApi={actionApi}
                                useCaseId={useCaseId}
                                isExpanded={expanded}
                            />
                        </div>
                    </>
                )}
                {activeTab === "ai-driven" && (
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-sm p-8 rounded-b-xl bg-slate-50/50">
                        Ai Driven view — coming soon
                    </div>
                )}
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
                <div className="flex-1 min-h-0 p-6 overflow-auto">
                    <div className="h-full w-full max-w-6xl mx-auto">{root}</div>
                </div>
            </div>
        );
    }
    return root;
};

export default FlowActionDetails;
