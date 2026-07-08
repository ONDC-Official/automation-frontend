import { useId, type FormEventHandler, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface IFormDialogShellProps {
    id?: string;
    onSubmit?: FormEventHandler<HTMLFormElement>;
    children: ReactNode;
    footer: ReactNode;
    className?: string;
}

export const FormDialogShell = ({
    id,
    onSubmit,
    children,
    footer,
    className,
}: IFormDialogShellProps) => {
    const autoId = useId();
    const formId = id ?? autoId;

    const body = (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">{children}</div>
    );

    const footerBar = (
        <div className="flex shrink-0 justify-end gap-2 border-t border-border-default bg-surface-muted/50 px-6 py-4">
            {footer}
        </div>
    );

    if (onSubmit) {
        return (
            <form
                id={formId}
                onSubmit={onSubmit}
                className={cn("flex min-h-0 flex-1 flex-col", className)}
            >
                {body}
                {footerBar}
            </form>
        );
    }

    return (
        <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
            {body}
            {footerBar}
        </div>
    );
};

export default FormDialogShell;
