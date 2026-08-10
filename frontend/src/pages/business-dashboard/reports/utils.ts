import { formatDay } from "@dashboard/lib/utils";

/** Either bound may be open — the date picker allows an unbounded window. */
export interface IReportRange {
    from?: string;
    to?: string;
}

/** An open bound is a real state, and it must not print as "— 30 Jul". */
export function describeRange({ from, to }: IReportRange) {
    if (from && to) return `${formatDay(from)} – ${formatDay(to)}`;
    if (from) return `From ${formatDay(from)}`;
    if (to) return `Up to ${formatDay(to)}`;
    return "All time";
}
