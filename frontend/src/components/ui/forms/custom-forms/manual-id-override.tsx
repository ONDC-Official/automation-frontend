import { useState } from "react";
import { IoPlay } from "react-icons/io5";
import { SubmitEventParams } from "@/types/flow-types";

// Override form for a `manual_id` input: the step only needs a manual trigger (the id is fixed to
// the action), so we show no fields — just a single submit button that fires the pending API.
export default function ManualIdOverride({
    submitEvent,
    actionId,
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    actionId?: string;
}) {
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            await submitEvent({
                jsonPath: {},
                formData: actionId ? { id: actionId } : {},
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4 p-8">
            <p className="text-sm text-gray-600 text-center">
                This step is waiting for a manual trigger
                {actionId ? (
                    <>
                        {" "}
                        (<span className="font-semibold text-gray-800">{actionId}</span>)
                    </>
                ) : null}
                .
            </p>
            <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 rounded bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {submitting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                    <IoPlay className="text-base" />
                )}
                <span>{submitting ? "Triggering..." : "Trigger Pending API"}</span>
            </button>
        </div>
    );
}
