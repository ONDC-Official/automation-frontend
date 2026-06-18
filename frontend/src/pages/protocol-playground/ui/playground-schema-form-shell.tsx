import {
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/Shadcn/Dialog/dialog";
import { Button } from "@/components/Shadcn/Button/button";

interface IPlaygroundSchemaFormShellProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    formId?: string;
    onCancel?: () => void;
    submitLabel?: string;
    isSubmitting?: boolean;
}

export const PlaygroundSchemaFormShell = ({
    title,
    description,
    children,
    formId,
    onCancel,
    submitLabel = "Submit",
    isSubmitting = false,
}: IPlaygroundSchemaFormShellProps) => (
    <>
        <DialogHeader className="border-b border-border-default px-6 py-4">
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="playground-schema-form max-h-[70vh] overflow-y-auto px-6 py-5">
            {children}
        </div>
        {formId && onCancel ? (
            <DialogFooter className="border-t border-border-default bg-surface-muted px-6 py-4">
                <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    form={formId}
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                >
                    {submitLabel}
                </Button>
            </DialogFooter>
        ) : null}
    </>
);
