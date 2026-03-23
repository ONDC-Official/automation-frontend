import { FC } from "react";
import type { OpenAPISpecification } from "../types";
import type { ActionAttributes, ValidationRuleDisplay } from "./types";
import type { RawTableRow } from "./attributePanelUtils";
import { AttributeSection, EnumSection, TagSection } from "./AttributeSections";
import ValidationsSection from "./ValidationsSection";

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
            <div className="h-full flex flex-col rounded-xl border border-sky-100 bg-white overflow-hidden shadow-sm">
                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-400 text-lg">
                        &#x276F;
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed max-w-[220px]">
                        Click a key in the JSON tree to view its schema, attributes, and
                        validations.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col rounded-xl border border-sky-100 bg-white overflow-hidden shadow-sm">
            <div className="flex-1 overflow-auto p-4 text-sm">
                {attributes.kind === "attribute" && <AttributeSection attrs={attributes} />}
                {attributes.kind === "enum" && <EnumSection attrs={attributes} />}
                {attributes.kind === "tag" && <TagSection attrs={attributes} />}
                <ValidationsSection
                    rawTableRows={rawTableRows}
                    selectedPath={attributes.jsonPath}
                />
            </div>
        </div>
    );
};

export default AttributesPanel;
