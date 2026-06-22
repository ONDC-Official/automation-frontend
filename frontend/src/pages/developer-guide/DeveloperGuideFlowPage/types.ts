export type TopLevelView = "flows" | "error-codes" | "supported-actions" | "docs" | "changelog";

export const TOP_LEVEL_VIEWS: TopLevelView[] = [
    "flows",
    "error-codes",
    "supported-actions",
    "docs",
    "changelog",
];

export const VIEW_LABEL: Record<TopLevelView, string> = {
    docs: "Documents",
    flows: "Flows",
    "error-codes": "Error Codes",
    "supported-actions": "Actions",
    changelog: "Changelog",
};
