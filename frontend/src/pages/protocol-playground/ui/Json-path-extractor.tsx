import React, { useCallback, useRef } from "react";
import JsonView from "@uiw/react-json-view";
import { useLocation } from "react-router-dom";
import { SelectedType } from "@pages/protocol-playground/ui/types";
import { cn } from "@/lib/utils";
import AppJsonViewer from "@components/AppJsonViewer";

type JsonPrimitive = string | number | boolean | null;
type JsonArray = JsonValue[];
type JsonObject = { [key: string]: JsonValue };
type JsonValue = JsonPrimitive | JsonArray | JsonObject;
type JsonNode = JsonObject;

const SIMPLE_PATH_KEY = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const appendPathSegment = (basePath: string, key: string | number): string => {
    if (typeof key === "number") {
        return `${basePath}[${key}]`;
    }
    if (SIMPLE_PATH_KEY.test(key)) {
        return `${basePath}.${key}`;
    }
    return `${basePath}[${JSON.stringify(key)}]`;
};

type NodeContext = {
    keyName?: string | number;
    keys?: Array<string | number>;
    value?: unknown;
};

/** True for object/array nodes — these render via a different internal path (no `JsonView.Row`
 *  wrapper), so their comment action has to be attached in `KeyName` instead, right after the key. */
const isContainerValue = (value: unknown): boolean =>
    typeof value === "object" && value !== null && !(value instanceof Date);

type JsonViewRowProps = Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "onMouseEnter" | "onMouseLeave"
> & {
    className?: string;
    // Loosened to optional-argument so `pin`/`unpin` (below) can re-trigger these outside of a
    // real mouse event, e.g. `rowProps.onMouseEnter?.()`.
    onMouseEnter?: (e?: React.MouseEvent<HTMLDivElement>) => void;
    onMouseLeave?: (e?: React.MouseEvent<HTMLDivElement>) => void;
};

/** Lets a row action (e.g. the comment trigger) keep the row's hover-only tools — like the
 *  built-in copy icon — mounted for as long as it needs, even after the cursor leaves the row. */
export interface RowHoverActions {
    pin: () => void;
    unpin: () => void;
}

/** Container-node triggers aren't tied to the library's hover-only copy icon (see below), so
 *  there's nothing to pin. */
const NOOP_ROW_HOVER: RowHoverActions = { pin: () => {}, unpin: () => {} };

type JsonViewKeyNameProps = React.HTMLAttributes<HTMLSpanElement> & {
    className?: string;
};

const getSelectedClass = (
    isSelected: (path: string) => { status: boolean; type: SelectedType | null },
    path: string
): string => {
    const selected = isSelected(path);
    if (!selected.status) return "";
    // Translucent tints keep the underlying syntax-highlighted text readable on
    // both light and dark (inverted) tree backgrounds, unlike a solid fill.
    return selected.type === SelectedType.SaveData
        ? "bg-sky-400/20 ring-1 ring-sky-400/70 shadow-xs rounded"
        : "bg-amber-400/20 ring-1 ring-amber-400/70 shadow-xs rounded";
};

const derivePathFromNode = (ctx: NodeContext): string => {
    const keys = [...(ctx.keys || [])].filter((k) => k !== "root" && k !== "$");
    const keyName = ctx.keyName;
    if (
        keyName !== undefined &&
        keyName !== "root" &&
        keyName !== "$" &&
        keys[keys.length - 1] !== keyName
    ) {
        keys.push(keyName);
    }
    return keys.reduce<string>((acc, segment) => appendPathSegment(acc, segment), "$");
};

// ─── Main component ────────────────────────────────────────────────────────────

interface JsonViewerProps {
    data: JsonNode;
    isSelected: (path: string) => { status: boolean; type: SelectedType | null };
    handleKeyClick: (path: string, key: string, e: React.MouseEvent) => void;
    onExpand?: () => void;
    isExpanded?: boolean;
    onCollapse?: () => void;
    invertTheme?: boolean;
    toolbarClassName?: string;
    /** Renders an inline action (e.g. a comment trigger) next to a field's built-in copy icon. */
    renderFieldCommentAction?: (path: string, rowHover: RowHoverActions) => React.ReactNode;
}

/**
 * A single row's `div`, split out from the inline `JsonView.Row` render prop so it can use hooks:
 * it tracks real hover state itself so `renderFieldCommentAction` can "pin" the row's tools-visible
 * state (which otherwise fully unmounts the built-in copy icon on mouse-leave) for as long as its
 * own popover is open — without pinning, the copy icon disappearing out from under an
 * open popover shifts the trigger left and makes the popover jump.
 */
const JsonFieldRow: React.FC<{
    rowProps: JsonViewRowProps;
    path: string;
    selectedClass: string;
    keyName: string | number | undefined;
    handleKeyClick: JsonViewerProps["handleKeyClick"];
    renderFieldCommentAction?: (path: string, rowHover: RowHoverActions) => React.ReactNode;
}> = ({ rowProps, path, selectedClass, keyName, handleKeyClick, renderFieldCommentAction }) => {
    const isHoveringRef = useRef(false);
    const isPinnedRef = useRef(false);

    const handleMouseEnter = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            isHoveringRef.current = true;
            rowProps.onMouseEnter?.(e);
        },
        [rowProps]
    );
    const handleMouseLeave = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            isHoveringRef.current = false;
            if (isPinnedRef.current) return;
            rowProps.onMouseLeave?.(e);
        },
        [rowProps]
    );
    const pin = useCallback(() => {
        isPinnedRef.current = true;
        rowProps.onMouseEnter?.();
    }, [rowProps]);
    const unpin = useCallback(() => {
        isPinnedRef.current = false;
        if (!isHoveringRef.current) rowProps.onMouseLeave?.();
    }, [rowProps]);

    return (
        <div
            {...rowProps}
            title={path}
            className={cn(
                rowProps.className,
                "cursor-pointer",
                selectedClass,
                renderFieldCommentAction && "group/jsonfield"
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => {
                const key = String(keyName ?? "");
                handleKeyClick(path, key, e as React.MouseEvent);
                rowProps.onClick?.(e);
            }}
        >
            {rowProps.children}
            {renderFieldCommentAction && (
                <span
                    // Mirrors GithubMarkdown's heading-comment trigger: hidden until the row
                    // is hovered/focused, and kept visible via has-data-[state=open] while its
                    // popover is open (the popover portals to document.body, so the cursor
                    // leaving this row would otherwise hide the trigger mid-interaction).
                    className="ml-1 inline-flex align-middle opacity-0 group-hover/jsonfield:opacity-100 focus-within:opacity-100 has-data-[state=open]:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                >
                    {renderFieldCommentAction(path, { pin, unpin })}
                </span>
            )}
        </div>
    );
};

const JsonViewer: React.FC<JsonViewerProps> = ({
    data,
    isSelected,
    handleKeyClick,
    invertTheme = false,
    onExpand: _onExpand,
    isExpanded: _isExpanded,
    toolbarClassName,
    renderFieldCommentAction,
}) => {
    const location = useLocation();
    const isDeveloperGuide = location.pathname.includes("developer-guide");

    return (
        <AppJsonViewer
            value={data}
            showSearch={true}
            showExpandCollapse={true}
            showDownload={isDeveloperGuide}
            showFullscreen={isDeveloperGuide}
            invertTheme={invertTheme}
            className={cn("min-h-full rounded-md")}
            toolbarClassName={toolbarClassName}
            enableClipboard={true}
            noResultsText="No results for"
        >
            <JsonView.KeyName
                as="span"
                render={(props: JsonViewKeyNameProps, ctx: NodeContext) => {
                    const path = derivePathFromNode(ctx);
                    const selectedClass = getSelectedClass(isSelected, path);
                    // Object/array nodes (e.g. `"descriptor": {...}`) render via `NestedOpen`, not
                    // `JsonView.Row` — this is the only override point their key name passes
                    // through, so the comment trigger lands right after the key text here instead
                    // of next to the copy icon at the end of the line (there's no hook for that).
                    const isContainer = isContainerValue(ctx?.value);

                    return (
                        <span
                            {...props}
                            title={path}
                            className={cn(
                                props.className,
                                "cursor-pointer",
                                selectedClass,
                                renderFieldCommentAction && isContainer && "group/containerkey"
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                const key = String(ctx?.keyName ?? "");
                                handleKeyClick(path, key, e as React.MouseEvent);
                                props.onClick?.(e);
                            }}
                        >
                            {props.children}
                            {renderFieldCommentAction && isContainer && (
                                <span
                                    className="ml-1 inline-flex align-middle opacity-0 group-hover/containerkey:opacity-100 focus-within:opacity-100 has-data-[state=open]:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {renderFieldCommentAction(path, NOOP_ROW_HOVER)}
                                </span>
                            )}
                        </span>
                    );
                }}
            />
            <JsonView.Row
                as="div"
                render={(props: JsonViewRowProps, ctx: NodeContext) => {
                    const path = derivePathFromNode(ctx);
                    const selectedClass = getSelectedClass(isSelected, path);

                    return (
                        <JsonFieldRow
                            rowProps={props}
                            path={path}
                            selectedClass={selectedClass}
                            keyName={ctx?.keyName}
                            handleKeyClick={handleKeyClick}
                            renderFieldCommentAction={renderFieldCommentAction}
                        />
                    );
                }}
            />
        </AppJsonViewer>
    );
};

export default JsonViewer;
