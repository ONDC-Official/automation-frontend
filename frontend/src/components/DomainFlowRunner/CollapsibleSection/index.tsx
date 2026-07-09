import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@components/Shadcn/Collapsible/collapsible";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import type { ICollapsibleSectionProps } from "@components/DomainFlowRunner/types";

export const CollapsibleSection = ({
    title,
    defaultOpen = true,
    children,
    headerActions,
    className,
}: ICollapsibleSectionProps) => (
    <Collapsible
        defaultOpen={defaultOpen}
        className={cn(
            "w-full rounded-xl border border-n-30 bg-surface-elevated shadow-xs dark:border-border-default",
            className
        )}
    >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
            <CollapsibleTrigger className="group flex min-w-0 flex-1 items-center gap-2 text-left">
                <ChevronDownIcon className="size-4 shrink-0 text-text-secondary transition-transform group-data-[state=open]:rotate-180" />
                <span className="text-h5 font-bold text-text-primary">{title}</span>
            </CollapsibleTrigger>
            {headerActions ? <div className="shrink-0">{headerActions}</div> : null}
        </div>
        <CollapsibleContent className="px-4 pb-4 pt-0">{children}</CollapsibleContent>
    </Collapsible>
);
