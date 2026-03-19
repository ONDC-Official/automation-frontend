import { FC, useState, useMemo, type ReactNode } from "react";
import { getValidationsIntroMessage } from "../xValidationsReadme";
import type { OpenAPISpecification } from "../types";
import type {
    ActionAttributes,
    AttributeDetails,
    EnumDetails,
    TagDetails,
    TagField,
    TagFieldItem,
    ValidationRuleDisplay,
} from "./types";
import rawTableData from "../raw_table.json";

const HTML_TAG_RE = /<[^>]+>/g;

function stripHtml(html: string): string {
    if (typeof document === "undefined")
        return html.replace(HTML_TAG_RE, " ").replace(/\s+/g, " ").trim();
    const div = document.createElement("div");
    div.innerHTML = html;
    return (div.textContent ?? div.innerText ?? "").replace(/\s+/g, " ").trim();
}

function hasHtml(s: string): boolean {
    return /<[^>]+>/.test(s);
}

function safeDescription(s: string): string {
    return hasHtml(s) ? stripHtml(s) : s;
}

// function formatRequired(value: string | undefined | null): string {
//     if (value === "true") return "Mandatory";
//     if (value === "false") return "Optional";
//     return value ?? "—";
// }

interface AttributesPanelProps {
    attributes: ActionAttributes | null;
    /** Validation rules from x-validations for the selected path. */
    validations?: ValidationRuleDisplay[];
    spec?: OpenAPISpecification | null;
    actionApi?: string;
    /** step.api (search, on_search, etc.) — used for x-attributes / getRequiredForPath lookup. */
    stepApi?: string;
    useCaseId?: string;
    isExpanded?: boolean;
}

const SectionHeader: FC<{ children: ReactNode }> = ({ children }) => (
    <div className="flex items-center gap-2 mb-3">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-sky-600">{children}</h4>
        <div className="flex-1 h-px bg-sky-100" />
    </div>
);

const LabelBadge: FC<{ children: ReactNode }> = ({ children }) => (
    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0">
        {children}
    </span>
);

/** Sky-tinted code badge — fits white-sky theme, readable without harsh black. */
const ValueBadge: FC<{ children: ReactNode }> = ({ children }) => (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-sky-50 text-sky-800 font-mono text-[11px] break-all border border-sky-200 shadow-sm">
        {children}
    </span>
);

// const RequiredBadge: FC<{ value: string | undefined | null }> = ({ value }) => {
//     const label = formatRequired(value);
//     const cls =
//         label === "Mandatory"
//             ? "bg-rose-50 text-rose-700 border-rose-200"
//             : label === "Optional"
//               ? "bg-emerald-50 text-emerald-700 border-emerald-200"
//               : "bg-slate-100 text-slate-500 border-slate-200";
//     return (
//         <span
//             className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}
//         >
//             {label}
//         </span>
//     );
// };

const AttributeSection: FC<{
    attrs: AttributeDetails;
    isExpanded?: boolean;
}> = ({ attrs }) => {
    return (
        <div className="space-y-5">
            <section>
                <SectionHeader>Details</SectionHeader>
                <div className="rounded-xl border border-sky-100 shadow-sm overflow-hidden">
                    {/* JSON Path — full width, sky-tinted row */}
                    <div className="px-4 py-3 border-b border-sky-100 flex flex-col gap-1.5">
                        <LabelBadge>JSON Path</LabelBadge>
                        <div className="overflow-x-auto">
                            <ValueBadge>{attrs.jsonPath}</ValueBadge>
                        </div>
                    </div>
                    {/* Meta row */}
                    <div className="grid grid-cols-3 divide-x divide-sky-100 bg-white">
                        {/* <div className="px-4 py-3 flex flex-col gap-1.5">
                            <LabelBadge>Required</LabelBadge>
                            <RequiredBadge value={attrs.required} />
                        </div> */}
                        <div className="px-4 py-3 flex flex-col gap-1.5">
                            <LabelBadge>Owner</LabelBadge>
                            <span className="text-sm text-slate-700 font-medium">
                                {attrs.owner ?? "—"}
                            </span>
                        </div>
                        <div className="px-4 py-3 flex flex-col gap-1.5">
                            <LabelBadge>Type</LabelBadge>
                            <span className="text-sm text-sky-700 font-mono font-semibold">
                                {attrs.type}
                            </span>
                        </div>
                    </div>
                </div>
            </section>
            <section>
                <SectionHeader>Description</SectionHeader>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap rounded-xl bg-white border border-slate-200 shadow-sm p-4">
                    {safeDescription(attrs._description?.info ?? attrs.description)}
                </p>
            </section>
            {attrs.enumrefs && attrs.enumrefs.length > 0 && (
                <section>
                    <SectionHeader>Enum References</SectionHeader>
                    <ul className="space-y-2 text-sm rounded-xl bg-white border border-slate-200 shadow-sm p-4">
                        {attrs.enumrefs.map((ref, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                                <span className="text-sky-300 mt-0.5">↗</span>
                                <a
                                    href={ref.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sky-600 hover:text-sky-800 hover:underline underline-offset-2 break-all font-medium"
                                >
                                    {ref.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
};

const EnumSection: FC<{ attrs: EnumDetails; isExpanded?: boolean }> = ({ attrs }) => (
    <div className="space-y-5">
        <section>
            <SectionHeader>Details</SectionHeader>
            <div className="rounded-xl border border-sky-100 shadow-sm overflow-hidden">
                {/* JSON Path — full width, sky-tinted row */}
                <div className="px-4 py-3 border-b border-sky-100 bg-sky-50/60 flex flex-col gap-1.5">
                    <LabelBadge>JSON Path</LabelBadge>
                    <div className="overflow-x-auto">
                        <ValueBadge>{attrs.jsonPath}</ValueBadge>
                    </div>
                </div>
                {/* Meta row */}
                <div className="grid grid-cols-3 divide-x divide-sky-100 bg-white">
                    {/* <div className="px-4 py-3 flex flex-col gap-1.5">
                        <LabelBadge>Required</LabelBadge>
                        <RequiredBadge value={attrs.required} />
                    </div> */}
                    <div className="px-4 py-3 flex flex-col gap-1.5">
                        <LabelBadge>Owner</LabelBadge>
                        <span className="text-sm text-slate-700 font-medium">
                            {attrs.owner ?? "—"}
                        </span>
                    </div>
                    <div className="px-4 py-3 flex flex-col gap-1.5">
                        <LabelBadge>Type</LabelBadge>
                        <span className="text-sm text-sky-700 font-mono font-semibold">
                            {attrs.type ?? "—"}
                        </span>
                    </div>
                </div>
            </div>
        </section>
        {attrs.description != null && attrs.description !== "—" && (
            <section>
                <SectionHeader>Description</SectionHeader>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap rounded-xl bg-white border border-slate-200 shadow-sm p-4">
                    {safeDescription(attrs.description)}
                </p>
            </section>
        )}
        {attrs.enumrefs && attrs.enumrefs.length > 0 && (
            <section>
                <SectionHeader>Enum References</SectionHeader>
                <ul className="space-y-2 text-sm rounded-xl bg-white border border-slate-200 shadow-sm p-4">
                    {attrs.enumrefs.map((ref, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                            <span className="text-sky-300 mt-0.5">↗</span>
                            <a
                                href={ref.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-600 hover:text-sky-800 hover:underline underline-offset-2 break-all font-medium"
                            >
                                {ref.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </section>
        )}
        {attrs.enumOptions && attrs.enumOptions.length > 0 && (
            <section>
                <SectionHeader>Possible Values</SectionHeader>
                <ul className="rounded-xl bg-white border border-sky-100 shadow-sm divide-y divide-sky-50">
                    {attrs.enumOptions.map((o, i) => (
                        <li key={i} className="flex items-start gap-3 px-4 py-2.5">
                            <ValueBadge>{o.code}</ValueBadge>
                            {o.description !== "—" && (
                                <span className="text-xs text-slate-500 leading-relaxed pt-1 flex-1">
                                    {safeDescription(o.description)}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            </section>
        )}
    </div>
);

/** Recursively count total nested items for display. */
function countNestedItems(list: TagFieldItem[]): number {
    return list.reduce((acc, item) => {
        const sub = item.list ? countNestedItems(item.list) : 0;
        return acc + 1 + sub;
    }, 0);
}

/** Renders a single tag list item; recurses for n-level nested list. */
const NestedTagItem: FC<{ item: TagFieldItem; depth: number }> = ({ item, depth }) => {
    const [expanded, setExpanded] = useState(false);
    const hasList = item.list && item.list.length > 0;
    const nestedCount = hasList ? countNestedItems(item.list!) : 0;

    return (
        <div
            className="border-l-2 border-sky-100 pl-3 py-2 min-w-0"
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
                        <span className="font-mono text-xs font-semibold text-sky-700">
                            {item.code}
                        </span>
                        {item.description !== "—" && (
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

const TagGroupItem: FC<{ field: TagField }> = ({ field }) => {
    const [expanded, setExpanded] = useState(false);
    const hasList = field.list && field.list.length > 0;
    const nestedCount = hasList ? countNestedItems(field.list!) : 0;

    return (
        <div className="rounded-lg border border-sky-100 overflow-hidden bg-white shadow-sm">
            <button
                type="button"
                onClick={() => hasList && setExpanded((e) => !e)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors ${hasList ? "hover:bg-sky-50/50 cursor-pointer" : "cursor-default"}`}
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
                    <span className="font-mono text-sm font-semibold text-sky-700 truncate">
                        {field.label}
                    </span>
                    {field.description !== "—" && !hasList && (
                        <span className="text-xs text-slate-500 truncate">
                            {safeDescription(field.description)}
                        </span>
                    )}
                </span>
                {hasList && (
                    <span className="text-[11px] text-sky-400 shrink-0 tabular-nums bg-sky-50 px-1.5 py-0.5 rounded">
                        {nestedCount} item{nestedCount !== 1 ? "s" : ""}
                    </span>
                )}
            </button>
            {hasList && expanded && (
                <div className="px-3 pb-3 pt-0 border-t border-sky-100 bg-sky-50/30">
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

const TagSection: FC<{ attrs: TagDetails; isExpanded?: boolean }> = ({ attrs }) => {
    const description = attrs._description?.info ?? attrs.attributeInfo?.description;
    const tagFields = attrs.tagFields ?? [];

    return (
        <div className="space-y-5">
            <section>
                <SectionHeader>Details</SectionHeader>
                <div className="rounded-xl border border-sky-100 shadow-sm overflow-hidden">
                    {/* JSON Path — full width, sky-tinted row */}
                    <div className="px-4 py-3 border-b border-sky-100 bg-sky-50/60 flex flex-col gap-1.5">
                        <LabelBadge>JSON Path</LabelBadge>
                        <div className="overflow-x-auto">
                            <ValueBadge>{attrs.jsonPath}</ValueBadge>
                        </div>
                    </div>
                    {/* Meta row */}
                    <div className="grid grid-cols-3 divide-x divide-sky-100 bg-white">
                        {/* <div className="px-4 py-3 flex flex-col gap-1.5">
                            <LabelBadge>Required</LabelBadge>
                            <RequiredBadge value={attrs.attributeInfo?.required} />
                        </div> */}
                        <div className="px-4 py-3 flex flex-col gap-1.5">
                            <LabelBadge>Owner</LabelBadge>
                            <span className="text-sm text-slate-700 font-medium">
                                {attrs.attributeInfo?.owner ?? "—"}
                            </span>
                        </div>
                        <div className="px-4 py-3 flex flex-col gap-1.5">
                            <LabelBadge>Type</LabelBadge>
                            <span className="text-sm text-sky-700 font-mono font-semibold">
                                {attrs.attributeInfo?.type ?? "—"}
                            </span>
                        </div>
                    </div>
                </div>
            </section>
            {description != null && description !== "—" && (
                <section>
                    <SectionHeader>Description</SectionHeader>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap rounded-xl bg-white border border-slate-200 shadow-sm p-4">
                        {safeDescription(description)}
                    </p>
                </section>
            )}
            {tagFields.length > 0 && (
                <section>
                    <SectionHeader>Tag Groups</SectionHeader>
                    <div className="space-y-2">
                        {tagFields.map((field, i) => (
                            <TagGroupItem key={i} field={field} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

// ─── Raw Table types ─────────────────────────────────────────────────────────
interface RawTableRow {
    rowType: "leaf" | "group";
    name: string;
    group: string;
    scope: string;
    description: string;
    skipIf: string;
    errorCode: string;
    successCode: string;
}

// ─── JSON Path helpers ────────────────────────────────────────────────────────

/**
 * Splits text into alternating plain-text and JSON-path segments.
 * Tracks bracket depth so filter expressions like $.tags[?(@.x == 'y')]
 * are captured as a single token.
 */
function splitByJsonPaths(text: string): Array<{ text: string; isPath: boolean }> {
    const result: Array<{ text: string; isPath: boolean }> = [];
    const n = text.length;
    let i = 0;
    let lastPlainStart = 0;
    while (i < n) {
        if (text[i] === "$" && i + 1 < n && (text[i + 1] === "." || text[i + 1] === "[")) {
            if (i > lastPlainStart) {
                result.push({ text: text.slice(lastPlainStart, i), isPath: false });
            }
            let j = i + 1;
            let depth = 0;
            while (j < n) {
                const c = text[j];
                if (c === "[") {
                    depth++;
                } else if (c === "]") {
                    depth--;
                    if (depth < 0) break;
                } else if (
                    depth === 0 &&
                    (c === " " ||
                        c === "\t" ||
                        c === "\n" ||
                        c === '"' ||
                        c === "'" ||
                        c === "," ||
                        c === ";" ||
                        c === ")")
                ) {
                    break;
                }
                j++;
            }
            result.push({ text: text.slice(i, j), isPath: true });
            i = j;
            lastPlainStart = j;
        } else {
            i++;
        }
    }
    if (lastPlainStart < n) {
        result.push({ text: text.slice(lastPlainStart), isPath: false });
    }
    return result;
}

function extractJsonPaths(text: string): string[] {
    return splitByJsonPaths(text)
        .filter((p) => p.isPath)
        .map((p) => p.text);
}

/**
 * Normalise a JSONPath for prefix matching:
 *  - ignores _EXTERNAL cross-payload references
 *  - strips filter expressions [?...] (cuts at that point)
 *  - replaces [*] wildcards and numeric indices with a dot separator
 *  - collapses double-dots
 */
function normalizePathForMatch(path: string): string {
    if (path.includes("_EXTERNAL")) return "";
    // strip leading $. or $ so both "$.context.foo" and "context.foo" compare equally
    path = path.replace(/^\$\.?/, "").trim();
    const filterIdx = path.indexOf("[?");
    if (filterIdx !== -1) path = path.slice(0, filterIdx);
    path = path.replace(/\[\*\]\./g, ".").replace(/\[\*\]$/, "");
    path = path.replace(/\[\d+\]\./g, ".").replace(/\[\d+\]$/, "");
    path = path.replace(/\.{2,}/g, ".").replace(/\.$/, "");
    return path.trim();
}

/** True if extractedPath and selectedPath refer to the same or related field.
 *  - Exact match (after normalisation)
 *  - Rule path is a child of the selected path (e.g. rule targets items[*].id while user selected items)
 *  - Rule path was truncated by a filter expression [?...] so its normalised form is a
 *    prefix of the selected path — ONLY in that case do we allow the reverse direction,
 *    preventing a plain $.context.ttl rule from matching message.intent.category.descriptor.code.
 */
function pathMatches(extractedPath: string, selectedPath: string): boolean {
    const norm1 = normalizePathForMatch(extractedPath);
    const norm2 = normalizePathForMatch(selectedPath);
    if (!norm1 || !norm2) return false;
    if (norm1 === norm2) return true;
    // rule targets a sub-field of the selected node
    if (norm1.startsWith(norm2 + ".")) return true;
    // rule path was shortened because of a filter expression — allow parent match
    if (extractedPath.includes("[?") && norm2.startsWith(norm1 + ".")) return true;
    return false;
}

// ─── Description renderer with inline highlighted JSONPaths ──────────────────

const DescriptionText: FC<{ text: string }> = ({ text }) => {
    const parts = splitByJsonPaths(text);
    return (
        <>
            {parts.map((part, i) =>
                part.isPath ? (
                    <code
                        key={i}
                        className="inline-flex items-center px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 font-mono text-[11px] border border-sky-200 leading-normal"
                    >
                        {part.text}
                    </code>
                ) : (
                    <span key={i}>{safeDescription(part.text)}</span>
                )
            )}
        </>
    );
};

// ─── Single validation-rule card ─────────────────────────────────────────────

const RawTableCard: FC<{ row: RawTableRow }> = ({ row }) => {
    const hasSkipIf = row.skipIf.trim() !== "";
    const hasErrorCode = row.errorCode.trim() !== "";

    return (
        <div className="rounded-xl border border-sky-100 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 px-4 py-2.5 bg-sky-50/60 border-b border-sky-100">
                <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-mono text-xs font-bold text-sky-800 break-all">
                        {row.name}
                    </span>
                    {row.group.trim() && (
                        <span className="text-[10px] text-slate-400 truncate" title={row.group}>
                            {row.group}
                        </span>
                    )}
                </div>
                {hasErrorCode && (
                    <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-semibold">
                        {row.errorCode}
                    </span>
                )}
            </div>
            {/* Body */}
            <div className="px-4 py-3 space-y-3 text-sm">
                <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-sky-500">
                        Rule
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                        <DescriptionText text={row.description} />
                    </p>
                </div>
                {hasSkipIf && (
                    <div className="space-y-1 pt-2 border-t border-sky-50">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-sky-500">
                            Skip If
                        </span>
                        <p className="text-slate-500 leading-relaxed">
                            <DescriptionText text={row.skipIf} />
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Validations section (driven by raw_table.json) ──────────────────────────

const ValidationsSection: FC<{
    stepApi?: string;
    selectedPath?: string;
}> = ({ stepApi, selectedPath }) => {
    const [searchQuery, setSearchQuery] = useState("");

    const allLeafRows = useMemo((): RawTableRow[] => {
        if (!stepApi) return [];
        const actionData = (rawTableData as Record<string, { rows: RawTableRow[] }>)[stepApi];
        if (!actionData?.rows) return [];
        return actionData.rows.filter((r) => r.rowType === "leaf");
    }, [stepApi]);

    const matchingRows = useMemo((): RawTableRow[] => {
        if (!selectedPath) return [];
        const normSelected = normalizePathForMatch(selectedPath.trim());
        if (!normSelected) return [];
        return allLeafRows.filter((row) => {
            const paths = extractJsonPaths(row.description);
            return paths.some((p) => pathMatches(p, selectedPath));
        });
    }, [allLeafRows, selectedPath]);

    const filteredRows = useMemo((): RawTableRow[] => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return matchingRows;
        return matchingRows.filter(
            (row) =>
                row.name.toLowerCase().includes(q) ||
                row.description.toLowerCase().includes(q) ||
                row.group.toLowerCase().includes(q)
        );
    }, [matchingRows, searchQuery]);

    if (!stepApi || allLeafRows.length === 0) return null;

    return (
        <section className="pt-5">
            <div className="flex items-center gap-2 mb-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-sky-600">
                    sync-validations
                </h4>
                <div className="flex-1 h-px bg-sky-100" />
                {matchingRows.length > 0 && (
                    <span className="text-[10px] font-semibold text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full">
                        {matchingRows.length}
                    </span>
                )}
            </div>
            <p className="text-slate-500 text-xs leading-relaxed mb-4 bg-sky-50/60 border border-sky-100 rounded-lg px-3 py-2.5">
                {getValidationsIntroMessage()}
            </p>
            {matchingRows.length > 1 && (
                <div className="mb-4">
                    <input
                        type="search"
                        placeholder="Filter rules by name, path or description…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-shadow"
                        aria-label="Filter validation rules"
                    />
                    {searchQuery.trim() && (
                        <p className="text-slate-400 text-xs mt-2">
                            {filteredRows.length === 0
                                ? "No rules match your search."
                                : `Showing ${filteredRows.length} of ${matchingRows.length} rules`}
                        </p>
                    )}
                </div>
            )}
            <div className="space-y-3">
                {matchingRows.length === 0 ? (
                    <p className="text-slate-400 text-sm py-8 text-center rounded-xl bg-slate-50 border border-slate-200">
                        No validation rules found for this field.
                    </p>
                ) : filteredRows.length === 0 && searchQuery.trim() ? (
                    <p className="text-slate-400 text-sm py-8 text-center rounded-xl bg-slate-50 border border-slate-200">
                        No rules match &quot;{searchQuery.trim()}&quot;.
                    </p>
                ) : (
                    filteredRows.map((row) => <RawTableCard key={row.name} row={row} />)
                )}
            </div>
        </section>
    );
};

const AttributesPanel: FC<AttributesPanelProps> = ({
    attributes,
    validations: _validations = [],
    spec: _spec,
    actionApi: _actionApi,
    stepApi,
    useCaseId: _useCaseId,
    isExpanded = false,
}) => {
    if (!attributes) {
        return (
            <div className="h-full flex flex-col rounded-xl border border-sky-100 bg-white overflow-hidden shadow-sm">
                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-400 text-lg">
                        &#x276F;
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed max-w-[220px]">
                        Click a key in the JSON tree to view its schema, attributes, and
                        validations.
                    </p>
                </div>
            </div>
        );
    }

    // const kindMeta = {
    //     attribute: { label: "Attribute", accent: "from-sky-500 to-sky-600" },
    //     enum: { label: "Enum", accent: "from-violet-500 to-violet-600" },
    //     tag: { label: "Tags", accent: "from-teal-500 to-teal-600" },
    // } as const;
    // const meta = kindMeta[attributes.kind as keyof typeof kindMeta] ?? {
    //     label: attributes.kind,
    //     accent: "from-slate-500 to-slate-600",
    // };

    return (
        <div className="h-full flex flex-col rounded-xl border border-sky-100 bg-white overflow-hidden shadow-sm">
            <div className="flex-1 overflow-auto p-4 text-sm">
                {attributes.kind === "attribute" && (
                    <AttributeSection attrs={attributes} isExpanded={isExpanded} />
                )}
                {attributes.kind === "enum" && (
                    <EnumSection attrs={attributes} isExpanded={isExpanded} />
                )}
                {attributes.kind === "tag" && (
                    <TagSection attrs={attributes} isExpanded={isExpanded} />
                )}
                {stepApi && (
                    <ValidationsSection stepApi={stepApi} selectedPath={attributes.jsonPath} />
                )}
            </div>
        </div>
    );
};

export default AttributesPanel;
