import { FC } from "react";
import { Check, X } from "lucide-react";
import type { IValidationErrorsPanelProps } from "@/components/PayloadEditor/types";
import { Button } from "@/components/Shadcn/Button/button";
import { ErrorItem } from "@/components/PayloadEditor/ErrorItem";
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";

/**
 * Panel below the JSON editor showing validation success or errors.
 */
const ValidationErrorsPanel: FC<IValidationErrorsPanelProps> = ({
    isVisible,
    isSuccess,
    errors,
    isExpanded,
    onExpand,
    onCollapse,
}) => {
    if (!isVisible) {
        return null;
    }

    if (isSuccess) {
        return (
            <div className="border-t border-n-30 bg-n-0 px-6 py-4 shrink-0">
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-success-500 text-n-0">
                        <Check className="h-4 w-4" />
                    </span>
                    <p className="text-body-2 font-semibold text-n-800">
                        Schema is valid: Schema validations passed!
                    </p>
                </div>
            </div>
        );
    }

    const previewError = errors[0];

    return (
        <div
            className={`border-t-2 flex flex-col overflow-hidden w-full h-full bg-red-50 ${
                isExpanded ? "flex-1 min-h-0 border-none" : "shrink-0 max-h-[220px] border-red-400"
            }`}
        >
            <div
                className={`px-6 py-3 flex items-center justify-between gap-4 shrink-0 bg-red-50 ${
                    isExpanded ? "border-b border-red-500" : ""
                }`}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-error-500 shrink-0" />
                    <p className="text-body-2 font-bold text-error-500 truncate">
                        Validation errors found
                    </p>
                </div>

                {isExpanded ? (
                    <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={onCollapse}
                        className="rounded-full bg-brand-light text-brand-normal hover:bg-brand-light-hover shrink-0"
                        aria-label="Collapse validation errors"
                    >
                        <X className="h-5 w-5" strokeWidth={3} />
                    </Button>
                ) : (
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onExpand}
                        className="shrink-0"
                    >
                        View All
                    </Button>
                )}
            </div>

            <div className="px-6 overflow-y-auto custom-scrollbar bg-red-50 flex-1 min-h-0">
                {isExpanded ? (
                    errors.map((error, index) => (
                        <ErrorItem key={`${error.code}-${error.path}-${index}`} error={error} />
                    ))
                ) : previewError ? (
                    <ErrorItem error={previewError} />
                ) : (
                    <p className="py-4 text-body-2 text-n-300">No error details available.</p>
                )}
            </div>
        </div>
    );
};

export default ValidationErrorsPanel;
