import { useState } from "react";
import { PlayIcon } from "@heroicons/react/24/solid";

import { Button } from "@/components/Shadcn/Button/button";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { SubmitEventParams } from "@/types/flow-types";

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
        <FormDialogShell
            footer={
                <Button
                    type="button"
                    onClick={handleSubmit}
                    isLoading={submitting}
                    className="gap-2"
                >
                    {!submitting && <PlayIcon className="size-4" />}
                    {submitting ? "Triggering..." : "Trigger Pending API"}
                </Button>
            }
        >
            <div className="flex flex-col items-center justify-center gap-4 py-4">
                <p className="text-center text-sm text-muted-foreground">
                    This step is waiting for a manual trigger
                    {actionId ? (
                        <>
                            {" "}
                            (<span className="font-semibold text-foreground">{actionId}</span>)
                        </>
                    ) : null}
                    .
                </p>
            </div>
        </FormDialogShell>
    );
}
