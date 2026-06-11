import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import { SubmitEventParams } from "../../../../types/flow-types";
import jsonpath from "jsonpath";
import { FormFieldConfigType } from "../config-form/config-form";

// ── Polling constants ──────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 2_000; // 2 seconds between each poll
const MAX_POLL_DURATION_MS = 600_000; // 10 minutes total timeout
const MAX_POLLS = MAX_POLL_DURATION_MS / POLL_INTERVAL_MS; // = 300 polls
// ──────────────────────────────────────────────────────────────────────────────

interface ManualDynamicFormHandlerProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    referenceData?: Record<string, unknown>;
    sessionId: string;
    transactionId: string;
    formConfig?: FormFieldConfigType;
}

/**
 * MANUAL_DYNAMIC_FORM step handler (currently only the LAMF single_redirection
 * flow). Unlike DynamicFormHandler it never opens the form itself: the buyer
 * copies the form URL and opens it manually in a new tab. Polling for the
 * completion callback starts automatically on mount, and the flow proceeds
 * once the form's final step fires the callback.
 */
export default function ManualDynamicFormHandler({
    submitEvent,
    referenceData,
    transactionId,
    formConfig,
}: ManualDynamicFormHandlerProps) {
    const [status, setStatus] = useState<"waiting" | "completed" | "error" | "timeout">("waiting");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [copied, setCopied] = useState<boolean>(false);

    // pollDisplay is only for rendering — source of truth is pollCountRef
    const [pollDisplay, setPollDisplay] = useState<number>(0);

    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isPollingRef = useRef<boolean>(false);
    const hasCompletedRef = useRef<boolean>(false);
    const pollCountRef = useRef<number>(0);

    // Extract form URL from reference data (same way as DynamicFormHandler)
    const formServiceUrl = useMemo<string>(() => {
        if (!formConfig || !formConfig.reference) {
            console.warn("⚠️ [ManualDynamicForm] No reference field found in form config");
            return "";
        }
        try {
            const url =
                jsonpath.query({ reference_data: referenceData }, formConfig.reference)[0] || "";
            return url as string;
        } catch (error) {
            console.error("❌ [ManualDynamicForm] Error extracting form URL:", error);
            return "";
        }
    }, [formConfig, referenceData]);

    const cleanup = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
        isPollingRef.current = false;
    }, []);

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    // Polls GET /form/check-completion?transaction_id=X — the backend resolves
    // which form completed via the latest_form:{txn} Redis pointer.
    const checkCompletion = useCallback(async () => {
        if (hasCompletedRef.current) return;
        if (!transactionId) return;

        pollCountRef.current += 1;
        setPollDisplay(pollCountRef.current);

        if (pollCountRef.current > MAX_POLLS) {
            cleanup();
            setStatus("timeout");
            return;
        }

        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/form/check-completion`,
                {
                    params: { transaction_id: transactionId },
                    timeout: 5000,
                }
            );

            const { completed, success, form_id } = response.data ?? {};

            // success is a boolean from the new api-service; tolerate the legacy
            // string form from older callback writers.
            if (
                completed === true &&
                (success === true || success === "true") &&
                !hasCompletedRef.current
            ) {
                console.warn("✅ [ManualDynamicForm] Form completed!", {
                    transactionId,
                    form_id,
                    poll: pollCountRef.current,
                });
                hasCompletedRef.current = true;
                cleanup();

                // Proceed the flow — temporary submission_id satisfies the mock
                // service's json_path_changes requirement; form_id is passed
                // through for the mock's saveData config.
                try {
                    const submission_id = crypto.randomUUID();
                    await submitEvent({
                        jsonPath: { submission_id },
                        formData: { submission_id, ...(form_id ? { form_id } : {}) },
                    });
                    setStatus("completed");
                } catch (error) {
                    console.error("❌ [ManualDynamicForm] Error submitting event:", error);
                    setErrorMessage("Form complete but failed to proceed. Please try again.");
                    setStatus("error");
                }
            }
        } catch (error: unknown) {
            // Network blips are expected during polling; keep retrying until MAX_POLLS.
            const err = error as { message?: string };
            console.error("[ManualDynamicForm] Error checking completion:", err.message);
        }
    }, [transactionId, submitEvent, cleanup]);

    const checkCompletionRef = useRef(checkCompletion);
    useEffect(() => {
        checkCompletionRef.current = checkCompletion;
    }, [checkCompletion]);

    const startPolling = useCallback(async () => {
        if (isPollingRef.current || !transactionId) return;
        isPollingRef.current = true;
        pollCountRef.current = 0;
        setPollDisplay(0);
        setStatus("waiting");

        // Clear any leftover completion from a previous form in this transaction
        // so polling only reacts to THIS form's callback. Non-fatal on failure.
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/form/reset-completion`, null, {
                params: { transaction_id: transactionId },
                timeout: 5000,
            });
        } catch (resetError) {
            console.warn(
                "⚠️ [ManualDynamicForm] Could not reset completion state (continuing):",
                resetError
            );
        }

        checkCompletionRef.current();
        pollingIntervalRef.current = setInterval(() => {
            checkCompletionRef.current();
        }, POLL_INTERVAL_MS);
    }, [transactionId]);

    // Polling starts automatically — there is no open button in this UX.
    useEffect(() => {
        startPolling();
    }, [transactionId]);

    const handleCopy = useCallback(async () => {
        if (!formServiceUrl) return;
        try {
            await navigator.clipboard.writeText(formServiceUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error("Could not copy URL:", e);
        }
    }, [formServiceUrl]);

    const handleResume = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            cleanup();
            hasCompletedRef.current = false;
            setErrorMessage("");
            startPolling();
        },
        [cleanup, startPolling]
    );

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Complete Verification Form</h2>

            {(status === "waiting" || status === "timeout" || status === "error") && (
                <div>
                    <p className="text-gray-600 mb-3">
                        Copy the link below and open it in a <strong>new tab</strong> to complete
                        the verification journey. This page will detect completion automatically.
                    </p>
                    {formServiceUrl ? (
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                readOnly
                                value={formServiceUrl}
                                onFocus={(e) => e.target.select()}
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50"
                            />
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap"
                            >
                                {copied ? "Copied!" : "Copy URL"}
                            </button>
                        </div>
                    ) : (
                        <p className="text-red-600 text-sm mb-4">
                            Form URL not found in reference data. Make sure the previous step
                            completed successfully.
                        </p>
                    )}
                </div>
            )}

            {status === "waiting" && (
                <div className="text-center border-t pt-4">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                    <p className="text-gray-600 text-sm">Waiting for form completion…</p>
                    <p className="text-xs text-gray-400 mt-1">
                        Poll #{pollDisplay} of {MAX_POLLS} — this page will not refresh.
                    </p>
                </div>
            )}

            {status === "completed" && (
                <div className="text-center text-green-600">
                    <div className="text-5xl mb-4">✓</div>
                    <h3 className="text-lg font-medium mb-2">Verification Completed!</h3>
                    <p className="text-gray-600">Proceeding to next step…</p>
                </div>
            )}

            {status === "timeout" && (
                <div className="text-center border-t pt-4">
                    <div className="text-yellow-500 text-4xl mb-2">⏱</div>
                    <p className="text-gray-600 mb-3">
                        We waited {MAX_POLL_DURATION_MS / 60000} minutes without detecting
                        completion. You can keep waiting if you are still filling the form.
                    </p>
                    <button
                        type="button"
                        onClick={handleResume}
                        className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Resume Waiting
                    </button>
                </div>
            )}

            {status === "error" && (
                <div className="text-center border-t pt-4">
                    <div className="text-red-600 text-4xl mb-2">✕</div>
                    <p className="text-gray-600 mb-3">{errorMessage}</p>
                    <button
                        type="button"
                        onClick={handleResume}
                        className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}
