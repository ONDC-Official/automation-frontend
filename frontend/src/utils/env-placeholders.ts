/**
 * Environment placeholders for flow-spec input schemas.
 *
 * Spec YAMLs are shared by every deployment, so a default such as a BPP URI cannot
 * hardcode the workbench host. Instead the spec writes a token and the frontend
 * fills it from its own build-time API service URL (VITE_BASE_URL):
 *
 *   default: "{{API_SERVICE_HOST}}"                          → workbench.ondc.tech
 *   default: "{{API_SERVICE_URL}}/ONDC:TRV11/2.0.0/seller"   → https://workbench.ondc.tech/api-service/ONDC:TRV11/2.0.0/seller
 *
 * Tokens are domain-agnostic: each spec appends its own domain/version path.
 */

const TOKEN_PATTERN = /\{\{(API_SERVICE_URL|API_SERVICE_HOST)\}\}/g;

type TokenValues = Record<"API_SERVICE_URL" | "API_SERVICE_HOST", string>;

function buildTokenValues(apiServiceBaseUrl: string | undefined): TokenValues | undefined {
    const trimmed = (apiServiceBaseUrl ?? "").trim().replace(/\/+$/, "");
    if (!trimmed) return undefined;
    try {
        return { API_SERVICE_URL: trimmed, API_SERVICE_HOST: new URL(trimmed).host };
    } catch {
        return undefined;
    }
}

function hasToken(value: string): boolean {
    TOKEN_PATTERN.lastIndex = 0;
    return TOKEN_PATTERN.test(value);
}

function replaceTokens(value: unknown, tokens: TokenValues): unknown {
    if (typeof value === "string") {
        return value.replace(TOKEN_PATTERN, (_, name: keyof TokenValues) => tokens[name]);
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
 * Return a copy of `schema` with {{API_SERVICE_URL}} / {{API_SERVICE_HOST}} filled in
 * every string. The input is never mutated. A schema without tokens, or a missing /
 * invalid base URL, returns the original schema unchanged.
 */
export function resolveEnvPlaceholders<T>(schema: T, apiServiceBaseUrl: string | undefined): T {
    if (!hasToken(JSON.stringify(schema) ?? "")) return schema;

    const tokens = buildTokenValues(apiServiceBaseUrl);
    if (!tokens) {
        console.warn(
            "resolveEnvPlaceholders: VITE_BASE_URL is missing or invalid; leaving placeholders unresolved"
        );
        return schema;
    }
    return replaceTokens(schema, tokens) as T;
}
