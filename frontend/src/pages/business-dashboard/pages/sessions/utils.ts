import type { FlowSummaryEntry, SessionResult } from "@pages/business-dashboard/services/types";

/**
 * Maps the server's `result` onto a badge variant. Nothing is derived here —
 * `result` is the same expression the `?result=` filter matches on, so the
 * badge and the filter cannot disagree.
 */
export function badgeVariantForResult(result: SessionResult | null) {
    switch (result) {
        case "PASS":
            return "success" as const;
        case "FAIL":
            return "error" as const;
        case "MIXED":
            return "alert" as const;
        default:
            return "secondary" as const;
    }
}

/** `null` means nothing has been judged yet — not a failure, not a zero. */
export function resultLabel(result: SessionResult | null) {
    return result ?? "Unjudged";
}

/** `{ MANDATORY: {…} }` -> a stable array the summary card can map over. */
export function flowSummaryRows(
    summary: Record<string, FlowSummaryEntry> | null | undefined,
    order: readonly string[]
) {
    if (!summary) return [];

    const known = order.filter((tag) => summary[tag]).map((tag) => ({ tag, ...summary[tag] }));

    const extra = Object.keys(summary)
        .filter((tag) => !order.includes(tag))
        .map((tag) => ({ tag, ...summary[tag] }));

    return [...known, ...extra];
}

/** Counts PASS/FAIL entries in `flowMap` for the detail sheet's summary line. */
export function flowMapTotals(flowMap: Record<string, "PASS" | "FAIL"> | null | undefined) {
    const entries = Object.entries(flowMap ?? {});
    return {
        entries,
        passed: entries.filter(([, result]) => result === "PASS").length,
        failed: entries.filter(([, result]) => result === "FAIL").length,
    };
}
