import { type ElementType } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/Shadcn/Tabs/tabs";

export interface GuideTabItem<T extends string = string> {
    id: T;
    label: string;
    icon?: ElementType;
    /** When false the tab is hidden entirely. Defaults to true. */
    visible?: boolean;
}

export interface GuideTabsProps<T extends string = string> {
    tabs: GuideTabItem<T>[];
    active: T;
    onChange: (id: T) => void;
    className?: string;
}

/**
 * Underlined tab strip for Developer Guide screens. Uses the shared Shadcn
 * `Tabs` line variant (brand underline + secondary inactive labels) per Figma.
 */
const GuideTabs = <T extends string = string>({
    tabs,
    active,
    onChange,
    className,
}: GuideTabsProps<T>) => {
    const visible = tabs.filter((t) => t.visible !== false);

    return (
        <Tabs
            value={active}
            onValueChange={(value) => onChange(value as T)}
            className={cn("w-full gap-0", className)}
        >
            <TabsList variant="line" className="w-full justify-start px-2 py-3 gap-6">
                {visible.map((tab) => {
                    const Icon = tab.icon;

                    return (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className="flex-none px-0 py-2.5 text-body-1 font-medium"
                        >
                            {Icon && <Icon className="size-3.5 shrink-0" aria-hidden />}
                            {tab.label}
                        </TabsTrigger>
                    );
                })}
            </TabsList>
        </Tabs>
    );
};

export default GuideTabs;
