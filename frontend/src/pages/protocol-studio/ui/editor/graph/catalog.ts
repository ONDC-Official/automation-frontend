import {
    ArrowPathRoundedSquareIcon,
    ArrowUturnLeftIcon,
    ArrowsRightLeftIcon,
    BellAlertIcon,
    DocumentTextIcon,
    PaperAirplaneIcon,
    RectangleGroupIcon,
} from "@heroicons/react/24/outline";
import type { XYPosition } from "@xyflow/react";

import {
    getDefaultSaveData,
    getTemplateFiles,
} from "@pages/protocol-studio/ui/editor/flows/action-files";
import { DEFAULT_CASES, getDecideTemplate } from "@pages/protocol-studio/ui/editor/graph/decision";
import type {
    ActionFiles,
    ApiNodeKind,
    EdgeKind,
    HeroIcon,
    NodeKind,
    NodeOwner,
    NodeTemplate,
    StudioGraph,
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
        hint: "The protocol decides from state: decide(sessionData) picks one case",
        owner: "BPP",
        Icon: ArrowsRightLeftIcon,
    },
    group: {
        label: "Group",
        hint: "A sub-protocol with its own graph inside",
        owner: "BAP",
        Icon: RectangleGroupIcon,
    },
};

export const NODE_KIND_IDS = Object.keys(NODE_KINDS) as NodeKind[];

/** What an API node can be switched to: the control nodes are a different sort of node, never a kind of call. */
export const API_NODE_KIND_IDS = NODE_KIND_IDS.filter(
    (kind): kind is ApiNodeKind => kind !== "decision" && kind !== "group"
);

/** The add-node menu's decision row. */
export const DECISION_TEMPLATE: NodeTemplate = { kind: "decision", api: "decision", owner: "BPP" };

/** A control node has no action files of its own. */
export const NO_FILES: ActionFiles = {
    generate: "",
    validate: "",
    match: "",
    exit: "",
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
        hint: "Out of a decision: taken when decide() returns its case",
    },
    on_demand: { label: "On demand", hint: "Available from here, fired by the tester" },
    form: { label: "Form", hint: "Hands over to a form" },
    error: { label: "Error", hint: "An async error path" },
    terminal: { label: "Terminal", hint: "Ends the protocol here" },
    mount: { label: "Mount", hint: "Enters a sub-protocol that can attach at several points" },
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

/** Ready-made empty groups for the sub-protocols most domains have. */
export const GROUP_TEMPLATES: { name: string; description: string }[] = [
    {
        name: "Cancellation",
        description:
            "Either side cancels an order: cancel / on_cancel, the refund and the terminal order state.",
    },
    {
        name: "Issue & grievance (IGM)",
        description:
            "The buyer raises an issue after the order; issue / on_issue, status updates and resolution.",
    },
    {
        name: "Settlement",
        description:
            "Post-fulfilment settlement between the parties: receiver recon and settlement callbacks.",
    },
    {
        name: "Returns (RTO)",
        description: "The item comes back: return request, pickup, and the order's return states.",
    },
];

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

/** A group's id from its name: `Seller cancellation` → `seller_cancellation`. */
export const slugify = (text: string) =>
    text
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "group";

/** `version` is the spec's, for the default `saveData` (`city_code`'s path differs on 1.x). */
export const createNode = (
    template: NodeTemplate,
    id: string,
    position: XYPosition,
    version = "2.0.0"
): StudioNode =>
    template.kind === "decision"
        ? createDecisionNode(id, position)
        : template.kind === "group"
          ? createGroupNode(id, position, template.api, "")
          : createApiNode(template, id, position, version);

const createDecisionNode = (id: string, position: XYPosition): StudioNode => {
    const shape = { cases: DEFAULT_CASES };
    return {
        id,
        api: "decision",
        owner: "BPP",
        kind: "decision",
        responseFor: null,
        description: "",
        files: NO_FILES,
        codeLanguage: "typescript",
        decision: { ...shape, decide: getDecideTemplate(shape) },
        position,
    };
};

export const createGroupNode = (
    id: string,
    position: XYPosition,
    name: string,
    description: string,
    graph: StudioGraph = { nodes: [], edges: [] }
): StudioNode => ({
    id,
    api: "group",
    owner: "BAP",
    kind: "group",
    responseFor: null,
    description,
    files: NO_FILES,
    group: { name, description, graph },
    position,
});

const createApiNode = (
    template: NodeTemplate,
    id: string,
    position: XYPosition,
    version: string
): StudioNode => ({
    id,
    api: template.api,
    owner: template.owner,
    kind: template.kind,
    responseFor: template.responseFor ?? null,
    description: "",
    files: getTemplateFiles(template.api),
    codeLanguage: "typescript",
    // Forms store their submission, not a payload: nothing to extract.
    ...(template.kind === "form" ? {} : { saveData: getDefaultSaveData(version) }),
    ...(template.manual ? { manual: true } : {}),
    position,
});

// The session's start time keeps ids unique across reloads: a saved draft still
// holds the wires of earlier sessions, and a pasted fragment brings in more.
const EDGE_ID_SESSION = Date.now().toString(36);
let nextEdgeId = 0;
export const makeEdgeId = () => `edge-${EDGE_ID_SESSION}-${(++nextEdgeId).toString(36)}`;

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

/** A readable name for a node: a group's name, else its id. */
export const getNodeTitle = (node: StudioNode) => node.group?.name || node.id;
