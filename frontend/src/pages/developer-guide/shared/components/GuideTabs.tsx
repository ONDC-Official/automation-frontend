import { type ElementType } from "react";
import { cn } from "@/lib/utils";

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
 * Plain underlined-text tab strip used across the redesigned Developer Guide
 * screens (top-level Documents/Flows/Error Codes/Actions/Changelog, detail
 * tabs, right-panel tabs). Visually distinct from `@components/ui/SegmentedTabs`
 * (pill/icon style) which stays untouched for legacy `developer-guide/*`.
 */
function GuideTabs<T extends string = string>({
    tabs,
    active,
    onChange,
    className,
}: GuideTabsProps<T>) {
    const visible = tabs.filter((t) => t.visible !== false);

    return (
        <nav
            role="tablist"
            className={cn("flex items-center gap-6 border-b border-slate-200 pb-[2px]", className)}
        >
            {visible.map((tab) => {
                const isActive = tab.id === active;
                const Icon = tab.icon;

                return (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange(tab.id)}
                        className={cn(
                            "relative flex items-center gap-1.5 pb-2 text-body-1 font-medium whitespace-nowrap transition-colors -mb-px border-b-2",
                            isActive
                                ? "text-sky-600 dark:text-sky-400 border-sky-500 dark:border-sky-400"
                                : "text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300"
                        )}
                    >
                        {Icon && (
                            <Icon
                                className={cn(
                                    "w-3.5 h-3.5",
                                    isActive ? "text-sky-500 dark:text-sky-400" : "text-slate-400"
                                )}
                            />
                        )}
                        {tab.label}
                    </button>
                );
            })}
        </nav>
    );
}

export default GuideTabs;
