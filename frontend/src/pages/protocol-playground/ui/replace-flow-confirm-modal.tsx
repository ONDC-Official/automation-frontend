import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/Shadcn/Button/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/Shadcn/Dialog/dialog";

interface IReplaceFlowConfirmModalProps {
    isOpen: boolean;
    flowId: string;
    domain: string;
    version: string;
    onCancel: () => void;
    onConfirm: () => void;
}

export const ReplaceFlowConfirmModal = ({
    isOpen,
    flowId,
    domain,
    version,
    onCancel,
    onConfirm,
}: IReplaceFlowConfirmModalProps) => (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
        <DialogContent className="flex max-w-md flex-col gap-0 overflow-hidden p-0">
            <DialogHeader className="flex flex-row items-start gap-3 border-b border-border-default px-6 py-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-alert-200 bg-alert-50 dark:border-alert-500/30 dark:bg-alert-500/10">
                    <ExclamationTriangleIcon className="size-5 text-alert-500" />
                </div>
                <div className="min-w-0">
                    <DialogTitle>Replace Current Flow?</DialogTitle>
                    <DialogDescription className="mt-1">
                        You already have a flow loaded. Importing from GitHub will replace it and
                        any unsaved changes will be lost.
                    </DialogDescription>
                </div>
            </DialogHeader>

            <div className="px-6 py-4">
                <p className="mb-1 font-mono text-sm font-medium text-brand-normal">{flowId}</p>
                <p className="text-xs text-text-secondary">
                    {domain} · v{version}
                </p>
            </div>

            <DialogFooter className="border-t border-border-default bg-surface-muted px-6 py-4">
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button onClick={onConfirm}>Continue</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);
