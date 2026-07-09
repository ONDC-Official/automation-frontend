import * as React from "react";
import { Button as ButtonPrimitive, buttonVariants } from "@/components/Shadcn/Button/button";
import { cn } from "@/lib/utils";
import {
    ICON_SIZE_CLASSES,
    type IButtonProps,
    type IconSize,
} from "@/components/Shadcn/Button/types";

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

export const Button = ({ icon, iconSize = "default", children, ...props }: IButtonProps) => {
    if (props.asChild) {
        if (!React.isValidElement(children) || React.Children.count(children) !== 1) {
            return (
                <ButtonPrimitive {...props} asChild={false}>
                    {renderIcon(icon, iconSize, children == null)}
                    {children}
                </ButtonPrimitive>
            );
        }

        return <ButtonPrimitive {...props}>{children}</ButtonPrimitive>;
    }

    return (
        <ButtonPrimitive {...props}>
            {renderIcon(icon, iconSize, children == null)}
            {children}
        </ButtonPrimitive>
    );
};

export { buttonVariants };
