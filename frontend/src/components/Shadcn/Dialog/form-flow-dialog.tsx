import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/Shadcn/Button/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/Shadcn/Dialog";
import { isFormFlowPortaledOverlay } from "@/components/Shadcn/Dialog/form-flow-dialog-utils";
import { useSession } from "@/context/context";
import { cn } from "@/lib/utils";
import { ArrowsPointingOutIcon, MinusIcon, XMarkIcon } from "@heroicons/react/24/outline";

const WIDTH_CLASSES = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-xl",
    xl: "max-w-2xl",
    "2xl": "max-w-4xl",
} as const;

export interface IFormFlowDialogProps {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    disableClose?: boolean;
    width?: keyof typeof WIDTH_CLASSES;
    title?: string;
    description?: string;
    children: React.ReactNode;
}

const FormFlowDialog = ({
    open,
    onOpenChange,
    disableClose = false,
    width = "xl",
    title,
    description,
    children,
}: IFormFlowDialogProps) => {
    const [isMinimized, setIsMinimized] = useState(false);
    const [portalTarget, setPortalTarget] = useState<Element>(
        () => document.fullscreenElement ?? document.body
    );
    const { activeCallClickedToggle } = useSession();
    const hasTitle = Boolean(title);
    const hasDescription = Boolean(description);

    useEffect(() => {
        if (open) {
            setIsMinimized(false);
        }
    }, [open]);

    useEffect(() => {
        setIsMinimized(false);
    }, [activeCallClickedToggle]);

    useEffect(() => {
        const update = () => {
            setPortalTarget(document.fullscreenElement ?? document.body);
        };
        update();
        document.addEventListener("fullscreenchange", update);
        return () => document.removeEventListener("fullscreenchange", update);
    }, []);

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen && (disableClose || isMinimized)) {
            return;
        }
        if (!nextOpen) {
            setIsMinimized(false);
        }
        onOpenChange?.(nextOpen);
    };

    const handleClose = () => {
        if (disableClose) {
            return;
        }
        setIsMinimized(false);
        onOpenChange?.(false);
    };

    const handleRestore = () => {
        setIsMinimized(false);
    };

    if (!open) {
        return null;
    }

    const backdrop =
        open &&
        !isMinimized &&
        createPortal(
            <div
                aria-hidden="true"
                className="fixed inset-0 z-55 bg-black/50 backdrop-blur-xs"
                onClick={() => {
                    if (!disableClose) {
                        handleClose();
                    }
                }}
            />,
            portalTarget
        );

    const minimizedChip =
        isMinimized &&
        createPortal(
            <div className="fixed bottom-4 right-4 z-100">
                <div className="flex items-center gap-3 rounded-xl border border-border-default bg-surface-elevated px-4 py-2 shadow-lg">
                    <span className="text-sm font-medium text-text-primary">
                        {title ?? "Form minimized"}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Restore form"
                        onClick={handleRestore}
                    >
                        <ArrowsPointingOutIcon className="size-4" />
                    </Button>
                    {!disableClose && (
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Close form"
                            onClick={handleClose}
                        >
                            <XMarkIcon className="size-4" />
                        </Button>
                    )}
                </div>
            </div>,
            portalTarget
        );

    return (
        <>
            {backdrop}
            {minimizedChip}

            <Dialog open={open} modal={false} onOpenChange={handleOpenChange}>
                <DialogContent
                    showCloseButton={false}
                    overlayClassName="hidden"
                    className={cn(
                        WIDTH_CLASSES[width],
                        "z-60 flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0",
                        isMinimized && "hidden"
                    )}
                    onInteractOutside={(event) => {
                        if (isFormFlowPortaledOverlay(event.target)) {
                            return;
                        }
                        if (disableClose || isMinimized) {
                            event.preventDefault();
                        }
                    }}
                    onPointerDownOutside={(event) => {
                        if (isFormFlowPortaledOverlay(event.target)) {
                            return;
                        }
                        if (disableClose || isMinimized) {
                            event.preventDefault();
                        }
                    }}
                    onFocusOutside={(event) => {
                        if (isFormFlowPortaledOverlay(event.target)) {
                            return;
                        }
                        if (disableClose || isMinimized) {
                            event.preventDefault();
                        }
                    }}
                    onEscapeKeyDown={(event) => {
                        if (disableClose || isMinimized) {
                            event.preventDefault();
                        }
                    }}
                >
                    <div
                        className={cn(
                            "flex shrink-0 items-center border-b border-border-default px-6 py-4",
                            hasTitle || hasDescription ? "justify-between" : "justify-end"
                        )}
                    >
                        {(hasTitle || hasDescription) && (
                            <DialogHeader className="gap-1 text-left">
                                {hasTitle && <DialogTitle>{title}</DialogTitle>}
                                {hasDescription && (
                                    <DialogDescription>{description}</DialogDescription>
                                )}
                            </DialogHeader>
                        )}
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Minimize form"
                                onClick={() => setIsMinimized(true)}
                            >
                                <MinusIcon className="size-4" />
                            </Button>
                            {!disableClose && (
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Close form"
                                    onClick={handleClose}
                                    className="rounded-full bg-brand-normal/10 text-brand-normal hover:bg-brand-normal/20"
                                >
                                    <XMarkIcon className="size-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default FormFlowDialog;
