import { useState, useEffect, useRef, useCallback } from "react";
import {
    ArrowPathIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/Shadcn/Button/button";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { SubmitEventParams } from "@/types/flow-types";
import { FormFieldConfigType } from "@/components/ui/forms/config-form";
import { FormService } from "@services/formService";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 2_000;
const MAX_POLL_DURATION_MS = 600_000;
const MAX_POLLS = MAX_POLL_DURATION_MS / POLL_INTERVAL_MS;

interface ManualDynamicFormHandlerProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    referenceData?: Record<string, unknown>;
    sessionId: string;
    transactionId: string;
    formConfig?: FormFieldConfigType;
}

/**
 * MANUAL_DYNAMIC_FORM step handler (currently only the LAMF single_redirection
 * flow). Unlike DynamicFormHandler it never opens or even shows the form URL —
 * the buyer gets it from the on_select payload's xinput. This step only waits
 * for the form's callback: polling starts automatically on mount, and the flow
 * proceeds once the form's final step fires the callback.
 */
export default function ManualDynamicFormHandler({
    submitEvent,
    transactionId,
}: ManualDynamicFormHandlerProps) {
    // Completion is keyed by transaction_id (api-service GET /callback writes
    // form_completed:{transaction_id}).

    const [status, setStatus] = useState<"waiting" | "completed" | "error" | "timeout">("waiting");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [pollDisplay, setPollDisplay] = useState<number>(0);

    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isPollingRef = useRef<boolean>(false);
    const hasCompletedRef = useRef<boolean>(false);
    const pollCountRef = useRef<number>(0);

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

    // Polls GET /form/check-completion?transaction_id=X — the backend reads
    // form_completed:{transaction_id} written by the api-service GET /callback.
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
            const data = await FormService.checkCompletion(transactionId);

            const { completed, success } = data ?? {};

            if (completed === true && success === true && !hasCompletedRef.current) {
                console.warn("✅ [ManualDynamicForm] Form completed!", {
                    transactionId,
                    poll: pollCountRef.current,
                });
                hasCompletedRef.current = true;
                cleanup();

                try {
                    const submission_id = crypto.randomUUID();
                    await submitEvent({
                        jsonPath: { submission_id },
                        formData: { submission_id },
                    });
                    setStatus("completed");
                } catch (error) {
                    console.error("❌ [ManualDynamicForm] Error submitting event:", error);
                    setErrorMessage("Form complete but failed to proceed. Please try again.");
                    setStatus("error");
                }
            }
        } catch (error: unknown) {
            const err = error as { message?: string };
            console.error("[ManualDynamicForm] Error checking completion:", err.message);
        }
    }, [transactionId, submitEvent, cleanup]);

    const checkCompletionRef = useRef(checkCompletion);
    useEffect(() => {
        checkCompletionRef.current = checkCompletion;
    }, [checkCompletion]);

    const startPolling = useCallback(() => {
        if (isPollingRef.current || !transactionId) return;
        isPollingRef.current = true;
        pollCountRef.current = 0;
        setPollDisplay(0);
        setStatus("waiting");

        checkCompletionRef.current();
        pollingIntervalRef.current = setInterval(() => {
            checkCompletionRef.current();
        }, POLL_INTERVAL_MS);
    }, [transactionId]);

    useEffect(() => {
        startPolling();
    }, [transactionId]);

    const handleResume = useCallback(
        (event: React.MouseEvent) => {
            event.preventDefault();
            cleanup();
            hasCompletedRef.current = false;
            setErrorMessage("");
            startPolling();
        },
        [cleanup, startPolling]
    );

    const footer =
        status === "timeout" || status === "error" ? (
            <Button type="button" onClick={handleResume}>
                {status === "timeout" ? "Resume Waiting" : "Try Again"}
            </Button>
        ) : null;

    return (
        <FormDialogShell footer={footer}>
            <h2 className="text-lg font-semibold text-text-primary">
                Waiting for Verification Callback
            </h2>

            {(status === "waiting" || status === "timeout" || status === "error") && (
                <p className="text-sm text-text-secondary">
                    Complete the verification journey in the form you opened from the on_select
                    payload. This step finishes automatically when the callback is received.
                </p>
            )}

            {status === "waiting" && (
                <div className="space-y-4 border-t border-border-default pt-4 text-center">
                    <ArrowPathIcon
                        className="mx-auto size-8 animate-spin text-brand-normal"
                        aria-hidden
                    />
                    <p className="text-sm text-text-secondary">Waiting for form completion…</p>
                    <p className="text-xs text-text-secondary">
                        Poll #{pollDisplay} of {MAX_POLLS} — this page will not refresh.
                    </p>
                </div>
            )}

            {status === "completed" && (
                <div className="space-y-3 text-center">
                    <CheckCircleIcon className="mx-auto size-12 text-success-600" aria-hidden />
                    <h3 className="text-base font-medium text-text-primary">
                        Verification Completed!
                    </h3>
                    <p className="text-sm text-text-secondary">Proceeding to next step…</p>
                </div>
            )}

            {status === "timeout" && (
                <div className="space-y-3 border-t border-border-default pt-4 text-center">
                    <ClockIcon className="mx-auto size-10 text-warning-600" aria-hidden />
                    <p className={cn("text-sm text-text-secondary")}>
                        We waited {MAX_POLL_DURATION_MS / 60000} minutes without detecting
                        completion. You can keep waiting if you are still filling the form.
                    </p>
                </div>
            )}

            {status === "error" && (
                <div className="space-y-3 border-t border-border-default pt-4 text-center">
                    <XCircleIcon className="mx-auto size-10 text-destructive" aria-hidden />
                    <p className="text-sm text-text-secondary">{errorMessage}</p>
                </div>
            )}
        </FormDialogShell>
    );
}
