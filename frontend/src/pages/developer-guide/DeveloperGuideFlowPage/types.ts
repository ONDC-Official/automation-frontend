export type TopLevelView = "flows" | "error-codes" | "docs" | "changelog";

export const TOP_LEVEL_VIEWS: TopLevelView[] = ["flows", "error-codes", "docs", "changelog"];

export const VIEW_LABEL: Record<TopLevelView, string> = {
    docs: "Use Case Brief",
    flows: "API Walkthrough",
    "error-codes": "Error Codes",
    changelog: "Changelog",
};
