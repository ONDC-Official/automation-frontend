/**
 * The categorical slots, in fixed order. Series take slot 1, 2, 3… in the order
 * they are declared and the order is NEVER cycled — a sixth series folds into
 * "Other", becomes a facet, or the panel is split. Validated with the dataviz
 * palette validator against both surfaces (see pages/business-dashboard/tokens.css).
 */
export const CHART_SLOT_VARS = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
] as const;

/**
 * Reserved status scale — used when a series *means* good/bad, never for
 * "series 4". Deliberately only two entries: see `ChartTone` in ./types.
 */
export const CHART_TONE_VARS = {
    pass: "var(--status-pass)",
    fail: "var(--status-fail)",
} as const;

/** Mark specs, fixed across every chart (dataviz marks-and-anatomy). */
export const LINE_WIDTH = 2;
export const MAX_BAR_SIZE = 24;
/** 4px rounded data-end, square at the baseline. */
export const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0];
export const AREA_FILL_OPACITY = 0.1;
export const DEFAULT_HEIGHT = 260;
export const AXIS_TICK_FONT_SIZE = 11;
