export type TabType = "overview" | "snippets";

export interface TabConfig {
    id: TabType;
    label: string;
    icon: React.ReactNode;
}
