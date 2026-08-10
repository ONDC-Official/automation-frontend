import type { ComponentProps } from "react";
import { cn } from "@pages/business-dashboard/lib/utils";

const Card = ({ className, ...props }: ComponentProps<"div">) => (
    <div
        data-slot="card"
        className={cn(
            "border-border bg-card text-card-foreground flex flex-col gap-4 rounded-xl border py-4",
            className
        )}
        {...props}
    />
);

export const CardHeader = ({ className, ...props }: ComponentProps<"div">) => (
    <div
        data-slot="card-header"
        className={cn(
            "grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto]",
            className
        )}
        {...props}
    />
);

export const CardTitle = ({ className, ...props }: ComponentProps<"div">) => (
    <div data-slot="card-title" className={cn("text-sm font-semibold", className)} {...props} />
);

export const CardDescription = ({ className, ...props }: ComponentProps<"div">) => (
    <div
        data-slot="card-description"
        className={cn("text-muted-foreground text-xs", className)}
        {...props}
    />
);

export const CardAction = ({ className, ...props }: ComponentProps<"div">) => (
    <div
        data-slot="card-action"
        className={cn("col-start-2 row-span-2 row-start-1 self-start", className)}
        {...props}
    />
);

export const CardContent = ({ className, ...props }: ComponentProps<"div">) => (
    <div data-slot="card-content" className={cn("px-4", className)} {...props} />
);

export const CardFooter = ({ className, ...props }: ComponentProps<"div">) => (
    <div data-slot="card-footer" className={cn("flex items-center px-4", className)} {...props} />
);

export default Card;
