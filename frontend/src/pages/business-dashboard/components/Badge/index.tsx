import type { ComponentProps } from "react";
import { Slot } from "radix-ui";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@dashboard/lib/utils";
import { badgeVariants } from "./variants";

interface IProps extends ComponentProps<"span">, VariantProps<typeof badgeVariants> {
    asChild?: boolean;
}

const Badge = ({ className, variant, size, asChild, ...props }: IProps) => {
    const Comp = asChild ? Slot.Root : "span";

    return (
        <Comp
            data-slot="badge"
            className={cn(badgeVariants({ variant, size }), className)}
            {...props}
        />
    );
};

export default Badge;
