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

/**
 * Counts `flowMap` entries for the detail sheet's summary line.
 *
 * Typed as an open `string` map rather than the `FlowResult` union on purpose:
 * the stored field is unvalidated (`Schema.Types.Mixed` upstream), and older
 * documents carry a literal "RUN" written by a workbench bug. Such a value is
 * neither a pass nor a failure, so it gets its own bucket instead of being
 * silently dropped — `passed + failed + unknown === entries.length` always, and
 * the card can say so rather than implying the flows were judged.
 */
export function flowMapTotals(flowMap: Record<string, string> | null | undefined) {
    const entries = Object.entries(flowMap ?? {});
    const passed = entries.filter(([, result]) => result === "PASS").length;
    const failed = entries.filter(([, result]) => result === "FAIL").length;
    return { entries, passed, failed, unknown: entries.length - passed - failed };
}
