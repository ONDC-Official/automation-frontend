import { Badge } from "@components/Shadcn/Badge/badge";
import { Button } from "@components/Shadcn/Button";
import { cn } from "@/lib/utils";
import type { FilterBadgeProps } from "@components/Shadcn/Badge/types";

export const FilterBadge = ({ label, selected, onClick }: FilterBadgeProps) => (
    <Button
        variant="ghost"
        onClick={onClick}
        className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-normal/50"
    >
        <Badge
            variant="outline"
            className={cn(
                "cursor-pointer select-none rounded-lg px-4 py-1.5 text-body-2 font-regular uppercase tracking-wide transition-colors",
                selected
                    ? "border-brand-normal bg-brand-normal text-n-0 hover:bg-brand-normal-hover"
                    : "border-brand-light-active bg-brand-light text-text-primary hover:bg-brand-light-hover dark:border-border-default dark:bg-surface-muted dark:hover:bg-surface-elevated"
            )}
        >
            {label}
        </Badge>
    </Button>
);

export { Badge, badgeVariants } from "@components/Shadcn/Badge/badge";
