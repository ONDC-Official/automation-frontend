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

/** Config for a flow to be injected inline within the main journey view. */
export interface InlineFlowConfig {
    /** The flowId of the flow to inject inline. */
    flowId: string;
    /** Inject this flow's card after the last item belonging to this heading in the main journey. */
    afterHeading: string;
    /** Override label shown on the inline card header (defaults to stripped flowId). */
    displayName?: string;
    /** Headings from this flow's simplified groups to hide when rendered inline
     * (use to suppress sections already shown in the parent journey, e.g. "Product Discovery"). */
    skipHeadings?: string[];
}

interface SimplifiedFlowConfig {
    domain: string;
    usecase: string;
    groups: SimplifiedStepGroup[];
    /** Per-flow overrides (exact flowId match) for flows whose calls mean something
     * different, e.g. the dedupe-check flow's select/on_select. */
    flowGroups?: Record<string, SimplifiedStepGroup[]>;
    /** Flows to inject inline within the main journey view, anchored to a specific heading. */
    inlineFlows?: InlineFlowConfig[];
    /** The flowId to prefer as the representative journey view (falls back to first annotated primary). */
    preferredFlowId?: string;
}

const SIMPLIFIED_FLOW_CONFIGS: SimplifiedFlowConfig[] = [
    {
        domain: "ONDC:FIS12",
        usecase: "Personal Loan",
        preferredFlowId: "Personal_Loan_Single_Redirection",
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
                heading: "Single Redirection (app-in-app experience)",
                stepLabels: {
                    dynamic_form: "Payment Link Redirection",
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
            // ── Foreclosure ───────────────────────────────────────────────────
            Personal_Loan_Foreclosure_Offline: [
                {
                    stepLabels: {
                        update: "Request foreclosure of the Personal Loan",
                        on_update: "Receive foreclosure request with payment URL",
                    },
                },
                {
                    stepLabels: {
                        dynamic_form: "Payment Link Redirection",
                    },
                },
                {
                    stepLabels: {
                        on_update:
                            "Receive foreclosure payment confirmation and loan closure status",
                    },
                },
            ],
            Personal_Loan_Foreclosure_Single_Redirection: [
                {
                    stepLabels: {
                        update: "Request foreclosure of the Personal Loan",
                        on_update: "Receive foreclosure request with payment URL",
                    },
                },
                {
                    stepLabels: {
                        dynamic_form: "Payment Link Redirection",
                    },
                },
                {
                    stepLabels: {
                        on_update:
                            "Receive foreclosure payment confirmation and loan closure status",
                    },
                },
            ],
            // ── Missed EMI Payment ────────────────────────────────────────────
            Personal_Loan_missed_emi_payment_Offline: [
                {
                    stepLabels: {
                        update: "Request of missed EMI",
                        on_update: "Receive missed EMI payment request with payment URL",
                    },
                },
                {
                    stepLabels: {
                        dynamic_form: "Payment Link Redirection",
                    },
                },
                {
                    stepLabels: {
                        on_update:
                            "Receive missed EMI payment confirmation and account updated status",
                    },
                },
            ],
            Personal_Loan_Missed_EMI_Single_Redirection: [
                {
                    stepLabels: {
                        update: "Request of missed EMI",
                        on_update: "Receive missed EMI payment request with payment URL",
                    },
                },
                {
                    stepLabels: {
                        dynamic_form: "Payment Link Redirection",
                    },
                },
                {
                    stepLabels: {
                        on_update:
                            "Receive missed EMI payment confirmation and account updated status",
                    },
                },
            ],
            // ── Pre Part Payment ──────────────────────────────────────────────
            Personal_Loan_Pre_Part_Payment_Offline: [
                {
                    stepLabels: {
                        update: "Request a partial prepayment of the Personal Loan",
                        on_update: "Receive prepayment request with payment URL",
                    },
                },
                {
                    stepLabels: {
                        dynamic_form: "Payment Link Redirection",
                    },
                },
                {
                    stepLabels: {
                        on_update:
                            "Receive prepayment payment confirmation and revised loan terms status",
                    },
                },
            ],
            Personal_Loan_Pre_Part_Payment_Single_Redirection: [
                {
                    stepLabels: {
                        update: "Request a partial prepayment of the Personal Loan",
                        on_update: "Receive prepayment request with payment URL",
                    },
                },
                {
                    stepLabels: {
                        dynamic_form: "Payment Link Redirection",
                    },
                },
                {
                    stepLabels: {
                        on_update:
                            "Receive prepayment payment confirmation and revised loan terms status",
                    },
                },
            ],
            // ── IGM (Issue & Grievance Management) ───────────────────────────
            "Personal_Loan_Single_Redirection_With_IGM(v-1.0.0)": [
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
                    heading: "Single Redirection (app-in-app experience)",
                    stepLabels: {
                        dynamic_form: "Payment Link Redirection",
                    },
                },
                {
                    heading: "Loan Confirmation And Disbursement",
                    stepLabels: {
                        confirm: "Confirm the Personal Loan booking",
                        on_confirm: "Receive the confirmed and disbursed Personal Loan order",
                    },
                },
                {
                    heading: "Issue & Grievance Management",
                    stepLabels: {
                        issue: "Raise an issue or grievance",
                        on_issue: "Receive issue raised acknowledgement",
                    },
                },
                {
                    stepLabels: {
                        issue_status: "Check the issue resolution status",
                        on_issue_status: "Receive the issue status update",
                    },
                },
                {
                    stepLabels: {
                        on_issue_status: "Receive the issue resolution and closure",
                    },
                },
                {
                    stepLabels: {
                        issue: "Escalate or reopen the grievance",
                    },
                },
            ],
            "Personal_Loan_Offline_With_IGM(v-1.0.0)": [
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
                    heading: "Loan Confirmation And Disbursement",
                    stepLabels: {
                        confirm: "Confirm the Personal Loan booking",
                        on_confirm: "Receive the confirmed and disbursed Personal Loan order",
                    },
                },
                {
                    heading: "Issue & Grievance Management",
                    stepLabels: {
                        issue: "Raise an issue or grievance",
                        on_issue: "Receive issue raised acknowledgement",
                    },
                },
                {
                    stepLabels: {
                        issue_status: "Check the issue resolution status",
                        on_issue_status: "Receive the issue status update",
                    },
                },
                {
                    stepLabels: {
                        on_issue_status: "Receive the issue resolution and closure",
                    },
                },
                {
                    stepLabels: {
                        issue: "Escalate or reopen the grievance",
                    },
                },
            ],
        },
        inlineFlows: [
            {
                flowId: "Personal_Loan_Dedupe_Check",
                afterHeading: "Product Discovery",
                displayName: "Dedupe Check",
                skipHeadings: ["Product Discovery"],
            },
        ],
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

/** Inline-flow injection configs for the journey view of this flow's domain + use case, or [] when none. */
export function getInlineFlowConfigs(flow: FlowEntry): InlineFlowConfig[] {
    const cfg = SIMPLIFIED_FLOW_CONFIGS.find(
        (c) =>
            normalize(c.domain) === normalize(flow.domain) &&
            normalize(c.usecase) === normalize(flow.usecase)
    );
    return cfg?.inlineFlows ?? [];
}

/** Preferred flowId to use as the representative journey view, or null when unspecified. */
export function getPreferredJourneyFlowId(flow: FlowEntry): string | null {
    const cfg = SIMPLIFIED_FLOW_CONFIGS.find(
        (c) =>
            normalize(c.domain) === normalize(flow.domain) &&
            normalize(c.usecase) === normalize(flow.usecase)
    );
    return cfg?.preferredFlowId ?? null;
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
    let prevHeading: string | null = null;
    // Sequential group pointer: only advances forward so two steps sharing the
    // same API name (e.g. two on_updates) each land in their correct group.
    let groupIdx = 0;

    const annotations = items.map<SimplifiedItemAnnotation>((item) => {
        const steps = stepsOfItem(item);
        // Scan forward from the current group pointer to find the next match.
        let matchedIdx = -1;
        for (let i = groupIdx; i < groups.length; i++) {
            if (steps.some((s) => groups[i].stepLabels[s.api])) {
                matchedIdx = i;
                break;
            }
        }
        if (matchedIdx === -1) {
            prevHeading = null;
            return {};
        }
        // Advance the group pointer to the matched group so subsequent items
        // search forward from here (never re-visit earlier groups).
        groupIdx = matchedIdx;
        const group = groups[matchedIdx];

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
