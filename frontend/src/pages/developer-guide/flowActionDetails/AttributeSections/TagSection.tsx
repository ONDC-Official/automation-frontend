import { FC } from "react";
import { safeDescription, hasDescription } from "../attributePanelUtils";
import type { TagDetails } from "../types";
import { SectionHeader, DetailsList } from "./atoms";
import { TagGroupItem } from "./tagHelpers";

export const TagSection: FC<{ attrs: TagDetails }> = ({ attrs }) => {
    const description = attrs._description?.info ?? attrs.attributeInfo?.description;
    const tagFields = attrs.tagFields ?? [];

    return (
        <div className="space-y-5">
            <DetailsList
                jsonPath={attrs.jsonPath}
                required={attrs.attributeInfo?.required}
                usage={attrs.attributeInfo?.usage}
                owner={attrs.attributeInfo?.owner}
                type={attrs.attributeInfo?.type}
            />
            {hasDescription(description) && (
                <section>
                    <SectionHeader>Description</SectionHeader>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
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
