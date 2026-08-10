import type { ISeries } from "@pages/business-dashboard/components/Chart";

export const DEFAULT_RANGE_DAYS = 29;

/**
 * Panel configs. A new chart on this page is a new entry here plus a `<Chart>`
 * driven by it — never new chart code.
 *
 * Passed/failed *mean* good and bad, so they wear the reserved status scale.
 * A chart never mixes status-toned and categorical series (dataviz collision
 * rule), which is why the domain panel below is a separate, single-series panel.
 */
export const TREND_SERIES: ISeries[] = [
    { key: "passed", label: "Passed", tone: "pass" },
    { key: "failed", label: "Failed", tone: "fail" },
];

/**
 * Domain is a nominal category — swapping the order changes nothing — so every
 * bar takes the same slot-1 hue and the panel carries no legend.
 */
export const DOMAIN_SERIES: ISeries[] = [{ key: "sessions", label: "Sessions" }];

export const MAX_DOMAIN_BARS = 12;
