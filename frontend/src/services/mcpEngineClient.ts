import axios from "axios";
// The sanctioned wrapper — `window.sessionStorage` is lint-banned so that
// persistence goes through one place. Note its API is async, which is why the
// reads below are promises.
import { sessionStorage } from "@store/storage";

/**
 * The client for an ondc-mcp engine, which is **not** this app's backend.
 *
 * The MCP session viewer reads a mock-NP engine that the person running the
 * test owns — its address arrives in the link, so it is different on every
 * visit and is not `VITE_BACKEND_URL`. That is the whole shape of the feature:
 * this app serves the page, the engine serves the data, and no payload ever
 * passes through us.
 *
 * ## Why this is a separate instance and not `apiClient`
 *
 * `apiClient` attaches the signed-in user's workbench token to **every**
 * request (`services/apiClient.ts`), and `withCredentials: true` sends our
 * cookies besides. Both are correct for our own backend and wrong here: the
 * engine origin comes out of a URL somebody was handed, and sending a
 * workbench credential to an arbitrary host because it appeared in a link is
 * exactly the mistake this file exists to avoid. No interceptors, no
 * credentials, and the only header sent is the engine's own token.
 */
export const mcpEngineClient = axios.create({
    timeout: 30_000,
    withCredentials: false,
    headers: { "Content-Type": "application/json" },
});

/** What the link carries, once it has been read and checked. */
export interface McpEngineTarget {
    /** Origin of the engine, with no trailing slash. */
    engine: string;
    sessionId: string;
    token: string;
}

/**
 * Read the target out of the URL **fragment**.
 *
 * A fragment, not a query string, and that is not a style choice: a query
 * string is sent to this app's host in the request line, so the engine token —
 * a credential for somebody else's server — would land in our access logs and
 * our CDN's. A fragment never leaves the browser. `ondc-mcp` builds the link
 * this way for the same reason; the two halves have to agree.
 *
 * Returns `null` rather than throwing, because a malformed link is a page state
 * to render, not an exception to swallow somewhere up the tree.
 */
export function parseMcpEngineTarget(hash: string): McpEngineTarget | null {
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const engine = params.get("engine");
    const sessionId = params.get("session");
    const token = params.get("k");

    if (!engine || !sessionId || !token) return null;

    const origin = normaliseEngineOrigin(engine);
    if (!origin) return null;

    return { engine: origin, sessionId, token };
}

/**
 * What the page starts with, before the tab has been asked what it remembers.
 *
 * `undefined`, never `null`, and that distinction is the whole point:
 * downstream, `undefined` means "still resolving" and `null` means "asked
 * everywhere, definitely absent". `parseMcpEngineTarget` answers `null` for a
 * missing fragment — which is correct for a parser and wrong as a starting
 * state, because on a reload the fragment is *always* missing and `null` would
 * end the search before the stored copy was consulted.
 *
 * That exact inversion shipped once: the page cleared the hash, the reload
 * found none, and the stored fallback was never reached. Hence a named function
 * with a test on it rather than a `??` at the call site.
 */
export function initialMcpEngineTarget(hash: string): McpEngineTarget | undefined {
    return parseMcpEngineTarget(hash) ?? undefined;
}

/**
 * Where the target is kept once the fragment has been read and cleared.
 *
 * `sessionStorage`, not `localStorage`, and the difference is the point: it is
 * scoped to this tab and dies with it, so closing the tab forgets the engine
 * token without anybody having to remember to log out. Two tabs watching two
 * engines also cannot collide, which is why the key needs no session in it.
 */
const TARGET_KEY = "mcp-session-target";

/**
 * Survive a reload without putting the token back in the URL.
 *
 * The first version of this cleared the fragment on mount and kept the target
 * in React state alone — so the page worked until somebody pressed refresh, and
 * then told them their link was incomplete. On a page whose whole job is to
 * watch something happen, refusing to reload is not a small bug.
 *
 * So the two goals are kept apart: the address bar is cleaned (nothing to
 * screenshot, nothing in history), and the tab remembers.
 */
export async function storeMcpEngineTarget(target: McpEngineTarget): Promise<void> {
    try {
        await sessionStorage.setItem(TARGET_KEY, JSON.stringify(target));
    } catch {
        // Private modes and storage-partitioned iframes can refuse. The page
        // still works for as long as it is open; only reload is lost, which is
        // exactly where it was before this existed.
    }
}

/**
 * Read the remembered target back, **through the same validation as a link**.
 *
 * Re-validating is not paranoia about our own write: `sessionStorage` is
 * readable and writable by any script on this origin, so a value read out of it
 * deserves precisely as much trust as one that arrived in a URL — and that is
 * the level `parseMcpEngineTarget` already applies.
 */
export async function readStoredMcpEngineTarget(): Promise<McpEngineTarget | null> {
    let raw: string | null;
    try {
        // Resolves `null` when absent, despite the `Promise<string>` type.
        raw = (await sessionStorage.getItem(TARGET_KEY)) as string | null;
    } catch {
        return null;
    }
    if (!raw) return null;

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return null;
    }

    if (typeof parsed !== "object" || parsed === null) return null;
    const { engine, sessionId, token } = parsed as Record<string, unknown>;
    if (typeof engine !== "string" || typeof sessionId !== "string" || typeof token !== "string") {
        return null;
    }

    const origin = normaliseEngineOrigin(engine);
    if (!origin || !sessionId || !token) return null;

    return { engine: origin, sessionId, token };
}

/** Forget this tab's engine, for a page that wants to stop watching. */
export async function clearStoredMcpEngineTarget(): Promise<void> {
    try {
        await sessionStorage.removeItem(TARGET_KEY);
    } catch {
        // Nothing to do, and nothing depends on it having worked.
    }
}

/**
 * Accept only an `http(s)` URL, and keep only its origin and path.
 *
 * The engine address is attacker-supplyable — a link is just a string somebody
 * sends you — and the token travels with it. Refusing anything that is not
 * `http:`/`https:` rules out `javascript:` and `data:`; dropping the query and
 * fragment stops a crafted address from smuggling parameters onto every request
 * we then make with a credential attached.
 */
function normaliseEngineOrigin(raw: string): string | null {
    let url: URL;
    try {
        url = new URL(raw);
    } catch {
        return null;
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    return `${url.origin}${url.pathname}`.replace(/\/+$/, "");
}
