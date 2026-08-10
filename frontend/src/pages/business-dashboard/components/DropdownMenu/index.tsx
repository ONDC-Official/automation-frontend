import type { ComponentProps } from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { Check } from "lucide-react";
import { cn } from "@pages/business-dashboard/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;

export const DropdownMenuTrigger = (
    props: ComponentProps<typeof DropdownMenuPrimitive.Trigger>
) => <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;

export const DropdownMenuGroup = (props: ComponentProps<typeof DropdownMenuPrimitive.Group>) => (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
);

export const DropdownMenuContent = ({
    className,
    sideOffset = 4,
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) => (
    <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
            data-slot="dropdown-menu-content"
            sideOffset={sideOffset}
            className={cn(
                "border-border bg-popover text-popover-foreground z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto rounded-md border p-1 shadow-md",
                className
            )}
            {...props}
        />
    </DropdownMenuPrimitive.Portal>
);

export const DropdownMenuLabel = ({
    className,
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Label>) => (
    <DropdownMenuPrimitive.Label
        data-slot="dropdown-menu-label"
        className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
        {...props}
    />
);

export const DropdownMenuItem = ({
    className,
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item>) => (
    <DropdownMenuPrimitive.Item
        data-slot="dropdown-menu-item"
        className={cn(
            "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none",
            "focus:bg-accent focus:text-accent-foreground",
            "data-disabled:pointer-events-none data-disabled:opacity-50",
            "[&_svg:not([class*='size-'])]:size-4",
            className
        )}
        {...props}
    />
);

export const DropdownMenuCheckboxItem = ({
    className,
    children,
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) => (
    <DropdownMenuPrimitive.CheckboxItem
        data-slot="dropdown-menu-checkbox-item"
        className={cn(
            "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none select-none",
            "focus:bg-accent focus:text-accent-foreground",
            "data-disabled:pointer-events-none data-disabled:opacity-50",
            className
        )}
        {...props}
    >
        <span className="absolute left-2 flex size-3.5 items-center justify-center">
            <DropdownMenuPrimitive.ItemIndicator>
                <Check className="size-4" />
            </DropdownMenuPrimitive.ItemIndicator>
        </span>
        {children}
    </DropdownMenuPrimitive.CheckboxItem>
);

export const DropdownMenuSeparator = ({
    className,
    ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Separator>) => (
    <DropdownMenuPrimitive.Separator
        data-slot="dropdown-menu-separator"
        className={cn("bg-border -mx-1 my-1 h-px", className)}
        {...props}
    />
);

export default DropdownMenu;
