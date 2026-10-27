import {
    AdjustmentsHorizontalIcon,
    ArrowRightEndOnRectangleIcon,
    ArrowRightStartOnRectangleIcon,
    ArrowsPointingOutIcon,
    BoltIcon,
    ClipboardDocumentIcon,
    ClipboardIcon,
    CodeBracketIcon,
    CursorArrowRaysIcon,
    DocumentDuplicateIcon,
    FlagIcon,
    LinkSlashIcon,
    PlayIcon,
    RectangleGroupIcon,
    RectangleStackIcon,
    ScissorsIcon,
    SparklesIcon,
    Squares2X2Icon,
    TagIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import type { XYPosition } from "@xyflow/react";

import {
    API_NODE_KIND_IDS,
    EDGE_KIND_IDS,
    EDGE_KINDS,
    FORM_APIS,
    getCallbackApi,
    getSuggestedNext,
    GROUP_TEMPLATES,
    NODE_KINDS,
    ON_DEMAND_APIS,
    REQUEST_APIS,
    DECISION_TEMPLATE,
    templateFromApi,
    UNSOLICITED_APIS,
} from "@pages/protocol-studio/ui/editor/graph/catalog";
import { hasMainWireIntoLevel, isBoundary } from "@pages/protocol-studio/ui/editor/graph/flatten";
import { BP, getPinPoint } from "@pages/protocol-studio/ui/editor/graph/layout";
import { formatShortcut } from "@pages/protocol-studio/ui/editor/shortcuts";
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
    /** The level the canvas shows. */
    graph: StudioGraph;
    /** Inside a group (the level has Entry / Exit pins). */
    inGroup: boolean;
    published: PublishedFlows;
    actions: StudioGraphActions;
    /** Adds a node from `template` at `at`: its top-left, or where its linked pin goes when `link` is set. */
    addNode: (template: NodeTemplate, at: XYPosition, link?: NodeLink) => void;
    /** Adds an empty group named from a template. */
    addGroup: (template: { name: string; description: string }, at: XYPosition) => void;
    /** Opens the "Group nodes…" dialog, with these nodes ticked. */
    openGroupDialog: (preselected: string[]) => void;
    insertFlow: (flow: PublishedFlow, at: XYPosition) => void;
    /**
     * Duplicate / copy / cut a node — or, when it is part of a selection of
     * several, the whole selection (`selectedNodeIds`).
     */
    duplicateNode: (nodeId: string) => void;
    copyNode: (nodeId: string) => void;
    cutNode: (nodeId: string) => void;
    selectedNodeIds: readonly string[];
    /** Pastes the last copy with its top-left at `at`; `canPaste` when there is one. */
    paste: (at: XYPosition) => void;
    canPaste: boolean;
    /** Selects every node on the level. */
    selectAll: () => void;
    /** Selects the node and opens an inspector tab on it. */
    editNode: (nodeId: string, tab: InspectorTabId) => void;
    selectEdge: (edgeId: string) => void;
    fitView: () => void;
    /** Lays the whole level out in tidy columns. */
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

/** Duplicate, copy and cut, for a node's menu: on the selection when the node is part of one. */
const getClipboardItems = (ctx: MenuContext, node: StudioNode): GraphMenuItem[] => {
    const count = ctx.selectedNodeIds.includes(node.id) ? ctx.selectedNodeIds.length : 1;
    const what = count > 1 ? ` ${count} nodes` : "";
    return [
        {
            id: "node:duplicate",
            label: `Duplicate${what}`,
            hint: formatShortcut("D"),
            Icon: DocumentDuplicateIcon,
            onSelect: () => ctx.duplicateNode(node.id),
        },
        {
            id: "node:copy",
            label: `Copy${what}`,
            hint: formatShortcut("C"),
            Icon: ClipboardDocumentIcon,
            onSelect: () => ctx.copyNode(node.id),
        },
        {
            id: "node:cut",
            label: `Cut${what}`,
            hint: formatShortcut("X"),
            Icon: ScissorsIcon,
            onSelect: () => ctx.cutNode(node.id),
        },
    ];
};

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
    const fromBoundary = link && isBoundary(link.nodeId);

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
        // A second wire out of a Then pin is an alternative: suggest the same callback again.
        suggested = getSuggestedNext(linked, hasCallback(graph, linked.id));
        if (linked.kind === "request" && hasCallback(graph, linked.id)) {
            suggested.unshift({
                kind: "callback",
                api: getCallbackApi(linked.api),
                owner: "BPP",
                responseFor: linked.id,
            });
        }
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
                        template.responseFor && linked && hasCallback(graph, linked.id)
                            ? `another answer to ${template.responseFor} — an alternative`
                            : template.responseFor
                              ? `answers ${template.responseFor}`
                              : graph.nodes.length === 0
                                ? "where the protocol starts"
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
            id: "control",
            title: "Flow control",
            items: [
                {
                    ...item(DECISION_TEMPLATE, "the protocol decides from state", "Decision"),
                    keywords: "decision switch branch if enum case session state decide protocol",
                },
            ],
        }
    );

    // Groups and whole published flows only make sense dropped on their own, not on a wire.
    if (!link) {
        sections.push({
            id: "group",
            title: "Sub-protocol",
            items: [
                {
                    id: "group:new",
                    label: "Group nodes…",
                    hint: "collapse nodes on this level into one named block",
                    tone: "group",
                    Icon: RectangleGroupIcon,
                    keywords: "group collapse sub-protocol fold nest",
                    disabled: graph.nodes.length === 0,
                    onSelect: () => ctx.openGroupDialog([]),
                },
                ...GROUP_TEMPLATES.map((template) => ({
                    id: `group:${template.name}`,
                    label: template.name,
                    hint: "an empty group, named and described",
                    tone: "group" as const,
                    Icon: RectangleGroupIcon,
                    keywords: `group sub-protocol ${template.description}`,
                    onSelect: () => ctx.addGroup(template, at),
                })),
            ],
        });
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

    if (!link && (graph.nodes.length > 0 || ctx.inGroup || ctx.canPaste)) {
        const items: GraphMenuItem[] = [];
        if (ctx.canPaste) {
            items.push({
                id: "canvas:paste",
                label: "Paste here",
                hint: formatShortcut("V"),
                tone: "neutral",
                Icon: ClipboardIcon,
                onSelect: () => ctx.paste(at),
            });
        }
        if (graph.nodes.length > 0) {
            items.push({
                id: "canvas:select-all",
                label: "Select all",
                hint: formatShortcut("A"),
                tone: "neutral",
                Icon: CursorArrowRaysIcon,
                onSelect: ctx.selectAll,
            });
        }
        if (graph.nodes.length > 0) {
            items.push(
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
                }
            );
        }
        if (ctx.inGroup) {
            items.push({
                id: "canvas:exit",
                label: "Leave this group",
                hint: "back up one level",
                tone: "neutral",
                Icon: ArrowRightStartOnRectangleIcon,
                keywords: "exit up back parent",
                onSelect: () => ctx.actions.exitToLevel(Number.MAX_SAFE_INTEGER - 1),
            });
        }
        sections.push({ id: "canvas", title: "Canvas", items });
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
            : fromBoundary
              ? link?.nodeId === "$in"
                  ? "After Entry"
                  : "Before Exit"
              : "Add node",
        subtitle:
            linked || fromBoundary ? "The new node is wired in" : "Right-click · type to filter",
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
    if (node.group) return getGroupContent(ctx, node, wired);
    const answered = hasCallback(graph, node.id);
    const next = getSuggestedNext(node, answered);
    // A request that already has its callback may get another: an alternative answer.
    if (node.kind === "request" && answered) {
        next.unshift({
            kind: "callback",
            api: getCallbackApi(node.api),
            owner: "BPP",
            responseFor: node.id,
        });
    }
    const fanOut = graph.edges.filter((edge) => edge.from === node.id).length;

    const sections: GraphMenuSection[] = [
        {
            id: "node",
            title: "Node",
            items: [
                {
                    id: "node:properties",
                    label: "Edit properties",
                    hint: "kind, owner, behaviour…",
                    Icon: AdjustmentsHorizontalIcon,
                    onSelect: () => ctx.editNode(node.id, "properties"),
                },
                {
                    id: "node:generate",
                    label: "Edit generate",
                    Icon: BoltIcon,
                    onSelect: () => ctx.editNode(node.id, "generate"),
                },
                // Only a node nothing wires into may start a journey (unmarking is always allowed).
                ...(node.start || !hasMainWireIntoLevel(graph, node)
                    ? [
                          {
                              id: "node:start",
                              label: node.start ? "Unmark as start" : "Mark as start",
                              hint: "a journey may begin here",
                              Icon: PlayIcon,
                              onSelect: () =>
                                  actions.updateNode(node.id, {
                                      start: node.start ? undefined : true,
                                  }),
                          },
                      ]
                    : []),
                {
                    id: "node:end",
                    label: node.end ? "Unmark as end" : "Mark as end",
                    hint: "a transaction may finish here",
                    Icon: FlagIcon,
                    onSelect: () =>
                        actions.updateNode(node.id, { end: node.end ? undefined : true }),
                },
                ...getClipboardItems(ctx, node),
                {
                    id: "node:group",
                    label: "Group with…",
                    hint: "fold this and other nodes into a sub-protocol",
                    tone: "group",
                    Icon: RectangleGroupIcon,
                    onSelect: () => ctx.openGroupDialog([node.id]),
                },
            ],
        },
    ];

    if (next.length > 0) {
        // Beside the node, In pin level with its Then pin, below anything already wired out.
        const pin = getPinPoint(node, "source");
        const at = { x: pin.x + BP.gap, y: pin.y + fanOut * FAN_OUT_STEP };
        sections.push({
            id: "next",
            title: fanOut > 0 ? "Add an alternative after" : "Add after",
            items: next.map((template) => ({
                id: `next:${templateId(template)}`,
                label: template.api,
                hint: template.responseFor
                    ? fanOut > 0
                        ? "another possible answer"
                        : "its callback"
                    : "next request",
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
        subtitle: `${node.id} · ${NODE_KINDS[node.kind].label} · ${node.owner}${fanOut >= 2 ? ` · ${fanOut} alternatives` : ""}`,
        sections,
        searchable: false,
    };
};

const deleteNodeItem = (ctx: MenuContext, node: StudioNode): GraphMenuItem => ({
    id: "node:delete",
    label: node.group ? "Delete group" : "Delete node",
    hint: node.group ? "and everything inside it" : "Del",
    tone: "danger",
    Icon: TrashIcon,
    onSelect: () => ctx.actions.removeNode(node.id),
});

const getDecisionContent = (ctx: MenuContext, node: StudioNode, wired: boolean): MenuContent => {
    const { actions } = ctx;
    return {
        title: node.id,
        subtitle: `Decision · ${node.decision?.cases.length ?? 0} cases`,
        searchable: false,
        sections: [
            {
                id: "node",
                title: "Node",
                items: [
                    {
                        id: "node:properties",
                        label: "Edit cases",
                        Icon: AdjustmentsHorizontalIcon,
                        onSelect: () => ctx.editNode(node.id, "properties"),
                    },
                    {
                        id: "node:decide",
                        label: "Edit decide.ts",
                        Icon: CodeBracketIcon,
                        onSelect: () => ctx.editNode(node.id, "decide"),
                    },
                    ...getClipboardItems(ctx, node),
                    {
                        id: "node:group",
                        label: "Group with…",
                        tone: "group",
                        Icon: RectangleGroupIcon,
                        onSelect: () => ctx.openGroupDialog([node.id]),
                    },
                ],
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

const getGroupContent = (ctx: MenuContext, node: StudioNode, wired: boolean): MenuContent => {
    const { actions } = ctx;
    const count = node.group?.graph.nodes.length ?? 0;
    return {
        title: node.group?.name || node.id,
        subtitle: `Sub-protocol · ${count} ${count === 1 ? "node" : "nodes"} inside`,
        searchable: false,
        sections: [
            {
                id: "node",
                title: "Group",
                items: [
                    {
                        id: "group:enter",
                        label: "Open the group",
                        hint: "double-click",
                        tone: "group",
                        Icon: ArrowRightEndOnRectangleIcon,
                        onSelect: () => actions.enterGroup(node.id),
                    },
                    {
                        id: "node:properties",
                        label: "Edit name & description",
                        Icon: AdjustmentsHorizontalIcon,
                        onSelect: () => ctx.editNode(node.id, "properties"),
                    },
                    {
                        id: "group:ungroup",
                        label: "Ungroup",
                        hint: "its nodes rejoin this level",
                        Icon: RectangleGroupIcon,
                        onSelect: () => actions.ungroup(node.id),
                    },
                    ...getClipboardItems(ctx, node),
                ],
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
    const siblings = ctx.graph.edges.filter((e) => e.from === edge.from && e.case === edge.case);
    const isAlternative = !cases && siblings.length >= 2;
    return {
        title: `${edge.from} → ${edge.to}`,
        subtitle: cases
            ? `taken on “${edge.case}”`
            : isAlternative
              ? `${edge.label || "unnamed"} · one of ${siblings.length} alternatives`
              : `${EDGE_KINDS[edge.kind].label} wire`,
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
                        id: "edge:label",
                        label: edge.label ? `Label: ${edge.label}` : "Name this alternative…",
                        hint: isAlternative ? "journeys are named from it" : "optional label",
                        Icon: TagIcon,
                        onSelect: () => ctx.selectEdge(edge.id),
                    },
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
