import { FC } from "react";
import { FunctionToggleProps } from "@pages/auth-header/code-snippets/types";

const inactiveClass =
    "bg-n-20 text-n-300 hover:bg-n-30 dark:bg-surface-muted dark:text-n-60 dark:hover:bg-surface-elevated";

const FunctionToggle: FC<FunctionToggleProps> = ({ functionType, onFunctionTypeChange }) => (
    <div className="flex flex-wrap gap-2">
        <button
            type="button"
            onClick={() => onFunctionTypeChange("generate")}
            className={`rounded-lg px-4 py-2 font-medium transition-all ${
                functionType === "generate" ? "bg-success-500 text-n-0" : inactiveClass
            }`}
            aria-pressed={functionType === "generate"}
            aria-label="Generate Header function"
        >
            Generate Header
        </button>
        <button
            type="button"
            onClick={() => onFunctionTypeChange("verify")}
            className={`rounded-lg px-4 py-2 font-medium transition-all ${
                functionType === "verify" ? "bg-brand-normal text-n-0" : inactiveClass
            }`}
            aria-pressed={functionType === "verify"}
            aria-label="Verify Header function"
        >
            Verify Header
        </button>
    </div>
);

export default FunctionToggle;
