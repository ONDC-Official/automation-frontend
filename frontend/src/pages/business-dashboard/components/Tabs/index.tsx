import type { ComponentProps } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@dashboard/lib/utils";
import { tabsListVariants, tabsTriggerVariants } from "./variants";

const Tabs = ({ className, ...props }: ComponentProps<typeof TabsPrimitive.Root>) => (
    <TabsPrimitive.Root
        data-slot="tabs"
        className={cn("flex flex-col gap-3", className)}
        {...props}
    />
);

export const TabsList = ({
    className,
    variant,
    ...props
}: ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) => (
    <TabsPrimitive.List
        data-slot="tabs-list"
        className={cn(tabsListVariants({ variant }), className)}
        {...props}
    />
);

export const TabsTrigger = ({
    className,
    variant,
    ...props
}: ComponentProps<typeof TabsPrimitive.Trigger> & VariantProps<typeof tabsTriggerVariants>) => (
    <TabsPrimitive.Trigger
        data-slot="tabs-trigger"
        className={cn(tabsTriggerVariants({ variant }), className)}
        {...props}
    />
);

export const TabsContent = ({
    className,
    ...props
}: ComponentProps<typeof TabsPrimitive.Content>) => (
    <TabsPrimitive.Content
        data-slot="tabs-content"
        className={cn("flex-1 outline-none", className)}
        {...props}
    />
);

export default Tabs;
