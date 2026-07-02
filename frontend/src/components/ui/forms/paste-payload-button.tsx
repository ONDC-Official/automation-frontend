import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/Shadcn/Button/button";
import { cn } from "@/lib/utils";

export interface IPastePayloadButtonProps {
    onClick: () => void;
    label?: string;
    className?: string;
    title?: string;
}

export const PastePayloadButton = ({
    onClick,
    label = "Paste on_search",
    className,
    title,
}: IPastePayloadButtonProps) => (
    <Button
        type="button"
        variant="outline"
        onClick={onClick}
        className={cn("mb-3 flex items-center gap-2", className)}
        title={title ?? "Paste payload to auto-populate fields"}
    >
        <ClipboardDocumentIcon className="size-4" />
        <span className="text-sm">{label}</span>
    </Button>
);

export default PastePayloadButton;
