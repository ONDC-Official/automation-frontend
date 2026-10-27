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

export type DockTab = "console" | "problems" | "ai" | "preview" | "run" | "session";

export type ExplorerTab = "nodes" | "search";

/**
 * Studio's four stages, in pipeline order: what the spec provides, the
 * protocol it permits, the mock journeys extracted from it, and a review of
 * the whole. One page; the header's stage bar switches between them.
 */
export type StudioStage = "specification" | "protocol" | "journeys" | "review";

/** An action's own files: the inspector's tabs. */
export type ActionFileId =
    | "generate"
    | "validate"
    | "match"
    | "exit"
    | "requirements"
    | "defaultPayload"
    | "inputs";

/** A decision node's one file: its `decide` function. */
export type DecisionFileId = "decide";

/** A file the inspector can open on a node: an action's, or a decision's. */
export type NodeFileId = ActionFileId | DecisionFileId;

/**
 * The inspector's non-code panes: the node's own fields (a form), the
 * `validations.yaml` tests for its api (read-only), and its `saveData` table.
 */
export type InspectorPaneId = "properties" | "validations" | "saveData";

/** Anything the inspector can show for a node: a file, or one of the panes. */
export type InspectorTabId = NodeFileId | InspectorPaneId;

/** A tab in the file picker: every tab but Properties (which is the section's own row). */
export type InspectorFileId = Exclude<InspectorTabId, "properties">;

/**
 * The four sections of a node, selectable at the top of the inspector:
 * - definition: the node's fields (Properties)
 * - validation: `validator` (validate) and the api's `validations.yaml` tests
 * - generation: `requirements`, `generate`, `defaultPayload`, `inputs`
 * - session: `saveData` — what this step writes into session data
 */
export type NodeSectionId = "definition" | "validation" | "generation" | "session";

/** Every editable code file: a node's own, or the config's helpers.ts (header popup). */
export type CodeFileId = NodeFileId | "helpers";

export type ActionFiles = Record<ActionFileId, string>;

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
export type EditorLanguage = CodeLanguage | "json" | "yaml" | "studio-dts";

/** A node's state in the current simulation. */
export type RunStatus = "idle" | "running" | "done" | "failed" | "skipped";

export interface InspectorTab {
    id: InspectorFileId;
    label: string;
    /** One line on what the file is for, shown as the tab's tooltip. */
    description: string;
    Icon: HeroIcon;
    /** The section the tab belongs to. */
    section: NodeSectionId;
    /** The Monaco language of a code tab; panes (`validations`, `saveData`) have none. */
    language?: EditorLanguage;
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

/**
 * What a node is. The five API kinds are messages; `decision` and `group` are
 * control nodes with no API of their own:
 * - `decision` branches on state (`decide(sessionData)` → one case pin). It is a
 *   *protocol* decision: given what was exchanged, exactly one case is legal.
 * - `group` is a sub-protocol (cancellation, IGM…) drawn collapsed, with its
 *   own graph inside.
 *
 * There is no "tester decides" node. Where the protocol permits several next
 * steps and cannot decide between them (an `on_select` in stock or out of
 * stock — there is no real stock), the node simply has several wires out of
 * one pin: **alternatives**. Which one a mock run takes is a journey's choice,
 * made in the Journeys stage, never on the protocol graph.
 */
export type NodeKind =
    | "request"
    | "callback"
    | "unsolicited"
    | "on_demand"
    | "form"
    | "decision"
    | "group";

/** The kinds that are an API call (or form): every kind but the control nodes. */
export type ApiNodeKind = Exclude<NodeKind, "decision" | "group">;

/** The control nodes: no API, no step files. */
export type ControlNodeKind = Extract<NodeKind, "decision" | "group">;

export interface StudioDecision {
    /** The values `decide` can return: one out pin each, at least one. */
    cases: string[];
    /** The TypeScript source of `decide(sessionData)`. */
    decide: string;
}

/**
 * A sub-protocol: its own graph, drawn as one collapsed node outside and
 * entered by double-click. Inside, wires may start at `GROUP_IN` (the group's
 * In pin) or end at `GROUP_OUT` (its Then pin). Node ids are unique across
 * every level, so journeys and lint address nodes flatly.
 */
export interface StudioGroup {
    /** A readable name, e.g. "Seller cancellation". Required: a reader must know what it is without opening it. */
    name: string;
    /** What the sub-protocol covers, in a sentence or two. Required. */
    description: string;
    graph: StudioGraph;
}

/** Sentinel ids a group's inner wires use for its boundary pins. */
export const GROUP_IN = "$in";
export const GROUP_OUT = "$out";

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
    /**
     * What this step writes into session data once its payload exists, in v1's
     * format: `key → JSONPath` (a match list), `APPEND#key` to accumulate, and
     * `EVAL#<base64 js>` for a `getSave(payload)` function. Absent = nothing.
     */
    saveData?: Record<string, string>;
    /** A form node's HTML (decoded), shown to the tester when the step runs. */
    formHtml?: string;
    helperModules?: string[];
    /**
     * How often the node may run. `until`: it runs again, right after itself,
     * until `files.exit` returns true (e.g. an unsolicited on_status until the
     * order is COMPLETED); reaching `max` first fails the run. Absent = runs
     * once each time the path reaches it.
     */
    repeat?: { max: number | "unbounded"; resetOn?: string; until?: boolean };
    /**
     * A journey may begin here. Only a node with no wire into it can be one;
     * when any node is marked, the entries are exactly the marked nodes.
     */
    start?: boolean;
    /** A transaction may finish here, even though wires lead on. */
    end?: boolean;
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
    /** Set on (and only on) a `decision` node: its cases and `decide`. */
    decision?: StudioDecision;
    /** Set on (and only on) a `group` node: the sub-protocol inside. */
    group?: StudioGroup;
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
    /**
     * The human name of an alternative ("out of stock"), shown on the wire.
     * Journeys use it to name themselves; the linter asks for one wherever a
     * pin has several wires.
     */
    label?: string;
    /** Per-domain strictness: a mandated edge must be followed in this order. */
    mandated: boolean;
}

export interface StudioGraph {
    nodes: StudioNode[];
    edges: StudioEdge[];
}

/**
 * The whole protocol flattened: every node at every level, and every wire
 * with a group's boundary sentinels resolved to the wires outside it. What
 * lint, journeys and coverage read.
 */
export interface FlatGraph {
    nodes: StudioNode[];
    edges: StudioEdge[];
    byId: Map<string, StudioNode>;
    /** Wires out of each node (decision wires included), in graph order. */
    out: Map<string, StudioEdge[]>;
    /** Wires into each node. */
    into: Map<string, StudioEdge[]>;
    /** The group each node sits in, by node id; absent at the top level. */
    groupOf: Map<string, string>;
}

/**
 * A fork: a place a path can go more than one way.
 * - `alternatives`: ≥2 wires out of one pin of an API node. The protocol
 *   permits any; the actor owning the targets picks. A journey must choose.
 * - `decision`: a decision node. The protocol decides from state at run time; a
 *   journey may record the case it expects, so a linear preview can be drawn.
 */
export interface Fork {
    /** `${nodeId}` for alternatives, `${nodeId}:decision` for a decision. */
    key: string;
    nodeId: string;
    kind: "alternatives" | "decision";
    /** Who picks at run time: the owner of the targets, or the protocol itself. */
    chooser: NodeOwner | "protocol" | "mixed";
    options: ForkOption[];
}

export interface ForkOption {
    edge: StudioEdge;
    target: StudioNode;
    /** `edge.label`, else the decision case, else the target's id. */
    label: string;
}

/**
 * One mock run through the protocol, every fork resolved. Extracted from the
 * protocol graph in the Journeys stage; the graph itself never says which
 * alternative a run takes.
 */
export interface StudioJourney {
    /** A slug, unique among journeys. */
    id: string;
    title: string;
    description: string;
    /** MANDATORY, NEGATIVE, … free-form. */
    tags: string[];
    usecase?: string;
    /** The node the run starts at. */
    entry: string;
    /** Fork key (`Fork.key`) → the chosen target node id, for alternatives. */
    choices: Record<string, string>;
    /** Decision node id → the case this journey expects. At run time the decision decides. */
    expects: Record<string, string>;
    /** on_demand nodes the tester may fire during this journey. */
    onDemand: string[];
    /** Optional nodes on the path this journey passes over instead of running. Absent = none. */
    skips?: string[];
    /** The node the journey finishes at (an End node, or one no wire leaves). Absent = runs to the end. */
    exit?: string;
    /** Per-node payload overlays. Reserved: shown, not editable yet. */
    seeds?: Record<string, unknown>;
}

/** A step of a journey as walked: a node reached, or a fork still open. */
export type JourneyStep =
    | {
          type: "node";
          node: StudioNode;
          via?: StudioEdge;
          index: number;
          skipped?: boolean;
          /** A repeat-until node: it runs again until its exit condition holds (drawn once). */
          repeats?: boolean;
      }
    | { type: "fork"; fork: Fork; chosen?: ForkOption; index: number };

/** A problem the Protocol or Journeys stage reports. */
export interface ProtocolProblem {
    id: string;
    level: "error" | "warning" | "info";
    message: string;
    nodeId?: string;
    edgeId?: string;
    journeyId?: string;
}

/**
 * What is selected on the graph: one node, several nodes (two or more, on
 * the current level), one edge, or nothing.
 */
export type GraphSelection =
    | { type: "node"; id: string }
    | { type: "nodes"; ids: string[] }
    | { type: "edge"; id: string }
    | null;

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
    /** How many wires leave the Then pin: ≥2 is a fork of alternatives. */
    fanOut: number;
    /** Journeys stage: on the lit path (`true`), off it (`false`), or no highlight (`undefined`). */
    lit?: boolean;
    /** Journeys stage, while a simulation runs: how far it got with this node. */
    runStatus?: RunStatus;
    /** A group's boundary pseudo-node inside it: the group's In or Then pin. */
    boundary?: "in" | "out";
};

export type StudioGraphNode = Node<BlueprintNodeData, "studioNode">;

export type BlueprintEdgeData = {
    edge: StudioEdge;
    isSelected: boolean;
    /** This wire is one of ≥2 out of the same pin: an alternative, so its label always shows. */
    isAlternative: boolean;
    lit?: boolean;
    /** Journeys stage: an option of the fork waiting to be resolved. */
    pending?: boolean;
};

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
    /** Edits from the Specification stage (meta). Held by the page, like the config itself. */
    onConfigChange: (config: MockPlaygroundConfigV2Type) => void;
    stage: StudioStage;
    onStageChange: (stage: StudioStage) => void;
    /** Leave the editor for the starter form. The local draft is kept, so it can be resumed. */
    onExit: () => void;
    /** The draft to resume from (graph, journeys, helpers); absent for a new config. */
    draft?: StudioDraftContent | null;
}

/** What the editor keeps in the local draft besides the config (see `persistence/studio-draft.ts`). */
export interface StudioDraftContent {
    graph: StudioGraph;
    journeys: StudioJourney[];
    /** helpers.ts source, decoded. */
    helpers: string;
}

/** One stage's entry on the header's stage bar. */
export interface StageStatus {
    /** A short read-out under the name, e.g. `18 nodes · 3 forks`. */
    summary: string;
    /** Problems in this stage: colours the pill. */
    errors: number;
    warnings: number;
}

export interface IEditorHeaderBarProps {
    config: MockPlaygroundConfigV2Type;
    validity: ConfigValidity;
    stage: StudioStage;
    onStageChange: (stage: StudioStage) => void;
    stageStatus: Record<StudioStage, StageStatus>;
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
    onNodeDoubleClick?: NodeMouseHandler<StudioGraphNode>;
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
    /** Undo / redo buttons in the canvas controls (not shown when read-only). */
    history?: { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean };
    /** The Journeys stage: nodes stay put, no wiring, no menu; a path is lit and the rest dimmed. */
    readOnly?: boolean;
    /** Inside a group: `Protocol › Cancellation › …`, each a step back up. */
    breadcrumb?: { label: string; onSelect: () => void }[];
    /** What to say when the level is empty, instead of the default hint. */
    emptyHint?: { title: string; sub: string };
}

/** Which nodes and wires a journey lights up on the canvas; everything else is dimmed. */
export interface GraphHighlight {
    nodes: ReadonlySet<string>;
    edges: ReadonlySet<string>;
    /** The fork a journey still has to resolve: its options pulse. */
    pendingEdges?: ReadonlySet<string>;
    /** A running simulation: per node id, how far it got. */
    runStatus?: Readonly<Record<string, RunStatus>>;
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

/** Edits on a selection of several nodes (the inspector's multi-selection card). */
export interface IMultiSelectionActions {
    onDuplicate: () => void;
    onCopy: () => void;
    onGroup: () => void;
    onDelete: () => void;
}

export interface IMultiSelectionProps extends IMultiSelectionActions {
    nodes: StudioNode[];
}

export interface IInspectorCardProps {
    isMaximized: boolean;
    onToggleMaximized: () => void;
    /** `separator` props from `useDragResize`, spread onto the card's left-edge handle. */
    resizeHandleProps: React.HTMLAttributes<HTMLDivElement>;
    /** The level the canvas shows. */
    graph: StudioGraph;
    /** That level is inside a group. */
    inGroup?: boolean;
    /** The node whose files and fields the tabs show; null shows step templates. */
    selection: GraphSelection;
    activeTab: InspectorTabId;
    onTabChange: (tab: InspectorTabId) => void;
    actions: Pick<
        StudioGraphActions,
        | "updateNode"
        | "updateNodeFile"
        | "updateNodeSaveData"
        | "renameNode"
        | "updateEdge"
        | "removeNode"
        | "removeEdge"
        | "updateDecision"
        | "updateGroup"
        | "ungroup"
        | "enterGroup"
    >;
    reveal: RevealRequest | null;
    /** What the inspector offers for a selection of several nodes. */
    multiActions?: IMultiSelectionActions;
    /** Function names in helpers.ts, for the helper-call warning in validate / requirements. */
    helperNames?: string[];
    /** The config's domain + version: which `validations.yaml` the Validation section shows. */
    domain: string;
    version: string;
    /** Per node, the session values its last simulated run saved (Session › Last run). */
    lastSaved?: Record<string, Record<string, unknown>>;
}

export interface INodePropertiesProps {
    node: StudioNode;
    nodes: StudioNode[];
    /** A main-path wire leads into the node, so it cannot be marked Start. */
    wiredInto: boolean;
    actions: IInspectorCardProps["actions"];
    /** Opens one of the node's files (e.g. exit.ts once repeat-until is on). */
    onEditFile: (file: ActionFileId) => void;
}

export interface IDecisionPropertiesProps {
    node: StudioNode & { decision: StudioDecision };
    edges: StudioEdge[];
    actions: IInspectorCardProps["actions"];
    /** Opens decide.ts. */
    onEditCode: () => void;
}

export interface IGroupPropertiesProps {
    node: StudioNode & { group: StudioGroup };
    actions: IInspectorCardProps["actions"];
    /** Opens the group's own canvas. */
    onEnter: () => void;
}

export interface IEdgePropertiesProps {
    edge: StudioEdge;
    nodes: StudioNode[];
    edges: StudioEdge[];
    /** Inside a group: the wire may start at Entry or end at Exit. */
    inGroup?: boolean;
    actions: IInspectorCardProps["actions"];
}

/** Every edit the graph supports; `useStudioGraph` implements them. */
export interface StudioGraphActions {
    /** Adds nodes and edges at once, e.g. a node plus the wire it was dragged from. */
    addFragment: (fragment: StudioGraph) => void;
    updateNode: (nodeId: string, patch: Partial<Omit<StudioNode, "id">>) => void;
    updateNodeFile: (nodeId: string, file: ActionFileId, value: string) => void;
    /** Replaces the node's `saveData` map. */
    updateNodeSaveData: (nodeId: string, saveData: Record<string, string>) => void;
    /** Renames a node and everything pointing at it. Returns an error, or null. */
    renameNode: (nodeId: string, nextId: string) => string | null;
    /**
     * Moves several nodes at once: a drag of a selection, or a tidy-up. Moves
     * passing the same `gesture` (one drag) are one undo step.
     */
    moveNodes: (positions: ReadonlyMap<string, XYPosition>, gesture?: string) => void;
    /** Removes the node, its edges, and `responseFor` / `resetOn` pointers to it. */
    removeNode: (nodeId: string) => void;
    /** `removeNode` for several nodes of the current level, as one edit. */
    removeNodes: (nodeIds: readonly string[]) => void;
    /**
     * Wires `from` → `to`; the edge kind is inferred unless given. Out of a
     * decision node the wire leaves `branchCase`'s pin (else the first free
     * one), replacing whatever that pin was wired to. Out of an API node a
     * second wire from the same pin is an alternative. Returns the edge, or null.
     */
    connect: (from: string, to: string, kind?: EdgeKind, branchCase?: string) => StudioEdge | null;
    /**
     * Edits a decision node's cases. `renamed` carries a case rename to its wire;
     * wires of cases that are gone are removed. `decide`'s return type follows.
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
    /**
     * Collapses `nodeIds` (on the current level) into one group node named
     * `name`. Wires crossing the boundary are re-pointed at the group's pins
     * inside, and at the group node outside. Returns the group's id, or null.
     */
    groupNodes: (nodeIds: string[], name: string, description: string) => string | null;
    /** Dissolves a group: its nodes rejoin the current level where the group stood. */
    ungroup: (groupId: string) => void;
    /** Edits a group's name / description. */
    updateGroup: (groupId: string, patch: Partial<StudioGroup>) => void;
    /** Opens a group's own canvas (it must be on the current level). */
    enterGroup: (groupId: string) => void;
    /** Goes back up to level `depth` of the path (0 = the top). */
    exitToLevel: (depth: number) => void;
    /** Shows the level at `path` (group ids, top down), e.g. to reveal a node inside a group. */
    openLevel: (path: string[]) => void;
}

export interface INodesTabProps {
    graph: StudioGraph;
    selection: GraphSelection;
    onSelectNode: (nodeId: string) => void;
    onRemoveNode: (nodeId: string) => void;
    /** Double-click on a group row opens it. */
    onEnterGroup?: (groupId: string) => void;
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
    problems: ProtocolProblem[];
    /** Selects (and pans to) the node / wire a problem points at. */
    onRevealProblem: (problem: ProtocolProblem) => void;
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    onClearChat: () => void;
    /** Tabs a stage adds in front of the fixed ones (the Journeys stage's flow preview, run, session). */
    extraTabs?: {
        id: DockTab;
        label: string;
        Icon: HeroIcon;
        content: React.ReactNode;
        count?: number;
    }[];
}

export interface IProblemsPanelProps {
    problems: ProtocolProblem[];
    onReveal: (problem: ProtocolProblem) => void;
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
