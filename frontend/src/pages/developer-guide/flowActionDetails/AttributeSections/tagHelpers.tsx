import { FC, useState } from "react";
import { safeDescription, hasDescription } from "../attributePanelUtils";
import type { TagField, TagFieldItem } from "../types";

// ─── Tag helpers ──────────────────────────────────────────────────────────────

export function countNestedItems(list: TagFieldItem[]): number {
    return list.reduce((acc, item) => {
        const sub = item.list ? countNestedItems(item.list) : 0;
        return acc + 1 + sub;
    }, 0);
}

export const NestedTagItem: FC<{ item: TagFieldItem; depth: number }> = ({ item, depth }) => {
    const [expanded, setExpanded] = useState(false);
    const hasList = item.list && item.list.length > 0;
    const nestedCount = hasList ? countNestedItems(item.list!) : 0;

    return (
        <div
            className="border-l-2 border-sky-100 dark:border-sky-500/30 pl-3 py-2 min-w-0"
            style={{ marginLeft: depth * 20 }}
        >
            <button
                type="button"
                onClick={() => hasList && setExpanded((e) => !e)}
                className={`w-full text-left flex items-start justify-between gap-2 ${hasList ? "cursor-pointer" : "cursor-default"}`}
            >
                <div className="flex items-start gap-2 flex-1 min-w-0">
                    {hasList && (
                        <span
                            className="text-sky-400 text-xs shrink-0 transition-transform mt-0.5"
                            aria-hidden
                        >
                            {expanded ? "▾" : "▸"}
                        </span>
                    )}
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className="font-mono text-xs font-semibold text-sky-700 dark:text-sky-300">
                            {item.code}
                        </span>
                        {hasDescription(item.description) && (
                            <span className="text-xs text-slate-500 leading-snug">
                                {safeDescription(item.description)}
                            </span>
                        )}
                    </div>
                </div>
                {hasList && (
                    <span className="text-[11px] text-sky-400 shrink-0 tabular-nums">
                        {nestedCount} item{nestedCount !== 1 ? "s" : ""}
                    </span>
                )}
            </button>
            {hasList && expanded && (
                <div className="mt-1 space-y-0">
                    {item.list!.map((child, i) => (
                        <NestedTagItem key={i} item={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

export const TagGroupItem: FC<{ field: TagField }> = ({ field }) => {
    const [expanded, setExpanded] = useState(false);
    const hasList = field.list && field.list.length > 0;
    const nestedCount = hasList ? countNestedItems(field.list!) : 0;

    return (
        <div className="rounded-lg border border-sky-100 dark:border-sky-500/30 overflow-hidden bg-white dark:bg-surface-elevated shadow-xs">
            <button
                type="button"
                onClick={() => hasList && setExpanded((e) => !e)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors ${hasList ? "hover:bg-sky-50/50 dark:hover:bg-sky-500/10 cursor-pointer" : "cursor-default"}`}
            >
                <span className="flex items-center gap-2 min-w-0">
                    {hasList && (
                        <span
                            className="text-sky-400 text-xs shrink-0 transition-transform"
                            aria-hidden
                        >
                            {expanded ? "▾" : "▸"}
                        </span>
                    )}
                    <span className="font-mono text-sm font-semibold text-sky-700 dark:text-sky-300 truncate">
                        {field.label}
                    </span>
                    {hasDescription(field.description) && !hasList && (
                        <span className="text-xs text-slate-500 truncate">
                            {safeDescription(field.description)}
                        </span>
                    )}
                </span>
                {hasList && (
                    <span className="text-[11px] text-sky-400 shrink-0 tabular-nums bg-sky-50 dark:bg-sky-500/10 px-1.5 py-0.5 rounded">
                        {nestedCount} item{nestedCount !== 1 ? "s" : ""}
                    </span>
                )}
            </button>
            {hasList && expanded && (
                <div className="px-3 pb-3 pt-0 border-t border-sky-100 dark:border-sky-500/30 bg-sky-50/30 dark:bg-sky-500/5">
                    <div className="mt-2 space-y-0">
                        {field.list!.map((item, i) => (
                            <NestedTagItem key={i} item={item} depth={0} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
