import type { ComponentProps } from "react";
import { Select as SelectPrimitive } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@pages/business-dashboard/lib/utils";

const Select = SelectPrimitive.Root;

export const SelectGroup = (props: ComponentProps<typeof SelectPrimitive.Group>) => (
    <SelectPrimitive.Group data-slot="select-group" {...props} />
);

export const SelectValue = (props: ComponentProps<typeof SelectPrimitive.Value>) => (
    <SelectPrimitive.Value data-slot="select-value" {...props} />
);

export const SelectTrigger = ({
    className,
    children,
    ...props
}: ComponentProps<typeof SelectPrimitive.Trigger>) => (
    <SelectPrimitive.Trigger
        data-slot="select-trigger"
        className={cn(
            "border-input bg-background flex h-9 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none",
            "data-[placeholder]:text-muted-foreground",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "*:data-[slot=select-value]:truncate",
            className
        )}
        {...props}
    >
        {children}
        <SelectPrimitive.Icon asChild>
            <ChevronDown className="size-4 opacity-50" />
        </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
);

export const SelectContent = ({
    className,
    children,
    position = "popper",
    ...props
}: ComponentProps<typeof SelectPrimitive.Content>) => (
    <SelectPrimitive.Portal>
        <SelectPrimitive.Content
            data-slot="select-content"
            position={position}
            className={cn(
                "border-border bg-popover text-popover-foreground relative z-50 max-h-72 min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
                position === "popper" && "translate-y-1",
                className
            )}
            {...props}
        >
            <SelectPrimitive.Viewport
                className={cn(
                    "p-1",
                    position === "popper" && "w-full min-w-[var(--radix-select-trigger-width)]"
                )}
            >
                {children}
            </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
);

export const SelectLabel = ({
    className,
    ...props
}: ComponentProps<typeof SelectPrimitive.Label>) => (
    <SelectPrimitive.Label
        data-slot="select-label"
        className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
        {...props}
    />
);

export const SelectItem = ({
    className,
    children,
    ...props
}: ComponentProps<typeof SelectPrimitive.Item>) => (
    <SelectPrimitive.Item
        data-slot="select-item"
        className={cn(
            "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none",
            "focus:bg-accent focus:text-accent-foreground",
            "data-disabled:pointer-events-none data-disabled:opacity-50",
            className
        )}
        {...props}
    >
        <span className="absolute right-2 flex size-3.5 items-center justify-center">
            <SelectPrimitive.ItemIndicator>
                <Check className="size-4" />
            </SelectPrimitive.ItemIndicator>
        </span>
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
);

export const SelectSeparator = ({
    className,
    ...props
}: ComponentProps<typeof SelectPrimitive.Separator>) => (
    <SelectPrimitive.Separator
        data-slot="select-separator"
        className={cn("bg-border -mx-1 my-1 h-px", className)}
        {...props}
    />
);

export default Select;
