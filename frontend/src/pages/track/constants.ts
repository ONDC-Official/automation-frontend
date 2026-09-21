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

/**
 * How often the page asks for new ride state.
 *
 * Matched to the seller's `on_track` cadence rather than the workbench runner's
 * 4s poll: the driver animation emits a fix every 2s, so polling any slower
 * discards half of them and doubles the distance the marker has to estimate
 * between corrections.
 */
export const TRACK_POLL_MS = 2000;
