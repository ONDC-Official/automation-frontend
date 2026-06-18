import { FC } from "react";
import { useSchemaValidation } from "@pages/schema-validation/hooks/useSchemaValidation";
import SchemaGuideAccordion from "@pages/schema-validation/SchemaGuideAccordion";
import ValidationErrorsPanel from "@pages/schema-validation/ValidationErrorsPanel";
import PayloadEditor from "@/components/PayloadEditor";
import { Button } from "@/components/shadcn/button";

/**
 * Schema validation page with guide accordion and Monaco payload editor.
 */
const SchemaValidation: FC = () => {
    const {
        payload,
        isLoading,
        validationErrors,
        isSuccessResponse,
        isValidationVisible,
        isErrorsExpanded,
        handlePayloadChange,
        verifyRequest,
        handleEditorMount,
        expandValidationErrors,
        collapseValidationErrors,
    } = useSchemaValidation();

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-n-0">
            <div className="max-w-7xl mx-auto px-6 py-6 lg:h-[calc(100vh-4rem)]">
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,2fr)_minmax(0,3fr)] gap-6 lg:h-full">
                    <div className="lg:min-h-0 lg:h-full">
                        <SchemaGuideAccordion />
                    </div>

                    <div className="h-[clamp(380px,55vh,560px)] lg:min-h-0 lg:h-full">
                        <div className="h-full flex flex-col min-w-0">
                            <div className="h-full bg-brand-light border border-n-30 rounded-2xl flex flex-col overflow-hidden min-h-0">
                                <div className="px-6 py-5 border-b border-n-30 flex items-start justify-between gap-4 shrink-0">
                                    <div className="min-w-0">
                                        <h2 className="text-h5 font-bold text-n-800">
                                            JSON Payload
                                        </h2>
                                        <p className="text-body-2 text-brand-normal mt-1">
                                            Paste your JSON payload below for validation
                                        </p>
                                    </div>

                                    <Button
                                        type="button"
                                        onClick={verifyRequest}
                                        disabled={isLoading || payload === ""}
                                        className="shrink-0"
                                    >
                                        {isLoading ? "Validating..." : "Validate"}
                                    </Button>
                                </div>

                                <PayloadEditor
                                    payload={payload}
                                    onPayloadChange={handlePayloadChange}
                                    onEditorMount={handleEditorMount}
                                    isFooterExpanded={
                                        isErrorsExpanded &&
                                        isValidationVisible &&
                                        !isSuccessResponse
                                    }
                                    footer={
                                        <ValidationErrorsPanel
                                            isVisible={isValidationVisible}
                                            isSuccess={isSuccessResponse}
                                            errors={validationErrors}
                                            isExpanded={isErrorsExpanded}
                                            onExpand={expandValidationErrors}
                                            onCollapse={collapseValidationErrors}
                                        />
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchemaValidation;
