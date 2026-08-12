import type { ParticipantRow } from "@pages/business-dashboard/services/types";

/**
 * What identifies a row: one NP, in one role, on one domain+version.
 *
 * null is a real value here — "ran sessions with none recorded" — never
 * "unknown", which is why these are not optional.
 */
export interface ParticipantSelection {
    host: string;
    npType: string | null;
    domain: string | null;
    version: string | null;
}

export const selectionOf = (row: ParticipantRow): ParticipantSelection => ({
    host: row.host,
    npType: row.npType ?? null,
    domain: row.domain ?? null,
    version: row.version ?? null,
});

/**
 * Stable string form of a selection, for React keys and `data-state` only —
 * never sent on the wire, where the four parts travel as their own query
 * params. NUL separates because a host may carry a port and a domain carries a
 * colon, so no printable separator is safe.
 */
export const participantKey = (selection: ParticipantSelection): string =>
    [selection.host, selection.npType ?? "", selection.domain ?? "", selection.version ?? ""].join(
        "\u0000"
    );

/** "BAP · ONDC:FIS10 · v2.1.0" — names the slice, for the drill-down header. */
export const sliceLabel = (selection: ParticipantSelection): string =>
    [
        selection.npType ?? "—",
        selection.domain ?? "—",
        selection.version ? `v${selection.version}` : "—",
    ].join(" · ");

/**
 * Pass rate wears the reserved status scale, but only once something has been
 * judged. A participant with no report yet is not failing — it is unmeasured,
 * and must stay on the neutral token.
 */
export function passRateTone(passRate: number | null | undefined) {
    if (passRate === null || passRate === undefined) return "secondary" as const;
    if (passRate >= 0.9) return "success" as const;
    if (passRate >= 0.7) return "alert" as const;
    return "error" as const;
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
