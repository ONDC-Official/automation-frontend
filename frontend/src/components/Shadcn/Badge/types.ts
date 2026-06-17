import type { ComponentProps } from "react";
import { VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/components/Shadcn/Badge/badge";

export type BadgeProps = ComponentProps<"span"> &
    VariantProps<typeof badgeVariants> & {
        asChild?: boolean;
    };

export type FilterBadgeProps = {
    label: string;
    selected: boolean;
    onClick: () => void;
};
