/**
 * How often the page refetches when it is **not** being pushed to.
 *
 * The engine streams its journal over SSE, and every event triggers a refetch —
 * so this is the fallback for a stream that could not be opened (a proxy that
 * buffers, a browser that gave up) rather than the normal path. Slower than the
 * workbench's 5s poll on purpose: with the stream working, polling this often
 * would be pure waste, and with it broken the page is still live enough to
 * follow a run.
 */
export const MCP_FALLBACK_POLL_MS = 8_000;

/** Matches the workbench's side panel, so the two pages scroll alike. */
export const MCP_INSPECTOR_MAX_HEIGHT = "600px";
