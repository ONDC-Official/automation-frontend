/** Sentinel for "no filter" — Radix Select cannot hold an empty string value. */
export const ANY_VALUE = "__any__";

/**
 * Columns, in display order. `sortKey: null` marks a column the server cannot
 * sort on, so the header renders as plain text rather than a dead button.
 */
export const TABLE_COLUMNS: Array<{
    label: string;
    sortKey: string | null;
    align?: "right";
}> = [
    { label: "Participant", sortKey: "host" },
    { label: "Role", sortKey: null },
    { label: "Sessions", sortKey: "sessions", align: "right" },
    { label: "First session", sortKey: "firstSessionAt" },
    { label: "First payload", sortKey: "firstPayloadAt" },
    { label: "Flows attempted", sortKey: "flowsAttempted", align: "right" },
    { label: "Flows judged", sortKey: "flowsJudged", align: "right" },
    { label: "Passed", sortKey: "flowsPassed", align: "right" },
    { label: "Failed", sortKey: "flowsFailed", align: "right" },
    { label: "Pass rate", sortKey: "passRate", align: "right" },
];

export const NP_TYPE_OPTIONS = ["BAP", "BPP"] as const;
