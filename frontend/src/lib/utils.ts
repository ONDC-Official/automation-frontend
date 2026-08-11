import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
    extend: {
        classGroups: {
            "font-size": [
                "text-h1",
                "text-h2",
                "text-h3",
                "text-h4",
                "text-h5",
                "text-h6",
                "text-body-1",
                "text-body-2",
                "text-caption-1",
                "text-caption",
                "text-caption-2",
            ],
        },
    },
});

/**
 * Merges Tailwind class names with conflict resolution.
 *
 * @param inputs - Class values to combine
 * @returns A single deduplicated class string
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Local-calendar `YYYY-MM-DD`. Deliberately not `toISOString().slice(0,10)`
 * on the raw date: that is UTC, so anyone east or west of it gets a range
 * starting on the wrong day.
 */
/** A Date as `YYYY-MM-DD`, the wire format every date filter uses. */
export function toIsoDate(date: Date) {
    const offsetMs = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

/** `YYYY-MM-DD` for `daysAgo` days before today. */
export function isoDaysAgo(daysAgo: number) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return toIsoDate(date);
}

/** 1284 -> "1,284". Used for axis ticks and table figures. */
export function formatNumber(value: number | null | undefined) {
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
    return new Intl.NumberFormat("en-IN").format(value);
}
