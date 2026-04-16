import { STORAGE_KEY } from "./constants";
import { v4 as uuidv4 } from "uuid";

export function getAssistantBaseUrl(): string {
    return import.meta.env.VITE_CHATBOT_MCP_BASE_URL || "";
}

export function getSessionId(): string {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
        return existing;
    }
    const created = uuidv4();
    localStorage.setItem(STORAGE_KEY, created);
    return created;
}

export function describeArgs(args: unknown): string {
    if (!args || typeof args !== "object") {
        return "";
    }

    const parsed = args as Record<string, unknown>;
    const query = String(
        parsed.query ??
            (parsed.input as Record<string, unknown> | undefined)?.query ??
            parsed.cypher ??
            ""
    );
    const source = String(parsed.query_from ?? "");
    const sourceTag = source ? ` [${source}]` : "";

    if (query) {
        const snippet = query.slice(0, 45);
        return `query: "${snippet}${query.length > 45 ? "..." : ""}"${sourceTag}`;
    }

    const keys = Object.keys(parsed).filter((key) => key !== "query_from");
    if (!keys.length) {
        return sourceTag;
    }

    const inline = keys
        .slice(0, 2)
        .map((key) => `${key}: ${String(parsed[key]).slice(0, 30)}`)
        .join(" · ");
    return `${inline}${sourceTag}`;
}

export function parsePayloadString(value: unknown): string {
    if (typeof value === "string") {
        return value;
    }
    if (value === null || value === undefined) {
        return "";
    }
    return JSON.stringify(value, null, 2);
}
