export type TabType = "overview" | "snippets" | "tryit";

export interface TabConfig {
    id: TabType;
    label: string;
    icon: React.ReactNode;
}
