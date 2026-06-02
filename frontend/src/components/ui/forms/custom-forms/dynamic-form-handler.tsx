import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import { SubmitEventParams } from "../../../../types/flow-types";

import jsonpath from "jsonpath";
import { FormFieldConfigType } from "../config-form/config-form";

// ── Polling constants ──────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 1_000; // 1 second between each poll
const MAX_POLL_DURATION_MS = 120_000; // 2 minutes total timeout
const MAX_POLLS = MAX_POLL_DURATION_MS / POLL_INTERVAL_MS; // = 120 polls
// ──────────────────────────────────────────────────────────────────────────────

interface DynamicFormHandlerProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    referenceData?: Record<string, unknown>;
    sessionId: string;
    transactionId: string;
    formConfig?: FormFieldConfigType;
}

export default function DynamicFormHandler({
    submitEvent,
    referenceData,
    transactionId,
    formConfig,
}: DynamicFormHandlerProps) {
    const [status, setStatus] = useState<"idle" | "waiting" | "completed" | "error" | "timeout">(
        "idle"
    );
    const [formUrl, setFormUrl] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");

    // pollDisplay is only for rendering — source of truth is pollCountRef
    const [pollDisplay, setPollDisplay] = useState<number>(0);

    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Use refs to prevent page refresh
    const formWindowRef = useRef<Window | null>(null);
    const isPollingRef = useRef<boolean>(false);
    const hasCompletedRef = useRef<boolean>(false);

    // Tracks actual poll count synchronously (avoids stale-closure issues with state)
    const pollCountRef = useRef<number>(0);

    // Tracks when polling started (for elapsed-time logging)
    const pollStartTimeRef = useRef<number>(0);

    // Extract form URL from reference data (same way as HTML_FORM)
    const formServiceUrl = useMemo<string>(() => {
        if (!formConfig || !formConfig.reference) {
            console.warn("⚠️ No reference field found in form config");
            return "";
        }

        try {
            const url =
                jsonpath.query({ reference_data: referenceData }, formConfig.reference)[0] || "";

            return url as string;
        } catch (error) {
            console.error("❌ Error extracting form URL from reference:", error);
            return "";
        }
    }, [formConfig, referenceData]);

    // Resolve the form_id to use when polling /form/check-completion.
    //
    // Priority:
    //   ① referenceData.form_id — the canonical xinput.form.id saved by the mock
    //      service's saveData config (e.g. "$.message...xinput.form.id").
    //      This is the value the form-service uses as the Redis key suffix.
    //   ② URL-path last segment — legacy fallback for flows where form_id is not
    //      yet saved in reference_data (e.g. path: /forms/FIS13/Ekyc_details_form
    //      → "Ekyc_details_form").
    const formName = useMemo<string>(() => {
        // ① Best: use xinput.form.id saved directly in reference_data by mock saveData
        const directFormId = referenceData?.form_id as string | undefined;
        if (directFormId?.trim()) {
            console.warn(
                "🎯 [DynamicForm] Using xinput form_id from reference_data:",
                directFormId
            );
            return directFormId.trim();
        }

        // ② Fallback: derive form name from URL path
        if (!formServiceUrl) return "";
        try {
            const urlObj = new URL(formServiceUrl);
            const pathParts = urlObj.pathname.split("/").filter(Boolean);
            // Path is like: /forms/FIS13/Ekyc_details_form
            // So formName is the last part
            if (pathParts.length >= 3) {
                const extractedFormName = pathParts[pathParts.length - 1];
                console.warn(
                    "⚠️ [DynamicForm] form_id not in reference_data — falling back to URL-path:",
                    extractedFormName
                );
                return extractedFormName;
            }
        } catch (error) {
            console.error("❌ Error extracting form name from URL:", error);
        }

        return "";
    }, [referenceData, formServiceUrl]);

    // Cleanup function - prevents memory leaks and ensures no refresh
    const cleanup = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
        isPollingRef.current = false;
        localStorage.removeItem("dynamic_form_flow_active");
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    // Check completion function - polls GET /form/check-completion?transaction_id=X&form_id=Y
    // This is ONLY used by DYNAMIC_FORM type — does not affect HTML_FORM or any other form type.
    const checkCompletion = useCallback(async () => {
        if (hasCompletedRef.current) return;

        // ── Guard 1: identifiers ─────────────────────────────────────────────
        if (!transactionId || !formName) {
            console.warn("⚠️ [DynamicForm] Cannot poll: transactionId or formName missing", {
                transactionId,
                formName,
            });
            return;
        }

        // ── Guard 2: max poll / timeout ──────────────────────────────────────
        pollCountRef.current += 1;
        setPollDisplay(pollCountRef.current); // trigger UI re-render

        if (pollCountRef.current > MAX_POLLS) {
            console.warn(
                `⏱️ [DynamicForm] Polling timed out after ${MAX_POLL_DURATION_MS / 1000}s ` +
                    `(${MAX_POLLS} polls)`
            );
            cleanup();
            setStatus("timeout");
            return;
        }

        // ── Elapsed time log ─────────────────────────────────────────────────
        const elapsedSec = ((Date.now() - pollStartTimeRef.current) / 1000).toFixed(1);
        console.warn(
            `🔄 [DynamicForm] Poll #${pollCountRef.current}/${MAX_POLLS} | ` +
                `elapsed: ${elapsedSec}s | ` +
                `transactionId: "${transactionId}" | form_id: "${formName}"`
        );

        try {
            // ── New API: purpose-built completion check ───────────────────────
            // GET /form/check-completion?transaction_id={transactionId}&form_id={formName}
            // Backend reads Redis key: form_completed:{transactionId}:{formName}
            // Expected response: { completed: boolean, success: "true"|"false", message: string, timestamp: string }
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/form/check-completion`,
                {
                    params: {
                        transaction_id: transactionId,
                        form_id: formName, // BUG FIX: was missing — backend needs both to resolve Redis key
                    },
                    timeout: 5000,
                }
            );
            // ─────────────────────────────────────────────────────────────────

            const { completed, success } = response.data ?? {};

            if (completed === true && success === "true" && !hasCompletedRef.current) {
                console.warn("✅ [DynamicForm] Form completed!", {
                    transactionId,
                    formName,
                    poll: pollCountRef.current,
                    elapsedSec,
                    message: response.data.message,
                    timestamp: response.data.timestamp,
                });

                hasCompletedRef.current = true;

                // Stop polling immediately
                cleanup();

                // Close form tab if still open
                if (formWindowRef.current && !formWindowRef.current.closed) {
                    try {
                        formWindowRef.current.close();
                    } catch (e) {
                        console.error("Could not close form window:", e);
                    }
                }

                // Proceed the flow — generate a temporary submission_id to satisfy
                // the mock service's json_path_changes requirement.
                // TODO: replace with actual submission_id from /form/check-completion
                // once the backend returns it from the Redis form_completed key.
                try {
                    const submission_id = crypto.randomUUID();
                    console.warn("⚠️ [DynamicForm] Using temporary submission_id:", submission_id);
                    await submitEvent({
                        jsonPath: { submission_id },
                        formData: { submission_id },
                    });
                    setStatus("completed"); // BUG FIX: was never set — "completed" UI was dead code
                    // Parent (mapped-flow) will close the popup modal after submitEvent
                } catch (error) {
                    console.error("❌ [DynamicForm] Error submitting event:", error);
                    setErrorMessage("Form complete but failed to proceed. Please try again.");
                    setStatus("error");
                }
            }
        } catch (error: unknown) {
            // NOTE: do NOT set "error" status here — network blips are expected during
            // polling; we keep retrying until MAX_POLLS is reached.
            const err = error as { message?: string };
            console.error("Error checking completion:", err.message);
        }
    }, [transactionId, formName, submitEvent, cleanup]);
    // NOTE: pollCountRef & pollDisplay are intentionally NOT in deps — they are refs/
    // updated imperatively. This prevents checkCompletion from being recreated on
    // every tick, which was the root cause of the stale-closure bug.

    // Keep a ref to the latest checkCompletion so setInterval always calls the
    // most up-to-date closure (anti-stale-closure pattern for intervals).
    const checkCompletionRef = useRef(checkCompletion);
    useEffect(() => {
        checkCompletionRef.current = checkCompletion;
    }, [checkCompletion]);

    // Start polling function
    const startPolling = useCallback(() => {
        if (isPollingRef.current) {
            return;
        }

        isPollingRef.current = true;
        pollCountRef.current = 0; // reset counter
        setPollDisplay(0); // reset display
        pollStartTimeRef.current = Date.now(); // mark start time

        // Log identifiers so they are visible in the console when polling starts
        console.warn("🔄 [DynamicForm] Starting polling:");
        console.warn(`   ➤ interval      : ${POLL_INTERVAL_MS}ms`);
        console.warn(`   ➤ max duration  : ${MAX_POLL_DURATION_MS / 1000}s (${MAX_POLLS} polls)`);
        console.warn("   ➤ transactionId :", transactionId || "(empty — check flowMap)");
        console.warn("   ➤ form_id       :", formName || "(empty — check formServiceUrl path)");
        console.warn(
            "   ➤ endpoint      :",
            `${import.meta.env.VITE_BACKEND_URL}/form/check-completion`
        );

        // Poll immediately first time
        checkCompletion();

        // Then poll every POLL_INTERVAL_MS using ref to avoid stale closure
        pollingIntervalRef.current = setInterval(() => {
            checkCompletionRef.current();
        }, POLL_INTERVAL_MS);
    }, [transactionId, formName, checkCompletion]);

    // Handle start form - NO navigation/refresh
    const handleOpenForm = useCallback(
        async (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            // CRITICAL: Open window IMMEDIATELY to preserve user gesture (before async calls)
            // Otherwise popup blockers will prevent window.open after await
            const formWindow = window.open("about:blank", "_blank", "width=1200,height=800");

            if (!formWindow) {
                setStatus("error");
                setErrorMessage("Could not open form window. Please allow popups for this site.");
                return;
            }

            formWindowRef.current = formWindow;

            // Show loading message in the popup while we fetch the URL
            try {
                formWindow.document.open();
                formWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Loading Form...</title>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0;
                background: #f3f4f6;
              }
              .loader { 
                text-align: center; 
              }
              .spinner {
                border: 4px solid #e5e7eb;
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 16px;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="loader">
              <div class="spinner"></div>
              <p>Loading your form...</p>
              <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">Please wait...</p>
            </div>
          </body>
        </html>
      `);
                formWindow.document.close();
            } catch (writeError) {
                console.warn("Could not write loading content to popup:", writeError);
                // Continue anyway - the navigation will still work
            }

            try {
                setStatus("waiting");
                setErrorMessage("");
                setPollDisplay(0);

                // Mark flow as active in localStorage (prevents accidental navigation)
                localStorage.setItem("dynamic_form_flow_active", "true");

                if (!transactionId) {
                    throw new Error("Transaction ID is missing! Cannot create form URL.");
                }

                if (!formServiceUrl) {
                    throw new Error(
                        "Form service URL is missing in reference_data! Make sure the form URL is generated in the mock service."
                    );
                }

                // Navigate directly to the URL from reference_data — it IS the final destination.
                // The mock service is responsible for storing the correct URL in the session.
                setFormUrl(formServiceUrl);

                if (formWindow && !formWindow.closed) {
                    formWindow.location.href = formServiceUrl;
                    startPolling();
                } else {
                    throw new Error("Form window was closed before navigation");
                }
            } catch (error: unknown) {
                console.error("Error opening form:", error);
                setStatus("error");
                const err = error as {
                    message?: string;
                    response?: { data?: { message?: string } };
                };
                setErrorMessage(
                    err.response?.data?.message || err.message || "Failed to open form"
                );

                // Close the popup if we failed to get the URL
                if (formWindow && !formWindow.closed) {
                    try {
                        formWindow.close();
                    } catch (e) {
                        console.error("Could not close form window:", e);
                    }
                }

                cleanup();
            }
        },
        [transactionId, formServiceUrl, startPolling, cleanup]
    );

    // Handle reopen - NO navigation
    const handleReopenForm = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            if (formUrl) {
                const formWindow = window.open(
                    formUrl,
                    "_blank",
                    "noopener,noreferrer,width=1200,height=800"
                );
                formWindowRef.current = formWindow;
            }
        },
        [formUrl]
    );

    // Handle retry - NO navigation
    const handleRetry = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            cleanup();
            setStatus("idle");
            setErrorMessage("");
            setPollDisplay(0);
            pollCountRef.current = 0;
            pollStartTimeRef.current = 0;
            hasCompletedRef.current = false;
        },
        [cleanup]
    );

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Complete Form</h2>

            {status === "idle" && (
                <div>
                    <p className="text-gray-600 mb-4">
                        Click the button below to open and complete the required form. A new tab
                        will open where you can fill out the form.
                    </p>
                    <button
                        type="button"
                        onClick={handleOpenForm}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Open Form
                    </button>
                </div>
            )}

            {status === "waiting" && (
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <h3 className="text-lg font-medium mb-2">Waiting for Form Submission</h3>
                    <p className="text-gray-600 mb-4">
                        Please complete and submit the form in the tab that was opened.
                    </p>
                    <p className="text-sm text-gray-500 mb-1">
                        Poll #{pollDisplay} of {MAX_POLLS}
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                        Time remaining: ~{Math.max(0, MAX_POLLS - pollDisplay)}s &nbsp;|&nbsp; This
                        page will NOT refresh.
                    </p>
                    <button
                        type="button"
                        onClick={handleReopenForm}
                        className="text-blue-600 hover:text-blue-800 underline focus:outline-none"
                    >
                        Reopen Form Tab
                    </button>
                </div>
            )}

            {status === "completed" && (
                <div className="text-center text-green-600">
                    <div className="text-5xl mb-4">✓</div>
                    <h3 className="text-lg font-medium mb-2">Form Submitted Successfully!</h3>
                    <p className="text-gray-600">Proceeding to next step...</p>
                </div>
            )}

            {status === "timeout" && (
                <div className="text-center">
                    <div className="text-yellow-500 text-5xl mb-4">⏱</div>
                    <h3 className="text-lg font-medium text-yellow-600 mb-2">
                        Form Submission Timed Out
                    </h3>
                    <p className="text-gray-600 mb-2">
                        We waited {MAX_POLL_DURATION_MS / 1000} seconds but the form was not
                        completed.
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                        If you submitted the form, please try again. Otherwise, check your
                        connection.
                    </p>
                    <button
                        type="button"
                        onClick={handleRetry}
                        className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {status === "error" && (
                <div className="text-center">
                    <div className="text-red-600 text-5xl mb-4">✕</div>
                    <h3 className="text-lg font-medium text-red-600 mb-2">Error</h3>
                    <p className="text-gray-600 mb-4">{errorMessage}</p>
                    <button
                        type="button"
                        onClick={handleRetry}
                        className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}
