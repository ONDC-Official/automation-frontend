import { FC, useState, useMemo, isValidElement, type ReactNode } from "react";
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
    /** Owner from the step (not from attribute). */
    stepOwner?: string;
    /** Validation rules from x-validations for the selected path. */
    validations?: ValidationRuleDisplay[];
    spec?: OpenAPISpecification | null;
    actionApi?: string;
    useCaseId?: string;
    isExpanded?: boolean;
}

const LabelBadge: FC<{ children: ReactNode }> = ({ children }) => (
    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 shrink-0">
        {children}
    </span>
);

const ValueBadge: FC<{ children: ReactNode }> = ({ children }) => (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono text-xs break-all border border-slate-200/60">
        {children}
    </span>
);

const AttrRow: FC<{ label: string; value: ReactNode }> = ({ label, value }) => (
    <div className="flex flex-col gap-1.5 py-3 border-b border-slate-100 last:border-0">
        <LabelBadge>{label}</LabelBadge>
        <div className="text-sm text-slate-700 break-words min-w-0 leading-relaxed">
            {typeof value === "object" &&
            value !== null &&
            !Array.isArray(value) &&
            !isValidElement(value)
                ? String(value)
                : value}
        </div>
    </div>
);

const AttributeSection: FC<{
    attrs: AttributeDetails;
    stepOwner?: string;
    isExpanded?: boolean;
}> = ({ attrs, stepOwner, isExpanded = false }) => {
    return (
        <div className="space-y-6">
            <section>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                    Details
                </h4>
                <div
                    className={`rounded-xl bg-slate-50/80 border border-slate-200 p-4 ${isExpanded ? "grid grid-cols-2 gap-x-4 gap-y-0" : "space-y-0"}`}
                >
                    <AttrRow label="JSON path" value={<ValueBadge>{attrs.jsonPath}</ValueBadge>} />
                    <AttrRow label="Required" value={formatRequired(attrs.required)} />
                    <AttrRow label="Owner" value={stepOwner ?? attrs.owner ?? "—"} />
                    <AttrRow label="Type" value={attrs.type} />
                </div>
            </section>
            <section>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                    Description
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap rounded-xl bg-slate-50/80 border border-slate-200 p-4">
                    {safeDescription(attrs._description?.info ?? attrs.description)}
                </p>
            </section>
            {attrs.enumRefs && attrs.enumRefs.length > 0 && (
                <section>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                        Enum references
                    </h4>
                    <ul className="space-y-2 text-sm rounded-xl bg-slate-50/80 border border-slate-200 p-4">
                        {attrs.enumRefs.map((ref, i) => (
                            <li key={i}>
                                <a
                                    href={ref.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sky-600 hover:text-sky-700 hover:underline break-all"
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

const EnumSection: FC<{ attrs: EnumDetails; stepOwner?: string; isExpanded?: boolean }> = ({
    attrs,
    stepOwner,
    isExpanded = false,
}) => (
    <div className="space-y-6">
        <section>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                Details
            </h4>
            <div
                className={`rounded-xl bg-slate-50/80 border border-slate-200 p-4 ${isExpanded ? "grid grid-cols-2 gap-x-4 gap-y-0" : "space-y-0"}`}
            >
                <AttrRow label="JSON path" value={<ValueBadge>{attrs.jsonPath}</ValueBadge>} />
                <AttrRow label="Required" value={formatRequired(attrs.required)} />
                <AttrRow label="Owner" value={stepOwner ?? attrs.owner ?? "—"} />
                <AttrRow label="Type" value={attrs.type ?? "—"} />
            </div>
        </section>
        {attrs.description != null && attrs.description !== "—" && (
            <section>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                    Description
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap rounded-xl bg-slate-50/80 border border-slate-200 p-4">
                    {safeDescription(attrs.description)}
                </p>
            </section>
        )}
        {attrs.enumRefs && attrs.enumRefs.length > 0 && (
            <section>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                    Enum references
                </h4>
                <ul className="space-y-2 text-sm rounded-xl bg-slate-50/80 border border-slate-200 p-4">
                    {attrs.enumRefs.map((ref, i) => (
                        <li key={i}>
                            <a
                                href={ref.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-600 hover:text-sky-700 hover:underline break-all"
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
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                    Possible values
                </h4>
                <ul className="space-y-2.5 rounded-xl bg-slate-50/80 border border-slate-200 p-4">
                    {attrs.enumOptions.map((o, i) => (
                        <li key={i} className="flex gap-1">
                            <ValueBadge>{o.code}</ValueBadge>
                            {o.description !== "—" && (
                                <span className="text-xs text-gray-600 pl-0.5">
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
            className="border-l-2 border-slate-200 pl-3 py-2 min-w-0"
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
                            className="text-gray-400 text-xs shrink-0 transition-transform mt-0.5"
                            aria-hidden
                        >
                            {expanded ? "▾" : "▸"}
                        </span>
                    )}
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className="font-mono text-xs font-medium text-slate-800">
                            {item.code}
                        </span>
                        {item.description !== "—" && (
                            <span className="text-xs text-gray-600 leading-snug">
                                {safeDescription(item.description)}
                            </span>
                        )}
                    </div>
                </div>
                {hasList && (
                    <span className="text-[11px] text-gray-400 shrink-0 tabular-nums">
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
    const [expanded, setExpanded] = useState(false); // Start collapsed
    const hasList = field.list && field.list.length > 0;
    const nestedCount = hasList ? countNestedItems(field.list!) : 0;

    return (
        <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
            <button
                type="button"
                onClick={() => hasList && setExpanded((e) => !e)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors ${hasList ? "hover:bg-gray-50 cursor-pointer" : "cursor-default"}`}
            >
                <span className="flex items-center gap-2 min-w-0">
                    {hasList && (
                        <span
                            className="text-gray-400 text-xs shrink-0 transition-transform"
                            aria-hidden
                        >
                            {expanded ? "▾" : "▸"}
                        </span>
                    )}
                    <span className="font-mono text-sm font-medium text-slate-800 truncate">
                        {field.label}
                    </span>
                    {field.description !== "—" && !hasList && (
                        <span className="text-xs text-gray-500 truncate">
                            {safeDescription(field.description)}
                        </span>
                    )}
                </span>
                {hasList && (
                    <span className="text-[11px] text-gray-400 shrink-0 tabular-nums">
                        {nestedCount} item{nestedCount !== 1 ? "s" : ""}
                    </span>
                )}
            </button>
            {hasList && expanded && (
                <div className="px-3 pb-3 pt-0 border-t border-gray-100 bg-gray-50/60">
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

const TagSection: FC<{ attrs: TagDetails; stepOwner?: string; isExpanded?: boolean }> = ({
    attrs,
    stepOwner,
    isExpanded = false,
}) => {
    const description = attrs._description?.info ?? attrs.attributeInfo?.description;
    const tagFields = attrs.tagFields ?? [];

    return (
        <div className="space-y-6">
            <section>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                    Details
                </h4>
                <div
                    className={`rounded-xl bg-slate-50/80 border border-slate-200 p-4 ${isExpanded ? "grid grid-cols-2 gap-x-4 gap-y-0" : "space-y-0"}`}
                >
                    <AttrRow label="JSON path" value={<ValueBadge>{attrs.jsonPath}</ValueBadge>} />
                    <AttrRow
                        label="Required"
                        value={formatRequired(attrs.attributeInfo?.required)}
                    />
                    <AttrRow label="Owner" value={stepOwner ?? attrs.attributeInfo?.owner ?? "—"} />
                    <AttrRow label="Type" value={attrs.attributeInfo?.type ?? "—"} />
                </div>
            </section>
            {description != null && description !== "—" && (
                <section>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                        Description
                    </h4>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap rounded-xl bg-slate-50/80 border border-slate-200 p-4">
                        {safeDescription(description)}
                    </p>
                </section>
            )}
            {tagFields.length > 0 && (
                <section>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                        Tag groups
                    </h4>
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
    useCaseId?: string;
}> = ({ validations, spec, actionApi, useCaseId }) => {
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
        <section className="pt-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                X-Validations
            </h4>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
                {getValidationsIntroMessage()}
            </p>
            {grouped.length > 1 && (
                <div className="mb-4">
                    <input
                        type="search"
                        placeholder="Search by field path (e.g. context, message)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                        aria-label="Search validations by field"
                    />
                    {searchQuery.trim() && (
                        <p className="text-slate-600 text-xs mt-2">
                            {filteredGrouped.length === 0
                                ? "No validations match your search."
                                : `${filteredGrouped.length} of ${grouped.length} validation${grouped.length === 1 ? "" : "s"}`}
                        </p>
                    )}
                </div>
            )}
            <div className="space-y-3">
                {filteredGrouped.length === 0 ? (
                    searchQuery.trim() ? (
                        <p className="text-slate-500 text-sm py-6 text-center rounded-xl bg-slate-50 border border-slate-200">
                            No validations match &quot;{searchQuery.trim()}&quot;. Try a different
                            field path.
                        </p>
                    ) : null
                ) : (
                    filteredGrouped.map(([groupKey, rules]) => {
                        const first = rules[0];
                        const attr = first?.attr ?? null;
                        const requiredRaw =
                            attr != null && spec != null && actionApi
                                ? getRequiredForPath(spec, actionApi, attr, useCaseId)
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
                                className="rounded-xl border border-amber-200/90 bg-amber-50/60 p-4 text-sm shadow-sm"
                            >
                                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-xs">
                                    {attr != null && (
                                        <>
                                            <dt className="text-slate-600 shrink-0 font-medium">
                                                Field
                                            </dt>
                                            <dd className="min-w-0">
                                                <ValueBadge>{attr}</ValueBadge>
                                            </dd>
                                        </>
                                    )}
                                    {attr != null && (
                                        <>
                                            <dt className="text-slate-600 shrink-0 font-medium">
                                                Required
                                            </dt>
                                            <dd className="min-w-0">
                                                <span
                                                    className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium ${
                                                        required === "Mandatory"
                                                            ? "bg-amber-100 text-amber-800 border border-amber-200/60"
                                                            : required === "Optional"
                                                              ? "bg-slate-100 text-slate-600 border border-slate-200/60"
                                                              : "bg-slate-100 text-slate-500 border border-slate-200/60"
                                                    }`}
                                                >
                                                    {required ?? "Optional"}
                                                </span>
                                            </dd>
                                        </>
                                    )}
                                    <dt className="text-slate-600 shrink-0 font-medium">
                                        Validation{messages.length > 1 ? "s" : ""}
                                    </dt>
                                    <dd className="text-slate-700 leading-relaxed space-y-1.5">
                                        {messages.length === 1 ? (
                                            safeDescription(messages[0])
                                        ) : (
                                            <ul className="list-disc list-inside space-y-1">
                                                {messages.map((msg, j) => (
                                                    <li key={j}>{safeDescription(msg)}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </dd>
                                    {skipIfUnique.length > 0 && (
                                        <>
                                            <dt className="text-slate-600 shrink-0 font-medium">
                                                Skip if
                                            </dt>
                                            <dd className="text-slate-600 leading-relaxed whitespace-pre-wrap space-y-1">
                                                {skipIfUnique.length === 1 ? (
                                                    safeDescription(skipIfUnique[0])
                                                ) : (
                                                    <ul className="list-disc list-inside space-y-1">
                                                        {skipIfUnique.map((s, j) => (
                                                            <li key={j}>{safeDescription(s)}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </dd>
                                        </>
                                    )}
                                </dl>
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
    stepOwner,
    validations = [],
    spec,
    actionApi,
    useCaseId,
    isExpanded = false,
}) => {
    if (!attributes) {
        return (
            <div className="h-full flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70">
                    <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Attribute & validations
                    </h3>
                </div>
                <div className="flex-1 p-6 flex items-center justify-center text-slate-500 text-sm text-center leading-relaxed">
                    Click a key in the JSON tree to view its schema, attributes, and validations
                    here.
                </div>
            </div>
        );
    }

    const title =
        attributes.kind === "attribute"
            ? "Attribute"
            : attributes.kind === "enum"
              ? "ENUM"
              : "Tags";

    return (
        <div className="h-full flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70">
                <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {title}
                </h3>
            </div>
            <div className="flex-1 overflow-auto p-4 text-sm">
                {attributes.kind === "attribute" && (
                    <AttributeSection
                        attrs={attributes}
                        stepOwner={stepOwner}
                        isExpanded={isExpanded}
                    />
                )}
                {attributes.kind === "enum" && (
                    <EnumSection attrs={attributes} stepOwner={stepOwner} isExpanded={isExpanded} />
                )}
                {attributes.kind === "tag" && (
                    <TagSection attrs={attributes} stepOwner={stepOwner} isExpanded={isExpanded} />
                )}
                {validations.length > 0 && (
                    <ValidationsSection
                        validations={validations}
                        spec={spec}
                        actionApi={actionApi}
                        useCaseId={useCaseId}
                    />
                )}
            </div>
        </div>
    );
};

export default AttributesPanel;
