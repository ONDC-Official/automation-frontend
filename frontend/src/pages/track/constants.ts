/**
 * A tracking token is `<sessionId>.<transactionId>`, both verbatim.
 *
 * Session ids come from express-session via uid-safe — URL-safe base64, so
 * `[A-Za-z0-9_-]` and not hex — while the transaction id is a UUID. A dot
 * appears in neither alphabet, which is what makes the split unambiguous.
 *
 * Checked here purely so an obviously malformed link fails fast in the browser;
 * the backend validates it again and is the authority.
 */
export const TRACK_TOKEN_RE =
    /^[A-Za-z0-9_-]+\.[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** Matches the workbench runner's own poll cadence (RideMapTab). */
export const TRACK_POLL_MS = 4000;
