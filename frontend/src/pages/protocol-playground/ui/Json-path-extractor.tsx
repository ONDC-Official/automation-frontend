import React, { useCallback, useRef, useSyncExternalStore } from "react";
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

type JsonViewRowProps = React.HTMLAttributes<HTMLDivElement>;

/** Synthetic event for pin/unpin — library hover handlers expect a MouseEvent, but we re-fire
 *  them outside a real pointer interaction to keep row tools mounted. */
const SYNTHETIC_ROW_MOUSE_EVENT = {} as React.MouseEvent<HTMLDivElement>;

/** Lets a row action (e.g. the comment trigger) keep the row's hover-only tools — like the
 *  built-in copy icon — mounted for as long as it needs, even after the cursor leaves the row. */
export interface RowHoverActions {
    pin: () => void;
    unpin: () => void;
}

/** Object/array nodes render via `NestedOpen`, not `JsonView.Row`, so there's no row-level
 *  onMouseEnter/onMouseLeave we can reach to keep the built-in copy icon mounted — pin/unpin
 *  are no-ops for those. */
const NOOP_ROW_HOVER: RowHoverActions = { pin: () => {}, unpin: () => {} };

type JsonViewKeyNameProps = React.HTMLAttributes<HTMLSpanElement> & {
    className?: string;
};

type JsonViewCountInfoExtraProps = React.HTMLAttributes<HTMLSpanElement> & {
    className?: string;
};

/**
 * Bridges "is this object/array key hovered" from `JsonView.KeyName` to the trailing comment
 * trigger rendered via `JsonView.CountInfoExtra` — the two render independently for the same
 * node (siblings in both the React tree and, ultimately, the DOM), so there's no shared
 * ancestor/descendant relationship a CSS `group`/`peer` selector can hang off. Confirmed by
 * inspection: the key's own `<span>` (from `KeyNameComp`) is nested one level deeper than the
 * row's actual flat sibling group — inside a wrapper `KayName` renders around the quote marks —
 * while `CountInfoExtra`'s trigger sits directly in that flat group. They share a *grandparent*,
 * not a parent, which every CSS sibling/descendant combinator requires. Plain JS + a
 * `useSyncExternalStore` subscription sidesteps that entirely.
 */
interface ContainerHoverStore {
    isHovered: (key: object) => boolean;
    setHovered: (key: object, value: boolean) => void;
    subscribe: (key: object, listener: () => void) => () => void;
}

const createContainerHoverStore = (): ContainerHoverStore => {
    const hovered = new WeakMap<object, boolean>();
    const listeners = new WeakMap<object, Set<() => void>>();
    return {
        isHovered: (key) => hovered.get(key) ?? false,
        setHovered: (key, value) => {
            if (hovered.get(key) === value) return;
            hovered.set(key, value);
            listeners.get(key)?.forEach((listener) => listener());
        },
        subscribe: (key, listener) => {
            let set = listeners.get(key);
            if (!set) {
                set = new Set();
                listeners.set(key, set);
            }
            set.add(listener);
            return () => set.delete(listener);
        },
    };
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
        rowProps.onMouseEnter?.(SYNTHETIC_ROW_MOUSE_EVENT);
    }, [rowProps]);
    const unpin = useCallback(() => {
        isPinnedRef.current = false;
        if (!isHoveringRef.current) rowProps.onMouseLeave?.(SYNTHETIC_ROW_MOUSE_EVENT);
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

/**
 * The comment trigger for object/array rows, rendered via `JsonView.CountInfoExtra` (see
 * `JsonViewer` below) so it lands at the end of the row next to the built-in copy icon, matching
 * leaf rows. Visibility is driven by `ContainerHoverStore` rather than CSS, since there's no
 * shared ancestor to hang a `group`/`peer` hover selector off (see that store's comment) —
 * `JsonView.KeyName` reports hover state into the store keyed by the node's own object identity,
 * and this component subscribes to that same key.
 */
const ContainerCommentTrigger: React.FC<{
    path: string;
    hoverKey: object;
    hoverStore: ContainerHoverStore;
    renderFieldCommentAction: NonNullable<JsonViewerProps["renderFieldCommentAction"]>;
}> = ({ path, hoverKey, hoverStore, renderFieldCommentAction }) => {
    const isHovered = useSyncExternalStore(
        useCallback((listener) => hoverStore.subscribe(hoverKey, listener), [hoverStore, hoverKey]),
        useCallback(() => hoverStore.isHovered(hoverKey), [hoverStore, hoverKey])
    );

    return (
        <span
            className={cn(
                // `CountInfoExtra` renders before the built-in copy icon in the DOM (`Copied`),
                // but the row is a flex container (`NestedOpen`), so `order-1` visually moves
                // this after it — standardizing on copy-then-comment without touching DOM order.
                "order-1 ml-1 inline-flex align-middle transition-opacity focus-within:opacity-100 has-data-[state=open]:opacity-100",
                isHovered ? "opacity-100" : "opacity-0"
            )}
            onClick={(e) => e.stopPropagation()}
        >
            {renderFieldCommentAction(path, NOOP_ROW_HOVER)}
        </span>
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

    // Object/array nodes reach `JsonView.CountInfoExtra` (see below) with only `{ value, keyName }`
    // in context — no `keys`, so `derivePathFromNode` can't recover the full ancestor chain there.
    // `JsonView.KeyName` renders earlier for the same node with full context, so it stashes the
    // correct path here (keyed by the node's own object identity) for `CountInfoExtra` to read.
    // Safe because `NestedOpen`'s children are a fixed, ordered array — KeyName always precedes
    // CountInfoExtra in the same render pass — though that ordering is an internal detail of
    // `@uiw/react-json-view`, not a documented contract.
    const containerPathByValueRef = useRef(new WeakMap<object, string>());
    // See `ContainerHoverStore`'s comment: bridges "is this key hovered" from `JsonView.KeyName`
    // to the trailing trigger rendered via `JsonView.CountInfoExtra`, since no CSS selector can.
    const containerHoverStoreRef = useRef(createContainerHoverStore());

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

                    if (renderFieldCommentAction && ctx?.value && typeof ctx.value === "object") {
                        containerPathByValueRef.current.set(ctx.value as object, path);
                    }

                    const isContainer = !!(
                        renderFieldCommentAction &&
                        ctx?.value &&
                        typeof ctx.value === "object"
                    );
                    const containerHoverKey = isContainer ? (ctx.value as object) : undefined;

                    return (
                        <span
                            {...props}
                            title={path}
                            className={cn(props.className, "cursor-pointer", selectedClass)}
                            ref={(el: HTMLSpanElement | null) => {
                                if (!el || !containerHoverKey) return;
                                // Two DOM levels up from this span is the row's real hover
                                // boundary — the flat row element that also directly contains
                                // the trailing comment trigger — so entering/leaving anywhere in
                                // that shared box (key, copy icon, or comment icon) fires once,
                                // instead of dropping hover the instant the cursor leaves just
                                // the key text on its way to the icons.
                                const row = el.parentElement?.parentElement;
                                if (!row) return;
                                const handleEnter = () =>
                                    containerHoverStoreRef.current.setHovered(
                                        containerHoverKey,
                                        true
                                    );
                                const handleLeave = () =>
                                    containerHoverStoreRef.current.setHovered(
                                        containerHoverKey,
                                        false
                                    );
                                row.addEventListener("mouseenter", handleEnter);
                                row.addEventListener("mouseleave", handleLeave);
                                return () => {
                                    row.removeEventListener("mouseenter", handleEnter);
                                    row.removeEventListener("mouseleave", handleLeave);
                                };
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                const key = String(ctx?.keyName ?? "");
                                handleKeyClick(path, key, e as React.MouseEvent);
                                props.onClick?.(e);
                            }}
                        >
                            {props.children}
                        </span>
                    );
                }}
            />
            {/* Object/array rows only: `CountInfoExtra` sits right before the built-in `Copied`
                icon in `NestedOpen`'s render order, and is the one override point positioned at
                the *end* of the row rather than next to the key — so the trigger lands in the
                same visual slot (adjacent to the copy icon) as it does on leaf rows below,
                instead of up by the key. */}
            <JsonView.CountInfoExtra
                as="span"
                render={(_props: JsonViewCountInfoExtraProps, ctx: NodeContext) => {
                    if (!renderFieldCommentAction || !ctx?.value || typeof ctx.value !== "object") {
                        return undefined;
                    }
                    const hoverKey = ctx.value as object;
                    const path =
                        containerPathByValueRef.current.get(hoverKey) ?? derivePathFromNode(ctx);

                    return (
                        <ContainerCommentTrigger
                            path={path}
                            hoverKey={hoverKey}
                            hoverStore={containerHoverStoreRef.current}
                            renderFieldCommentAction={renderFieldCommentAction}
                        />
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
