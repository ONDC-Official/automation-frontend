import type { FlowEntry, FlowMeta } from "../types";
import { getActionId } from "../utils";

/**
 * Links inline-code API mentions in the Use Case Brief (e.g. `/search`,
 * `on_search` under a stage's "Network interaction" list) to the matching call
 * in the API Walkthrough. Only tokens that match an api of the loaded flows
 * become links; every other inline code stays plain text.
 */

export interface ApiCallLinkTarget {
    flowId: string;
    actionId: string;
}

function metaOf(flow: FlowEntry): FlowMeta | undefined {
    if (flow.meta) return flow.meta;
    const configMeta = flow.config?.meta;
    return configMeta && typeof configMeta === "object" ? (configMeta as FlowMeta) : undefined;
}

function isPrimary(flow: FlowEntry): boolean {
    return String(metaOf(flow)?.type ?? "").toUpperCase() === "PRIMARY";
}

function orderOf(flow: FlowEntry): number {
    const order = metaOf(flow)?.order;
    return typeof order === "number" ? order : Number.MAX_SAFE_INTEGER;
}

/**
 * api name → first step carrying it, preferring main-path (PRIMARY) flows in
 * authored order so a brief's `/search` lands on the primary walkthrough flow.
 */
export function buildApiCallLinkMap(flows: FlowEntry[]): Map<string, ApiCallLinkTarget> {
    const sorted = [...flows].sort(
        (a, b) =>
            Number(isPrimary(b)) - Number(isPrimary(a)) ||
            orderOf(a) - orderOf(b) ||
            a.flowId.localeCompare(b.flowId)
    );

    const map = new Map<string, ApiCallLinkTarget>();
    for (const flow of sorted) {
        for (const step of flow.config?.steps ?? []) {
            const api = step.api?.toLowerCase();
            if (api && !map.has(api)) {
                map.set(api, { flowId: flow.flowId, actionId: getActionId(step) });
            }
        }
    }
    return map;
}

/** `/on_search` / `on_search` → `on_search`; null for anything that isn't an API-shaped token. */
export function normalizeApiToken(raw: string): string | null {
    const token = raw.trim();
    if (!/^\/?[a-z][a-z0-9_]*$/i.test(token)) return null;
    return token.replace(/^\//, "").toLowerCase();
}
