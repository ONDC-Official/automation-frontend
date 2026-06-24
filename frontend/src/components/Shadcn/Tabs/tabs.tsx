import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

const Tabs = ({
    className,
    orientation = "horizontal",
    ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) => (
    <TabsPrimitive.Root
        data-slot="tabs"
        data-orientation={orientation}
        orientation={orientation}
        className={cn("group/tabs flex data-[orientation=horizontal]:flex-col", className)}
        {...props}
    />
);

const tabsListVariants = cva(
    "group/tabs-list inline-flex w-full items-center justify-start rounded-none p-0 text-n-80 group-data-[orientation=horizontal]/tabs:h-auto group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:rounded-none",
    {
        variants: {
            variant: {
                default: "bg-transparent",
                // line: "gap-0 border-b border-n-30 bg-transparent dark:border-border-default",
                line: "gap-0 bg-transparent",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

const TabsList = ({
    className,
    variant = "default",
    ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) => (
    <TabsPrimitive.List
        data-slot="tabs-list"
        data-variant={variant}
        className={cn(tabsListVariants({ variant }), className)}
        {...props}
    />
);

const TabsTrigger = ({
    className,
    ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) => (
    <TabsPrimitive.Trigger
        data-slot="tabs-trigger"
        className={cn(
            "relative inline-flex flex-1 items-center justify-center gap-1.5 border-b-2 border-transparent px-4 py-2.5 text-body-2 font-semibold whitespace-nowrap text-text-secondary transition-all hover:text-brand-normal focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
            "group-data-[variant=line]/tabs-list:flex-none group-data-[variant=line]/tabs-list:justify-start",
            "data-[state=active]:border-brand-normal data-[state=active]:text-brand-normal",
            className
        )}
        {...props}
    />
);

const TabsContent = ({
    className,
    ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) => (
    <TabsPrimitive.Content
        data-slot="tabs-content"
        className={cn("flex-1 outline-none data-[state=inactive]:hidden", className)}
        {...props}
    />
);

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
