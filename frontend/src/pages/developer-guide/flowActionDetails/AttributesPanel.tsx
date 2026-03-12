import { FC, useState, useMemo, type ReactNode } from "react";
import {
    getReadmeMessage,
    getValidationsIntroMessage,
    getReadmeSkipIf,
} from "../xValidationsReadme";
import { getRequiredForPath } from "./schemaAttributes";
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

function formatRequired(value: string | undefined | null): string {
    if (value === "true") return "Mandatory";
    if (value === "false") return "Optional";
    return value ?? "—";
}

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

const RequiredBadge: FC<{ value: string | undefined | null }> = ({ value }) => {
    const label = formatRequired(value);
    const cls =
        label === "Mandatory"
            ? "bg-rose-50 text-rose-700 border-rose-200"
            : label === "Optional"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-500 border-slate-200";
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}
        >
            {label}
        </span>
    );
};

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

function normalizePathForGroup(p: string): string {
    return p.replace(/^\$\.?/, "").trim() || p;
}

const ValidationsSection: FC<{
    validations: ValidationRuleDisplay[];
    spec?: OpenAPISpecification | null;
    actionApi?: string;
    stepApi?: string;
    useCaseId?: string;
}> = ({ validations, spec, actionApi, stepApi, useCaseId }) => {
    const [searchQuery, setSearchQuery] = useState("");

    const grouped = useMemo(() => {
        const map = new Map<string, ValidationRuleDisplay[]>();
        for (const rule of validations) {
            const key =
                rule.attr != null ? normalizePathForGroup(rule.attr) : `__no_attr_${rule.name}`;
            const list = map.get(key) ?? [];
            list.push(rule);
            map.set(key, list);
        }
        return Array.from(map.entries());
    }, [validations]);

    const filteredGrouped = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return grouped;
        return grouped.filter(([groupKey, rules]) => {
            const first = rules[0];
            const attr = first?.attr ?? "";
            return (
                groupKey.toLowerCase().includes(q) ||
                (attr && String(attr).toLowerCase().includes(q))
            );
        });
    }, [grouped, searchQuery]);

    return (
        <section className="pt-5">
            <div className="flex items-center gap-2 mb-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-sky-600">
                    sync-validations
                </h4>
                <div className="flex-1 h-px bg-sky-100" />
                {grouped.length > 0 && (
                    <span className="text-[10px] font-semibold text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full">
                        {grouped.length}
                    </span>
                )}
            </div>
            <p className="text-slate-500 text-xs leading-relaxed mb-4 bg-sky-50/60 border border-sky-100 rounded-lg px-3 py-2.5">
                {getValidationsIntroMessage()}
            </p>
            {grouped.length > 1 && (
                <div className="mb-4">
                    <input
                        type="search"
                        placeholder="Search by field path (e.g. context, message)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-shadow"
                        aria-label="Search validations by field"
                    />
                    {searchQuery.trim() && (
                        <p className="text-slate-400 text-xs mt-2">
                            {filteredGrouped.length === 0
                                ? "No validations match your search."
                                : `Showing ${filteredGrouped.length} of ${grouped.length} groups`}
                        </p>
                    )}
                </div>
            )}
            <div className="space-y-3">
                {filteredGrouped.length === 0 ? (
                    searchQuery.trim() ? (
                        <p className="text-slate-400 text-sm py-8 text-center rounded-xl bg-slate-50 border border-slate-200">
                            No validations match &quot;{searchQuery.trim()}&quot;.
                        </p>
                    ) : null
                ) : (
                    filteredGrouped.map(([groupKey, rules]) => {
                        const first = rules[0];
                        const attr = first?.attr ?? null;
                        const apiForAttrs = stepApi ?? actionApi;
                        const requiredRaw =
                            attr != null && spec != null && apiForAttrs
                                ? getRequiredForPath(spec, apiForAttrs, attr, useCaseId)
                                : null;
                        const required =
                            requiredRaw === "—" || requiredRaw === "" ? "Optional" : requiredRaw;
                        const messagesRaw = rules.map(
                            (r) => getReadmeMessage(r.name) ?? r.returnMessage
                        );
                        const messages = [...new Set(messagesRaw)];
                        const skipIfList = rules
                            .map((r) => getReadmeSkipIf(r.name))
                            .filter((s): s is string => s != null && s.trim() !== "");
                        const skipIfUnique = [...new Set(skipIfList)];

                        return (
                            <div
                                key={groupKey}
                                className="rounded-xl border border-sky-100 bg-white shadow-sm overflow-hidden"
                            >
                                {/* Card header — field + required */}
                                {attr != null && (
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 bg-sky-50/60 border-b border-sky-100">
                                        <div className="overflow-x-auto flex-1 min-w-0">
                                            <ValueBadge>{attr}</ValueBadge>
                                        </div>
                                        <span
                                            className={`inline-flex shrink-0 items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                                required === "Mandatory"
                                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            }`}
                                        >
                                            {required ?? "Optional"}
                                        </span>
                                    </div>
                                )}
                                {/* Card body */}
                                <div className="px-4 py-3 space-y-3">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-sky-500">
                                            Validation{messages.length > 1 ? "s" : ""}
                                        </span>
                                        <div className="text-sm text-slate-700 leading-relaxed">
                                            {messages.length === 1 ? (
                                                safeDescription(messages[0])
                                            ) : (
                                                <ul className="space-y-1.5 mt-1">
                                                    {messages.map((msg, j) => (
                                                        <li
                                                            key={j}
                                                            className="flex items-start gap-2"
                                                        >
                                                            <span className="text-amber-400 shrink-0 mt-0.5">
                                                                •
                                                            </span>
                                                            <span>{safeDescription(msg)}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                    {skipIfUnique.length > 0 && (
                                        <div className="space-y-1 pt-2 border-t border-sky-50">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-500">
                                                Skip If
                                            </span>
                                            <div className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">
                                                {skipIfUnique.length === 1 ? (
                                                    safeDescription(skipIfUnique[0])
                                                ) : (
                                                    <ul className="space-y-1.5 mt-1">
                                                        {skipIfUnique.map((s, j) => (
                                                            <li
                                                                key={j}
                                                                className="flex items-start gap-2"
                                                            >
                                                                <span className="text-slate-300 shrink-0 mt-0.5">
                                                                    •
                                                                </span>
                                                                <span>{safeDescription(s)}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
};

const AttributesPanel: FC<AttributesPanelProps> = ({
    attributes,
    validations = [],
    spec,
    actionApi,
    stepApi,
    useCaseId,
    isExpanded = false,
}) => {
    if (!attributes) {
        return (
            <div className="h-full flex flex-col rounded-xl border border-sky-100 bg-white overflow-hidden shadow-sm">
                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-400 text-lg">
                        &#x276F;
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-[220px]">
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
                {validations.length > 0 && (
                    <ValidationsSection
                        validations={validations}
                        spec={spec}
                        actionApi={actionApi}
                        stepApi={stepApi}
                        useCaseId={useCaseId}
                    />
                )}
            </div>
        </div>
    );
};

export default AttributesPanel;
