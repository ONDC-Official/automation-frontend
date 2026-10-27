import type {
    FlowDisplayInline,
    FlowEntry,
    FlowStep,
    StepDisplayItem,
} from "@pages/developer-guide/types";
import { getActionId } from "@pages/developer-guide/utils";

/**
 * Simplified ("API Reference" toggle off) presentation for the flows sidebar.
 *
 * The business-name/section mapping is backend-provided per flow via
 * `flow.meta.display` (already part of `x-flows`) rather than hardcoded here —
 * this module only converts that config into the shape the annotator needs and
 * does the annotation itself.
 */

/** One user-friendly grouping of API calls, e.g. "Product Discovery". */
export interface SimplifiedStepGroup {
    /** Optional heading rendered above the group's calls (omit for a bare rename). */
    heading?: string;
    /** action_id (step.action_id, falling back to step.api) → user-friendly display name. */
    stepLabels: Record<string, string>;
}

/** Converts this flow's `meta.display` into the groups the annotator consumes,
 * or null when the flow has no display config (toggle stays hidden for it). */
export function getSimplifiedGroups(flow: FlowEntry): SimplifiedStepGroup[] | null {
    const display = flow.meta?.display;
    if (!display) return null;

    if (display.sections?.length) {
        return display.sections.map((section) => ({
            heading: section.name,
            stepLabels: section.actions,
        }));
    }

    if (display.actions && Object.keys(display.actions).length > 0) {
        return [{ stepLabels: display.actions }];
    }

    return null;
}

/** Flows to inject inline within this flow's Journey View, anchored to one of
 * its sections, or `[]` when it has none. */
export function getInlineFlowConfigs(flow: FlowEntry): FlowDisplayInline[] {
    return flow.meta?.display?.inline ?? [];
}

/** Variant of `getSimplifiedGroups` for an inline-injected flow: drops any
 * section named in `skipSections` (e.g. a section already shown in the parent
 * journey) before converting to the annotator's group shape. */
export function getSimplifiedGroupsExcluding(
    flow: FlowEntry,
    skipSections: string[]
): SimplifiedStepGroup[] | null {
    const groups = getSimplifiedGroups(flow);
    if (!groups || skipSections.length === 0) return groups;
    const filtered = groups.filter((g) => !g.heading || !skipSections.includes(g.heading));
    return filtered.length > 0 ? filtered : null;
}

/** The action_ids covered by the named sections of this flow's own
 * `meta.display`, or an empty set when it has no display config / no section
 * named matches. */
function actionIdsForSections(flow: FlowEntry, sectionNames: string[]): Set<string> {
    const ids = new Set<string>();
    if (sectionNames.length === 0) return ids;
    const groups = getSimplifiedGroups(flow);
    if (!groups) return ids;
    for (const group of groups) {
        if (group.heading && sectionNames.includes(group.heading)) {
            for (const actionId of Object.keys(group.stepLabels)) ids.add(actionId);
        }
    }
    return ids;
}

/** Drops any display item whose step(s) belong to one of `skipSections` (per
 * this flow's own `meta.display`) — used for an inline-injected flow so its
 * `skip_sections` fully hides those calls, rather than leaving them shown
 * with just the business label stripped. */
export function filterItemsExcludingSections(
    flow: FlowEntry,
    items: StepDisplayItem[],
    skipSections: string[]
): StepDisplayItem[] {
    const skipIds = actionIdsForSections(flow, skipSections);
    if (skipIds.size === 0) return items;
    return items.filter((item) => !stepsOfItem(item).some((s) => skipIds.has(getActionId(s))));
}

/** For each display item's heading, the index of the last item belonging to
 * that heading — used to find where an inline flow should be injected. */
export function lastIndexPerHeading(
    annotations: SimplifiedItemAnnotation[] | null
): Record<string, number> {
    const map: Record<string, number> = {};
    if (!annotations) return map;
    let current: string | undefined;
    annotations.forEach((ann, i) => {
        if (ann.heading) current = ann.heading;
        if (current !== undefined) map[current] = i;
    });
    return map;
}

/** Per-display-item annotation used by the sidebar's simplified rendering. */
export interface SimplifiedItemAnnotation {
    /** Group heading rendered above this item (only on the group's first item). */
    heading?: string;
    /** action_id → friendly label for this item's covered steps. */
    stepLabels?: Record<string, string>;
}

function stepsOfItem(item: StepDisplayItem): FlowStep[] {
    return item.type === "pair" ? [item.request, item.response] : [item.step];
}

/**
 * Maps each display item to its simplified-view annotation (index-aligned with
 * `items`). Returns null when no step is covered so callers can skip the
 * simplified path entirely.
 *
 * Matches on `action_id` (via `getActionId`), not the generic `step.api` — the
 * same `api` (e.g. "on_status") can recur across a flow with a different
 * `action_id` and business meaning each time, so `display.sections[].actions`
 * (and `display.actions`) are keyed by `action_id`.
 *
 * Matching is a flat `action_id -> {groupIdx, label}` lookup, independent of
 * item order — a forward-only pointer previously required each flow's actual
 * step order to exactly follow `display.sections`' declared order, silently
 * dropping the label (and section heading) for any step that fell out of
 * sequence with it.
 */
export function annotateSimplifiedItems(
    items: StepDisplayItem[],
    groups: SimplifiedStepGroup[]
): SimplifiedItemAnnotation[] | null {
    const actionIndex = new Map<string, { groupIdx: number; label: string }>();
    groups.forEach((group, groupIdx) => {
        for (const [actionId, label] of Object.entries(group.stepLabels)) {
            if (!actionIndex.has(actionId)) actionIndex.set(actionId, { groupIdx, label });
        }
    });

    let anyCovered = false;
    let prevGroupIdx: number | null = null;

    const annotations = items.map<SimplifiedItemAnnotation>((item) => {
        const steps = stepsOfItem(item);
        const stepLabels: Record<string, string> = {};
        let matchedGroupIdx: number | null = null;
        for (const step of steps) {
            const match = actionIndex.get(getActionId(step));
            if (!match) continue;
            stepLabels[getActionId(step)] = match.label;
            if (matchedGroupIdx === null) matchedGroupIdx = match.groupIdx;
        }

        if (matchedGroupIdx === null) {
            prevGroupIdx = null;
            return {};
        }

        anyCovered = true;
        const annotation: SimplifiedItemAnnotation = { stepLabels };
        const group = groups[matchedGroupIdx];
        if (group.heading && matchedGroupIdx !== prevGroupIdx) {
            annotation.heading = group.heading;
        }
        prevGroupIdx = matchedGroupIdx;
        return annotation;
    });

    return anyCovered ? annotations : null;
}
