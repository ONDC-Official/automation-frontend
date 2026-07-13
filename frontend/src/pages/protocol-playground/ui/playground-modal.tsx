import { Dialog, DialogContent } from "@components/Shadcn/Dialog";
import { cn } from "@/lib/utils";

interface IPlaygroundModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
}

// modal={false}: portaled ComboBox lists render under body; a modal Dialog would
// pointer-events-lock + scroll-lock them so options can't be scrolled or selected.
// A custom backdrop replaces DialogOverlay, which does not render meaningfully when
// modal={false} (same pattern as FormFlowDialog).
export const PlaygroundModal = ({
    isOpen,
    onClose,
    children,
    className,
}: IPlaygroundModalProps) => {
    if (!isOpen) {
        return null;
    }

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" onClick={onClose} />
            <Dialog open={isOpen} modal={false} onOpenChange={(open) => !open && onClose()}>
                <DialogContent
                    overlayClassName="hidden"
                    className={cn(
                        "z-60 flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden p-0",
                        className
                    )}
                >
                    {children}
                </DialogContent>
            </Dialog>
        </>
    );
};
