import {
    AdjustmentsHorizontalIcon,
    ArrowsPointingOutIcon,
    BoltIcon,
    CodeBracketIcon,
    DocumentDuplicateIcon,
    LinkSlashIcon,
    RectangleStackIcon,
    ScissorsIcon,
    SparklesIcon,
    Squares2X2Icon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import type { XYPosition } from "@xyflow/react";

import {
    API_NODE_KIND_IDS,
    DECISION_TEMPLATE,
    EDGE_KIND_IDS,
    EDGE_KINDS,
    FORM_APIS,
    getCallbackApi,
    getSuggestedNext,
    NODE_KINDS,
    ON_DEMAND_APIS,
    REQUEST_APIS,
    templateFromApi,
    UNSOLICITED_APIS,
} from "@pages/protocol-studio/ui/editor/graph/catalog";
import { BP, getPinPoint } from "@pages/protocol-studio/ui/editor/graph/layout";
import type {
    GraphMenuItem,
    GraphMenuSection,
    GraphMenuState,
    IGraphMenuProps,
    InspectorTabId,
    NodeTemplate,
    PublishedFlow,
    PublishedFlows,
    StudioGraph,
    StudioGraphActions,
    StudioNode,
} from "@pages/protocol-studio/ui/editor/types";

/**
 * A wire the new node joins: dragged out of `nodeId`'s Then pin (source) or
 * In pin (target). Out of a decision, `branchCase` is the case pin it left.
 */
export type NodeLink = { nodeId: string; side: "source" | "target"; branchCase?: string };

export interface MenuContext {
    graph: StudioGraph;
    published: PublishedFlows;
    actions: StudioGraphActions;
    /** Adds a node from `template` at `at`: its top-left, or where its linked pin goes when `link` is set. */
    addNode: (template: NodeTemplate, at: XYPosition, link?: NodeLink) => void;
    insertFlow: (flow: PublishedFlow, at: XYPosition) => void;
    duplicateNode: (nodeId: string) => void;
    /** Selects the node and opens an inspector tab on it. */
    editNode: (nodeId: string, tab: InspectorTabId) => void;
    selectEdge: (edgeId: string) => void;
    fitView: () => void;
    /** Lays the whole graph out in tidy columns. */
    tidy: () => void;
}

type MenuContent = Pick<
    IGraphMenuProps,
    "title" | "subtitle" | "sections" | "searchable" | "getQueryItems"
>;

/** Vertical step between nodes wired out of the same pin. */
const FAN_OUT_STEP = 120;

/** Most suggestions a section shows before it is noise. */
const SUGGESTION_LIMIT = 6;

const templateId = (template: NodeTemplate) =>
    `${template.kind}:${template.api}:${template.responseFor ?? ""}`;

const hasCallback = (graph: StudioGraph, nodeId: string) =>
    graph.nodes.some((node) => node.responseFor === nodeId);

/** Requests on the graph still missing their callback: the likeliest thing to add next. */
const getMissingCallbacks = (graph: StudioGraph): NodeTemplate[] =>
    graph.nodes
        .filter((node) => node.kind === "request" && !hasCallback(graph, node.id))
        .map((node) => ({
            kind: "callback",
            api: getCallbackApi(node.api),
            owner: "BPP",
            responseFor: node.id,
        }));

/** What a wire dragged into `node`'s In pin most likely comes from. */
const getSuggestedBefore = (node: StudioNode): NodeTemplate[] =>
    node.kind === "callback" && node.api.startsWith("on_")
        ? [{ kind: "request", api: node.api.slice(3), owner: "BAP" }]
        : [];

const getPaneContent = (
    ctx: MenuContext,
    at: XYPosition,
    link: NodeLink | undefined
): MenuContent => {
    const { graph, published } = ctx;
    const linked = link ? graph.nodes.find((node) => node.id === link.nodeId) : undefined;

    const item = (template: NodeTemplate, hint?: string, label?: string): GraphMenuItem => ({
        id: templateId(template),
        label: label ?? template.api,
        hint: hint ?? NODE_KINDS[template.kind].hint,
        tone: template.kind,
        Icon: NODE_KINDS[template.kind].Icon,
        keywords: `${template.kind} ${NODE_KINDS[template.kind].label}`,
        onSelect: () => ctx.addNode(template, at, link),
    });

    let suggested: NodeTemplate[];
    if (linked && link?.side === "source") {
        suggested = getSuggestedNext(linked, hasCallback(graph, linked.id));
    } else if (linked) {
        suggested = getSuggestedBefore(linked);
    } else if (graph.nodes.length === 0) {
        suggested = [{ kind: "request", api: "search", owner: "BAP" }];
    } else {
        suggested = getMissingCallbacks(graph);
    }

    const sections: GraphMenuSection[] = [];
    if (suggested.length > 0) {
        sections.push({
            id: "suggested",
            title: "Suggested",
            items: suggested
                .slice(0, SUGGESTION_LIMIT)
                .map((template) =>
                    item(
                        template,
                        template.responseFor
                            ? `answers ${template.responseFor}`
                            : graph.nodes.length === 0
                              ? "start the journey"
                              : NODE_KINDS[template.kind].hint
                    )
                ),
        });
    }

    sections.push(
        {
            id: "request",
            title: "Request · BAP → BPP",
            items: REQUEST_APIS.map((api) => item({ kind: "request", api, owner: "BAP" })),
        },
        {
            id: "callback",
            title: "Callback · BPP → BAP",
            items: REQUEST_APIS.map((api) =>
                item({ kind: "callback", api: getCallbackApi(api), owner: "BPP" }, `answers ${api}`)
            ),
        },
        {
            id: "unsolicited",
            title: "Unsolicited · BPP → BAP",
            items: UNSOLICITED_APIS.map((api) =>
                item({ kind: "unsolicited", api, owner: "BPP" }, "pushed by the BPP")
            ),
        },
        {
            id: "on_demand",
            title: "On demand · tester triggered",
            items: ON_DEMAND_APIS.map((api) =>
                item({ kind: "on_demand", api, owner: "BAP", manual: true }, "manual trigger")
            ),
        },
        {
            id: "form",
            title: "Form",
            items: FORM_APIS.map((api) => item({ kind: "form", api, owner: "BPP" })),
        },
        {
            id: "decision",
            title: "Flow control",
            items: [
                {
                    ...item(DECISION_TEMPLATE, "decide() picks a branch", "Decision"),
                    keywords: "decision branch switch if enum case session user input choice",
                },
            ],
        }
    );

    // A whole published flow only makes sense dropped on its own, not on a wire.
    if (!link) {
        sections.push({
            id: "published",
            title: "Insert a published flow",
            items: published.isLoading
                ? [
                      {
                          id: "published:loading",
                          label: "Loading published flows…",
                          disabled: true,
                          onSelect: () => {},
                      },
                  ]
                : published.isError
                  ? [
                        {
                            id: "published:retry",
                            label: "Couldn't load published flows",
                            hint: "retry",
                            tone: "danger",
                            onSelect: published.refetch,
                        },
                    ]
                  : published.flows.map((flow) => ({
                        id: `published:${flow.key}`,
                        label: flow.title,
                        hint: `${flow.entry.usecase} · ${flow.entry.config.steps?.length ?? 0} steps`,
                        tone: "neutral" as const,
                        Icon: RectangleStackIcon,
                        keywords: `flow ${flow.entry.flowId}`,
                        onSelect: () => ctx.insertFlow(flow, at),
                    })),
        });
    }

    if (!link && graph.nodes.length > 0) {
        sections.push({
            id: "canvas",
            title: "Canvas",
            items: [
                {
                    id: "canvas:tidy",
                    label: "Tidy up layout",
                    hint: "columns along the wires",
                    tone: "neutral",
                    Icon: Squares2X2Icon,
                    keywords: "auto arrange format clean organise",
                    onSelect: ctx.tidy,
                },
                {
                    id: "canvas:fit",
                    label: "Fit graph to view",
                    tone: "neutral",
                    Icon: ArrowsPointingOutIcon,
                    onSelect: ctx.fitView,
                },
            ],
        });
    }

    const known = new Set<string>([
        ...REQUEST_APIS,
        ...REQUEST_APIS.map(getCallbackApi),
        ...UNSOLICITED_APIS,
        ...FORM_APIS,
        DECISION_TEMPLATE.api,
    ]);

    return {
        title: linked
            ? link?.side === "source"
                ? `After ${linked.id}`
                : `Before ${linked.id}`
            : "Add node",
        subtitle: linked ? "The new node is wired in" : "Right-click · type to filter",
        sections,
        searchable: true,
        getQueryItems: (query) =>
            /^[A-Za-z0-9_]+$/.test(query) && !known.has(query)
                ? [
                      {
                          ...item(templateFromApi(query), undefined, `Add “${query}”`),
                          id: `custom:${query}`,
                          hint: `custom ${NODE_KINDS[templateFromApi(query).kind].label.toLowerCase()}`,
                      },
                  ]
                : [],
    };
};

const getNodeContent = (ctx: MenuContext, node: StudioNode): MenuContent => {
    const { graph, actions } = ctx;
    const wired = graph.edges.some((edge) => edge.from === node.id || edge.to === node.id);
    if (node.decision) return getDecisionContent(ctx, node, wired);
    const next = getSuggestedNext(node, hasCallback(graph, node.id));

    const sections: GraphMenuSection[] = [
        {
            id: "node",
            title: "Node",
            items: [
                {
                    id: "node:properties",
                    label: "Edit properties",
                    hint: "kind, guard, effects…",
                    Icon: AdjustmentsHorizontalIcon,
                    onSelect: () => ctx.editNode(node.id, "properties"),
                },
                {
                    id: "node:generate",
                    label: "Edit generate.js",
                    Icon: BoltIcon,
                    onSelect: () => ctx.editNode(node.id, "generate"),
                },
                {
                    id: "node:duplicate",
                    label: "Duplicate",
                    Icon: DocumentDuplicateIcon,
                    onSelect: () => ctx.duplicateNode(node.id),
                },
            ],
        },
    ];

    if (next.length > 0) {
        // Beside the node, In pin level with its Then pin, below anything already wired out.
        const fanOut = graph.edges.filter((edge) => edge.from === node.id).length;
        const pin = getPinPoint(node, "source");
        const at = { x: pin.x + BP.gap, y: pin.y + fanOut * FAN_OUT_STEP };
        sections.push({
            id: "next",
            title: "Add after",
            items: next.map((template) => ({
                id: `next:${templateId(template)}`,
                label: template.api,
                hint: template.responseFor ? "its callback" : "next request",
                tone: template.kind,
                Icon: SparklesIcon,
                onSelect: () => ctx.addNode(template, at, { nodeId: node.id, side: "source" }),
            })),
        });
    }

    sections.push(
        {
            id: "kind",
            title: "Kind",
            items: API_NODE_KIND_IDS.map((kind) => ({
                id: `kind:${kind}`,
                label: NODE_KINDS[kind].label,
                hint: NODE_KINDS[kind].hint,
                tone: kind,
                Icon: NODE_KINDS[kind].Icon,
                checked: node.kind === kind,
                onSelect: () => actions.updateNode(node.id, { kind }),
            })),
        },
        {
            id: "owner",
            title: "Owner",
            items: (["BAP", "BPP"] as const).map((owner) => ({
                id: `owner:${owner}`,
                label: owner,
                hint: owner === "BAP" ? "buyer app sends it" : "seller app sends it",
                checked: node.owner === owner,
                onSelect: () => actions.updateNode(node.id, { owner }),
            })),
        },
        {
            id: "remove",
            title: "Remove",
            items: [
                {
                    id: "node:disconnect",
                    label: "Disconnect all wires",
                    Icon: LinkSlashIcon,
                    disabled: !wired,
                    onSelect: () => actions.disconnectNode(node.id),
                },
                deleteNodeItem(ctx, node),
            ],
        }
    );

    return {
        title: node.api,
        subtitle: `${node.id} · ${NODE_KINDS[node.kind].label} · ${node.owner}`,
        sections,
        searchable: false,
    };
};

const deleteNodeItem = (ctx: MenuContext, node: StudioNode): GraphMenuItem => ({
    id: "node:delete",
    label: "Delete node",
    hint: "Del",
    tone: "danger",
    Icon: TrashIcon,
    onSelect: () => ctx.actions.removeNode(node.id),
});

const getDecisionContent = (ctx: MenuContext, node: StudioNode, wired: boolean): MenuContent => {
    const { actions } = ctx;
    const decision = node.decision;
    return {
        title: node.id,
        subtitle: `Decision · ${decision?.mode === "input" ? "user input" : "session"} · ${decision?.cases.length ?? 0} cases`,
        searchable: false,
        sections: [
            {
                id: "node",
                title: "Node",
                items: [
                    {
                        id: "node:properties",
                        label: "Edit mode & cases",
                        Icon: AdjustmentsHorizontalIcon,
                        onSelect: () => ctx.editNode(node.id, "properties"),
                    },
                    {
                        id: "node:decide",
                        label: "Edit decide.ts",
                        Icon: CodeBracketIcon,
                        onSelect: () => ctx.editNode(node.id, "decide"),
                    },
                    {
                        id: "node:duplicate",
                        label: "Duplicate",
                        Icon: DocumentDuplicateIcon,
                        onSelect: () => ctx.duplicateNode(node.id),
                    },
                ],
            },
            {
                id: "mode",
                title: "Decides from",
                items: (["session", "input"] as const).map((mode) => ({
                    id: `mode:${mode}`,
                    label: mode === "session" ? "Session data" : "User input",
                    hint: mode === "session" ? "decide(sessionData)" : "the tester picks a case",
                    checked: decision?.mode === mode,
                    onSelect: () => actions.updateDecision(node.id, { mode }),
                })),
            },
            {
                id: "remove",
                title: "Remove",
                items: [
                    {
                        id: "node:disconnect",
                        label: "Disconnect all wires",
                        Icon: LinkSlashIcon,
                        disabled: !wired,
                        onSelect: () => actions.disconnectNode(node.id),
                    },
                    deleteNodeItem(ctx, node),
                ],
            },
        ],
    };
};

const getEdgeContent = (ctx: MenuContext, edgeId: string): MenuContent | null => {
    const edge = ctx.graph.edges.find((e) => e.id === edgeId);
    if (!edge) return null;
    const { actions } = ctx;
    const cases = ctx.graph.nodes.find((n) => n.id === edge.from)?.decision?.cases;
    return {
        title: `${edge.from} → ${edge.to}`,
        subtitle: cases ? `taken on “${edge.case}”` : `${EDGE_KINDS[edge.kind].label} wire`,
        searchable: false,
        sections: [
            ...(cases
                ? [
                      {
                          id: "case",
                          title: "Taken on case",
                          items: cases.map((value) => ({
                              id: `case:${value}`,
                              label: value,
                              checked: edge.case === value,
                              onSelect: () => {
                                  // The case's pin holds one wire: the one it had goes.
                                  for (const other of ctx.graph.edges) {
                                      if (
                                          other.from === edge.from &&
                                          other.case === value &&
                                          other.id !== edge.id
                                      ) {
                                          actions.removeEdge(other.id);
                                      }
                                  }
                                  actions.updateEdge(edge.id, { case: value });
                              },
                          })),
                      },
                  ]
                : []),
            {
                id: "kind",
                title: "Kind",
                items: EDGE_KIND_IDS.map((kind) => ({
                    id: `kind:${kind}`,
                    label: EDGE_KINDS[kind].label,
                    hint: EDGE_KINDS[kind].hint,
                    tone: kind,
                    checked: edge.kind === kind,
                    onSelect: () => actions.updateEdge(edge.id, { kind }),
                })),
            },
            {
                id: "rules",
                title: "Rules",
                items: [
                    {
                        id: "edge:mandated",
                        label: "Mandated",
                        hint: "must be followed in order",
                        checked: edge.mandated,
                        onSelect: () => actions.updateEdge(edge.id, { mandated: !edge.mandated }),
                    },
                    {
                        id: "edge:edit",
                        label: "Edit in inspector",
                        Icon: AdjustmentsHorizontalIcon,
                        onSelect: () => ctx.selectEdge(edge.id),
                    },
                ],
            },
            {
                id: "remove",
                title: "Remove",
                items: [
                    {
                        id: "edge:delete",
                        label: "Delete wire",
                        hint: "Del",
                        tone: "danger",
                        Icon: ScissorsIcon,
                        onSelect: () => actions.removeEdge(edge.id),
                    },
                ],
            },
        ],
    };
};

/** What the graph menu shows for whatever was right-clicked; null when it is gone. */
export const getMenuContent = (menu: GraphMenuState, ctx: MenuContext): MenuContent | null => {
    const { target } = menu;
    if (target.type === "pane") return getPaneContent(ctx, menu.at, target.link);
    if (target.type === "node") {
        const node = ctx.graph.nodes.find((n) => n.id === target.id);
        return node ? getNodeContent(ctx, node) : null;
    }
    return getEdgeContent(ctx, target.id);
};
