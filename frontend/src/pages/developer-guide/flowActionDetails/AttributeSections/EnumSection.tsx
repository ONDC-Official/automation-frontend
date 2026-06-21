import { FC } from "react";
import { safeDescription, hasDescription } from "../attributePanelUtils";
import type { EnumDetails } from "../types";
import { SectionHeader, ValueBadge, DetailsCard } from "./atoms";

export const EnumSection: FC<{ attrs: EnumDetails }> = ({ attrs }) => (
    <div className="space-y-5">
        <section>
            <SectionHeader>Details</SectionHeader>
            <DetailsCard
                jsonPath={attrs.jsonPath}
                owner={attrs.owner}
                type={attrs.type}
                headerShaded
            />
        </section>
        {hasDescription(attrs.description) && (
            <section>
                <SectionHeader>Description</SectionHeader>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap rounded-xl bg-white dark:bg-surface-elevated border border-slate-200 shadow-xs p-4">
                    {safeDescription(attrs.description)}
                </p>
            </section>
        )}
        {attrs.enumrefs && attrs.enumrefs.length > 0 && (
            <section>
                <SectionHeader>Enum References</SectionHeader>
                <ul className="space-y-2 text-sm rounded-xl bg-white dark:bg-surface-elevated border border-slate-200 shadow-xs p-4">
                    {attrs.enumrefs.map((ref, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                            <span className="text-sky-300 mt-0.5">↗</span>
                            <a
                                href={ref.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 hover:underline underline-offset-2 break-all font-medium"
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
                <ul className="rounded-xl bg-white dark:bg-surface-elevated border border-sky-100 dark:border-sky-500/30 shadow-xs divide-y divide-sky-50 dark:divide-sky-500/20">
                    {attrs.enumOptions.map((o, i) => (
                        <li key={i} className="flex items-start gap-3 px-4 py-2.5">
                            <ValueBadge>{o.code}</ValueBadge>
                            {hasDescription(o.description) && (
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

export default EnumSection;
