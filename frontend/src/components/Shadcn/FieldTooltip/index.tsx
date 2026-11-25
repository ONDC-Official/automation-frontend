import { useState } from "react";
import { Info } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@components/Shadcn/Tooltip";

interface IFieldTooltipProps {
    /** The field's label, used to name the icon for screen readers. */
    label: string;
    /** What the field means. */
    content: string;
}

/**
 * A small "i" next to a form label that explains the field. Opens on hover, on
 * keyboard focus, and on tap (touch screens have no hover); closes on leaving,
 * Escape, or tapping elsewhere. Shared by TextField and ComboBox.
 */
export const FieldTooltip = ({ label, content }: IFieldTooltipProps) => {
    const [open, setOpen] = useState(false);
    return (
        <TooltipProvider>
            <Tooltip open={open} onOpenChange={setOpen}>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        aria-label={`About ${label}`}
                        data-testid="field-tooltip"
                        // A click/tap opens it (Radix would close it on click otherwise).
                        onClick={(event) => {
                            event.preventDefault();
                            setOpen(true);
                        }}
                        className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-brand-normal focus-visible:text-brand-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-normal/50"
                    >
                        <Info className="size-4" aria-hidden="true" />
                    </button>
                </TooltipTrigger>
                <TooltipContent
                    side="top"
                    className="max-w-xs text-left text-caption-1 leading-relaxed"
                >
                    {content}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
