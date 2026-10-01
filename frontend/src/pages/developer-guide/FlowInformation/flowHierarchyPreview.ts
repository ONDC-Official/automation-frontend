import type { FlowEntry, FlowMeta, FlowStep, StepDisplayItem } from "@pages/developer-guide/types";
import { getActionId } from "@pages/developer-guide/utils";
import { buildStepDisplayItems } from "./utils";

/**
 * Hierarchical flows sidebar, driven by flow-index metadata (`flows[].meta`):
 * - `type: PRIMARY` + `secondary_flows: [ids]` — a primary card listing its secondaries;
 * - `type: SECONDARY` + `visible_actions` / `hide_actions` — nested under its primary,
 *   showing only the visible (or non-hidden) calls;
 * - `type: PREREQUISITE` — rendered inside each primary card above the primary's calls.
 * Legacy schemas (`secondary_of`/`secondary_start`, `is_secondary`/`parent_flow`) are
 * still honored for already-ingested builds. Flip the flag for the flat accordion.
 */

export interface FlowHierarchyChildFlow {
    flow: FlowEntry;
    /** Calls shown for this flow (filtered per its meta). */
    items: StepDisplayItem[];
    /** Raw count of the steps shown (before pair grouping). */
    stepCount: number;
}

export interface FlowHierarchyGroup {
    primary: FlowEntry;
    /** Whether the card should show the PRIMARY badge (explicit type or has secondaries). */
    isExplicitPrimary: boolean;
    primaryItems: StepDisplayItem[];
    /** PREREQUISITE flows, shown above the primary's calls. */
    prerequisites: FlowHierarchyChildFlow[];
    secondaries: FlowHierarchyChildFlow[];
}

function metaOf(flow: FlowEntry): FlowMeta | undefined {
    // Prefer the flow-index meta; fall back to meta authored inside the flow's config YAML
    // (the config object is stored verbatim by the ingest, so config-level meta survives).
    if (flow.meta) return flow.meta;
    const configMeta = flow.config?.meta;
    return configMeta && typeof configMeta === "object" ? (configMeta as FlowMeta) : undefined;
}

function stepsOf(flow: FlowEntry): FlowStep[] {
    return flow.config?.steps ?? [];
}

function orderOf(flow: FlowEntry): number {
    const order = metaOf(flow)?.order;
    return typeof order === "number" ? order : Number.MAX_SAFE_INTEGER;
}

function byOrderThenId(a: FlowEntry, b: FlowEntry): number {
    return orderOf(a) - orderOf(b) || a.flowId.localeCompare(b.flowId);
}

function roleOf(flow: FlowEntry): string {
    return String(metaOf(flow)?.type ?? "").toUpperCase();
}

/** Legacy linking: flowId of the primary this flow declares itself a secondary of. */
function legacyParentId(flow: FlowEntry): string | undefined {
    const meta = metaOf(flow);
    if (!meta) return undefined;
    if (meta.secondary_of) return meta.secondary_of;
    if (meta.is_secondary && meta.parent_flow) return meta.parent_flow;
    return undefined;
}

/**
 * Calls a secondary flow shows, by precedence:
 * 1. `visible_actions` — explicit whitelist (kept in flow order);
 * 2. `hide_actions` — everything except these;
 * 3. legacy `secondary_start` — from that action onward;
 * 4. the full sequence.
 */
export function secondaryVisibleSteps(flow: FlowEntry): FlowStep[] {
    const steps = stepsOf(flow);
    const meta = metaOf(flow);

    const visible = meta?.visible_actions ?? [];
    if (visible.length > 0) {
        const shown = steps.filter((s) => visible.includes(getActionId(s)));
        if (shown.length > 0) return shown;
    }

    const hidden = meta?.hide_actions ?? [];
    if (hidden.length > 0) {
        const shown = steps.filter((s) => !hidden.includes(getActionId(s)));
        if (shown.length > 0) return shown;
    }

    const startIds = meta?.secondary_start ?? [];
    if (startIds.length > 0) {
        const startIdx = steps.findIndex((s) => startIds.includes(getActionId(s)));
        if (startIdx >= 0) return steps.slice(startIdx);
    }

    return steps;
}

function toChildFlow(flow: FlowEntry): FlowHierarchyChildFlow {
    const visibleSteps = secondaryVisibleSteps(flow);
    return {
        flow,
        items: buildStepDisplayItems(visibleSteps),
        stepCount: visibleSteps.length,
    };
}

/**
 * Groups flows into primary cards with prerequisites + secondaries nested.
 * Parent→child links come from the primary's `secondary_flows`; legacy child→parent
 * declarations are honored as fallback. A secondary whose primary isn't present falls
 * back to a standalone card so it never disappears from the sidebar.
 */
export function buildFlowHierarchies(flows: FlowEntry[]): FlowHierarchyGroup[] {
    const byId = new Map(flows.map((f) => [f.flowId, f]));

    // PREREQUISITE flows render inside every primary card, above the primary's calls.
    const prerequisiteFlows = flows.filter((f) => roleOf(f) === "PREREQUISITE").sort(byOrderThenId);
    const prerequisites = prerequisiteFlows.map((f) => ({
        flow: f,
        items: buildStepDisplayItems(stepsOf(f)),
        stepCount: stepsOf(f).length,
    }));

    // Resolve child → parent from the primaries' secondary_flows lists (current schema),
    // then from the child's own legacy declaration.
    const parentByChildId = new Map<string, string>();
    for (const flow of flows) {
        for (const childId of metaOf(flow)?.secondary_flows ?? []) {
            if (byId.has(childId) && childId !== flow.flowId) {
                parentByChildId.set(childId, flow.flowId);
            }
        }
    }
    for (const flow of flows) {
        if (parentByChildId.has(flow.flowId)) continue;
        const legacy = legacyParentId(flow);
        if (legacy && byId.has(legacy) && legacy !== flow.flowId) {
            parentByChildId.set(flow.flowId, legacy);
        }
    }

    const prerequisiteIds = new Set(prerequisiteFlows.map((f) => f.flowId));
    const primaries = flows.filter(
        (f) => !prerequisiteIds.has(f.flowId) && !parentByChildId.has(f.flowId)
    );

    return primaries.sort(byOrderThenId).map((primary) => {
        const secondaries = flows
            .filter((f) => parentByChildId.get(f.flowId) === primary.flowId)
            .sort(byOrderThenId)
            .map(toChildFlow);
        return {
            primary,
            isExplicitPrimary: roleOf(primary) === "PRIMARY" || secondaries.length > 0,
            primaryItems: buildStepDisplayItems(stepsOf(primary)),
            prerequisites,
            secondaries,
        };
    });
}
