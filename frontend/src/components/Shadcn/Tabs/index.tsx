import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Shadcn/Tabs/tabs";
import { cn } from "@/lib/utils";
import type { FlowTabsProps } from "@/components/Shadcn/Tabs/types";

export const FlowTabs = ({
    options,
    value,
    onValueChange,
    children,
    className,
    variant = "line",
}: FlowTabsProps) => (
    <Tabs value={value} onValueChange={onValueChange} className={cn("w-full gap-0", className)}>
        <TabsList variant={variant as "line" | "default"}>
            {options.map((option) => (
                <TabsTrigger key={option.key} value={option.key}>
                    {option.label}
                </TabsTrigger>
            ))}
        </TabsList>
        {children}
    </Tabs>
);

export { Tabs, TabsContent, TabsList, TabsTrigger };
