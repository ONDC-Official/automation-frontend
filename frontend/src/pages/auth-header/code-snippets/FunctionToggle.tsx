import { FC } from "react";
import { FunctionToggleProps } from "@pages/auth-header/code-snippets/types";

const FunctionToggle: FC<FunctionToggleProps> = ({ functionType, onFunctionTypeChange }) => (
    <div className="flex gap-2">
        <button
            onClick={() => onFunctionTypeChange("generate")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                functionType === "generate"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            aria-pressed={functionType === "generate"}
            aria-label="Generate Header function"
        >
            Generate Header
        </button>
        <button
            onClick={() => onFunctionTypeChange("verify")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                functionType === "verify"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            aria-pressed={functionType === "verify"}
            aria-label="Verify Header function"
        >
            Verify Header
        </button>
    </div>
);

export default FunctionToggle;
