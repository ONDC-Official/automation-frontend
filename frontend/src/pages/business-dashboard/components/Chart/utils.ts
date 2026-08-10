import {
    CHART_SLOT_VARS,
    CHART_TONE_VARS,
    PRINT_MUTED,
    PRINT_SLOT_HEXES,
    PRINT_TONE_HEXES,
} from "./constants";
import type { ISeries } from "./types";

/**
 * Colour follows the entity, not its rank: a series keeps the slot it was
 * declared in, so filtering one out never repaints the survivors. Slots are
 * never cycled — past five series, fold the tail into "Other" or facet the
 * panel rather than reusing a hue.
 */
export function colorForSeries(series: ISeries, index: number) {
    if (series.tone) return CHART_TONE_VARS[series.tone];
    return CHART_SLOT_VARS[index] ?? "var(--muted-foreground)";
}

/**
 * The same assignment, resolved to literal hex for the PDF. Deliberately a
 * separate function rather than `getComputedStyle` on the live document: that
 * would hand a dark-mode reader the dark steps, which are chosen for a dark
 * surface and fail against white paper.
 */
export function printColorForSeries(series: ISeries, index: number) {
    if (series.tone) return PRINT_TONE_HEXES[series.tone];
    return PRINT_SLOT_HEXES[index] ?? PRINT_MUTED;
}

export const identityFormatter = (value: number) => String(value);
