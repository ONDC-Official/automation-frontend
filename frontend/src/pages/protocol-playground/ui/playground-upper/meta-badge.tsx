import { cn } from "@/lib/utils";
import { Badge } from "@/components/Shadcn/Badge/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/Shadcn/Tooltip";
import { IMetaBadgeProps } from "@pages/protocol-playground/ui/playground-upper/types";

export const MetaBadge = ({ value, className, showTooltip = true }: IMetaBadgeProps) => {
    const badge = (
        <Badge
            variant="outline"
            className={cn(
                "min-w-0 max-w-40 shrink rounded-lg border-none bg-brand-light px-2 py-1.5 text-body-2 font-medium text-text-primary dark:bg-surface-muted",
                className
            )}
        >
            <span className="block truncate">{value}</span>
        </Badge>
    );

    if (!showTooltip) {
        return badge;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>{badge}</TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-sm break-all">
                {value}
            </TooltipContent>
        </Tooltip>
    );
};
