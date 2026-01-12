import { FC } from "react";
import { useSchemaValidation } from "@pages/schema-validation/hooks/useSchemaValidation";
import InstructionsPanel from "@pages/schema-validation/InstructionsPanel";
import ValidationResults from "@pages/schema-validation/ValidationResults";
import EmptyState from "@components/EmptyState";
import PayloadEditor from "@components/PayloadEditor";
import { schemaValidationStyles } from "@pages/schema-validation/styles";

const SchemaValidation: FC = () => {
  const {
    payload,
    isLoading,
    mdData,
    isSuccessResponse,
    isValidationOpen,
    isGuideOpen,
    handlePayloadChange,
    verifyRequest,
    handleEditorMount,
  } = useSchemaValidation();

  return (
    <div className="h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        <PayloadEditor
          payload={payload}
          isLoading={isLoading}
          onPayloadChange={handlePayloadChange}
          onEditorMount={handleEditorMount}
          onValidate={verifyRequest}
          title="Beckn JSON Payload"
          message="Paste your JSON payload below for validation"
        />

        {/* Right Panel - Instructions & Results */}
        <div className="w-2/5 flex flex-col p-6 space-y-4 overflow-hidden min-w-0">
          <InstructionsPanel isVisible={isGuideOpen && !isValidationOpen} />
          <ValidationResults isVisible={isValidationOpen} isSuccess={isSuccessResponse} markdownData={mdData} />
          {!isGuideOpen && !isValidationOpen && (
            <EmptyState
              title="Ready to Validate"
              message="Enter your JSON payload and click validate to see results here."
            />
          )}
        </div>
      </div>

      <style>{schemaValidationStyles}</style>
    </div>
  );
};

export default SchemaValidation;
