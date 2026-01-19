/**
 * Instructions Panel Component
 *
 * Displays step-by-step instructions for using the schema validation tool
 */

import { FC } from "react";
import type { InstructionsPanelProps } from "@pages/schema-validation/types";
import { SchemaGuide } from "@/components/FlowShared/schema-guide";

/**
 * InstructionsPanel component that displays usage instructions
 *
 * @param props - Component props
 * @returns JSX element or null if not visible
 */
const InstructionsPanel: FC<InstructionsPanelProps> = ({ isVisible }) => {
    if (!isVisible) {
        return null;
    }

    return (
        <div className="bg-white border border-sky-100 shadow-sm flex flex-col overflow-hidden animate-fadeIn min-w-0">
            <SchemaGuide />
        </div>
    );
};

export default InstructionsPanel;
