/**
 * Instructions Panel Component
 *
 * Displays step-by-step instructions for using the schema validation tool
 */

import { FC } from "react";
import { INSTRUCTIONS } from "@pages/schema-validation/constants";
import type { InstructionsPanelProps } from "@pages/schema-validation/types";

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
    <div className="bg-white border border-sky-100 shadow-sm flex flex-col overflow-hidden animate-fadeIn">
      <div className="bg-gradient-to-r from-sky-50 to-sky-100/50 px-6 py-4 border-b border-sky-100 flex-shrink-0">
        <h3 className="text-lg font-bold text-gray-900">How to Use</h3>
      </div>
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          {INSTRUCTIONS.map((item: string, index: number) => (
            <div
              key={index}
              className="flex items-start space-x-3 transform transition-all duration-300 hover:translate-x-1">
              <div className="w-7 h-7 bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300 hover:scale-110">
                <span className="text-sky-700 text-sm font-bold">{index + 1}</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InstructionsPanel;
