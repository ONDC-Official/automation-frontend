import type { McpRun } from "@store/api";

/** Progress for one run, as a whole percentage. */
export function runPercent(run: McpRun): number {
    const total = run.steps_total ?? 0;
    if (total === 0) return 0;
    return Math.round(((run.steps_complete ?? 0) / total) * 100);
}

/**
 * Is this the run currently moving?
 *
 * The workbench has one `activeFlow` per session and stores it; an engine
 * session can have several runs going at once and stores no such thing. So
 * "active" here is derived: a run that has started and is not finished or
 * written off. It drives only the card's tint in the run list — a step's own
 * spinner is keyed off that step's own status, not this, because the run
 * summary this reads and the step map a card opens to are two separate
 * fetches that can be a beat apart.
 */
export function isRunActive(run: McpRun): boolean {
    return run.flow_status === "IN_PROGRESS";
}

/**
 * Sort runs the way somebody watching would want them.
 *
 * Whatever is moving first, then whatever has not started, then what is
 * finished or blocked — a completed run is a result you go looking for, not
 * something you want at the top of the page while another is mid-flight.
 */
export function orderRuns(runs: McpRun[]): McpRun[] {
    const rank = (run: McpRun): number => {
        if (run.error !== undefined) return 3;
        switch (run.flow_status) {
            case "IN_PROGRESS":
                return 0;
            case "NOT_STARTED":
                return 1;
            default:
                return 2;
        }
    };

    return [...runs].sort((a, b) => rank(a) - rank(b) || a.flow_id.localeCompare(b.flow_id));
}

/** `2026-08-18T06:48:56.134Z` → `12:18:56`, in the reader's own timezone. */
export function clockTime(iso: string): string {
    const at = new Date(iso);
    if (Number.isNaN(at.getTime())) return iso;
    return at.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
}

/**
 * How long until this session stops resolving.
 *
 * Worth showing because expiry is silent: the engine's store drops a session on
 * TTL with no event, so a page that did not say "40 minutes left" would simply
 * start 404ing one day with no explanation.
 */
export function expiresIn(iso: string, now = Date.now()): string {
    const ms = new Date(iso).getTime() - now;
    if (Number.isNaN(ms)) return "unknown";
    if (ms <= 0) return "expired";

    const minutes = Math.floor(ms / 60_000);
    if (minutes < 60) return `${String(minutes)}m left`;
    const hours = Math.floor(minutes / 60);
    if (hours < 48) return `${String(hours)}h left`;
    return `${String(Math.floor(hours / 24))}d left`;
}
