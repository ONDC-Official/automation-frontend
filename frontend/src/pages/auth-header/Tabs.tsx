import { Button } from "@/components/Shadcn/Button";
import { TabConfig, TabType } from "@pages/auth-header/types";

interface TabsProps {
    tabs: TabConfig[];
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    layout?: "default" | "hero";
}

const Tabs = ({ tabs, activeTab, setActiveTab, layout = "default" }: TabsProps) => {
    const isHero = layout === "hero";

    return (
        <div
            className={
                isHero
                    ? "flex flex-row flex-nowrap gap-2"
                    : "mb-6 flex gap-2 border-b border-n-40 pb-4 dark:border-border-default"
            }
            role="tablist"
            aria-label="Auth header documentation tabs"
        >
            {tabs.map((tab) => (
                <Button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`tabpanel-${tab.id}`}
                    id={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-2 font-medium transition-all ${
                        isHero
                            ? "shrink-0 whitespace-nowrap rounded-xl px-5 py-3 text-sm"
                            : "rounded-lg px-5 py-3"
                    } ${
                        activeTab === tab.id
                            ? "bg-brand-normal text-n-0 shadow-lg shadow-brand-normal/20"
                            : isHero
                              ? "border border-n-40 bg-white text-n-300 hover:border-brand-normal/40 hover:bg-brand-light dark:border-border-default dark:bg-surface-elevated dark:text-n-60 dark:hover:bg-brand-normal/10"
                              : "border border-n-40 bg-white text-n-300 hover:bg-n-20 dark:border-border-default dark:bg-surface-elevated dark:text-n-60 dark:hover:bg-surface-muted"
                    }`}
                >
                    {tab.icon}
                    {tab.label}
                </Button>
            ))}
        </div>
    );
};

export default Tabs;
