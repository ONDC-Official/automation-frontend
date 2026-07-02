import React from "react";
import JsonView from "@uiw/react-json-view";
import { useLocation } from "react-router-dom";
import { SelectedType } from "@pages/protocol-playground/ui/types";
import { cn } from "@/lib/utils";
import AppJsonViewer from "@/components/AppJsonViewer";

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
};

type JsonViewRowProps = React.HTMLAttributes<HTMLDivElement> & {
    className?: string;
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
}

const JsonViewer: React.FC<JsonViewerProps> = ({
    data,
    isSelected,
    handleKeyClick,
    onExpand: _onExpand,
    isExpanded: _isExpanded,
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
            className={cn("min-h-full rounded-md")}
            enableClipboard={true}
            noResultsText="No results for"
        >
            <JsonView.Row
                as="div"
                render={(props: JsonViewRowProps, ctx: NodeContext) => {
                    const path = derivePathFromNode(ctx);
                    const selected = isSelected(path);
                    const selectedClass = selected.status
                        ? selected.type === SelectedType.SaveData
                            ? "bg-sky-100 dark:bg-sky-500/15 ring-1 ring-sky-400 dark:ring-sky-400/60 shadow-xs rounded"
                            : "bg-slate-100 ring-1 ring-slate-300 shadow-xs rounded"
                        : "";

                    return (
                        <div
                            {...props}
                            title={path}
                            className={cn(props.className, "cursor-pointer", selectedClass)}
                            onClick={(e) => {
                                const key = String(ctx?.keyName ?? "");
                                handleKeyClick(path, key, e as React.MouseEvent);
                                props.onClick?.(e);
                            }}
                        />
                    );
                }}
            />
        </AppJsonViewer>
    );
};

export default JsonViewer;
