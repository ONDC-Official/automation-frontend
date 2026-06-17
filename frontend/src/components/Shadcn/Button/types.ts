import type * as React from "react";
import type { VariantProps } from "class-variance-authority";
import type { buttonVariants } from "./button";

export const ICON_SIZE_CLASSES = {
    xs: "size-3",
    sm: "size-3.5",
    default: "size-4",
    lg: "size-5",
} as const;

export type IconSize = keyof typeof ICON_SIZE_CLASSES;

export interface IButtonProps
    extends React.ComponentProps<"button">,
        VariantProps<typeof buttonVariants> {
    icon?: React.ReactNode;
    iconSize?: IconSize;
    isLoading?: boolean;
    asChild?: boolean;
}
