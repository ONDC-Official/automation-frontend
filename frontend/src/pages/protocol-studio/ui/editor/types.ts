import type { CubeIcon } from "@heroicons/react/24/outline";
import type { MockPlaygroundConfigV2Type, UserCodeKindV2 } from "@ondc/automation-mock-runner";
import type {
    Edge,
    EdgeMouseHandler,
    IsValidConnection,
    Node,
    NodeMouseHandler,
    OnConnect,
    OnConnectEnd,
    OnNodeDrag,
    OnNodesChange,
    XYPosition,
} from "@xyflow/react";

import type { FlowEntry } from "@/types/apiShared/developerGuide/developerGuide.types";

/** Any heroicons icon component. */
export type HeroIcon = typeof CubeIcon;

export type DockTab = "console" | "ai";

export type ExplorerTab = "nodes" | "search";

/** An action's own files: the inspector's tabs. */
export type ActionFileId = "generate" | "validate" | "requirements" | "defaultPayload" | "inputs";

/** A decision node's one file: its `decide` function. */
export type DecisionFileId = "decide";

/** A file the inspector can open on a node: an action's, or a decision's. */
export type NodeFileId = ActionFileId | DecisionFileId;

/** The node's own fields, edited as a form; the rest of the tabs are its files. */
export type InspectorTabId = NodeFileId | "properties";

/** Every editable code file: a node's own, or the config's helpers.ts (header popup). */
export type CodeFileId = NodeFileId | "helpers";

export type ActionFiles = Record<ActionFileId, string>;

/** One row of the inspector's file picker. */
export type InspectorGroupId = "functions" | "data";

/**
 * The language a node's step functions are written in. New nodes are
 * TypeScript, typed from the spec; nodes imported from published flows keep
 * their JavaScript.
 */
export type CodeLanguage = "typescript" | "javascript";

/**
 * A Monaco language Studio shows files in. `studio-dts` is TypeScript
 * highlighting for read-only declarations that must not join the TypeScript
 * program step code is checked in (they are already there, as extra libs).
 */
export type EditorLanguage = CodeLanguage | "json" | "studio-dts";

export interface InspectorTab {
    id: NodeFileId;
    label: string;
    /** One line on what the file is for, shown as the tab's tooltip. */
    description: string;
    Icon: HeroIcon;
    group: InspectorGroupId;
    language: EditorLanguage;
}

/** A config-level file opened in the header's code popup; `types` is the generated declarations. */
export type CodeDialogFile = "helpers" | "config" | "types";

/** One generated declaration file, as the types popup shows it. */
export interface StudioTypeFile {
    id: string;
    label: string;
    description: string;
    content: string;
    language: EditorLanguage;
}

export type NodeOwner = "BAP" | "BPP";

export type NodeKind = "request" | "callback" | "unsolicited" | "on_demand" | "form" | "decision";

/** The kinds that are an API call (or form): every kind but `decision`. */
export type ApiNodeKind = Exclude<NodeKind, "decision">;

/**
 * How a decision node picks its branch. Either way `decide` returns one of
 * the node's cases, and the wire on that case's pin is followed.
 * - `session`: from what earlier steps saved, `decide(sessionData)`.
 * - `input`: the tester is asked; their answer reaches `decide(input, sessionData)`.
 */
export type DecisionMode = "session" | "input";

export interface StudioDecision {
    mode: DecisionMode;
    /** The values `decide` can return: one out pin each, at least one. */
    cases: string[];
    /** `input` mode: what the tester is asked. The answer is one of the cases, saved as `user_inputs[id]`. */
    input?: { id: string; label: string };
    /** The TypeScript source of `decide`. */
    decide: string;
}

export type EdgeKind =
    | "response"
    | "next"
    | "optional"
    | "branch"
    | "on_demand"
    | "form"
    | "error"
    | "terminal"
    | "mount";

/** Guards and effects are free JSON in this POC: their schema is not settled yet. */
export type Predicate = unknown;
export type Effect = unknown;

/**
 * One API call (or form) on the protocol graph. Editor state only: the v2
 * config schema has no graph yet, so nodes live in memory and a refresh drops
 * them (see TODO(persistence)).
 */
export interface StudioNode {
    /** Unique on the graph, e.g. `search` or `on_search_2`; also the React Flow node id. */
    id: string;
    api: string;
    owner: NodeOwner;
    kind: NodeKind;
    /** The request node this one answers. */
    responseFor: string | null;
    usecases?: string[];
    description: string;
    /** Decoded sources; inspector edits land here. */
    files: ActionFiles;
    /** What `files.generate` / `validate` / `requirements` are written in; absent = TypeScript. */
    codeLanguage?: CodeLanguage;
    /**
     * Which `sessionData` the step functions are typed against: `typed` (the V2
     * view, `cardinality: one` keys unwrapped) or `raw` (as stored, every key a
     * match list, as v1 code reads it). Absent = `typed`.
     */
    sessionView?: "typed" | "raw";
    helperModules?: string[];
    /** Enablement, over state + session + vault. */
    guard?: Predicate;
    /** Present ⇒ this node is a state transition. */
    effects: Effect[];
    repeat?: { max: number | "unbounded"; resetOn?: string };
    /** Needs an explicit UI trigger. */
    manual?: boolean;
    /** Skipping it is not "missed". */
    optional?: boolean;
    /** An async error on_X. */
    error?: { code: string; message?: string };
    /** Negative journey: the NP must NACK; `path` is the field it violates. */
    expects?: { nack: string; path?: string };
    priority?: number;
    examples?: unknown;
    /** Set on (and only on) a `decision` node: how it picks a branch. */
    decision?: StudioDecision;
    /** Editor only: the node's top-left corner, in graph coordinates. */
    position: XYPosition;
}

export interface StudioEdge {
    id: string;
    from: string;
    to: string;
    kind: EdgeKind;
    /** A wire out of a decision node: the case it is taken on (one wire per case). */
    case?: string;
    /** Per-domain strictness: a mandated edge must be followed in this order. */
    mandated: boolean;
}

export interface StudioGraph {
    nodes: StudioNode[];
    edges: StudioEdge[];
}

/** What is selected on the graph: one node, one edge, or nothing. */
export type GraphSelection = { type: "node"; id: string } | { type: "edge"; id: string } | null;

/** What a new node starts from: the menu's add-node rows. */
export interface NodeTemplate {
    kind: NodeKind;
    api: string;
    owner: NodeOwner;
    responseFor?: string | null;
    manual?: boolean;
}

/** Ask the inspector (or the helpers.ts popup) to open a file and select a range in it (1-based, like Monaco). */
export interface RevealRequest {
    tab: CodeFileId;
    line: number;
    column: number;
    length: number;
    /** Bumped per request, so revealing the same spot twice still scrolls. */
    nonce: number;
}

/** A flow published by the ONDC team, ready to drop onto the graph. */
export interface PublishedFlow {
    /** `<usecase>::<flowId>`: flow ids repeat across use cases. */
    key: string;
    title: string;
    entry: FlowEntry;
}

export interface PublishedFlows {
    flows: PublishedFlow[];
    byKey: Map<string, PublishedFlow>;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
}

export interface SearchOptions {
    query: string;
    matchCase: boolean;
    regex: boolean;
}

export interface SearchMatch {
    /** 1-based line number. */
    line: number;
    /** 0-based offset of the match in `text`. */
    column: number;
    length: number;
    /** The whole line the match is on. */
    text: string;
}

/** Every match in one file. */
export interface SearchFileResult {
    key: string;
    /** The node the file belongs to; absent for config-level files (helpers.ts). */
    nodeId?: string;
    tab: CodeFileId;
    /** Where the file lives, e.g. `on_search · Seller Cancellation`. */
    location: string;
    matches: SearchMatch[];
}

export interface SearchOutcome {
    results: SearchFileResult[];
    total: number;
    /** Stopped at the match limit. */
    truncated: boolean;
    /** An invalid regular expression. */
    error?: string;
}

/** A node's exec pins: In, and Then, or one out pin per case on a decision. */
export type PinId = "in" | "out" | `case:${string}`;

export type BlueprintNodeData = {
    node: StudioNode;
    isSelected: boolean;
    /** Pins with a wire attached. */
    wired: PinId[];
};

export type StudioGraphNode = Node<BlueprintNodeData, "studioNode">;

export type BlueprintEdgeData = { edge: StudioEdge; isSelected: boolean };

export type StudioGraphEdge = Edge<BlueprintEdgeData, "studioEdge">;

/** Where a right-click (or a wire dropped on empty canvas) opened the graph menu. */
export type GraphMenuTarget =
    | {
          type: "pane";
          /** A wire dragged out of a node's pin: the new node is wired to it. */
          link?: { nodeId: string; side: "source" | "target"; branchCase?: string };
      }
    | { type: "node"; id: string }
    | { type: "edge"; id: string };

export interface GraphMenuState {
    target: GraphMenuTarget;
    /** Where the menu opens, relative to the editor root. */
    anchor: XYPosition;
    /** The same point in graph coordinates: where a new node goes. */
    at: XYPosition;
}

export interface GraphMenuItem {
    id: string;
    label: string;
    hint?: string;
    /** Colours the row's swatch like a node / edge of this kind. */
    tone?: NodeKind | EdgeKind | "danger" | "neutral";
    Icon?: HeroIcon;
    /** A toggle or radio row's state. */
    checked?: boolean;
    disabled?: boolean;
    /** Extra words the search box matches. */
    keywords?: string;
    onSelect: () => void;
}

export interface GraphMenuSection {
    id: string;
    title: string;
    items: GraphMenuItem[];
}

export interface ConsoleEntry {
    id: string;
    time: Date;
    level: ConsoleLevel;
    message: string;
}

export type ConsoleLevel = "info" | "success" | "warn" | "error";

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    text: string;
}

export interface ConfigValidity {
    ok: boolean;
    error?: string;
}

export interface IStudioEditorProps {
    config: MockPlaygroundConfigV2Type;
    /** Leave the editor for the starter form. The in-memory config is discarded. */
    onExit: () => void;
}

export interface IEditorHeaderBarProps {
    config: MockPlaygroundConfigV2Type;
    validity: ConfigValidity;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
    onExit: () => void;
    /** Opens helpers.ts in the code popup. */
    onOpenHelpers: () => void;
    /** Opens the whole config, as raw JSON, in the code popup. */
    onViewRawConfig: () => void;
    /** Opens the generated types (spec payloads, sessionData, …) in the code popup. */
    onViewTypes: () => void;
    onDownloadConfig: () => void;
    /** What step code is typed against: shown next to the validity badge. */
    typesControl?: React.ReactNode;
}

export interface ICodeDialogProps {
    /** The open file, or null when the popup is closed. */
    file: CodeDialogFile | null;
    onClose: () => void;
    /** The editor root: the popup portals into it, so it keeps the Studio theme and fullscreen. */
    container: HTMLElement | null;
    helpers: string;
    onHelpersChange: (value: string) => void;
    /** The config as it would be exported, helpers.ts edits included. */
    configJson: string;
    onDownloadConfig: () => void;
    reveal: RevealRequest | null;
    /** What step code is typed against, file by file, for the types popup. */
    typeFiles: StudioTypeFile[];
    /** One line on where the types came from (spec, session schema, …). */
    typesSummary: string;
}

export interface IEditorCanvasProps {
    nodes: StudioGraphNode[];
    edges: StudioGraphEdge[];
    onNodesChange: OnNodesChange<StudioGraphNode>;
    onNodeClick: NodeMouseHandler<StudioGraphNode>;
    onNodeDragStart: OnNodeDrag<StudioGraphNode>;
    onNodeContextMenu: NodeMouseHandler<StudioGraphNode>;
    onEdgeClick: EdgeMouseHandler<StudioGraphEdge>;
    onEdgeContextMenu: EdgeMouseHandler<StudioGraphEdge>;
    onPaneClick: () => void;
    onPaneContextMenu: (event: MouseEvent | React.MouseEvent) => void;
    onConnect: OnConnect;
    onConnectEnd: OnConnectEnd;
    isValidConnection: IsValidConnection<StudioGraphEdge>;
    isEmpty: boolean;
    /** Lays the graph out in tidy columns. */
    onTidy: () => void;
}

export interface IGraphMenuProps {
    /** Where the menu opens, relative to `container`. */
    anchor: XYPosition;
    title: string;
    subtitle?: string;
    sections: GraphMenuSection[];
    /** Shows a filter box, like Blueprint's "All actions" menu. */
    searchable: boolean;
    /** Rows that depend on what is typed, e.g. adding a custom API. */
    getQueryItems?: (query: string) => GraphMenuItem[];
    onClose: () => void;
}

export interface IInspectorCardProps {
    isMaximized: boolean;
    onToggleMaximized: () => void;
    /** `separator` props from `useDragResize`, spread onto the card's left-edge handle. */
    resizeHandleProps: React.HTMLAttributes<HTMLDivElement>;
    graph: StudioGraph;
    /** The node whose files and fields the tabs show; null shows step templates. */
    selection: GraphSelection;
    activeTab: InspectorTabId;
    onTabChange: (tab: InspectorTabId) => void;
    actions: Pick<
        StudioGraphActions,
        | "updateNode"
        | "updateNodeFile"
        | "renameNode"
        | "updateEdge"
        | "removeNode"
        | "removeEdge"
        | "updateDecision"
    >;
    reveal: RevealRequest | null;
    /** Function names in helpers.ts, for the helper-call warning in validate / requirements. */
    helperNames?: string[];
}

export interface INodePropertiesProps {
    node: StudioNode;
    nodes: StudioNode[];
    actions: IInspectorCardProps["actions"];
}

export interface IDecisionPropertiesProps {
    node: StudioNode & { decision: StudioDecision };
    edges: StudioEdge[];
    actions: IInspectorCardProps["actions"];
    /** Opens decide.ts. */
    onEditCode: () => void;
}

export interface IEdgePropertiesProps {
    edge: StudioEdge;
    nodes: StudioNode[];
    edges: StudioEdge[];
    actions: IInspectorCardProps["actions"];
}

/** Every edit the graph supports; `useStudioGraph` implements them. */
export interface StudioGraphActions {
    /** Adds nodes and edges at once, e.g. a node plus the wire it was dragged from. */
    addFragment: (fragment: StudioGraph) => void;
    updateNode: (nodeId: string, patch: Partial<Omit<StudioNode, "id">>) => void;
    updateNodeFile: (nodeId: string, file: ActionFileId, value: string) => void;
    /** Renames a node and everything pointing at it. Returns an error, or null. */
    renameNode: (nodeId: string, nextId: string) => string | null;
    /** Moves several nodes at once: a drag of a selection, or a tidy-up. */
    moveNodes: (positions: ReadonlyMap<string, XYPosition>) => void;
    /** Removes the node, its edges, and `responseFor` / `resetOn` pointers to it. */
    removeNode: (nodeId: string) => void;
    /**
     * Wires `from` → `to`; the edge kind is inferred unless given. Out of a
     * decision node the wire leaves `branchCase`'s pin (else the first free
     * one), replacing whatever that pin was wired to. Returns the edge, or null.
     */
    connect: (from: string, to: string, kind?: EdgeKind, branchCase?: string) => StudioEdge | null;
    /**
     * Edits a decision node: its mode, cases and input. `renamed` carries a case
     * rename to its wire; wires of cases that are gone are removed. `decide`'s
     * signature follows (its parameters and return type).
     */
    updateDecision: (
        nodeId: string,
        patch: Partial<Omit<StudioDecision, "decide">>,
        renamed?: [from: string, to: string]
    ) => void;
    updateEdge: (edgeId: string, patch: Partial<Omit<StudioEdge, "id">>) => void;
    removeEdge: (edgeId: string) => void;
    /** Removes every edge into or out of the node. */
    disconnectNode: (nodeId: string) => void;
}

export interface INodesTabProps {
    graph: StudioGraph;
    selection: GraphSelection;
    onSelectNode: (nodeId: string) => void;
    onRemoveNode: (nodeId: string) => void;
}

export interface ISearchTabProps {
    nodes: StudioNode[];
    helpers: string;
    options: SearchOptions;
    onOptionsChange: (options: SearchOptions) => void;
    onOpenMatch: (result: SearchFileResult, match: SearchMatch) => void;
}

export interface IExplorerCardProps {
    /** Collapsed, the card is a slim rail of view icons, like the dock's bar. */
    isOpen: boolean;
    onToggleOpen: () => void;
    tab: ExplorerTab;
    /** Shows a view, opening the card if it is collapsed. */
    onTabChange: (tab: ExplorerTab) => void;
    /** Covered by the maximized inspector: faded out and made inert. */
    isHidden: boolean;
    /** `separator` props from `useDragResize`, spread onto the card's right-edge handle. */
    resizeHandleProps: React.HTMLAttributes<HTMLDivElement>;
    nodesTab: INodesTabProps;
    searchTab: Omit<ISearchTabProps, "options" | "onOptionsChange">;
}

export interface IBottomDockProps {
    open: boolean;
    tab: DockTab;
    /** Covered by the maximized inspector: faded out and made inert. */
    isHidden: boolean;
    onSelectTab: (tab: DockTab) => void;
    onToggleOpen: () => void;
    resizeHandleProps: React.HTMLAttributes<HTMLDivElement>;
    /** Short graph summary for the dock bar, e.g. `12 nodes · 11 edges`. */
    graphSummary: string;
    entries: ConsoleEntry[];
    onClearConsole: () => void;
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    onClearChat: () => void;
}

export interface IInspectorCodePaneProps {
    path: string;
    language: EditorLanguage;
    /**
     * TypeScript step code: which function it is. The pane then compiles it to
     * the JavaScript the runner executes, and marks sandbox errors in place.
     */
    compileAs?: UserCodeKindV2;
    /** The helpers' function names, to warn when validate / meetsRequirements call one. */
    helperNames?: string[];
    value: string;
    onChange?: (value: string) => void;
    readOnly?: boolean;
    /** Scroll to and select this range once the file is open. */
    reveal?: RevealRequest | null;
}

export interface IConsolePanelProps {
    entries: ConsoleEntry[];
    onClear: () => void;
}

export interface IAiChatPanelProps {
    messages: ChatMessage[];
    onSend: (text: string) => void;
    onClear: () => void;
}
