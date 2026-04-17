import { type ElementType } from "react";

export interface TabItem<T extends string = string> {
    id: T;
    label: string;
    /** Any react-icons (or similar) icon component */
    icon?: ElementType;
    /** When false the tab is hidden entirely. Defaults to true. */
    visible?: boolean;
}

interface SegmentedTabsProps<T extends string = string> {
    tabs: TabItem<T>[];
    active: T;
    onChange: (id: T) => void;
    className?: string;
}

export function SegmentedTabs<T extends string = string>({
    tabs,
    active,
    onChange,
    className = "",
}: SegmentedTabsProps<T>) {
    const visible = tabs.filter((t) => t.visible !== false);

    return (
        <nav
            className={`flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200/70 w-fit shadow-inner ${className}`}
        >
            {visible.map((tab) => {
                const isActive = tab.id === active;
                const Icon = tab.icon;

                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onChange(tab.id)}
                        className={`group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                            isActive
                                ? "bg-white text-sky-600 shadow-sm border border-sky-100 ring-1 ring-sky-200/50"
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
                        }`}
                    >
                        {Icon && (
                            <Icon
                                className={`w-3.5 h-3.5 transition-colors ${
                                    isActive
                                        ? "text-sky-500"
                                        : "text-slate-400 group-hover:text-slate-500"
                                }`}
                            />
                        )}
                        {tab.label}
                    </button>
                );
            })}
        </nav>
    );
}
