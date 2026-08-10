import { toIsoDate } from "@pages/business-dashboard/lib/utils";
import type { SessionStatsResponse } from "@pages/business-dashboard/services/types";

type DayPoint = SessionStatsResponse["byDay"][number];

/** Guard against a bad range silently generating an unbounded series. */
const MAX_DAYS = 400;

/**
 * `byDay` is ascending but SPARSE — a day with no sessions is absent entirely.
 * Plotted as-is, a three-week gap renders as one flat segment between two
 * adjacent points and the trend lies about spacing. This fills every missing
 * day with an explicit zero.
 *
 * The window comes from the active filter when it is bounded; otherwise it
 * spans the data's own first and last day.
 */
export function fillDayGaps(byDay: DayPoint[], from?: string, to?: string): DayPoint[] {
    if (byDay.length === 0) return [];

    const known = new Map(byDay.map((point) => [point.date, point]));
    const start = new Date(`${from ?? byDay[0].date}T00:00:00`);
    const end = new Date(`${to ?? byDay[byDay.length - 1].date}T00:00:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return byDay;
    if (end < start) return byDay;

    const filled: DayPoint[] = [];
    const cursor = new Date(start);

    while (cursor <= end && filled.length < MAX_DAYS) {
        const date = toIsoDate(cursor);
        filled.push(known.get(date) ?? { date, sessions: 0, passed: 0, failed: 0 });
        cursor.setDate(cursor.getDate() + 1);
    }

    // A range wider than the guard falls back to the raw series rather than a
    // truncated one, which would misrepresent the tail.
    return filled.length < MAX_DAYS ? filled : byDay;
}

/** Bucket keys are nullable — a session may carry no domain/version/npType. */
export function bucketLabel(value: string | null | undefined) {
    return value ?? "(none)";
}
