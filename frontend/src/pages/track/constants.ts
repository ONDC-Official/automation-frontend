/**
 * A tracking token is the session id followed by the transaction id with dashes
 * stripped — 32 + 32 hex characters. Checked here purely so an obviously
 * malformed link fails fast in the browser; the backend validates it again.
 */
export const TRACK_TOKEN_RE = /^[0-9a-f]{64}$/i;

/** Matches the workbench runner's own poll cadence (RideMapTab). */
export const TRACK_POLL_MS = 4000;
