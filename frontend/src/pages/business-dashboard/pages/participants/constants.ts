/** Sentinel for "no filter" — Radix Select cannot hold an empty string value. */
export const ANY_VALUE = "__any__";

/**
 * Columns, in display order. `sortKey: null` marks a column the server cannot
 * sort on, so the header renders as plain text rather than a dead button.
 *
 * Only the header and the loading skeleton iterate this list — the body cells
 * in ParticipantsTable are positional, so the two have to move together.
 */
export const TABLE_COLUMNS: Array<{
    label: string;
    sortKey: string | null;
    align?: "right";
}> = [
    { label: "Participant", sortKey: "host" },
    // The first four together identify a row, which is why Role is sortable
    // now: it is no longer a badge stack summarising the whole host.
    { label: "Role", sortKey: "npType" },
    { label: "Domain", sortKey: "domain" },
    // Sorts as text, so "10.0.0" lands before "2.0.0". Fine for the versions in
    // play; a semver collation would have to be built server-side.
    { label: "Version", sortKey: "version" },
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
