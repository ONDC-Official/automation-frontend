import { useState, useEffect, useRef, useCallback } from "react";
import { SubmitEventParams } from "@/types/flow-types";
import { FormFieldConfigType } from "@components/ui/forms/config-form/config-form";
import { useSession } from "@context/context";
import { FormService } from "@services/formService";

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
 * flow). Unlike DynamicFormHandler it never opens or even shows the form URL —
 * the buyer gets it from the on_select payload's xinput. This step only waits
 * for the form's callback: polling starts automatically on mount, and the flow
 * proceeds once the form's final step fires the callback.
 */
export default function ManualDynamicFormHandler({ submitEvent }: ManualDynamicFormHandlerProps) {
    // Completion is keyed by session_id (api-service GET /callback writes
    // form_completed:{session_id}). Read it from context, not props.
    const { sessionId } = useSession();

    const [status, setStatus] = useState<"waiting" | "completed" | "error" | "timeout">("waiting");
    const [errorMessage, setErrorMessage] = useState<string>("");

    // pollDisplay is only for rendering — source of truth is pollCountRef
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

    // Polls GET /form/check-completion?session_id=X — the backend reads
    // form_completed:{session_id} written by the api-service GET /callback.
    const checkCompletion = useCallback(async () => {
        if (hasCompletedRef.current) return;
        if (!sessionId) return;

        pollCountRef.current += 1;
        setPollDisplay(pollCountRef.current);

        if (pollCountRef.current > MAX_POLLS) {
            cleanup();
            setStatus("timeout");
            return;
        }

        try {
            const data = await FormService.checkCompletion(sessionId);

            const { completed, success } = data ?? {};

            if (completed === true && success === true && !hasCompletedRef.current) {
                console.warn("✅ [ManualDynamicForm] Form completed!", {
                    sessionId,
                    poll: pollCountRef.current,
                });
                hasCompletedRef.current = true;
                cleanup();

                // Proceed the flow — temporary submission_id satisfies the mock
                // service's json_path_changes requirement.
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
            // Network blips are expected during polling; keep retrying until MAX_POLLS.
            const err = error as { message?: string };
            console.error("[ManualDynamicForm] Error checking completion:", err.message);
        }
    }, [sessionId, submitEvent, cleanup]);

    const checkCompletionRef = useRef(checkCompletion);
    useEffect(() => {
        checkCompletionRef.current = checkCompletion;
    }, [checkCompletion]);

    const startPolling = useCallback(() => {
        if (isPollingRef.current || !sessionId) return;
        isPollingRef.current = true;
        pollCountRef.current = 0;
        setPollDisplay(0);
        setStatus("waiting");

        // No reset here: for LAMF the launch popup's "Open Form" button already
        // cleared stale completion, and this flow has a single form — so resetting
        // again at poll time is redundant.
        checkCompletionRef.current();
        pollingIntervalRef.current = setInterval(() => {
            checkCompletionRef.current();
        }, POLL_INTERVAL_MS);
    }, [sessionId]);

    // Polling starts automatically — there is no open button in this UX.
    useEffect(() => {
        startPolling();
    }, [sessionId]);

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
            <h2 className="text-xl font-semibold mb-4">Waiting for Verification Callback</h2>

            {(status === "waiting" || status === "timeout" || status === "error") && (
                <p className="text-gray-600 mb-3">
                    Complete the verification journey in the form you opened from the on_select
                    payload. This step finishes automatically when the callback is received.
                </p>
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
