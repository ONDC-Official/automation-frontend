import React, { useState, useMemo, type JSX } from "react";
import Tippy from "@tippyjs/react";
// import "tippy.js/dist/tippy.css";
import "tippy.js/animations/perspective-subtle.css";

import { SelectedType } from "@pages/protocol-playground/ui/types";
import { useLocation } from "react-router-dom";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { useClipboard } from "@hooks/useClipboard";
import FullScreenIcon from "@/assets/svgs/FullScreenIcon";
import { Button } from "@/components/Shadcn/Button/button";
import SearchField from "@/components/Shadcn/SearchField";

type JsonPrimitive = string | number | boolean | null;
type JsonArray = JsonValue[];
type JsonObject = { [key: string]: JsonValue };
type JsonValue = JsonPrimitive | JsonArray | JsonObject;
type JsonNode = JsonObject;

// ─── Icons ────────────────────────────────────────────────────────────────────

const ChevronRight = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const ChevronDown = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const CopyIcon = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
    </svg>
);

// ─── VS Code–style tooltip ─────────────────────────────────────────────────────

const TooltipContent = ({ path, fullValue }: { path: string; fullValue?: string }) => (
    <div className="text-xs p-2.5 rounded-lg bg-slate-800 border border-sky-400/50 shadow-xl">
        <div className="font-semibold text-sky-400 mb-1 uppercase tracking-widest text-[9px]">
            Path
        </div>
        <div className="text-slate-300 font-mono break-all leading-relaxed">{path}</div>
        {fullValue && (
            <>
                <div className="font-semibold text-sky-400 mt-2 mb-1 uppercase tracking-widest text-[9px]">
                    Full Value
                </div>
                <div className="text-slate-300 font-mono break-all leading-relaxed">
                    {fullValue}
                </div>
            </>
        )}
    </div>
);

// ─── Value renderer ────────────────────────────────────────────────────────────

/**
 * VS Code JSON color palette:
 *   string  → #ce9178
 *   number  → #b5cea8
 *   boolean → #569cd6
 *   null    → #569cd6
 *   key     → #9cdcfe
 */
const VALUE_COLORS: Record<string, string> = {
    string: "#059669", // emerald-600
    number: "#d97706", // amber-600
    boolean: "#7c3aed", // violet-600
    null: "#e11d48", // rose-600
};

function getValueColor(value: JsonValue): string {
    if (value === null) return VALUE_COLORS.null;
    if (typeof value === "string") return VALUE_COLORS.string;
    if (typeof value === "number") return VALUE_COLORS.number;
    if (typeof value === "boolean") return VALUE_COLORS.boolean;
    return "#475569"; // slate-600
}

interface IPrimitiveValueProps {
    value: JsonValue;
    path: string;
    keyName: string;
    isSelected: (path: string) => { status: boolean; type: SelectedType | null };
    handleKeyClick: (path: string, key: string, e: React.MouseEvent) => void;
}

const PrimitiveValue = ({
    value,
    path,
    keyName,
    isSelected,
    handleKeyClick,
}: IPrimitiveValueProps) => {
    const { copyToClipboard } = useClipboard();
    const selected = isSelected(path);
    const stringValue = JSON.stringify(value);
    const isTruncated = stringValue.length > 100;
    const displayValue = isTruncated ? stringValue.slice(0, 100) + "…" : stringValue;
    const color = getValueColor(value);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        void copyToClipboard(JSON.stringify(value));
    };

    let rowBg = "";
    if (selected.status) {
        rowBg =
            selected.type === SelectedType.SaveData
                ? "bg-sky-100 dark:bg-sky-500/15 ring-1 ring-sky-400 dark:ring-sky-400/60 shadow-xs"
                : "bg-slate-100 ring-1 ring-slate-300 shadow-xs";
    }

    return (
        <Tippy
            content={
                <TooltipContent path={path} fullValue={isTruncated ? stringValue : undefined} />
            }
            delay={[300, 0]}
            placement="top"
            arrow={false}
            className="max-w-xs wrap-break-word whitespace-normal"
            interactive={true}
            animation="perspective-subtle"
        >
            <span
                onClick={(e) => handleKeyClick(path, keyName, e)}
                className={`group/value inline-flex items-center gap-1 cursor-pointer rounded px-0.5 transition-colors duration-100 ${
                    selected.status
                        ? rowBg
                        : "hover:bg-sky-100/60 dark:hover:bg-sky-500/10 hover:ring-1 hover:ring-sky-200 dark:hover:ring-sky-500/30"
                }`}
            >
                <span
                    className="font-mono text-xs truncate max-w-md inline-block leading-relaxed"
                    style={{ color }}
                >
                    {displayValue}
                </span>
                <button
                    onClick={handleCopy}
                    className="opacity-0 group-hover/value:opacity-60 hover:opacity-100! transition-opacity text-slate-400 hover:text-sky-600 shrink-0"
                    title="Copy value"
                >
                    <CopyIcon />
                </button>
            </span>
        </Tippy>
    );
};

const renderValue = (
    value: JsonValue,
    path: string,
    key: string,
    isSelected: (path: string) => { status: boolean; type: SelectedType | null },
    handleKeyClick: (path: string, key: string, e: React.MouseEvent) => void
) => {
    const isPrimitive = typeof value !== "object" || value === null || value === undefined;

    if (!isPrimitive) return null;

    return (
        <PrimitiveValue
            value={value}
            path={path}
            keyName={key}
            isSelected={isSelected}
            handleKeyClick={handleKeyClick}
        />
    );
};

// ─── Tree renderer ─────────────────────────────────────────────────────────────

const renderJson = ({
    obj,
    currentPath = "$",
    level = 0,
    collapsedPaths,
    setCollapsedPaths,
    isSelected,
    handleKeyClick,
    searchTerm,
    matchingPaths,
}: {
    obj: JsonNode;
    currentPath?: string;
    level?: number;
    collapsedPaths: Record<string, boolean>;
    setCollapsedPaths: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    isSelected: (path: string) => { status: boolean; type: SelectedType | null };
    handleKeyClick: (path: string, key: string, e: React.MouseEvent) => void;
    searchTerm: string;
    matchingPaths: Set<string>;
}): JSX.Element => {
    const INDENT = 16;
    const indent = level * INDENT;

    const toggleCollapse = (path: string) => {
        setCollapsedPaths((prev) => ({ ...prev, [path]: !prev[path] }));
    };

    return (
        <div>
            {Object.entries(obj).map(([key, value]) => {
                const newPath = `${currentPath}.${key}`;

                if (searchTerm && !matchingPaths.has(newPath)) return null;

                const isObject =
                    typeof value === "object" && value !== null && !Array.isArray(value);
                const isArray = Array.isArray(value);
                const isCollapsed = collapsedPaths[newPath];
                const isKeySelected = isSelected(newPath);
                const itemCount = isArray
                    ? (value as JsonArray).length
                    : isObject
                      ? Object.keys(value as JsonObject).length
                      : 0;

                // Key highlight
                let keyClass =
                    "font-mono text-[12px] leading-[1.35] transition-colors duration-100 select-none shrink-0 ";
                if (isKeySelected.status) {
                    keyClass +=
                        isKeySelected.type === SelectedType.SaveData
                            ? "bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 rounded px-1 ring-1 ring-sky-400 dark:ring-sky-400/60 shadow-xs"
                            : "bg-slate-100 text-slate-700 rounded px-1 ring-1 ring-slate-300 shadow-xs";
                } else {
                    keyClass +=
                        isObject || isArray
                            ? "text-sky-600 font-semibold cursor-pointer hover:underline underline-offset-2"
                            : "text-sky-600 font-semibold";
                }

                return (
                    <div
                        key={key}
                        style={{ paddingLeft: `${indent}px` }}
                        className="whitespace-nowrap"
                    >
                        {/* Row */}
                        <div className="group inline-flex items-start hover:bg-sky-100/60 dark:hover:bg-sky-500/10 mx-[-2px] px-[2px] rounded w-full min-w-0 transition-colors duration-75">
                            {/* Collapse toggle / spacer */}
                            {isObject || isArray ? (
                                <button
                                    onClick={() => toggleCollapse(newPath)}
                                    className="text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 mr-1 mt-[3px] transition-colors shrink-0"
                                    aria-label={isCollapsed ? "Expand" : "Collapse"}
                                >
                                    {isCollapsed ? <ChevronRight /> : <ChevronDown />}
                                </button>
                            ) : (
                                <span className="w-3 mr-1 shrink-0 inline-block" />
                            )}

                            {/* Key */}
                            <div className="inline-flex items-baseline gap-[2px] min-w-0">
                                <Tippy
                                    content={<TooltipContent path={newPath} />}
                                    delay={[600, 0]}
                                    arrow={false}
                                    disabled={!isObject && !isArray}
                                    placement="top"
                                    className="max-w-xs wrap-break-word whitespace-normal"
                                    interactive={true}
                                    animation="perspective-subtle"
                                >
                                    <span
                                        onClick={(e) => handleKeyClick(newPath, key, e)}
                                        className={keyClass}
                                    >
                                        "{key}"
                                    </span>
                                </Tippy>

                                <span className="text-slate-400 font-mono text-[12px] leading-[1.35] shrink-0 mx-px">
                                    :
                                </span>

                                {/* Value / opening bracket */}
                                <div className="inline-flex items-baseline gap-1 min-w-0 ml-1">
                                    {isObject && (
                                        <span className="text-slate-500 font-mono text-[12px]">
                                            {"{"}
                                            {isCollapsed && (
                                                <>
                                                    <span className="text-slate-400 text-[11px] italic mx-1.5">
                                                        {itemCount}{" "}
                                                        {itemCount === 1
                                                            ? "property"
                                                            : "properties"}
                                                    </span>
                                                    <span className="text-slate-500">{"}"} </span>
                                                </>
                                            )}
                                        </span>
                                    )}
                                    {isArray && (
                                        <span className="text-slate-500 font-mono text-[12px]">
                                            {"["}
                                            {isCollapsed && (
                                                <>
                                                    <span className="text-slate-400 text-[11px] italic mx-1.5">
                                                        {itemCount}{" "}
                                                        {itemCount === 1 ? "item" : "items"}
                                                    </span>
                                                    <span className="text-slate-500">{"]"} </span>
                                                </>
                                            )}
                                        </span>
                                    )}
                                    {!isObject &&
                                        !isArray &&
                                        renderValue(
                                            value,
                                            newPath,
                                            key,
                                            isSelected,
                                            handleKeyClick
                                        )}
                                </div>
                            </div>
                        </div>

                        {/* Children */}
                        {!isCollapsed && (
                            <>
                                {isObject && (
                                    <>
                                        {/* Indent guide */}
                                        <div
                                            style={{ paddingLeft: `${INDENT - 1}px` }}
                                            className="border-l border-slate-100"
                                        >
                                            {renderJson({
                                                obj: value as JsonObject,
                                                currentPath: newPath,
                                                level: level + 1,
                                                collapsedPaths,
                                                setCollapsedPaths,
                                                isSelected,
                                                handleKeyClick,
                                                searchTerm,
                                                matchingPaths,
                                            })}
                                        </div>
                                        <div
                                            style={{ paddingLeft: `${indent}px` }}
                                            className="text-slate-500 font-mono text-[12px]"
                                        >
                                            {"}"}
                                        </div>
                                    </>
                                )}

                                {isArray && (
                                    <>
                                        <div
                                            style={{ paddingLeft: `${INDENT - 1}px` }}
                                            className="border-l border-slate-100"
                                        >
                                            {(value as JsonArray).map(
                                                (item: JsonValue, index: number) => {
                                                    const arrayPath = `${newPath}[${index}]`;

                                                    if (searchTerm && !matchingPaths.has(arrayPath))
                                                        return null;

                                                    if (typeof item === "object" && item !== null) {
                                                        return (
                                                            <div key={index}>
                                                                {renderJson({
                                                                    obj: item as JsonObject,
                                                                    currentPath: arrayPath,
                                                                    level: level + 1,
                                                                    collapsedPaths,
                                                                    setCollapsedPaths,
                                                                    isSelected,
                                                                    handleKeyClick,
                                                                    searchTerm,
                                                                    matchingPaths,
                                                                })}
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <div
                                                            key={index}
                                                            style={{
                                                                paddingLeft: `${(level + 1) * INDENT}px`,
                                                            }}
                                                            className="whitespace-nowrap inline-flex items-center gap-2"
                                                        >
                                                            <span className="text-slate-400 text-[11px] font-mono select-none">
                                                                {index}:
                                                            </span>
                                                            {renderValue(
                                                                item,
                                                                arrayPath,
                                                                `${key}_${index}`,
                                                                isSelected,
                                                                handleKeyClick
                                                            )}
                                                        </div>
                                                    );
                                                }
                                            )}
                                        </div>
                                        <div
                                            style={{ paddingLeft: `${indent}px` }}
                                            className="text-slate-500 font-mono text-[12px]"
                                        >
                                            {"]"}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// ─── Main component ────────────────────────────────────────────────────────────

interface JsonViewerProps {
    data: JsonNode;
    isSelected: (path: string) => { status: boolean; type: SelectedType | null };
    handleKeyClick: (path: string, key: string, e: React.MouseEvent) => void;
    onExpand?: () => void;
    isExpanded?: boolean;
    onCollapse?: () => void;
}

const JsonViewer: React.FC<JsonViewerProps> = ({
    data,
    isSelected,
    handleKeyClick,
    onExpand,
    isExpanded,
}) => {
    const [collapsedPaths, setCollapsedPaths] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState("");
    const location = useLocation();
    const isDeveloperGuide = location.pathname.includes("developer-guide");

    const matchingPaths = useMemo(() => {
        const matches = new Set<string>();
        if (!searchTerm.trim()) return matches;
        const searchLower = searchTerm.toLowerCase();

        const searchObject = (obj: JsonValue, path: string = "$") => {
            Object.entries(obj || {}).forEach(([key, value]) => {
                const newPath = `${path}.${key}`;
                const keyMatches = key.toLowerCase().includes(searchLower);
                const valueMatches =
                    (typeof value !== "object" || value === null) &&
                    String(value).toLowerCase().includes(searchLower);

                if (keyMatches || valueMatches) {
                    matches.add(newPath);
                    let parentPath = path;
                    while (parentPath !== "$") {
                        matches.add(parentPath);
                        const lastDot = parentPath.lastIndexOf(".");
                        parentPath = lastDot > 0 ? parentPath.slice(0, lastDot) : "$";
                    }
                }

                if (typeof value === "object" && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach((item, index) => {
                            const arrayPath = `${newPath}[${index}]`;
                            if (typeof item === "object" && item !== null) {
                                searchObject(item, arrayPath);
                            } else if (String(item).toLowerCase().includes(searchLower)) {
                                matches.add(arrayPath);
                                matches.add(newPath);
                            }
                        });
                    } else {
                        searchObject(value, newPath);
                    }
                }
            });
        };

        searchObject(data);
        return matches;
    }, [data, searchTerm]);

    const expandAll = () => setCollapsedPaths({});

    const collapseAll = () => {
        const allPaths: Record<string, boolean> = {};
        const collectPaths = (obj: JsonValue, path: string = "$") => {
            Object.entries(obj || {}).forEach(([key, value]) => {
                const newPath = `${path}.${key}`;
                if (typeof value === "object" && value !== null) {
                    allPaths[newPath] = true;
                    if (Array.isArray(value)) {
                        value.forEach((item, index) => {
                            if (typeof item === "object" && item !== null)
                                collectPaths(item, `${newPath}[${index}]`);
                        });
                    } else {
                        collectPaths(value, newPath);
                    }
                }
            });
        };
        collectPaths(data);
        setCollapsedPaths(allPaths);
    };

    return (
        <div className="font-mono text-sm h-full flex flex-col bg-white dark:bg-surface-elevated text-slate-700">
            {/* ── Toolbar ─────────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 bg-brand-light rounded-t-lg dark:bg-surface-elevated/90 backdrop-blur-xs overflow-x-auto">
                {/* Search */}
                <SearchField
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    containerClassName="w-44 shrink-0"
                    className="h-8 text-[12px] font-mono"
                />

                {/* Expand / Collapse */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={expandAll}
                    className="bg-white text-slate-700 border-slate-200 text-xs font-medium leading-4 hover:bg-slate-50 hover:text-slate-700 dark:bg-surface-elevated dark:text-n-20"
                >
                    Expand All
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={collapseAll}
                    className="bg-white text-slate-700 border-slate-200 text-xs font-medium leading-4 hover:bg-slate-50 hover:text-slate-700 dark:bg-surface-elevated dark:text-n-20"
                >
                    Collapse All
                </Button>

                {/* Developer Actions */}
                {isDeveloperGuide && (
                    <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-slate-200">
                        <Button
                            size="sm"
                            onClick={() => {
                                const blob = new Blob([JSON.stringify(data, null, 2)], {
                                    type: "application/json",
                                });

                                const url = URL.createObjectURL(blob);

                                const a = document.createElement("a");
                                a.href = url;
                                a.download = "payload.json";
                                a.click();

                                URL.revokeObjectURL(url);
                            }}
                        >
                            <ArrowDownTrayIcon className="size-3.5" />
                            Download
                        </Button>

                        {!isExpanded && (
                            <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                onClick={onExpand}
                                title="Fullscreen"
                            >
                                <FullScreenIcon />
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* ── JSON Tree ───────────────────────────────────────────────── */}
            <div className="overflow-auto flex-1 px-4 py-3">
                <div className="inline-block min-w-full">
                    <span className="text-slate-500 font-mono text-[12px]">{"{"} </span>
                    {renderJson({
                        obj: data,
                        collapsedPaths,
                        setCollapsedPaths,
                        isSelected,
                        handleKeyClick,
                        searchTerm,
                        matchingPaths,
                    })}
                    <span className="text-slate-500 font-mono text-[12px]">{"}"} </span>
                </div>
            </div>

            {/* ── No results ──────────────────────────────────────────────── */}
            {searchTerm && matchingPaths.size === 0 && (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <svg
                        className="w-7 h-7 text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                        />
                    </svg>
                    <span className="text-[12px] text-slate-400">
                        No results for{" "}
                        <span className="font-semibold text-slate-600">"{searchTerm}"</span>
                    </span>
                </div>
            )}
        </div>
    );
};

export default JsonViewer;
