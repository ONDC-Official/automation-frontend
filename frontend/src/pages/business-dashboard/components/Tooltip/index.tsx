import type { ComponentProps, ReactNode } from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn } from "@pages/business-dashboard/lib/utils";

export const TooltipProvider = ({
    delayDuration = 200,
    ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) => (
    <TooltipPrimitive.Provider
        data-slot="tooltip-provider"
        delayDuration={delayDuration}
        {...props}
    />
);

interface IProps extends ComponentProps<typeof TooltipPrimitive.Root> {
    /** what the tooltip says */
    content: ReactNode;
    /** the element the tooltip is anchored to */
    children: ReactNode;
    side?: ComponentProps<typeof TooltipPrimitive.Content>["side"];
    className?: string;
}

/**
 * A whole tooltip from `{ content, children }` — the trigger is always
 * `asChild`, so it never adds a wrapper element to the layout.
 */
const Tooltip = ({ content, children, side = "top", className, ...props }: IProps) => (
    <TooltipPrimitive.Root {...props}>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
                data-slot="tooltip-content"
                side={side}
                sideOffset={6}
                className={cn(
                    "bg-primary text-primary-foreground z-50 max-w-xs rounded-md px-2 py-1 text-xs text-balance shadow-md",
                    className
                )}
            >
                {content}
                <TooltipPrimitive.Arrow className="fill-primary size-2" />
            </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
);

export default Tooltip;
