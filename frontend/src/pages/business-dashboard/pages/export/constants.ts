/**
 * Columns the CSV can carry. `id` goes on the wire as `?columns=` against a
 * server-side whitelist — an unknown column is a 400, not a silent drop — so
 * this list must stay in step with it.
 *
 * Held in the server's own canonical order (the order used when `columns` is
 * omitted), so the preview's column order always matches the delivered file.
 * The picker groups them for display without disturbing that order.
 */
export const EXPORT_COLUMNS = [
    { id: "sessionId", label: "Session id", group: "Identity" },
    { id: "createdAt", label: "Created at", group: "Identity" },
    { id: "updatedAt", label: "Updated at", group: "Identity" },
    { id: "npType", label: "NP type", group: "Participant" },
    { id: "npId", label: "NP id", group: "Participant" },
    { id: "sessionType", label: "Session type", group: "Participant" },
    { id: "domain", label: "Domain", group: "Participant" },
    { id: "version", label: "Version", group: "Participant" },
    { id: "usecaseId", label: "Usecase id", group: "Participant" },
    { id: "userId", label: "User id", group: "Identity" },
    { id: "reportExists", label: "Report exists", group: "Results" },
    { id: "flowsTotal", label: "Flows total", group: "Results" },
    { id: "flowsCompleted", label: "Flows completed", group: "Results" },
    { id: "flowsPassed", label: "Flows passed", group: "Results" },
    { id: "flowsFailed", label: "Flows failed", group: "Results" },
    { id: "passRate", label: "Pass rate", group: "Results" },
    { id: "result", label: "Result", group: "Results" },
] as const;

export const COLUMN_GROUPS = ["Identity", "Participant", "Results"] as const;

/** A CSV row with no session id is unusable, so this column cannot be dropped. */
export const LOCKED_COLUMN_IDS: string[] = ["sessionId"];

/** Sensible starting selection — identity plus the derived result counts. */
export const DEFAULT_COLUMN_IDS = [
    "sessionId",
    "createdAt",
    "npType",
    "sessionType",
    "domain",
    "version",
    "reportExists",
    "flowsTotal",
    "flowsPassed",
    "flowsFailed",
    "passRate",
    "result",
];

/** Rows shown in the preview — the export itself streams the full slice. */
export const PREVIEW_LIMIT = 5;
