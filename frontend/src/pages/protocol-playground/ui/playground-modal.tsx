import { Dialog, DialogContent } from "@/components/Shadcn/Dialog";
import { cn } from "@/lib/utils";

interface IPlaygroundModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
}

export const PlaygroundModal = ({
    isOpen,
    onClose,
    children,
    className,
}: IPlaygroundModalProps) => (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
            className={cn(
                "flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden p-0",
                className
            )}
        >
            {children}
        </DialogContent>
    </Dialog>
);
