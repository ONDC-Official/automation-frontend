export type TopLevelView =
    | "docs"
    | "reference-implementation"
    | "flows"
    | "resources"
    | "error-codes"
    | "changelog";

export const TOP_LEVEL_VIEWS: TopLevelView[] = [
    "docs",
    "reference-implementation",
    "flows",
    "resources",
    "error-codes",
    "changelog",
];

export const VIEW_LABEL: Record<TopLevelView, string> = {
    docs: "Use Case Brief",
    "reference-implementation": "Reference Implementation",
    flows: "API Walkthrough",
    resources: "Additional Resources",
    "error-codes": "Error Codes",
    changelog: "Changelog",
};
