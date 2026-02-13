import { FC, useState, isValidElement, type ReactNode } from "react";
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

interface AttributesPanelProps {
    attributes: ActionAttributes | null;
    /** Owner from the step (not from attribute). */
    stepOwner?: string;
    /** Validation rules from x-validations for the selected path. */
    validations?: ValidationRuleDisplay[];
}

const LabelBadge: FC<{ children: ReactNode }> = ({ children }) => (
    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 shrink-0">
        {children}
    </span>
);

const ValueBadge: FC<{ children: ReactNode }> = ({ children }) => (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs break-all">
        {children}
    </span>
);

const AttrRow: FC<{ label: string; value: ReactNode }> = ({ label, value }) => (
    <div className="flex flex-col gap-1 py-2.5 border-b border-gray-100 last:border-0">
        <LabelBadge>{label}</LabelBadge>
        <div className="text-sm text-gray-900 break-words min-w-0">
            {typeof value === "object" &&
            value !== null &&
            !Array.isArray(value) &&
            !isValidElement(value)
                ? String(value)
                : value}
        </div>
    </div>
);

const AttributeSection: FC<{ attrs: AttributeDetails; stepOwner?: string }> = ({
    attrs,
    stepOwner,
}) => {
    return (
        <div className="space-y-5">
            <section>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Details
                </h4>
                <div className="rounded-lg bg-gray-50/80 border border-gray-100 p-3 space-y-0">
                    <AttrRow label="JSON path" value={<ValueBadge>{attrs.jsonPath}</ValueBadge>} />
                    <AttrRow label="Required" value={attrs.required} />
                    <AttrRow label="Owner" value={stepOwner ?? attrs.owner ?? "—"} />
                    <AttrRow label="Type" value={attrs.type} />
                </div>
            </section>
            <section>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Description
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap rounded-lg bg-gray-50/80 border border-gray-100 p-3">
                    {safeDescription(attrs._description?.info ?? attrs.description)}
                </p>
            </section>
            {attrs.enumRefs && attrs.enumRefs.length > 0 && (
                <section>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                        Enum references
                    </h4>
                    <ul className="space-y-1.5 text-sm rounded-lg bg-gray-50/80 border border-gray-100 p-3">
                        {attrs.enumRefs.map((ref, i) => (
                            <li key={i}>
                                <a
                                    href={ref.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sky-600 hover:underline break-all"
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

const EnumSection: FC<{ attrs: EnumDetails; stepOwner?: string }> = ({ attrs, stepOwner }) => (
    <div className="space-y-5">
        <section>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Details
            </h4>
            <div className="rounded-lg bg-gray-50/80 border border-gray-100 p-3 space-y-0">
                <AttrRow label="JSON path" value={<ValueBadge>{attrs.jsonPath}</ValueBadge>} />
                <AttrRow label="Required" value={attrs.required ?? "—"} />
                <AttrRow label="Owner" value={stepOwner ?? attrs.owner ?? "—"} />
                <AttrRow label="Type" value={attrs.type ?? "—"} />
            </div>
        </section>
        {attrs.description != null && attrs.description !== "—" && (
            <section>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Description
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap rounded-lg bg-gray-50/80 border border-gray-100 p-3">
                    {safeDescription(attrs.description)}
                </p>
            </section>
        )}
        {attrs.enumRefs && attrs.enumRefs.length > 0 && (
            <section>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Enum references
                </h4>
                <ul className="space-y-1.5 text-sm rounded-lg bg-gray-50/80 border border-gray-100 p-3">
                    {attrs.enumRefs.map((ref, i) => (
                        <li key={i}>
                            <a
                                href={ref.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-600 hover:underline break-all"
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
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Possible values
                </h4>
                <ul className="space-y-3 rounded-lg bg-gray-50/80 border border-gray-100 p-3">
                    {attrs.enumOptions.map((o, i) => (
                        <li key={i} className="flex flex-col gap-1">
                            <ValueBadge>{o.code}</ValueBadge>
                            {o.description !== "—" && (
                                <span className="text-sm text-gray-600 pl-0.5">
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
    const hasList = item.list && item.list.length > 0;

    return (
        <div
            className="border-l-2 border-slate-200 pl-3 py-2 min-w-0"
            style={{ marginLeft: depth * 20 }}
        >
            <div className="flex flex-col gap-0.5">
                <span className="font-mono text-xs font-medium text-slate-800">{item.code}</span>
                {item.description !== "—" && (
                    <span className="text-xs text-gray-600 leading-snug">
                        {safeDescription(item.description)}
                    </span>
                )}
            </div>
            {hasList && (
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

const TagSection: FC<{ attrs: TagDetails; stepOwner?: string }> = ({ attrs, stepOwner }) => {
    const description = attrs._description?.info ?? attrs.attributeInfo?.description;
    const tagFields = attrs.tagFields ?? [];

    return (
        <div className="space-y-5">
            <section>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Details
                </h4>
                <div className="rounded-lg bg-gray-50/80 border border-gray-100 p-3 space-y-0">
                    <AttrRow label="JSON path" value={<ValueBadge>{attrs.jsonPath}</ValueBadge>} />
                    <AttrRow label="Required" value={attrs.attributeInfo?.required ?? "—"} />
                    <AttrRow label="Owner" value={stepOwner ?? attrs.attributeInfo?.owner ?? "—"} />
                    <AttrRow label="Type" value={attrs.attributeInfo?.type ?? "—"} />
                </div>
            </section>
            {description != null && description !== "—" && (
                <section>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                        Description
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap rounded-lg bg-gray-50/80 border border-gray-100 p-3">
                        {safeDescription(description)}
                    </p>
                </section>
            )}
            {tagFields.length > 0 && (
                <section>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
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

const ValidationsSection: FC<{ validations: ValidationRuleDisplay[] }> = ({ validations }) => (
    <section className="pt-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            X-Validations
        </h4>
        <div className="space-y-2">
            {validations.map((rule, i) => (
                <div
                    key={i}
                    className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-3 text-sm space-y-2"
                >
                    <div className="font-semibold text-amber-900 text-xs uppercase tracking-wide">
                        {rule.name}
                    </div>
                    <p className="text-amber-900/90 text-xs leading-relaxed">
                        {rule.returnMessage}
                    </p>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs">
                        {rule.attr != null && (
                            <>
                                <dt className="text-amber-700 shrink-0">attr</dt>
                                <dd>
                                    <ValueBadge>{rule.attr}</ValueBadge>
                                </dd>
                            </>
                        )}
                        {rule.reg != null && rule.reg.length > 0 && (
                            <>
                                <dt className="text-amber-700 shrink-0">reg</dt>
                                <dd className="flex flex-wrap gap-1">
                                    {rule.reg.map((r, j) => (
                                        <ValueBadge key={j}>{r}</ValueBadge>
                                    ))}
                                </dd>
                            </>
                        )}
                        {rule.valid != null && rule.valid.length > 0 && (
                            <>
                                <dt className="text-amber-700 shrink-0">valid</dt>
                                <dd className="flex flex-wrap gap-1">
                                    {rule.valid.slice(0, 5).map((v, j) => (
                                        <ValueBadge key={j}>{v}</ValueBadge>
                                    ))}
                                    {rule.valid.length > 5 && (
                                        <span className="text-amber-600">
                                            +{rule.valid.length - 5}
                                        </span>
                                    )}
                                </dd>
                            </>
                        )}
                        {rule.domain != null && rule.domain.length > 0 && (
                            <>
                                <dt className="text-amber-700 shrink-0">domain</dt>
                                <dd className="flex flex-wrap gap-1">
                                    {rule.domain.map((d, j) => (
                                        <ValueBadge key={j}>{d}</ValueBadge>
                                    ))}
                                </dd>
                            </>
                        )}
                        {rule.version != null && rule.version.length > 0 && (
                            <>
                                <dt className="text-amber-700 shrink-0">version</dt>
                                <dd className="flex flex-wrap gap-1">
                                    {rule.version.map((v, j) => (
                                        <ValueBadge key={j}>{v}</ValueBadge>
                                    ))}
                                </dd>
                            </>
                        )}
                        {rule.continue != null && (
                            <>
                                <dt className="text-amber-700 shrink-0">_CONTINUE_</dt>
                                <dd className="text-amber-800">{rule.continue}</dd>
                            </>
                        )}
                    </dl>
                </div>
            ))}
        </div>
    </section>
);

const AttributesPanel: FC<AttributesPanelProps> = ({ attributes, stepOwner, validations = [] }) => {
    if (!attributes) {
        return (
            <div className="h-full flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-shadow duration-200">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                    <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Attributes
                    </h3>
                </div>
                <div className="flex-1 p-5 flex items-center justify-center text-slate-500 text-sm text-center">
                    Click a key in the JSON tree to view its schema and validations.
                </div>
            </div>
        );
    }

    const title =
        attributes.kind === "attribute"
            ? "Attributes"
            : attributes.kind === "enum"
              ? "ENUM"
              : "Tags";

    return (
        <div className="h-full flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {title}
                </h3>
            </div>
            <div className="flex-1 overflow-auto p-4 text-sm">
                {attributes.kind === "attribute" && (
                    <AttributeSection attrs={attributes} stepOwner={stepOwner} />
                )}
                {attributes.kind === "enum" && (
                    <EnumSection attrs={attributes} stepOwner={stepOwner} />
                )}
                {attributes.kind === "tag" && (
                    <TagSection attrs={attributes} stepOwner={stepOwner} />
                )}
                {validations.length > 0 && <ValidationsSection validations={validations} />}
            </div>
        </div>
    );
};

export default AttributesPanel;
