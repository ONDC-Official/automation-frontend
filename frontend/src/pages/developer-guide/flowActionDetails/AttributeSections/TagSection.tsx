import { FC } from "react";
import { safeDescription, hasDescription } from "../attributePanelUtils";
import type { TagDetails } from "../types";
import { SectionHeader, DetailsCard } from "./atoms";
import { TagGroupItem } from "./tagHelpers";

export const TagSection: FC<{ attrs: TagDetails }> = ({ attrs }) => {
    const description = attrs._description?.info ?? attrs.attributeInfo?.description;
    const tagFields = attrs.tagFields ?? [];

    return (
        <div className="space-y-5">
            <section>
                <SectionHeader>Details</SectionHeader>
                <DetailsCard
                    jsonPath={attrs.jsonPath}
                    owner={attrs.attributeInfo?.owner}
                    type={attrs.attributeInfo?.type}
                    headerShaded
                />
            </section>
            {hasDescription(description) && (
                <section>
                    <SectionHeader>Description</SectionHeader>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap rounded-xl bg-white dark:bg-surface-elevated border border-slate-200 shadow-xs p-4">
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

export default TagSection;
