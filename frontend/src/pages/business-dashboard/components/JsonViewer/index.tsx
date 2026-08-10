import { useMemo, useState } from "react";
import { Check, ChevronsDownUp, ChevronsUpDown, Copy, Search } from "lucide-react";
import Button from "@dashboard/components/Button";
import Input from "@dashboard/components/Input";
import { cn } from "@dashboard/lib/utils";
import Node from "./Node";
import { entriesOf, pathsMatching, pathsToDepth } from "./utils";
import type { IProps } from "./types";

const ROOT_PATH = "$";

/**
 * Dependency-free collapsible JSON tree: search (auto-opens matching branches),
 * expand/collapse all, and copy-to-clipboard.
 */
const JsonViewer = ({
    data,
    initialDepth = 1,
    maxHeightClassName = "max-h-96",
    className,
}: IProps) => {
    const [expanded, setExpanded] = useState<Set<string>>(
        () => new Set(pathsToDepth(data, initialDepth))
    );
    const [search, setSearch] = useState("");
    const [copied, setCopied] = useState(false);

    // Search opens every branch on the path to a hit, so matches are never
    // hidden inside a collapsed node. Derived at render rather than pushed into
    // state, so clearing the search restores the user's own expansions exactly.
    const searchHits = useMemo(() => pathsMatching(data, search), [data, search]);

    const visible = useMemo(() => new Set([...expanded, ...searchHits]), [expanded, searchHits]);

    const rows = useMemo(() => entriesOf(data), [data]);
    const serialised = useMemo(() => JSON.stringify(data, null, 2), [data]);

    const onToggle = (path: string) =>
        setExpanded((current) => {
            const next = new Set(current);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });

    const onExpandAll = () => setExpanded(new Set(pathsToDepth(data, Number.MAX_SAFE_INTEGER)));

    const onCollapseAll = () => setExpanded(new Set());

    const onCopy = async () => {
        await navigator.clipboard.writeText(serialised);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div
            data-slot="json-viewer"
            className={cn("border-border bg-card flex flex-col gap-2 rounded-lg border", className)}
        >
            <div className="border-border flex flex-wrap items-center gap-2 border-b p-2">
                <div className="relative min-w-40 flex-1">
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search keys and values"
                        aria-label="Search JSON"
                        className="h-8 pl-8 text-xs"
                    />
                </div>
                <Button variant="ghost" size="sm" onClick={onExpandAll}>
                    <ChevronsUpDown />
                    Expand all
                </Button>
                <Button variant="ghost" size="sm" onClick={onCollapseAll}>
                    <ChevronsDownUp />
                    Collapse all
                </Button>
                <Button variant="outline" size="sm" onClick={onCopy}>
                    {copied ? <Check /> : <Copy />}
                    {copied ? "Copied" : "Copy"}
                </Button>
            </div>

            <div className={cn("overflow-auto px-2 pb-2", maxHeightClassName)}>
                {rows.length === 0 ? (
                    <p className="text-muted-foreground p-2 font-mono text-xs">{serialised}</p>
                ) : (
                    rows.map(([key, value]) => (
                        <Node
                            key={`${ROOT_PATH}.${key}`}
                            nodeKey={key}
                            value={value}
                            depth={0}
                            path={`${ROOT_PATH}.${key}`}
                            expanded={visible}
                            onToggle={onToggle}
                            search={search}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default JsonViewer;
