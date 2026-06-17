/** Payload Editor Component **/
import { cn } from "@/lib/utils";
import { IPayloadEditorProps } from "@/components/PayloadEditor/types";
import { CodeEditor } from "@/components/PayloadEditor/CodeEditor";
import ValidationErrorsPanel from "@/components/PayloadEditor/ValidationErrorsPanel";

const PayloadEditor = ({
    payload,
    onPayloadChange,
    onEditorMount,
    validationErrors,
    isValidationVisible,
    isSuccessResponse,
    isErrorsExpanded,
    onExpandValidationErrors,
    onCollapseValidationErrors,
}: IPayloadEditorProps) => {
    const isValidationPanelExpanded = isErrorsExpanded && isValidationVisible && !isSuccessResponse;

    return (
        <div
            className={cn(
                "flex min-h-0 flex-1 flex-col overflow-hidden",
                isValidationPanelExpanded && "bg-red-50 dark:bg-error-500/10"
            )}
        >
            <div
                className={cn(
                    "relative flex flex-col overflow-hidden transition-all duration-300 ease-out",
                    isValidationPanelExpanded
                        ? "pointer-events-none max-h-0 min-h-0 flex-none opacity-0"
                        : "h-full min-h-0 flex-1"
                )}
            >
                <CodeEditor
                    value={payload}
                    onChange={onPayloadChange}
                    onMount={onEditorMount}
                    className="h-full w-full"
                    options={{ renderValidationDecorations: "on" }}
                />
            </div>

            <div
                className={cn(
                    isValidationPanelExpanded
                        ? "flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-red-50 dark:bg-error-500/10"
                        : "shrink-0"
                )}
            >
                <ValidationErrorsPanel
                    isVisible={isValidationVisible}
                    isSuccess={isSuccessResponse}
                    errors={validationErrors}
                    isExpanded={isErrorsExpanded}
                    onExpand={onExpandValidationErrors}
                    onCollapse={onCollapseValidationErrors}
                />
            </div>
        </div>
    );
};

export default PayloadEditor;
export { CodeEditor } from "@/components/PayloadEditor/CodeEditor";
