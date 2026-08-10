import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@pages/business-dashboard/lib/utils";
import { jsonValueVariants } from "./variants";
import { entriesOf, isBranch, kindOf, matchesSearch, summarise } from "./utils";
import type { INodeProps } from "./types";

const INDENT_REM = 0.875;

const Node = ({ nodeKey, value, depth, path, expanded, onToggle, search }: INodeProps) => {
    const branch = isBranch(value);
    const open = expanded.has(path);
    const highlighted = matchesSearch(nodeKey, value, search);
    const kind = kindOf(value);

    const renderedValue =
        kind === "string" ? `"${String(value)}"` : kind === "null" ? "null" : String(value);

    return (
        <div>
            <div
                className={cn(
                    "flex items-start gap-1 rounded-sm py-0.5 font-mono text-xs",
                    highlighted && "bg-status-pending-subtle"
                )}
                style={{ paddingLeft: `${depth * INDENT_REM}rem` }}
            >
                {branch ? (
                    <button
                        type="button"
                        onClick={() => onToggle(path)}
                        aria-expanded={open}
                        aria-label={`${open ? "Collapse" : "Expand"} ${nodeKey}`}
                        className="text-muted-foreground hover:text-foreground mt-px shrink-0 transition-colors"
                    >
                        {open ? (
                            <ChevronDown className="size-3.5" />
                        ) : (
                            <ChevronRight className="size-3.5" />
                        )}
                    </button>
                ) : (
                    <span className="w-3.5 shrink-0" />
                )}

                <span className="text-muted-foreground shrink-0">{nodeKey}:</span>

                {branch && !open && (
                    <span className="text-muted-foreground">{summarise(value)}</span>
                )}

                {!branch && (
                    <span className={cn(jsonValueVariants({ kind }))}>{renderedValue}</span>
                )}
            </div>

            {branch &&
                open &&
                entriesOf(value).map(([childKey, childValue]) => (
                    <Node
                        key={`${path}.${childKey}`}
                        nodeKey={childKey}
                        value={childValue}
                        depth={depth + 1}
                        path={`${path}.${childKey}`}
                        expanded={expanded}
                        onToggle={onToggle}
                        search={search}
                    />
                ))}
        </div>
    );
};

export default Node;
