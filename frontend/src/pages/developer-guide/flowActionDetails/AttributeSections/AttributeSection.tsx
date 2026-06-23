import { FC } from "react";
import { safeDescription } from "../attributePanelUtils";
import type { AttributeDetails } from "../types";
import { SectionHeader, DetailsList } from "./atoms";

export const AttributeSection: FC<{ attrs: AttributeDetails }> = ({ attrs }) => (
    <div className="space-y-5">
        <DetailsList
            jsonPath={attrs.jsonPath}
            required={attrs.required}
            usage={attrs.usage}
            owner={attrs.owner}
            type={attrs.type}
        />
        <section>
            <SectionHeader>Description</SectionHeader>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {safeDescription(attrs._description?.info ?? attrs.description)}
            </p>
        </section>
        {attrs.enumrefs && attrs.enumrefs.length > 0 && (
            <section>
                <SectionHeader>Enum References</SectionHeader>
                <ul className="space-y-1.5 text-sm">
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
    </div>
);

export default AttributeSection;
