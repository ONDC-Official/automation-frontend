/**
 * The categorical slots, in fixed order. Series take slot 1, 2, 3… in the order
 * they are declared and the order is NEVER cycled — a sixth series folds into
 * "Other", becomes a facet, or the panel is split. Validated with the dataviz
 * palette validator against both surfaces (see `src/index.css`).
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

export const CHART_GRID = "var(--chart-grid)";
export const CHART_AXIS = "var(--chart-axis)";
export const CHART_TEXT = "var(--muted-foreground)";
/** The surface colour, used for the 2px gap between stacked segments and dot rings. */
export const CHART_SURFACE = "var(--card)";

export const AXIS_TICK = { fill: CHART_TEXT, fontSize: 11 } as const;

/** Mark specs, fixed across every chart (dataviz marks-and-anatomy). */
export const LINE_WIDTH = 2;
export const MAX_BAR_SIZE = 24;
/** 4px rounded data-end, square at the baseline. */
export const BAR_CORNER_RADIUS = 4;
export const AREA_FILL_OPACITY = 0.1;
export const SURFACE_GAP = 2;
export const DEFAULT_HEIGHT = 260;

/**
 * Plot insets. `left` clears the widest y label, `bottom` the x labels; the
 * geometry core subtracts these before it scales anything, so both renderers
 * agree on the plot box without measuring the DOM.
 */
export const MARGIN = { top: 8, right: 8, bottom: 28, left: 48 } as const;

/** Rough width of one x label — sets how many bands can be labelled. */
export const AXIS_LABEL_WIDTH = 56;
export const Y_TICK_COUNT = 4;

/**
 * The print palette. `@react-pdf/renderer` resolves no CSS variables, and paper
 * is white in every theme — a report generated from dark mode must NOT carry the
 * dark steps onto the page. So print always takes the light values, validated
 * against the light surface, copied literally from `src/index.css`.
 */
export const PRINT_SLOT_HEXES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"] as const;

export const PRINT_TONE_HEXES = {
    pass: "#009966",
    fail: "#e7000b",
} as const;

export const PRINT_INK = "#252525";
export const PRINT_MUTED = "#717171";
export const PRINT_GRID = "#ededed";
export const PRINT_BORDER = "#e4e4e4";
export const PRINT_SURFACE = "#ffffff";
