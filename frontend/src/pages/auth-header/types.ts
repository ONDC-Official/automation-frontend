export type TabType = "overview" | "snippets" | "playground";

export interface TabConfig {
    id: TabType;
    label: string;
    icon: React.ReactNode;
}
