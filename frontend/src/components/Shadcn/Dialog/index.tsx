import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { XMarkIcon } from "@heroicons/react/24/outline";

import { cn } from "@/lib/utils";

const Dialog = ({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) => (
    <DialogPrimitive.Root data-slot="dialog" {...props} />
);

const DialogTrigger = ({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) => (
    <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
);

const DialogPortal = ({
    container,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) => (
    <DialogPrimitive.Portal
        data-slot="dialog-portal"
        container={container ?? document.fullscreenElement ?? document.body}
        {...props}
    />
);

const DialogClose = ({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) => (
    <DialogPrimitive.Close data-slot="dialog-close" {...props} />
);

const DialogOverlay = ({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) => (
    <DialogPrimitive.Overlay
        data-slot="dialog-overlay"
        className={cn(
            "fixed inset-0 z-50 bg-black/50 backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            className
        )}
        {...props}
    />
);

const DialogContent = ({
    className,
    children,
    showCloseButton = true,
    container,
    overlayClassName,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean;
    container?: HTMLElement;
    overlayClassName?: string;
}) => (
    <DialogPortal container={container}>
        <DialogOverlay className={overlayClassName} />
        <DialogPrimitive.Content
            data-slot="dialog-content"
            className={cn(
                "fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-2xl border border-border-default bg-surface-elevated p-6 text-text-primary shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                className
            )}
            {...props}
        >
            {children}
            {showCloseButton && (
                <DialogPrimitive.Close
                    data-slot="dialog-close"
                    className="absolute top-4 right-4 rounded-md p-1 text-text-secondary opacity-70 transition-opacity hover:bg-surface-muted hover:opacity-100 focus-visible:ring-2 focus-visible:ring-brand-normal/50 focus-visible:outline-none disabled:pointer-events-none"
                >
                    <XMarkIcon className="size-5" />
                    <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
            )}
        </DialogPrimitive.Content>
    </DialogPortal>
);

const DialogHeader = ({ className, ...props }: React.ComponentProps<"div">) => (
    <div
        data-slot="dialog-header"
        className={cn("flex flex-col gap-1.5 text-left", className)}
        {...props}
    />
);

const DialogFooter = ({ className, ...props }: React.ComponentProps<"div">) => (
    <div
        data-slot="dialog-footer"
        className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
        {...props}
    />
);

const DialogTitle = ({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) => (
    <DialogPrimitive.Title
        data-slot="dialog-title"
        className={cn("text-base leading-none font-semibold text-text-primary", className)}
        {...props}
    />
);

const DialogDescription = ({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) => (
    <DialogPrimitive.Description
        data-slot="dialog-description"
        className={cn("text-sm text-text-secondary", className)}
        {...props}
    />
);

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
};
