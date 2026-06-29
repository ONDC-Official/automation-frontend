import { useMemo } from "react";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/Shadcn/Button/button";
import { FormFieldConfigType } from "@components/ui/forms/config-form/config-form";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { FormService } from "@services/formService";
import { queryJsonPath } from "@utils/jsonpath-query";

interface IFormLaunchPopupProps {
    formConfig: FormFieldConfigType;
    referenceData?: Record<string, unknown>;
    sessionId: string;
    onLaunched: () => void;
}

export default function FormLaunchPopup({
    formConfig,
    referenceData,
    sessionId,
    onLaunched,
}: IFormLaunchPopupProps) {
    const formUrl = useMemo<string>(() => {
        if (!formConfig?.reference) {
            console.warn("⚠️ [FormLaunch] No reference field found in form config");
            return "";
        }
        try {
            return (
                (queryJsonPath(
                    { reference_data: referenceData },
                    formConfig.reference
                )[0] as string) || ""
            );
        } catch (error) {
            console.error("❌ [FormLaunch] Error extracting form URL from reference:", error);
            return "";
        }
    }, [formConfig, referenceData]);

    const handleLaunch = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!formUrl) {
            console.warn("⚠️ [FormLaunch] Cannot open form: URL missing");
            return;
        }

        window.open(formUrl, "_blank", "noopener,noreferrer");

        FormService.saveRedirection(window.location.href).catch((saveError) => {
            console.warn("⚠️ [FormLaunch] Could not save redirection URL (continuing):", saveError);
        });

        FormService.resetCompletion(sessionId).catch((resetError) => {
            console.warn("⚠️ [FormLaunch] Could not reset completion (continuing):", resetError);
        });

        onLaunched();
    };

    return (
        <FormDialogShell
            footer={
                <Button type="button" className="gap-2" onClick={handleLaunch} disabled={!formUrl}>
                    <ArrowTopRightOnSquareIcon className="size-5" />
                    Open Form
                </Button>
            }
        >
            <p className="text-sm text-muted-foreground">
                Click the button below to open the form in a new tab. Complete it there — this step
                continues automatically once the form is submitted.
            </p>
            {!formUrl && (
                <p className="text-sm text-destructive">
                    Form URL is not available yet. Please wait for the on_select response.
                </p>
            )}
        </FormDialogShell>
    );
}
