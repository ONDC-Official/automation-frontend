/**
 * Preset rows, per the dataviz filter-control spec: a short list of named
 * ranges with a custom range behind a hairline in the footer. `days: null` is
 * the "all time" row, which clears both bounds.
 */
export const RANGE_PRESETS = [
    { label: "Today", days: 0 },
    { label: "Last 7 days", days: 6 },
    { label: "Last 30 days", days: 29 },
    { label: "Last 90 days", days: 89 },
    { label: "All time", days: null },
] as const;
