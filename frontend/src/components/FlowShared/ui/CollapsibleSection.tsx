import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/Shadcn/Collapsible/collapsible";
import { cn } from "@/lib/utils";
import type { CollapsibleSectionProps } from "@/components/FlowShared/ui/types";

export const CollapsibleSection = ({
    title,
    defaultOpen = true,
    children,
    headerActions,
    className,
}: CollapsibleSectionProps) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            className={cn(
                "w-full rounded-xl border border-n-30 bg-surface-elevated shadow-xs dark:border-border-default",
                className
            )}
        >
            <div className="flex items-center justify-between gap-3 px-4 py-3">
                <CollapsibleTrigger className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left text-text-primary transition-colors hover:text-brand-normal">
                    <span className="text-h6 font-bold">{title}</span>
                    <ChevronDownIcon
                        className={cn(
                            "size-5 shrink-0 text-text-secondary transition-transform duration-300",
                            open && "rotate-180"
                        )}
                    />
                </CollapsibleTrigger>
                {headerActions ? (
                    <div className="flex shrink-0 items-center gap-2">{headerActions}</div>
                ) : null}
            </div>
            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <div className="px-4 pb-4">{children}</div>
            </CollapsibleContent>
        </Collapsible>
    );
};
