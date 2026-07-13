import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Dialog, DialogContent } from "@components/Shadcn/Dialog";
import { isFormFlowPortaledOverlay } from "@components/Shadcn/Dialog/form-flow-dialog-utils";
import { cn } from "@/lib/utils";

interface IPlaygroundModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
}

/** Ignore outside/backdrop dismiss until the opening gesture (e.g. DropdownMenu) has settled. */
const DISMISS_ARM_MS = 400;

// modal={false}: portaled ComboBox lists render under body; a modal Dialog would
// pointer-events-lock + scroll-lock them so options can't be scrolled or selected.
// A custom portaled backdrop replaces DialogOverlay. Outside pointer/focus dismiss
// is blocked so opening from a DropdownMenu (e.g. Export YAML → form step) cannot
// immediately close the dialog — same stack as FormFlowDialog.
export const PlaygroundModal = ({
    isOpen,
    onClose,
    children,
    className,
}: IPlaygroundModalProps) => {
    const dismissArmedRef = useRef(false);
    const [portalTarget, setPortalTarget] = useState<Element>(
        () => document.fullscreenElement ?? document.body
    );

    useEffect(() => {
        const update = () => {
            setPortalTarget(document.fullscreenElement ?? document.body);
        };
        update();
        document.addEventListener("fullscreenchange", update);
        return () => document.removeEventListener("fullscreenchange", update);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            dismissArmedRef.current = false;
            return;
        }
        dismissArmedRef.current = false;
        const timer = window.setTimeout(() => {
            dismissArmedRef.current = true;
        }, DISMISS_ARM_MS);
        return () => window.clearTimeout(timer);
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const requestClose = () => {
        if (!dismissArmedRef.current) {
            return;
        }
        onClose();
    };

    const blockOutsideDismiss = (event: {
        target: EventTarget | null;
        preventDefault: () => void;
    }) => {
        if (isFormFlowPortaledOverlay(event.target)) {
            return;
        }
        event.preventDefault();
    };

    return (
        <>
            {createPortal(
                <div
                    aria-hidden="true"
                    className="fixed inset-0 z-55 bg-black/50 backdrop-blur-xs"
                    onClick={requestClose}
                />,
                portalTarget
            )}
            <Dialog open={isOpen} modal={false} onOpenChange={(open) => !open && requestClose()}>
                <DialogContent
                    overlayClassName="hidden"
                    className={cn(
                        "z-60 flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden p-0",
                        className
                    )}
                    onInteractOutside={blockOutsideDismiss}
                    onPointerDownOutside={blockOutsideDismiss}
                    onFocusOutside={blockOutsideDismiss}
                >
                    {children}
                </DialogContent>
            </Dialog>
        </>
    );
};
