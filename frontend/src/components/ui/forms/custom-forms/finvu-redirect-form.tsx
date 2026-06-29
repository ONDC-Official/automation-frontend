import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { toast } from "sonner";

import { Button } from "@/components/Shadcn/Button/button";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { SubmitEventParams } from "@/types/flow-types";
import { cn } from "@/lib/utils";

interface IFinvuRedirectFormProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    referenceData?: Record<string, unknown>;
    sessionId: string;
    transactionId: string;
}

export default function FinvuRedirectForm({
    submitEvent,
    referenceData,
    sessionId,
    transactionId,
}: IFinvuRedirectFormProps) {
    const [status, setStatus] = useState<"idle" | "waiting" | "completed" | "error">("idle");
    const [finvuUrl, setFinvuUrl] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [pollCount, setPollCount] = useState<number>(0);

    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const finvuWindowRef = useRef<Window | null>(null);
    const isPollingRef = useRef<boolean>(false);
    const hasCompletedRef = useRef<boolean>(false);

    const cleanup = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
        isPollingRef.current = false;
        localStorage.removeItem("finvu_flow_active");
    }, []);

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    const checkCompletion = useCallback(async () => {
        if (hasCompletedRef.current) return;

        try {
            setPollCount((prev) => prev + 1);

            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/finvu/check-completion`,
                {
                    params: {
                        session_id: sessionId,
                        transaction_id: transactionId,
                    },
                    timeout: 5000,
                }
            );

            if (response.data.completed) {
                hasCompletedRef.current = true;
                cleanup();
                setStatus("completed");

                if (finvuWindowRef.current && !finvuWindowRef.current.closed) {
                    try {
                        finvuWindowRef.current.close();
                    } catch (error) {
                        console.error("Could not close Finvu window:", error);
                    }
                }

                setTimeout(async () => {
                    try {
                        await submitEvent({
                            jsonPath: {
                                "$.context.aa_consent_verified": "true",
                                "$.context.finvu_redirection": "true",
                            },
                            formData: {
                                finvu_consent: "verified",
                                timestamp: new Date().toISOString(),
                            },
                        });
                    } catch (error) {
                        console.error("Error submitting event:", error);
                        const message =
                            "Verification complete but failed to proceed. Please try again.";
                        setErrorMessage(message);
                        setStatus("error");
                        toast.error(message);
                    }
                }, 1000);
            }
        } catch (error: unknown) {
            const err = error as { message?: string };
            console.error("Error checking completion:", err.message);
        }
    }, [sessionId, transactionId, submitEvent, cleanup, pollCount]);

    const startPolling = useCallback(() => {
        if (isPollingRef.current) {
            return;
        }

        isPollingRef.current = true;
        setPollCount(0);
        checkCompletion();

        pollingIntervalRef.current = setInterval(() => {
            checkCompletion();
        }, 2000);
    }, [transactionId, checkCompletion]);

    const handleStartVerification = useCallback(
        async (event: React.MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();

            const finvuWindow = window.open("about:blank", "_blank", "width=800,height=600");

            if (!finvuWindow) {
                const message = "Could not open Finvu window. Please allow popups for this site.";
                setStatus("error");
                setErrorMessage(message);
                toast.error(message);
                return;
            }

            finvuWindowRef.current = finvuWindow;

            try {
                finvuWindow.document.open();
                finvuWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Loading Finvu...</title>
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
              <p>Opening Finvu Account Aggregator...</p>
              <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">Please wait...</p>
            </div>
          </body>
        </html>
      `);
                finvuWindow.document.close();
            } catch (writeError) {
                console.warn("Could not write loading content to popup:", writeError);
            }

            try {
                setStatus("waiting");
                setErrorMessage("");
                setPollCount(0);
                localStorage.setItem("finvu_flow_active", "true");

                if (!transactionId) {
                    throw new Error("Transaction ID is missing! Cannot create Finvu callback URL.");
                }

                const response = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/finvu/verify-consent`,
                    {
                        transactionId,
                        sessionId,
                    },
                    {
                        timeout: 15000,
                    }
                );

                const url = response.data?.url;

                if (!url) {
                    throw new Error(
                        "No URL received from backend. Response: " + JSON.stringify(response.data)
                    );
                }

                setFinvuUrl(url);

                if (finvuWindow && !finvuWindow.closed) {
                    finvuWindow.location.href = url;
                } else {
                    throw new Error("Finvu window was closed before navigation");
                }

                startPolling();
            } catch (error: unknown) {
                console.error("Error starting Finvu verification:", error);
                setStatus("error");
                const err = error as {
                    message?: string;
                    response?: { data?: { message?: string } };
                };
                const message =
                    err.response?.data?.message || err.message || "Failed to start verification";
                setErrorMessage(message);
                toast.error(message);

                if (finvuWindow && !finvuWindow.closed) {
                    try {
                        finvuWindow.close();
                    } catch (closeError) {
                        console.error("Could not close Finvu window:", closeError);
                    }
                }

                cleanup();
            }
        },
        [sessionId, transactionId, referenceData, startPolling, cleanup]
    );

    const handleReopenFinvu = useCallback(
        (event: React.MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();

            if (finvuUrl) {
                const finvuWindow = window.open(
                    finvuUrl,
                    "_blank",
                    "noopener,noreferrer,width=800,height=600"
                );
                finvuWindowRef.current = finvuWindow;
            }
        },
        [finvuUrl]
    );

    const handleRetry = useCallback(
        (event: React.MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();

            cleanup();
            setStatus("idle");
            setErrorMessage("");
            setPollCount(0);
            hasCompletedRef.current = false;
        },
        [cleanup]
    );

    const footer =
        status === "idle" ? (
            <Button type="button" onClick={handleStartVerification}>
                Start Account Aggregator Verification
            </Button>
        ) : status === "error" ? (
            <Button type="button" onClick={handleRetry}>
                Try Again
            </Button>
        ) : null;

    return (
        <FormDialogShell footer={footer}>
            <h2 className="text-lg font-semibold text-text-primary">
                Account Aggregator Verification
            </h2>

            {status === "idle" && (
                <p className="text-sm text-text-secondary">
                    Click the button below to verify your account with Finvu Account Aggregator. A
                    new tab will open where you can complete the verification process.
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
                            Waiting for Consent Approval
                        </h3>
                        <p className="mt-2 text-sm text-text-secondary">
                            Please complete the verification process in the Finvu tab that was
                            opened.
                        </p>
                    </div>
                    <p className="text-sm text-text-secondary">
                        Checking automatically... (Poll #{pollCount})
                    </p>
                    <p className="text-xs text-text-secondary">
                        This page will NOT refresh. Stay here while completing the verification.
                    </p>
                    <Button type="button" variant="link" onClick={handleReopenFinvu}>
                        Reopen Finvu Tab
                    </Button>
                </div>
            )}

            {status === "completed" && (
                <div className="space-y-3 text-center">
                    <CheckCircleIcon className="mx-auto size-12 text-success-600" aria-hidden />
                    <h3 className="text-base font-medium text-text-primary">
                        Verification Completed!
                    </h3>
                    <p className="text-sm text-text-secondary">Proceeding to next step...</p>
                </div>
            )}

            {status === "error" && (
                <div className="space-y-3 text-center">
                    <XCircleIcon className="mx-auto size-12 text-destructive" aria-hidden />
                    <h3 className="text-base font-medium text-destructive">Error</h3>
                    <p className={cn("text-sm text-text-secondary")}>{errorMessage}</p>
                </div>
            )}
        </FormDialogShell>
    );
}
