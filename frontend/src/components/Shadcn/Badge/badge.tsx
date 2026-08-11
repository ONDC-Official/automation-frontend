import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2.5 py-0.5 text-caption-1 font-semibold whitespace-nowrap transition-[color,box-shadow] [&>svg]:pointer-events-none [&>svg]:size-3",
    {
        variants: {
            variant: {
                // Dark keeps each variant's hue but inverts the recipe: the tinted fill goes dark
                // and the ink goes light, instead of a near-white pill punching a hole in the row.
                default: "border-transparent bg-brand-normal text-n-0",
                secondary:
                    "border-n-30 bg-n-0 text-n-600 uppercase dark:border-border-default dark:bg-dark-muted dark:text-n-60",
                outline:
                    "border-n-30 bg-n-0 text-n-600 dark:border-border-default dark:bg-dark-muted dark:text-n-60",
                success:
                    "border-success-200 bg-success-50 text-success-800 dark:border-success-800 dark:bg-success-800/30 dark:text-success-200",
                alert: "border-alert-200 bg-alert-50 text-alert-800 uppercase dark:border-alert-800 dark:bg-alert-800/30 dark:text-alert-200",
                error: "border-error-50 bg-error-50 text-error-500 dark:border-error-800 dark:bg-error-800/30 dark:text-red-200",
                info: "border-brand-light-active bg-brand-light text-brand-normal dark:border-brand-normal/40 dark:bg-brand-normal/15 dark:text-sky-300",
                mock: " bg-alert-200/50 text-alert-500 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200 uppercase",
                inputs: "border-success-200 bg-success-200/50 text-success-800 uppercase tracking-wide dark:border-success-800 dark:bg-success-800/30 dark:text-success-200",
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
