import * as React from "react";
import { Button as ButtonPrimitive, buttonVariants } from "./button";
import { cn } from "@/lib/utils";
import { ICON_SIZE_CLASSES, type IButtonProps, type IconSize } from "./types";

const renderIcon = (icon: React.ReactNode, iconSize: IconSize, iconOnly: boolean) => {
    if (!icon) {
        return null;
    }

    if (React.isValidElement<{ className?: string; "aria-hidden"?: boolean }>(icon)) {
        return React.cloneElement(icon, {
            className: cn("shrink-0", ICON_SIZE_CLASSES[iconSize], icon.props.className),
            "aria-hidden": iconOnly ? true : undefined,
        });
    }

    return icon;
};

export const Button = ({
    icon,
    iconSize = "default",
    children,
    ...props
}: IButtonProps) => (
    <ButtonPrimitive {...props}>
        {renderIcon(icon, iconSize, children == null)}
        {children}
    </ButtonPrimitive>
);

export { buttonVariants };
export type { IconSize };
