/** The sentinel a Radix Select uses for "no filter" — it cannot hold "". */
export const ANY_VALUE = "__any__";

export const RESULT_OPTIONS = [
    { label: "Any result", value: ANY_VALUE },
    { label: "Pass", value: "PASS" },
    { label: "Fail", value: "FAIL" },
    { label: "Mixed", value: "MIXED" },
] as const;

export const REPORT_OPTIONS = [
    { label: "Any report state", value: ANY_VALUE },
    { label: "Report exists", value: "true" },
    { label: "No report", value: "false" },
] as const;

/**
 * `sortKey` must be null or a member of SORTABLE_FIELDS — the server 400s on
 * anything else, so `reportExists` and `result` are deliberately unsortable.
 */
export const TABLE_COLUMNS = [
    { label: "Session", sortKey: "sessionId" },
    { label: "Domain", sortKey: "domain" },
    { label: "Version", sortKey: "version" },
    { label: "NP", sortKey: "npType" },
    { label: "Type", sortKey: "sessionType" },
    { label: "Flows", sortKey: "flowsTotal" },
    { label: "Result", sortKey: null },
    { label: "Pass rate", sortKey: "passRate" },
    { label: "Report", sortKey: null },
    { label: "Created", sortKey: "createdAt" },
] as const;

/** flowSummary keys, in the order the detail sheet renders them. */
export const FLOW_SUMMARY_TAGS = ["MANDATORY", "REPORTABLE", "OPTIONAL"] as const;
