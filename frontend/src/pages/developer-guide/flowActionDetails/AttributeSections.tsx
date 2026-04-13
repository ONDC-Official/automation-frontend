import { FC, useState, type ReactNode } from "react";
import { safeDescription } from "./attributePanelUtils";
import type { AttributeDetails, EnumDetails, TagDetails, TagField, TagFieldItem } from "./types";

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

export const SectionHeader: FC<{ children: ReactNode }> = ({ children }) => (
    <div className="flex items-center gap-2 mb-3">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-sky-600">{children}</h4>
        <div className="flex-1 h-px bg-sky-100" />
    </div>
);

export const LabelBadge: FC<{ children: ReactNode }> = ({ children }) => (
    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0">
        {children}
    </span>
);

export const ValueBadge: FC<{ children: ReactNode }> = ({ children }) => (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-sky-50 text-sky-800 font-mono text-[11px] break-all border border-sky-200 shadow-sm">
        {children}
    </span>
);

// ─── Tag helpers ──────────────────────────────────────────────────────────────

function countNestedItems(list: TagFieldItem[]): number {
    return list.reduce((acc, item) => {
        const sub = item.list ? countNestedItems(item.list) : 0;
        return acc + 1 + sub;
    }, 0);
}

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

// ─── Attribute / Enum / Tag sections ─────────────────────────────────────────

export const AttributeSection: FC<{ attrs: AttributeDetails }> = ({ attrs }) => (
    <div className="space-y-5">
        <section>
            <SectionHeader>Details</SectionHeader>
            <div className="rounded-xl border border-sky-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-sky-100 flex flex-col gap-1.5">
                    <LabelBadge>JSON Path</LabelBadge>
                    <div className="overflow-x-auto">
                        <ValueBadge>{attrs.jsonPath}</ValueBadge>
                    </div>
                </div>
                <div className="grid grid-cols-3 divide-x divide-sky-100 bg-white">
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

export const EnumSection: FC<{ attrs: EnumDetails }> = ({ attrs }) => (
    <div className="space-y-5">
        <section>
            <SectionHeader>Details</SectionHeader>
            <div className="rounded-xl border border-sky-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-sky-100 bg-sky-50/60 flex flex-col gap-1.5">
                    <LabelBadge>JSON Path</LabelBadge>
                    <div className="overflow-x-auto">
                        <ValueBadge>{attrs.jsonPath}</ValueBadge>
                    </div>
                </div>
                <div className="grid grid-cols-3 divide-x divide-sky-100 bg-white">
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

export const TagSection: FC<{ attrs: TagDetails }> = ({ attrs }) => {
    const description = attrs._description?.info ?? attrs.attributeInfo?.description;
    const tagFields = attrs.tagFields ?? [];

    return (
        <div className="space-y-5">
            <section>
                <SectionHeader>Details</SectionHeader>
                <div className="rounded-xl border border-sky-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-sky-100 bg-sky-50/60 flex flex-col gap-1.5">
                        <LabelBadge>JSON Path</LabelBadge>
                        <div className="overflow-x-auto">
                            <ValueBadge>{attrs.jsonPath}</ValueBadge>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-sky-100 bg-white">
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
