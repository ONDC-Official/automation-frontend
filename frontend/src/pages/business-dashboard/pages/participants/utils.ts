import type { ParticipantRow } from "@pages/business-dashboard/services/types";

/**
 * Pass rate wears the reserved status scale, but only once something has been
 * judged. A participant with no report yet is not failing — it is unmeasured,
 * and must stay on the neutral token.
 */
export function passRateTone(passRate: number | null | undefined) {
    if (passRate === null || passRate === undefined) return "muted" as const;
    if (passRate >= 0.9) return "pass" as const;
    if (passRate >= 0.7) return "pending" as const;
    return "fail" as const;
}

/**
 * How much of what a participant ran has actually been judged.
 *
 * Only 43 of 102 sessions in the current data carry a flowMap, so this gap is
 * common and meaningful: flows were exercised but no report was produced.
 */
export function judgedCoverage(row: ParticipantRow) {
    if (row.flowsAttempted === 0) return null;
    return Math.min(1, row.flowsJudged / row.flowsAttempted);
}

/** "3 of 12 flows judged" — the sentence form used in the drill-down. */
export function judgedSummary(row: ParticipantRow) {
    if (row.flowsAttempted === 0) return "No flows exercised yet";
    if (row.flowsJudged === 0) return `None of ${row.flowsAttempted} flows judged yet`;
    return `${row.flowsJudged} of ${row.flowsAttempted} flows judged`;
}
