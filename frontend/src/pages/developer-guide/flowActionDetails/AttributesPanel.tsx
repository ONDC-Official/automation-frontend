import { FC } from "react";
import type { OpenAPISpecification } from "../types";
import type { ActionAttributes, ValidationRuleDisplay } from "./types";
import type { RawTableRow } from "./attributePanelUtils";
import { AttributeSection, EnumSection, TagSection } from "./AttributeSections";
import ValidationsSection from "./ValidationsSection";
import GuideCard from "../shared/components/GuideCard";

interface AttributesPanelProps {
    attributes: ActionAttributes | null;
    /**
     * Leaf rows from raw_table.json for the current action — provided by the
     * parent so this component stays free of direct data-file imports.
     */
    rawTableRows?: RawTableRow[];
    /** Kept for API compatibility; not used internally any more. */
    validations?: ValidationRuleDisplay[];
    spec?: OpenAPISpecification | null;
    actionApi?: string;
    stepApi?: string;
    useCaseId?: string;
    isExpanded?: boolean;
}

const AttributesPanel: FC<AttributesPanelProps> = ({
    attributes,
    rawTableRows = [],
    isExpanded: _isExpanded = false,
}) => {
    if (!attributes) {
        return (
            <GuideCard border="none" rounded="none" layout="column">
                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <div className="w-10 h-10 bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/30 flex items-center justify-center text-sky-400 text-lg">
                        &#x276F;
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed max-w-55">
                        Click a key in the JSON tree to view its schema, attributes, and
                        validations.
                    </p>
                </div>
            </GuideCard>
        );
    }

    return (
        <GuideCard border="none" rounded="none" layout="column">
            <div className="flex-1 overflow-auto p-4 text-sm">
                {attributes.kind === "attribute" && <AttributeSection attrs={attributes} />}
                {attributes.kind === "enum" && <EnumSection attrs={attributes} />}
                {attributes.kind === "tag" && <TagSection attrs={attributes} />}
                <ValidationsSection
                    rawTableRows={rawTableRows}
                    selectedPath={attributes.jsonPath}
                />
            </div>
        </GuideCard>
    );
};

export default AttributesPanel;
