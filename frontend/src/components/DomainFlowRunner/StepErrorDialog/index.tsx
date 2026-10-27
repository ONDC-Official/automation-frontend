import { ArrowRightIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

import { Button } from "@components/Shadcn/Button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from "@components/Shadcn/Dialog";
import type { ErroredStep, RequestError } from "@components/DomainFlowRunner/utils/step-error";

export interface StepErrorPopup {
    step: ErroredStep;
    error: RequestError;
}

interface StepErrorDialogProps {
    popup: StepErrorPopup | null;
    onClose: () => void;
    onViewRequest: (popup: StepErrorPopup) => void;
}

/** Tells the participant which of their payloads was rejected and why (from the request's `error`). */
export default function StepErrorDialog({ popup, onClose, onViewRequest }: StepErrorDialogProps) {
    if (!popup) return null;
    const { step, error } = popup;
    const requestLabel = `${step.actionType} request #${step.requestNumber}`;

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg gap-0 p-6">
                <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-error-50 dark:bg-error-800/30">
                        <ExclamationTriangleIcon className="size-5 text-error-500" />
                    </div>
                    <div className="min-w-0">
                        <DialogTitle className="text-base">
                            Your {step.pairLabel} payload has an error
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-sm leading-relaxed">
                            The workbench rejected your {step.pairLabel} and sent {step.actionType}{" "}
                            again with the reason. Fix {step.pairLabel} and send it again.
                        </DialogDescription>
                    </div>
                </div>

                <div className="mt-4 rounded-lg border border-error-500/40 bg-error-50 p-3 dark:bg-error-800/20">
                    <div className="mb-1.5 flex items-center gap-2">
                        {error.code ? (
                            <span className="rounded-md border border-error-500/40 bg-surface-elevated px-2 py-0.5 font-mono text-xs text-error-500">
                                {error.code}
                            </span>
                        ) : null}
                        <span className="text-xs text-error-500">in {step.pairLabel}</span>
                    </div>
                    <p className="break-words text-sm text-error-500">{error.message}</p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-text-secondary">
                    <span className="rounded-md bg-error-50 px-2 py-0.5 text-error-500 dark:bg-error-800/30">
                        {step.pairLabel} · your response
                    </span>
                    <ArrowRightIcon className="size-3.5" />
                    <span className="rounded-md bg-surface-muted px-2 py-0.5">
                        reported in {requestLabel}
                    </span>
                </div>

                <DialogFooter className="mt-5">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button onClick={() => onViewRequest(popup)}>
                        View {requestLabel}
                        <ArrowRightIcon className="size-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
