import { useMemo } from "react";
import { queryJsonPath } from "@utils/jsonpath-query";
import { FormService } from "@services/formService";
import { FormFieldConfigType } from "@components/ui/forms/config-form/config-form";

interface FormLaunchPopupProps {
    formConfig: FormFieldConfigType;
    referenceData?: Record<string, unknown>;
    /** Called after the form tab is opened so the parent can dismiss this popup. */
    onLaunched: () => void;
}

/**
 * LAMF single-redirection "launch" popup. Shown when the first on_select
 * completes. It does NOT poll — that is the separate polling popup's job. It only
 * resolves the form URL from the on_select reference data and exposes a single
 * button that, on click:
 *   1. opens the form URL in a new tab, and
 *   2. saves the current workbench URL so the api-service callback can redirect
 *      the user back and resolve the session.
 * Once launched it disappears (parent closes it via onLaunched).
 */
export default function FormLaunchPopup({
    formConfig,
    referenceData,
    onLaunched,
}: FormLaunchPopupProps) {
    // Resolve the form URL from reference data (same mechanism as DYNAMIC_FORM).
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

        // 1. Open the form in a new tab.
        window.open(formUrl, "_blank", "noopener,noreferrer");

        // 2. Capture the current workbench URL and save it for the callback.
        //    Sent verbatim — it already carries subscriberUrl + sessionId params.
        //    Non-fatal: opening the form should not be blocked by this.
        FormService.saveRedirection(window.location.href).catch((saveError) => {
            console.warn("⚠️ [FormLaunch] Could not save redirection URL (continuing):", saveError);
        });

        // 3. Dismiss this popup.
        onLaunched();
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Complete Form</h2>
            <p className="text-gray-600 mb-4">
                Click the button below to open the form in a new tab. Complete it there — this step
                continues automatically once the form is submitted.
            </p>
            <button
                type="button"
                onClick={handleLaunch}
                disabled={!formUrl}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Open Form
            </button>
            {!formUrl && (
                <p className="text-sm text-red-600 mt-3">
                    Form URL is not available yet. Please wait for the on_select response.
                </p>
            )}
        </div>
    );
}
