import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

const Popover = ({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) => (
    <PopoverPrimitive.Root data-slot="popover" {...props} />
);

const PopoverTrigger = ({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) => (
    <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
);

const PopoverAnchor = ({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) => (
    <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
);

const PopoverContent = ({
    className,
    align = "center",
    sideOffset = 8,
    container,
    ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
    container?: HTMLElement | null;
}) => (
    <PopoverPrimitive.Portal container={container ?? document.fullscreenElement ?? document.body}>
        <PopoverPrimitive.Content
            data-slot="popover-content"
            align={align}
            sideOffset={sideOffset}
            className={cn(
                "z-50 w-auto origin-(--radix-popover-content-transform-origin) rounded-xl border border-border-default bg-surface-elevated p-0 text-text-primary shadow-lg outline-none",
                "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
                "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                className
            )}
            {...props}
        />
    </PopoverPrimitive.Portal>
);

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
