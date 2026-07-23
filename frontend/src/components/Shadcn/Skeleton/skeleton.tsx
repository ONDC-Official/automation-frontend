import { cn } from "@/lib/utils";

/** Pulsing placeholder block — shadcn/ui Skeleton primitive. */
const Skeleton = ({ className, ...props }: React.ComponentProps<"div">) => (
    <div
        data-slot="skeleton"
        className={cn("animate-pulse rounded-md bg-muted", className)}
        {...props}
    />
);

export { Skeleton };
