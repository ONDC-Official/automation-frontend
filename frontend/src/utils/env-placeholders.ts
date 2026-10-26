/**
 * Placeholders for flow-spec input schemas.
 *
 * Spec YAMLs are shared by every deployment and every session, so a default such as a
 * BPP URI cannot be hardcoded. The spec writes a token and the frontend fills it in.
 *
 * Environment tokens — from the build-time API service URL (VITE_BASE_URL):
 *   {{API_SERVICE_URL}}   → https://workbench.ondc.tech/api-service
 *   {{API_SERVICE_HOST}}  → workbench.ondc.tech
 *
 * Session tokens — the party playing each side in the current session:
 *   {{SESSION_BPP_URI}} / {{SESSION_BAP_URI}}  → full callback URL of that side. The user's
 *       own subscriber URL for the side they play; the workbench mock URL
 *       (<API_SERVICE_URL>/<domain>/<version>/seller|buyer) for the other side.
 *   {{SESSION_BPP_ID}} / {{SESSION_BAP_ID}}    → hostname of the matching URI, so the
 *       id and URI always point at the same party.
 */

const TOKEN_NAMES = [
    "API_SERVICE_URL",
    "API_SERVICE_HOST",
    "SESSION_BPP_URI",
    "SESSION_BPP_ID",
    "SESSION_BAP_URI",
    "SESSION_BAP_ID",
] as const;

type TokenName = (typeof TOKEN_NAMES)[number];
type TokenValues = Partial<Record<TokenName, string>>;

const TOKEN_PATTERN = new RegExp(`\\{\\{(${TOKEN_NAMES.join("|")})\\}\\}`, "g");

/** What the current session knows about its participants. Every field is optional. */
export interface PlaceholderContext {
    /** Role the user plays in the session; the workbench mocks the other side. */
    npType?: string;
    /** The user's own callback URL. */
    subscriberUrl?: string;
    domain?: string;
    version?: string;
}

function normaliseBaseUrl(url: string | undefined): string | undefined {
    const trimmed = (url ?? "").trim().replace(/\/+$/, "");
    if (!trimmed) return undefined;
    try {
        new URL(trimmed);
        return trimmed;
    } catch {
        return undefined;
    }
}

/** Hostname (no scheme, port or path) of a URL, or undefined when it is not a valid URL. */
export function hostnameOf(url: string | undefined): string | undefined {
    if (!url) return undefined;
    try {
        return new URL(url).hostname || undefined;
    } catch {
        return undefined;
    }
}

function buildTokenValues(
    apiServiceBaseUrl: string | undefined,
    context: PlaceholderContext | undefined
): TokenValues {
    const values: TokenValues = {};
    const base = normaliseBaseUrl(apiServiceBaseUrl);
    if (base) {
        values.API_SERVICE_URL = base;
        values.API_SERVICE_HOST = new URL(base).host;
    }

    const workbenchUri = (side: "seller" | "buyer") =>
        base && context?.domain && context?.version
            ? `${base}/${context.domain}/${context.version}/${side}`
            : undefined;
    const userUri = hostnameOf(context?.subscriberUrl) ? context?.subscriberUrl?.trim() : undefined;
    const role = context?.npType?.toUpperCase();

    const bppUri = role === "BPP" ? userUri : workbenchUri("seller");
    const bapUri = role === "BAP" ? userUri : workbenchUri("buyer");

    if (bppUri) {
        values.SESSION_BPP_URI = bppUri;
        values.SESSION_BPP_ID = hostnameOf(bppUri);
    }
    if (bapUri) {
        values.SESSION_BAP_URI = bapUri;
        values.SESSION_BAP_ID = hostnameOf(bapUri);
    }
    return values;
}

function replaceTokens(value: unknown, tokens: TokenValues): unknown {
    if (typeof value === "string") {
        return value.replace(TOKEN_PATTERN, (match, name: TokenName) => tokens[name] ?? match);
    }
    if (Array.isArray(value)) {
        return value.map((item) => replaceTokens(item, tokens));
    }
    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, replaceTokens(item, tokens)])
        );
    }
    return value;
}

/**
 * Return a copy of `schema` with every known placeholder filled in. The input is never
 * mutated. A schema without placeholders is returned as-is. A placeholder that cannot be
 * resolved (missing/invalid base URL or session data) is left in place and logged once.
 */
export function resolveEnvPlaceholders<T>(
    schema: T,
    apiServiceBaseUrl: string | undefined,
    context?: PlaceholderContext
): T {
    const serialised = JSON.stringify(schema) ?? "";
    const used = new Set(
        Array.from(serialised.matchAll(TOKEN_PATTERN), (match) => match[1] as TokenName)
    );
    if (used.size === 0) return schema;

    const tokens = buildTokenValues(apiServiceBaseUrl, context);
    const unresolved = [...used].filter((name) => !tokens[name]);
    if (unresolved.length > 0) {
        console.warn(
            `resolveEnvPlaceholders: could not resolve ${unresolved.join(", ")}; leaving them unresolved`
        );
    }
    if (unresolved.length === used.size) return schema;
    return replaceTokens(schema, tokens) as T;
}
