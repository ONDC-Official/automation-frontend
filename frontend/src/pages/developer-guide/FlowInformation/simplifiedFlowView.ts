import type { FlowEntry, FlowStep, StepDisplayItem } from "@pages/developer-guide/types";

/**
 * Simplified ("API Reference" toggle off) presentation for the flows sidebar.
 *
 * Configs are scoped per domain + use case and only rename/group the steps they
 * list; every other flow, step, and use case renders exactly as before. The
 * underlying steps (and their API-call UI) are untouched — the accordion just
 * swaps how the listed steps are presented while the toggle is off.
 */

/** One user-friendly grouping of API calls, e.g. "Product Discovery". */
export interface SimplifiedStepGroup {
    /** Optional heading rendered above the group's calls (omit for a bare rename). */
    heading?: string;
    /** step.api → user-friendly display name. */
    stepLabels: Record<string, string>;
}

interface SimplifiedFlowConfig {
    domain: string;
    usecase: string;
    groups: SimplifiedStepGroup[];
    /** Per-flow overrides (exact flowId match) for flows whose calls mean something
     * different, e.g. the dedupe-check flow's select/on_select. */
    flowGroups?: Record<string, SimplifiedStepGroup[]>;
}

const SIMPLIFIED_FLOW_CONFIGS: SimplifiedFlowConfig[] = [
    {
        domain: "ONDC:FIS12",
        usecase: "Personal Loan",
        groups: [
            {
                heading: "Product Discovery",
                stepLabels: {
                    search: "Search for Personal Loan products",
                    on_search: "Receive Personal Loan product catalogue",
                },
            },
            {
                heading: "Application Submission",
                stepLabels: {
                    html_form: "Submit the Personal Loan application form",
                },
            },
            {
                heading: "Offer Selection",
                stepLabels: {
                    select: "Select a Personal Loan offer",
                    on_select: "Receive the Personal Loan offer quote",
                },
            },
            {
                heading: "Loan Processing And Statuses",
                stepLabels: {
                    status: "Request the latest application status",
                    on_status: "Receive an application status update",
                },
            },
            {
                heading: "Single Redirection (app-in-app experience)",
                stepLabels: {
                    dynamic_form: "Dynamic Redirection form",
                },
            },
            {
                heading: "Loan Confirmation And Disbursement",
                stepLabels: {
                    confirm: "Confirm the Personal Loan booking",
                    on_confirm: "Receive the confirmed and disbursed Personal Loan order",
                },
            },
        ],
        flowGroups: {
            Personal_Loan_Dedupe_Check: [
                {
                    heading: "Product Discovery",
                    stepLabels: {
                        search: "Search for Personal Loan products",
                        on_search: "Receive Personal Loan product catalogue",
                    },
                },
                {
                    heading: "Dedupe Check",
                    stepLabels: {
                        select: "Share borrower details for the dedupe check",
                        on_select: "Receive the dedupe check outcome",
                    },
                },
            ],
        },
    },
];

const normalize = (s: string | undefined) =>
    (s ?? "")
        .toLowerCase()
        .replace(/[\s_-]+/g, " ")
        .trim();

/** Simplified-view groups for this flow's domain + use case, or null when none apply. */
export function getSimplifiedGroups(flow: FlowEntry): SimplifiedStepGroup[] | null {
    const cfg = SIMPLIFIED_FLOW_CONFIGS.find(
        (c) =>
            normalize(c.domain) === normalize(flow.domain) &&
            normalize(c.usecase) === normalize(flow.usecase)
    );
    if (!cfg) return null;
    return cfg.flowGroups?.[flow.flowId] ?? cfg.groups;
}

/** Per-display-item annotation used by the sidebar's simplified rendering. */
export interface SimplifiedItemAnnotation {
    /** Group heading rendered above this item (only on the group's first item). */
    heading?: string;
    /** step.api → friendly label for this item's covered steps. */
    stepLabels?: Record<string, string>;
}

function stepsOfItem(item: StepDisplayItem): FlowStep[] {
    return item.type === "pair" ? [item.request, item.response] : [item.step];
}

/**
 * Maps each display item to its simplified-view annotation (index-aligned with
 * `items`). Returns null when no step is covered so callers can skip the
 * simplified path entirely.
 */
export function annotateSimplifiedItems(
    items: StepDisplayItem[],
    groups: SimplifiedStepGroup[]
): SimplifiedItemAnnotation[] | null {
    let anyCovered = false;
    // Heading of the previous item's group — a heading renders whenever the group
    // changes, so a group whose calls resume after an interruption (e.g. on_status
    // around dynamic_form/confirm) gets its heading again.
    let prevHeading: string | null = null;

    const annotations = items.map<SimplifiedItemAnnotation>((item) => {
        const steps = stepsOfItem(item);
        const group = groups.find((g) => steps.some((s) => g.stepLabels[s.api]));
        if (!group) {
            prevHeading = null;
            return {};
        }

        anyCovered = true;
        const stepLabels: Record<string, string> = {};
        for (const step of steps) {
            const label = group.stepLabels[step.api];
            if (label) stepLabels[step.api] = label;
        }

        const annotation: SimplifiedItemAnnotation = { stepLabels };
        if (group.heading && group.heading !== prevHeading) {
            annotation.heading = group.heading;
        }
        prevHeading = group.heading ?? null;
        return annotation;
    });

    return anyCovered ? annotations : null;
}
