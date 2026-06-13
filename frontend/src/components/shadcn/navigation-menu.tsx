import { cva } from "class-variance-authority";
import { ChevronDownIcon } from "lucide-react";
import { NavigationMenu as NavigationMenuPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function NavigationMenu({
    className,
    children,
    viewport = true,
    ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Root> & {
    viewport?: boolean;
}) {
    return (
        <NavigationMenuPrimitive.Root
            data-slot="navigation-menu"
            data-viewport={viewport}
            className={cn(
                "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
                className
            )}
            {...props}
        >
            {children}
            {viewport && <NavigationMenuViewport />}
        </NavigationMenuPrimitive.Root>
    );
}

function NavigationMenuList({
    className,
    ...props
}: ComponentProps<typeof NavigationMenuPrimitive.List>) {
    return (
        <NavigationMenuPrimitive.List
            data-slot="navigation-menu-list"
            className={cn(
                "group flex flex-1 list-none items-center justify-center gap-1",
                className
            )}
            {...props}
        />
    );
}

function NavigationMenuItem({
    className,
    ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Item>) {
    return (
        <NavigationMenuPrimitive.Item
            data-slot="navigation-menu-item"
            className={cn(
                "relative has-[a[aria-current=page]]:**:data-[slot=navigation-menu-trigger]:text-brand-normal-hover",
                className
            )}
            {...props}
        />
    );
}

const navigationMenuTriggerStyle = cva(
    cn(
        "group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 outline-none hover:bg-transparent focus:bg-transparent focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 text-sm font-medium text-foreground transition-colors hover:text-brand-normal-hover focus:text-brand-normal-active data-[state=open]:bg-transparent data-[state=open]:text-foreground data-[state=open]:hover:bg-transparent data-[state=open]:hover:text-brand-normal-hover data-[state=open]:focus:bg-transparent data-[state=open]:focus:text-brand-normal-active"
    )
);

function NavigationMenuTrigger({
    className,
    children,
    ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
    return (
        <NavigationMenuPrimitive.Trigger
            data-slot="navigation-menu-trigger"
            className={cn(navigationMenuTriggerStyle(), "group", className)}
            {...props}
        >
            {children}{" "}
            <ChevronDownIcon
                className="relative top-1px ml-1 size-3 transition duration-300 group-data-[state=open]:rotate-180"
                aria-hidden="true"
            />
        </NavigationMenuPrimitive.Trigger>
    );
}

function NavigationMenuContent({
    className,
    forceMount = true,
    ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Content>) {
    return (
        <NavigationMenuPrimitive.Content
            data-slot="navigation-menu-content"
            forceMount={forceMount}
            className={cn(
                "top-0 left-0 w-full p-2 pr-2.5 data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 data-[motion^=from-]:animate-in data-[motion^=from-]:fade-in data-[motion^=to-]:animate-out data-[motion^=to-]:fade-out md:absolute md:w-auto",
                "group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-1.5 group-data-[viewport=false]/navigation-menu:z-50 group-data-[viewport=false]/navigation-menu:w-max group-data-[viewport=false]/navigation-menu:min-w-max group-data-[viewport=false]/navigation-menu:overflow-hidden group-data-[viewport=false]/navigation-menu:rounded-md group-data-[viewport=false]/navigation-menu:border group-data-[viewport=false]/navigation-menu:bg-popover group-data-[viewport=false]/navigation-menu:text-popover-foreground group-data-[viewport=false]/navigation-menu:shadow group-data-[viewport=false]/navigation-menu:duration-200 group-data-[viewport=false]/navigation-menu:**:data-[slot=navigation-menu-link]:whitespace-nowrap **:data-[slot=navigation-menu-link]:focus:ring-0 **:data-[slot=navigation-menu-link]:focus:outline-none data-[state=closed]:pointer-events-none data-[state=closed]:invisible data-[state=closed]:absolute data-[state=closed]:h-0 data-[state=closed]:overflow-hidden data-[state=closed]:border-0 data-[state=closed]:p-0 data-[state=closed]:opacity-0 data-[state=open]:visible data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
                className
            )}
            {...props}
        />
    );
}

function NavigationMenuViewport({
    className,
    ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
    return (
        <div className={cn("absolute top-full left-0 isolate z-50 flex justify-center")}>
            <NavigationMenuPrimitive.Viewport
                data-slot="navigation-menu-viewport"
                className={cn(
                    "origin-top-center relative mt-1.5 h-(--radix-navigation-menu-viewport-height) w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:zoom-in-90 md:w-(--radix-navigation-menu-viewport-width)",
                    className
                )}
                {...props}
            />
        </div>
    );
}

function NavigationMenuLink({
    className,
    ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Link>) {
    return (
        <NavigationMenuPrimitive.Link
            data-slot="navigation-menu-link"
            className={cn(
                "flex flex-col gap-1 rounded-sm p-2 outline-none aria-[current=page]:text-brand-normal-hover data-[active=true]:text-brand-normal-active [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground text-sm font-medium text-foreground transition-colors hover:text-brand-normal-hover focus:text-brand-normal-active",
                className
            )}
            {...props}
        />
    );
}

function NavigationMenuIndicator({
    className,
    ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Indicator>) {
    return (
        <NavigationMenuPrimitive.Indicator
            data-slot="navigation-menu-indicator"
            className={cn(
                "top-full z-1 flex h-1.5 items-end justify-center overflow-hidden data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:animate-in data-[state=visible]:fade-in",
                className
            )}
            {...props}
        >
            <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
        </NavigationMenuPrimitive.Indicator>
    );
}

export {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuContent,
    NavigationMenuTrigger,
    NavigationMenuLink,
    NavigationMenuIndicator,
    NavigationMenuViewport,
    navigationMenuTriggerStyle,
};
