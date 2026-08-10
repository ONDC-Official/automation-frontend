import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** The only sanctioned way to compose classNames. */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** 1284 -> "1,284". Used for axis ticks and table figures. */
export function formatNumber(value: number | null | undefined) {
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
    return new Intl.NumberFormat("en-IN").format(value);
}

/** 1284 -> "1.3K". For stat tiles, where the exact digit count is noise. */
export function formatCompact(value: number | null | undefined) {
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
    return new Intl.NumberFormat("en-IN", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);
}

/**
 * A rate the backend sends as a 0..1 fraction, rendered as "94.2%".
 *
 * The scale is authoritative, not sniffed from the magnitude — `1` means 100%,
 * not 1%. `null` means "nothing judged yet" and renders as an em-dash, never
 * "0%", because 0% is a real and very different answer.
 */
export function formatPercent(value: number | null | undefined) {
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
    return `${(value * 100).toFixed(1)}%`;
}

/** ISO timestamp -> "12 Aug 2026, 14:03". Empty input renders an em dash. */
export function formatDateTime(value: string | null | undefined) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

/** ISO timestamp -> "12 Aug". Compact form for chart axes. */
export function formatDay(value: string | null | undefined) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
    }).format(date);
}

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
