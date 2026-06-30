import { useMemo } from "react";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/Shadcn/Button/button";
import { FormFieldConfigType } from "@/components/ui/forms/config-form";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { FormService } from "@services/formService";
import { queryJsonPath } from "@utils/jsonpath-query";

interface IFormLaunchPopupProps {
    formConfig: FormFieldConfigType;
    referenceData?: Record<string, unknown>;
    /** transaction id — keys the redirection pointer + clears stale completion. */
    transactionId: string;
    /** Called after the form tab is opened so the parent can dismiss this popup. */
    onLaunched: () => void;
}

/**
 * LAMF single-redirection "launch" popup. Shown when the first on_select
 * completes. It does NOT poll — that is the separate polling popup's job. It only
 * resolves the form URL from the on_select reference data and exposes a single
 * button that, on click:
 *   1. opens the form URL in a new tab, and
 *   2. saves the current workbench URL (keyed by transaction_id) so the
 *      api-service callback can look it up and redirect the user back.
 * Once launched it disappears (parent closes it via onLaunched).
 */
export default function FormLaunchPopup({
    formConfig,
    referenceData,
    transactionId,
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

        // 2. Capture the current workbench URL and save it for the callback.
        //    Sent verbatim — it already carries subscriberUrl + sessionId params.
        //    Non-fatal: opening the form should not be blocked by this.
        FormService.saveRedirection(window.location.href, transactionId).catch((saveError) => {
            console.warn("⚠️ [FormLaunch] Could not save redirection URL (continuing):", saveError);
        });

        // 3. Clear any stale completion for this transaction before the form runs,
        //    so polling only reacts to THIS form's callback. Non-fatal.
        FormService.resetCompletion(transactionId).catch((resetError) => {
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
