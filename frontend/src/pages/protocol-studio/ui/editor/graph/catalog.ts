import {
    ArrowPathRoundedSquareIcon,
    ArrowUturnLeftIcon,
    BellAlertIcon,
    DocumentTextIcon,
    PaperAirplaneIcon,
    ShareIcon,
} from "@heroicons/react/24/outline";
import type { XYPosition } from "@xyflow/react";

import { getTemplateFiles } from "@pages/protocol-studio/ui/editor/flows/action-files";
import { DEFAULT_CASES, getDecideTemplate } from "@pages/protocol-studio/ui/editor/graph/decision";
import type {
    ActionFiles,
    ApiNodeKind,
    EdgeKind,
    HeroIcon,
    NodeKind,
    NodeOwner,
    NodeTemplate,
    StudioNode,
} from "@pages/protocol-studio/ui/editor/types";

/** Each node kind: its header colour lives in studio-editor.css under `[data-kind]`. */
export const NODE_KINDS: Record<
    NodeKind,
    { label: string; hint: string; owner: NodeOwner; Icon: HeroIcon }
> = {
    request: {
        label: "Request",
        hint: "BAP → BPP call",
        owner: "BAP",
        Icon: PaperAirplaneIcon,
    },
    callback: {
        label: "Callback",
        hint: "BPP answers a request",
        owner: "BPP",
        Icon: ArrowUturnLeftIcon,
    },
    unsolicited: {
        label: "Unsolicited",
        hint: "BPP pushes without a request",
        owner: "BPP",
        Icon: BellAlertIcon,
    },
    on_demand: {
        label: "On demand",
        hint: "Fired by the tester at any time",
        owner: "BAP",
        Icon: ArrowPathRoundedSquareIcon,
    },
    form: {
        label: "Form",
        hint: "A form the user fills in",
        owner: "BPP",
        Icon: DocumentTextIcon,
    },
    decision: {
        label: "Decision",
        hint: "decide() picks a branch: from sessionData, or the tester's answer",
        owner: "BPP",
        Icon: ShareIcon,
    },
};

export const NODE_KIND_IDS = Object.keys(NODE_KINDS) as NodeKind[];

/** What an API node can be switched to: a decision is a different sort of node, never a kind of call. */
export const API_NODE_KIND_IDS = NODE_KIND_IDS.filter(
    (kind): kind is ApiNodeKind => kind !== "decision"
);

/** The add-node menu's decision row. */
export const DECISION_TEMPLATE: NodeTemplate = { kind: "decision", api: "decision", owner: "BPP" };

/** A decision node has no action files of its own: only `decide`. */
const NO_FILES: ActionFiles = {
    generate: "",
    validate: "",
    requirements: "",
    defaultPayload: "",
    inputs: "",
};

export const EDGE_KINDS: Record<EdgeKind, { label: string; hint: string }> = {
    next: { label: "Next", hint: "Then this step" },
    response: { label: "Response", hint: "A request's own callback" },
    optional: { label: "Optional", hint: "May be skipped" },
    branch: {
        label: "Branch",
        hint: "Out of a decision node: taken when decide() returns its case",
    },
    on_demand: { label: "On demand", hint: "Available from here, fired by the tester" },
    form: { label: "Form", hint: "Hands over to a form" },
    error: { label: "Error", hint: "An async error path" },
    terminal: { label: "Terminal", hint: "Ends the journey" },
    mount: { label: "Mount", hint: "Enters a mounted sub-protocol" },
};

export const EDGE_KIND_IDS = Object.keys(EDGE_KINDS) as EdgeKind[];

/** The standard ONDC transaction APIs a BAP calls, in their usual order. */
export const REQUEST_APIS = [
    "search",
    "select",
    "init",
    "confirm",
    "status",
    "track",
    "cancel",
    "update",
    "rating",
    "support",
] as const;

/** Callbacks a BPP sends without being asked. */
export const UNSOLICITED_APIS = ["on_status", "on_update", "on_cancel", "on_track"] as const;

/** Post-order calls a tester can fire whenever they like. */
export const ON_DEMAND_APIS = ["status", "track", "update", "cancel", "support", "rating"] as const;

export const FORM_APIS = ["html_form", "dynamic_form"] as const;

export const getCallbackApi = (api: string) => `on_${api}`;

/** What usually follows a callback: the next request in the transaction. */
const NEXT_AFTER: Record<string, string[]> = {
    on_search: ["select"],
    on_select: ["init"],
    on_init: ["confirm"],
    on_confirm: ["status", "track", "update", "cancel"],
    on_status: ["status"],
    on_update: ["status"],
    on_track: ["track"],
};

/** Templates for whatever most likely comes after `node`. */
export const getSuggestedNext = (node: StudioNode, hasCallback: boolean): NodeTemplate[] => {
    const suggestions: NodeTemplate[] = [];
    if (node.kind === "request" && !hasCallback) {
        suggestions.push({
            kind: "callback",
            api: getCallbackApi(node.api),
            owner: "BPP",
            responseFor: node.id,
        });
    }
    for (const api of NEXT_AFTER[node.api] ?? []) {
        suggestions.push({ kind: "request", api, owner: "BAP" });
    }
    return suggestions;
};

/** A typed API name as a template: `on_*` is read as a callback, anything else a request. */
export const templateFromApi = (api: string): NodeTemplate =>
    api.startsWith("on_")
        ? { kind: "callback", api, owner: "BPP" }
        : { kind: "request", api, owner: "BAP" };

/** Allowed in node ids: action ids like `on_search_2` and `GENERATED#1#search`. */
export const NODE_ID_PATTERN = /^[A-Za-z0-9_.#-]+$/;

/** An unused node id: `base`, then `base_2`, `base_3`, … (like v1's action ids). */
export const getUniqueNodeId = (base: string, taken: ReadonlySet<string>) => {
    const clean = base.replace(/[^A-Za-z0-9_.#-]+/g, "_") || "node";
    if (!taken.has(clean)) return clean;
    let n = 2;
    while (taken.has(`${clean}_${n}`)) n += 1;
    return `${clean}_${n}`;
};

export const createNode = (template: NodeTemplate, id: string, position: XYPosition): StudioNode =>
    template.kind === "decision"
        ? createDecisionNode(id, position)
        : createApiNode(template, id, position);

const createDecisionNode = (id: string, position: XYPosition): StudioNode => {
    const shape = { mode: "session" as const, cases: DEFAULT_CASES };
    return {
        id,
        api: "decision",
        owner: "BPP",
        kind: "decision",
        responseFor: null,
        description: "",
        files: NO_FILES,
        codeLanguage: "typescript",
        effects: [],
        decision: { ...shape, decide: getDecideTemplate(shape) },
        position,
    };
};

const createApiNode = (template: NodeTemplate, id: string, position: XYPosition): StudioNode => ({
    id,
    api: template.api,
    owner: template.owner,
    kind: template.kind,
    responseFor: template.responseFor ?? null,
    description: "",
    files: getTemplateFiles(template.api),
    codeLanguage: "typescript",
    effects: [],
    ...(template.manual ? { manual: true } : {}),
    position,
});

let nextEdgeId = 0;
export const makeEdgeId = () => `edge-${++nextEdgeId}`;

/** Whether `to` is `from`'s own callback still waiting for its request (`select` → `on_select`). */
export const isUnpairedCallbackOf = (from: StudioNode, to: StudioNode) =>
    from.kind === "request" &&
    to.kind === "callback" &&
    to.responseFor === null &&
    to.api === getCallbackApi(from.api);

/** The kind a fresh wire gets from what it joins. */
export const inferEdgeKind = (from: StudioNode, to: StudioNode): EdgeKind => {
    if (from.kind === "decision") return "branch";
    if (to.responseFor === from.id || isUnpairedCallbackOf(from, to)) return "response";
    if (to.error) return "error";
    if (to.kind === "form") return "form";
    if (to.kind === "on_demand") return "on_demand";
    if (to.optional) return "optional";
    return "next";
};
