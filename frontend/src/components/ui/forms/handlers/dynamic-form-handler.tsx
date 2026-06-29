import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
    ArrowPathIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/Shadcn/Button/button";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { SubmitEventParams } from "@/types/flow-types";
import { queryJsonPath } from "@utils/jsonpath-query";
import { FormFieldConfigType } from "@components/ui/forms/config-form/config-form";
import { FormService } from "@services/formService";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 2_000;
const MAX_POLL_DURATION_MS = 600_000;
const MAX_POLLS = MAX_POLL_DURATION_MS / POLL_INTERVAL_MS;

interface DynamicFormHandlerProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    referenceData?: Record<string, unknown>;
    transactionId: string;
    formConfig?: FormFieldConfigType;
}

export default function DynamicFormHandler({
    submitEvent,
    referenceData,
    transactionId,
    formConfig,
}: DynamicFormHandlerProps) {
    // The form completion contract is keyed by transaction_id (the api-service GET
    // /callback writes form_completed:{transaction_id}).

    const [status, setStatus] = useState<"idle" | "waiting" | "completed" | "error" | "timeout">(
        "idle"
    );
    const [formUrl, setFormUrl] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [pollDisplay, setPollDisplay] = useState<number>(0);

    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const formWindowRef = useRef<Window | null>(null);
    const isPollingRef = useRef<boolean>(false);
    const hasCompletedRef = useRef<boolean>(false);
    const pollCountRef = useRef<number>(0);
    const pollStartTimeRef = useRef<number>(0);

    const formServiceUrl = useMemo<string>(() => {
        if (!formConfig || !formConfig.reference) {
            console.warn("⚠️ No reference field found in form config");
            return "";
        }

        try {
            const url =
                queryJsonPath({ reference_data: referenceData }, formConfig.reference)[0] || "";
            return url as string;
        } catch (error) {
            console.error("❌ Error extracting form URL from reference:", error);
            return "";
        }
    }, [formConfig, referenceData]);

    const cleanup = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
        isPollingRef.current = false;
        localStorage.removeItem("dynamic_form_flow_active");
    }, []);

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    // Check completion function - polls GET /form/check-completion?transaction_id=X
    // The backend reads form_completed:{transaction_id} (written by the api-service
    // GET /callback) and reports whether the form finished.
    // This is ONLY used by DYNAMIC_FORM type — does not affect HTML_FORM or any other form type.
    const checkCompletion = useCallback(async () => {
        if (hasCompletedRef.current) return;

        // ── Guard 1: identifiers ─────────────────────────────────────────────
        if (!transactionId) {
            console.warn("⚠️ [DynamicForm] Cannot poll: transactionId missing", {
                transactionId,
            });
            return;
        }

        pollCountRef.current += 1;
        setPollDisplay(pollCountRef.current);

        if (pollCountRef.current > MAX_POLLS) {
            console.warn(
                `⏱️ [DynamicForm] Polling timed out after ${MAX_POLL_DURATION_MS / 1000}s ` +
                    `(${MAX_POLLS} polls)`
            );
            cleanup();
            setStatus("timeout");
            return;
        }

        const elapsedSec = ((Date.now() - pollStartTimeRef.current) / 1000).toFixed(1);
        console.warn(
            `🔄 [DynamicForm] Poll #${pollCountRef.current}/${MAX_POLLS} | ` +
                `elapsed: ${elapsedSec}s | ` +
                `transactionId: "${transactionId}"`
        );

        try {
            // GET /form/check-completion?transaction_id={transactionId}
            // Backend reads form_completed:{transaction_id}.
            // Response: { completed: boolean, success: boolean, message: string, timestamp: string }
            const data = await FormService.checkCompletion(transactionId);

            const { completed, success } = data ?? {};

            if (completed === true && success === true && !hasCompletedRef.current) {
                console.warn("✅ [DynamicForm] Form completed!", {
                    transactionId,
                    poll: pollCountRef.current,
                    elapsedSec,
                    message: data.message,
                    timestamp: data.timestamp,
                });

                hasCompletedRef.current = true;
                cleanup();

                if (formWindowRef.current && !formWindowRef.current.closed) {
                    try {
                        formWindowRef.current.close();
                    } catch (e) {
                        console.error("Could not close form window:", e);
                    }
                }

                try {
                    const submission_id = crypto.randomUUID();
                    console.warn("⚠️ [DynamicForm] Using temporary submission_id:", submission_id);
                    await submitEvent({
                        jsonPath: { submission_id },
                        formData: { submission_id },
                    });
                    setStatus("completed");
                } catch (error) {
                    console.error("❌ [DynamicForm] Error submitting event:", error);
                    setErrorMessage("Form complete but failed to proceed. Please try again.");
                    setStatus("error");
                }
            }
        } catch (error: unknown) {
            const err = error as { message?: string };
            console.error("Error checking completion:", err.message);
        }
    }, [transactionId, submitEvent, cleanup]);
    // NOTE: pollCountRef & pollDisplay are intentionally NOT in deps — they are refs/
    // updated imperatively. This prevents checkCompletion from being recreated on
    // every tick, which was the root cause of the stale-closure bug.

    const checkCompletionRef = useRef(checkCompletion);
    useEffect(() => {
        checkCompletionRef.current = checkCompletion;
    }, [checkCompletion]);

    const startPolling = useCallback(() => {
        if (isPollingRef.current) {
            return;
        }

        isPollingRef.current = true;
        pollCountRef.current = 0;
        setPollDisplay(0);
        pollStartTimeRef.current = Date.now();

        console.warn("🔄 [DynamicForm] Starting polling:");
        console.warn(`   ➤ interval      : ${POLL_INTERVAL_MS}ms`);
        console.warn(`   ➤ max duration  : ${MAX_POLL_DURATION_MS / 1000}s (${MAX_POLLS} polls)`);
        console.warn("   ➤ transactionId     :", transactionId || "(empty — check session)");

        checkCompletion();

        pollingIntervalRef.current = setInterval(() => {
            checkCompletionRef.current();
        }, POLL_INTERVAL_MS);
    }, [transactionId, checkCompletion]);

    const handleOpenForm = useCallback(
        async (event: React.MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();

            const formWindow = window.open("about:blank", "_blank", "width=1200,height=800");

            if (!formWindow) {
                setStatus("error");
                setErrorMessage("Could not open form window. Please allow popups for this site.");
                return;
            }

            formWindowRef.current = formWindow;

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
            }

            try {
                setStatus("waiting");
                setErrorMessage("");
                setPollDisplay(0);

                localStorage.setItem("dynamic_form_flow_active", "true");

                if (!transactionId) {
                    throw new Error("Session ID is missing! Cannot track form completion.");
                }

                if (!formServiceUrl) {
                    throw new Error(
                        "Form service URL is missing in reference_data! Make sure the form URL is generated in the mock service."
                    );
                }

                // Store the current workbench URL (keyed by transaction_id) so the
                // api-service callback can look it up and redirect the user back here.
                // Non-fatal: completion polling still runs if this hiccups.
                try {
                    await FormService.saveRedirection(window.location.href, transactionId);
                } catch (saveError) {
                    console.warn(
                        "⚠️ [DynamicForm] Could not save redirection URL (continuing):",
                        saveError
                    );
                }

                try {
                    await FormService.resetCompletion(transactionId);
                } catch (resetError) {
                    console.warn(
                        "⚠️ [DynamicForm] Could not reset completion state (continuing):",
                        resetError
                    );
                }

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

    const handleReopenForm = useCallback(
        (event: React.MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();

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

    const handleRetry = useCallback(
        (event: React.MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();

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

    const footer =
        status === "idle" ? (
            <Button type="button" onClick={handleOpenForm}>
                Open Form
            </Button>
        ) : status === "timeout" || status === "error" ? (
            <Button type="button" onClick={handleRetry}>
                Try Again
            </Button>
        ) : null;

    return (
        <FormDialogShell footer={footer}>
            <h2 className="text-lg font-semibold text-text-primary">Complete Form</h2>

            {status === "idle" && (
                <p className="text-sm text-text-secondary">
                    Click the button below to open and complete the required form. A new tab will
                    open where you can fill out the form.
                </p>
            )}

            {status === "waiting" && (
                <div className="space-y-4 text-center">
                    <ArrowPathIcon
                        className="mx-auto size-12 animate-spin text-brand-normal"
                        aria-hidden
                    />
                    <div>
                        <h3 className="text-base font-medium text-text-primary">
                            Waiting for Form Submission
                        </h3>
                        <p className="mt-2 text-sm text-text-secondary">
                            Please complete and submit the form in the tab that was opened.
                        </p>
                    </div>
                    <p className="text-sm text-text-secondary">
                        Poll #{pollDisplay} of {MAX_POLLS}
                    </p>
                    <p className="text-xs text-text-secondary">
                        Time remaining: ~
                        {Math.max(0, ((MAX_POLLS - pollDisplay) * POLL_INTERVAL_MS) / 1000)}s
                        &nbsp;|&nbsp; This page will NOT refresh.
                    </p>
                    <Button type="button" variant="link" onClick={handleReopenForm}>
                        Reopen Form Tab
                    </Button>
                </div>
            )}

            {status === "completed" && (
                <div className="space-y-3 text-center">
                    <CheckCircleIcon className="mx-auto size-12 text-success-600" aria-hidden />
                    <h3 className="text-base font-medium text-text-primary">
                        Form Submitted Successfully!
                    </h3>
                    <p className="text-sm text-text-secondary">Proceeding to next step...</p>
                </div>
            )}

            {status === "timeout" && (
                <div className="space-y-3 text-center">
                    <ClockIcon className="mx-auto size-10 text-warning-600" aria-hidden />
                    <h3 className="text-base font-medium text-warning-600">
                        Form Submission Timed Out
                    </h3>
                    <p className={cn("text-sm text-text-secondary")}>
                        We waited {MAX_POLL_DURATION_MS / 1000} seconds but the form was not
                        completed.
                    </p>
                    <p className="text-sm text-text-secondary">
                        If you submitted the form, please try again. Otherwise, check your
                        connection.
                    </p>
                </div>
            )}

            {status === "error" && (
                <div className="space-y-3 text-center">
                    <XCircleIcon className="mx-auto size-12 text-destructive" aria-hidden />
                    <h3 className="text-base font-medium text-destructive">Error</h3>
                    <p className="text-sm text-text-secondary">{errorMessage}</p>
                </div>
            )}
        </FormDialogShell>
    );
}
