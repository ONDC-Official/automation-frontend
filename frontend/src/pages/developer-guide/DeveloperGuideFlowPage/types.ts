export type TopLevelView =
    | "docs"
    | "reference-implementation"
    | "flows"
    | "error-codes"
    | "changelog";

export const TOP_LEVEL_VIEWS: TopLevelView[] = [
    "docs",
    "reference-implementation",
    "flows",
    "error-codes",
    "changelog",
];

export const VIEW_LABEL: Record<TopLevelView, string> = {
    docs: "Use Case Brief",
    "reference-implementation": "Reference Implementation",
    flows: "API Walkthrough",
    "error-codes": "Error Codes",
    changelog: "Changelog",
};
