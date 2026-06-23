import { FC } from "react";
import type { OpenAPISpecification } from "../types";
import type { ActionAttributes, ValidationRuleDisplay } from "./types";
import type { RawTableRow } from "./attributePanelUtils";
import { AttributeSection, EnumSection, TagSection } from "./AttributeSections";
import ValidationsSection from "./ValidationsSection";
import GuideCard from "../shared/components/GuideCard";
import { EmptyState } from "../shared/components/states";
import { IconAttribute } from "../shared/icons";

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
                <div className="flex-1 flex items-start justify-center">
                    <EmptyState
                        message="Select a key in the JSON tree to view its attributes."
                        icon={IconAttribute}
                    />
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
