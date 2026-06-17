import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2.5 py-0.5 text-caption-1 font-semibold whitespace-nowrap transition-[color,box-shadow] [&>svg]:pointer-events-none [&>svg]:size-3",
    {
        variants: {
            variant: {
                default: "border-transparent bg-brand-normal text-n-0",
                secondary: "border-n-30 bg-n-0 text-n-600 uppercase",
                outline: "border-n-30 bg-n-0 text-n-600",
                success: "border-success-200 bg-success-50 text-success-800",
                alert: "border-alert-200 bg-alert-50 text-alert-800 uppercase",
                error: "border-error-50 bg-error-50 text-error-500",
                info: "border-brand-light-active bg-brand-light text-brand-normal",
                mock: " bg-alert-200/50 text-alert-500 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200. uppercase",
                inputs: "border-success-200 bg-success-200/50 text-success-800 uppercase tracking-wide",
                status: "border-transparent text-n-0",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

const Badge = ({
    className,
    variant = "default",
    asChild = false,
    ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) => {
    const Comp = asChild ? Slot.Root : "span";

    return (
        <Comp
            data-slot="badge"
            data-variant={variant}
            className={cn(badgeVariants({ variant }), className)}
            {...props}
        />
    );
};

export { Badge, badgeVariants };
