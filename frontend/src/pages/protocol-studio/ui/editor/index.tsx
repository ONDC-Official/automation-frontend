import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { loader, type Monaco } from "@monaco-editor/react";
import {
    MockRunnerV2,
    SANDBOX_GLOBALS_DTS_V2,
    type MockPlaygroundConfigV2Type,
} from "@ondc/automation-mock-runner";
import {
    ReactFlowProvider,
    useReactFlow,
    type EdgeMouseHandler,
    type IsValidConnection,
    type NodeMouseHandler,
    type OnConnect,
    type OnConnectEnd,
    type OnNodeDrag,
    type OnNodesChange,
    type XYPosition,
} from "@xyflow/react";
import "@pages/protocol-studio/ui/editor/studio-editor.css";

import { useDragResize } from "@pages/protocol-studio/hooks/use-drag-resize";
import { useFullscreen } from "@pages/protocol-studio/hooks/use-fullscreen";
import { usePublishedFlows } from "@pages/protocol-studio/hooks/use-published-flows";
import { useHelpersTypeScript } from "@pages/protocol-studio/hooks/use-helpers-typescript";
import { useSpecTypes } from "@pages/protocol-studio/hooks/use-spec-types";
import { useStudioGraph } from "@pages/protocol-studio/hooks/use-studio-graph";
import {
    AI_PLACEHOLDER_REPLY,
    DOCK_BAR_HEIGHT,
    DOCK_HEIGHT,
    EXPLORER_RAIL_WIDTH,
    EXPLORER_WIDTH,
    FOCUS_DURATION_MS,
    getDockMaxHeight,
    getExplorerMaxWidth,
    getInspectorMaxWidth,
    INSPECTOR_WIDTH,
} from "@pages/protocol-studio/ui/editor/constants";
import { CodeDialog } from "@pages/protocol-studio/ui/editor/code-dialog";
import { BottomDock } from "@pages/protocol-studio/ui/editor/dock";
import { EditorCanvas } from "@pages/protocol-studio/ui/editor/editor-canvas";
import { ExplorerCard } from "@pages/protocol-studio/ui/editor/explorer";
import { decodeHelpers } from "@pages/protocol-studio/ui/editor/flows/action-files";
import { toGraphFragment } from "@pages/protocol-studio/ui/editor/flows/published-flow";
import {
    createNode,
    getUniqueNodeId,
    inferEdgeKind,
    isUnpairedCallbackOf,
    makeEdgeId,
    NODE_KINDS,
} from "@pages/protocol-studio/ui/editor/graph/catalog";
import { tidyLayout } from "@pages/protocol-studio/ui/editor/graph/auto-layout";
import { getFreeCase, getPinCase } from "@pages/protocol-studio/ui/editor/graph/decision";
import { GraphMenu } from "@pages/protocol-studio/ui/editor/graph/graph-menu";
import {
    BP,
    buildGraph,
    EXEC_PIN_TOP,
    getGraphBounds,
    getNodeRect,
    type GraphRect,
} from "@pages/protocol-studio/ui/editor/graph/layout";
import { getMenuContent, type NodeLink } from "@pages/protocol-studio/ui/editor/graph/menu-content";
import { EditorHeaderBar } from "@pages/protocol-studio/ui/editor/header-bar";
import { InspectorCard } from "@pages/protocol-studio/ui/editor/inspector";
import {
    configureStudioTypeScript,
    setStudioTypeLibs,
} from "@pages/protocol-studio/ui/editor/inspector/typescript-setup";
import { describeTypes, TypesControl } from "@pages/protocol-studio/ui/editor/types-control";
import type {
    ChatMessage,
    CodeDialogFile,
    ConfigValidity,
    ConsoleEntry,
    ConsoleLevel,
    DockTab,
    ExplorerTab,
    GraphMenuState,
    GraphMenuTarget,
    GraphSelection,
    InspectorTabId,
    IStudioEditorProps,
    NodeTemplate,
    PublishedFlow,
    RevealRequest,
    SearchFileResult,
    SearchMatch,
    StudioEdge,
    StudioGraph,
    StudioGraphActions,
    StudioTypeFile,
    StudioGraphEdge,
    StudioGraphNode,
    StudioNode,
} from "@pages/protocol-studio/ui/editor/types";

let nextId = 0;
const makeId = () => `studio-${++nextId}`;

const logEntry = (level: ConsoleLevel, message: string): ConsoleEntry => ({
    id: makeId(),
    time: new Date(),
    level,
    message,
});

const getValidity = (config: MockPlaygroundConfigV2Type): ConfigValidity => {
    try {
        new MockRunnerV2(config);
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
};

/** Typing in these never triggers the graph's keyboard shortcuts. */
const isTypingTarget = (target: EventTarget | null) =>
    target instanceof HTMLElement &&
    (target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.closest(".monaco-editor") !== null);

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Monaco, once loaded (the editors load it; this shares the same instance).
 * Not `useMonaco()`: that cancels the load on unmount, and under StrictMode's
 * double mount the cancellation surfaces as an unhandled rejection.
 */
const useMonacoInstance = () => {
    const [monaco, setMonaco] = useState<Monaco | null>(null);
    useEffect(() => {
        let active = true;
        loader
            .init()
            .then((instance) => {
                if (active) setMonaco(instance);
            })
            // A failed load is reported by the editors themselves.
            .catch(() => {});
        return () => {
            active = false;
        };
    }, []);
    return monaco;
};

const downloadJson = (fileName: string, json: string) => {
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};

/** Room left around the graph when it is fitted to the view, in graph units. */
const FIT_PADDING = 48;
/** Matches the canvas's own `minZoom`. */
const MIN_ZOOM = 0.2;

/** How far a duplicate lands from its original. */
const DUPLICATE_OFFSET = 32;

/**
 * Studio editor, filling the window under the app header: a graph canvas with
 * floating frosted-glass panels — the explorer (nodes, search) on the left, the
 * inspector on the right, the console / AI dock below — themed from the app's
 * tokens so it follows light / dark. helpers.ts and the raw config open in a
 * popup from the header. Nodes are added from the right-click menu, dragged
 * freely and wired pin to pin; the graph lives in memory only.
 */
const StudioEditorContent = ({ config, onExit }: IStudioEditorProps) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const validity = useMemo(() => getValidity(config), [config]);
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(rootRef);
    const { getViewport, setViewport, screenToFlowPosition } = useReactFlow();

    const { graph, graphRef, actions } = useStudioGraph();
    const published = usePublishedFlows(config.meta.domain, config.meta.version);
    // helpers.ts: its TypeScript source when the config has one, else the
    // JavaScript helperLib (valid TypeScript as it stands).
    const [helpers, setHelpers] = useState(() =>
        decodeHelpers(config.helperLibTs ?? config.helperLib)
    );

    // What step code is typed against: the spec's API schemas, the chosen use
    // case's session data (undefined = picked from the config's use_case_id),
    // the sandbox's globals, and helpers.ts's declarations. Each step file is
    // checked on its own with these, so nodes never see each other's functions.
    const [usecaseChoice, setUsecaseChoice] = useState<string | null | undefined>(undefined);
    const specTypes = useSpecTypes(config.meta.domain, config.meta.version, {
        usecase: usecaseChoice,
        hint: config.meta.use_case_id,
    });
    const monaco = useMonacoInstance();
    const compiledHelpers = useHelpersTypeScript(monaco, helpers);
    useEffect(() => {
        if (!monaco) return;
        configureStudioTypeScript(monaco);
        setStudioTypeLibs(monaco, {
            "ondc-api.d.ts": specTypes.apiDts,
            "ondc-session.d.ts": specTypes.sessionDts,
            "sandbox.d.ts": SANDBOX_GLOBALS_DTS_V2,
            "helpers.d.ts": compiledHelpers.dts,
        });
    }, [monaco, specTypes.apiDts, specTypes.sessionDts, compiledHelpers.dts]);

    // The same declarations, file by file, for the "View types" popup.
    const typeFiles = useMemo<StudioTypeFile[]>(() => {
        const session = specTypes.session;
        const files: StudioTypeFile[] = [
            {
                id: "api",
                label: "ondc-api.d.ts",
                description: specTypes.apiCount
                    ? `Payload<"…">: the request payload of each of ${specTypes.apiCount} APIs, from the spec's JSON Schemas`
                    : "No spec types: every payload is AnyPayload",
                content: specTypes.apiDts,
                language: "studio-dts",
            },
            {
                id: "session",
                label: "ondc-session.d.ts",
                description: session
                    ? `SessionData (V2 view) and SessionDataRaw (as stored) for ${session.schema.id}`
                    : "No session schema: sessionData is untyped",
                content: specTypes.sessionDts,
                language: "studio-dts",
            },
            {
                id: "sandbox",
                label: "sandbox.d.ts",
                description:
                    "What step code can use besides ES2020: console, timers, fetch (generate only)",
                content: SANDBOX_GLOBALS_DTS_V2,
                language: "studio-dts",
            },
            {
                id: "helpers",
                label: "helpers.d.ts",
                description:
                    "What helpers.ts declares, as step code sees it: callable inside generate only",
                content: compiledHelpers.dts || "// helpers.ts hasn't compiled yet.\n",
                language: "studio-dts",
            },
        ];
        if (session) {
            files.push({
                id: "session-schema",
                label: "session-schema.json",
                description: `The session schema the types come from: inferred from ${session.report.flows} published flows`,
                content: JSON.stringify(session.schema, null, 2),
                language: "json",
            });
        }
        return files;
    }, [specTypes, compiledHelpers.dts]);

    // A deleted (or renamed) node's files would stay in the TypeScript program,
    // their globals visible to every other node: drop their models.
    const nodeIdsKey = graph.nodes.map((node) => node.id).join("\n");
    useEffect(() => {
        if (!monaco) return;
        const live = new Set(nodeIdsKey.split("\n"));
        for (const model of monaco.editor.getModels()) {
            const { scheme, authority } = model.uri;
            if (scheme !== "studio" || authority === "templates" || authority === "config") {
                continue;
            }
            if (!live.has(authority) && !live.has(decodeURIComponent(authority))) model.dispose();
        }
    }, [monaco, nodeIdsKey]);
    const [codeDialog, setCodeDialog] = useState<CodeDialogFile | null>(null);

    const [selection, setSelection] = useState<GraphSelection>(null);
    const [menu, setMenu] = useState<GraphMenuState | null>(null);
    const [inspectorTab, setInspectorTab] = useState<InspectorTabId>("properties");
    const [reveal, setReveal] = useState<RevealRequest | null>(null);
    const [explorer, setExplorer] = useState<{ open: boolean; tab: ExplorerTab }>({
        open: true,
        tab: "nodes",
    });

    const [isInspectorMaximized, setInspectorMaximized] = useState(false);
    const [dock, setDock] = useState<{ open: boolean; tab: DockTab }>({
        open: false,
        tab: "console",
    });
    const [entries, setEntries] = useState<ConsoleEntry[]>(() => [
        logEntry("info", `Config created · ${config.meta.domain} ${config.meta.version}`),
        validity.ok
            ? logEntry("success", "MockRunnerV2: config valid")
            : logEntry("error", `MockRunnerV2: ${validity.error}`),
        logEntry("info", "Graph is empty · right-click the canvas to add a node"),
    ]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const log = useCallback(
        (level: ConsoleLevel, message: string) =>
            setEntries((prev) => [...prev, logEntry(level, message)]),
        []
    );

    // A selection whose node / edge was deleted (or renamed away) is no selection.
    const liveSelection: GraphSelection =
        selection?.type === "node" && graph.nodes.some((n) => n.id === selection.id)
            ? selection
            : selection?.type === "edge" && graph.edges.some((e) => e.id === selection.id)
              ? selection
              : null;
    const rfGraph = useMemo(() => buildGraph(graph, liveSelection), [graph, liveSelection]);

    // The config as it would be exported: helpers.ts edits are encoded back in.
    const configJson = useMemo(
        () =>
            JSON.stringify(
                {
                    ...config,
                    // What runs: the last helpers.ts that compiled (the original until one has).
                    helperLib: compiledHelpers.js
                        ? MockRunnerV2.encodeBase64(compiledHelpers.js)
                        : config.helperLib,
                    // What the editor shows: the TypeScript source.
                    helperLibTs: MockRunnerV2.encodeBase64(helpers),
                },
                null,
                2
            ),
        [config, helpers, compiledHelpers.js]
    );
    const downloadSessionSchema = useCallback(() => {
        const session = specTypes.session;
        if (!session) return;
        // JSON is valid YAML: the file can go straight into the specs repo to curate.
        downloadJson(`${session.schema.id}.session.json`, JSON.stringify(session.schema, null, 2));
        log("success", `Downloaded session schema ${session.schema.id}`);
    }, [specTypes.session, log]);

    const downloadConfig = useCallback(() => {
        const { domain, version } = config.meta;
        downloadJson(`${domain}_${version}_config.json`.replace(/[^\w.-]+/g, "_"), configJson);
        log("success", "Downloaded config.json");
    }, [config.meta, configJson, log]);

    const inspectorResize = useDragResize({
        targetRef: rootRef,
        cssVar: "--studio-inspector-w",
        axis: "x",
        direction: -1,
        initial: INSPECTOR_WIDTH.initial,
        min: INSPECTOR_WIDTH.min,
        max: getInspectorMaxWidth,
    });
    const explorerResize = useDragResize({
        targetRef: rootRef,
        cssVar: "--studio-explorer-w",
        axis: "x",
        direction: 1,
        initial: EXPLORER_WIDTH.initial,
        min: EXPLORER_WIDTH.min,
        max: getExplorerMaxWidth,
    });
    const dockResize = useDragResize({
        targetRef: rootRef,
        cssVar: "--studio-dock-h",
        axis: "y",
        direction: -1,
        initial: DOCK_HEIGHT.initial,
        min: DOCK_HEIGHT.min,
        max: getDockMaxHeight,
    });

    // Esc restores a maximized inspector — unless Monaco wants it (closing a widget).
    useEffect(() => {
        if (!isInspectorMaximized) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            if (e.target instanceof Element && e.target.closest(".monaco-editor")) return;
            setInspectorMaximized(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isInspectorMaximized]);

    /**
     * Pans (and zooms) so `rect` sits in the middle of the visible canvas — the
     * part the explorer, inspector and dock leave uncovered, not the whole pane.
     */
    const centerOn = useCallback(
        (rect: GraphRect, zoom: number) => {
            const root = rootRef.current;
            const area = root?.querySelector<HTMLElement>(".studio-canvas-area");
            if (!root || !area) return;
            const rootBox = root.getBoundingClientRect();
            const areaBox = area.getBoundingClientRect();
            const cx = areaBox.left - rootBox.left + areaBox.width / 2;
            const cy = areaBox.top - rootBox.top + areaBox.height / 2;
            void setViewport(
                {
                    x: cx - (rect.x + rect.width / 2) * zoom,
                    y: cy - (rect.y + rect.height / 2) * zoom,
                    zoom,
                },
                { duration: FOCUS_DURATION_MS }
            );
        },
        [setViewport]
    );

    const focusNode = useCallback(
        (nodeId: string) => {
            const node = graphRef.current.nodes.find((n) => n.id === nodeId);
            if (!node) return;
            const rect = getNodeRect(node);
            centerOn(rect, clamp(getViewport().zoom, 0.85, 1.25));
        },
        [graphRef, centerOn, getViewport]
    );

    /** Fits the whole graph (or `target`, a graph about to be shown) into the visible canvas, not under the panels. */
    const fitGraph = useCallback(
        (target?: StudioGraph) => {
            const current = target ?? graphRef.current;
            const bounds = getGraphBounds(current);
            const area = rootRef.current?.querySelector<HTMLElement>(".studio-canvas-area");
            if (!bounds || !area) return;
            const zoom = Math.min(
                area.clientWidth / (bounds.width + FIT_PADDING * 2),
                area.clientHeight / (bounds.height + FIT_PADDING * 2)
            );
            centerOn(bounds, clamp(zoom, MIN_ZOOM, 1));
        },
        [graphRef, centerOn]
    );

    const select = useCallback((next: GraphSelection) => {
        setSelection(next);
        setReveal(null);
    }, []);

    const selectNode = useCallback(
        (nodeId: string) => select({ type: "node", id: nodeId }),
        [select]
    );

    const removeNode = useCallback(
        (nodeId: string) => {
            actions.removeNode(nodeId);
            log("info", `Deleted ${nodeId}`);
        },
        [actions, log]
    );

    const removeEdge = useCallback(
        (edgeId: string) => {
            const edge = graphRef.current.edges.find((e) => e.id === edgeId);
            actions.removeEdge(edgeId);
            if (edge) log("info", `Deleted wire ${edge.from} → ${edge.to}`);
        },
        [actions, graphRef, log]
    );

    // The graph's edits as panels and the menu see them: deletes and renames are logged.
    const editActions = useMemo<StudioGraphActions>(
        () => ({
            ...actions,
            removeNode,
            removeEdge,
            renameNode: (nodeId, nextId) => {
                const error = actions.renameNode(nodeId, nextId);
                const id = nextId.trim();
                if (!error && id !== nodeId) {
                    // The selection follows the node to its new id.
                    setSelection({ type: "node", id });
                    log("info", `Renamed ${nodeId} to ${id}`);
                }
                return error;
            },
        }),
        [actions, removeNode, removeEdge, log]
    );

    /**
     * Adds a node from the menu. Wired to `link`, the new node's matching pin
     * lands on `at` (where the wire was dropped); otherwise `at` is its top-left.
     */
    const addNode = useCallback(
        (template: NodeTemplate, at: XYPosition, link?: NodeLink) => {
            const { nodes } = graphRef.current;
            const linked = link ? nodes.find((n) => n.id === link.nodeId) : undefined;
            const id = getUniqueNodeId(template.api, new Set(nodes.map((n) => n.id)));
            let position = at;
            if (linked && link?.side === "source") position = { x: at.x, y: at.y - EXEC_PIN_TOP };
            if (linked && link?.side === "target") {
                position = { x: at.x - BP.width, y: at.y - EXEC_PIN_TOP };
            }
            const node = createNode(template, id, position);

            const edges: StudioEdge[] = [];
            if (linked) {
                const [from, to] = link?.side === "source" ? [linked, node] : [node, linked];
                // A request wired to its own lone callback: the callback answers it.
                const answers = isUnpairedCallbackOf(from, to);
                if (answers && to === node) node.responseFor = from.id;
                // Out of a decision: the case pin it was dragged from, or the new node's first.
                const branchCase = from.decision
                    ? (link?.branchCase ?? getFreeCase(from, graphRef.current.edges))
                    : undefined;
                if (branchCase !== undefined && from === linked) {
                    for (const edge of graphRef.current.edges) {
                        if (edge.from === from.id && edge.case === branchCase) {
                            actions.removeEdge(edge.id);
                        }
                    }
                }
                edges.push({
                    id: makeEdgeId(),
                    from: from.id,
                    to: to.id,
                    kind: answers ? "response" : inferEdgeKind(from, to),
                    ...(branchCase !== undefined ? { case: branchCase } : {}),
                    mandated: true,
                });
                if (answers && to === linked)
                    actions.updateNode(linked.id, { responseFor: node.id });
            }
            actions.addFragment({ nodes: [node], edges });
            select({ type: "node", id });
            log("info", `Added ${NODE_KINDS[template.kind].label.toLowerCase()} ${id}`);
        },
        [actions, graphRef, log, select]
    );

    const duplicateNode = useCallback(
        (nodeId: string) => {
            const { nodes } = graphRef.current;
            const original = nodes.find((n) => n.id === nodeId);
            if (!original) return;
            const id = getUniqueNodeId(original.id, new Set(nodes.map((n) => n.id)));
            const copy: StudioNode = {
                ...structuredClone(original),
                id,
                position: {
                    x: original.position.x + DUPLICATE_OFFSET,
                    y: original.position.y + DUPLICATE_OFFSET,
                },
            };
            actions.addFragment({ nodes: [copy], edges: [] });
            select({ type: "node", id });
            log("info", `Duplicated ${nodeId} as ${id}`);
        },
        [actions, graphRef, log, select]
    );

    const insertFlow = useCallback(
        (flow: PublishedFlow, at: XYPosition) => {
            const taken = new Set(graphRef.current.nodes.map((n) => n.id));
            const fragment = toGraphFragment(flow, at, taken);
            actions.addFragment(fragment);
            log("success", `Inserted ${flow.title} · ${fragment.nodes.length} nodes`);
        },
        [actions, graphRef, log]
    );

    const tidy = useCallback(() => {
        const current = graphRef.current;
        const positions = tidyLayout(current);
        if (positions.size === 0) return;
        actions.moveNodes(positions);
        log("info", "Tidied the layout");
        // Fit to where the nodes are going: the state update has not run yet.
        fitGraph({
            ...current,
            nodes: current.nodes.map((node) => ({
                ...node,
                position: positions.get(node.id) ?? node.position,
            })),
        });
    }, [actions, graphRef, fitGraph, log]);

    const editNode = useCallback(
        (nodeId: string, tab: InspectorTabId) => {
            selectNode(nodeId);
            setInspectorTab(tab);
        },
        [selectNode]
    );

    /** Opens the graph menu at a pointer position, for whatever was right-clicked. */
    const openMenu = useCallback(
        (target: GraphMenuTarget, client: XYPosition) => {
            const box = rootRef.current?.getBoundingClientRect();
            if (!box) return;
            setMenu({
                target,
                anchor: { x: client.x - box.left, y: client.y - box.top },
                at: screenToFlowPosition(client),
            });
        },
        [screenToFlowPosition]
    );
    const closeMenu = useCallback(() => setMenu(null), []);

    const menuContent = menu
        ? getMenuContent(menu, {
              graph,
              published,
              actions: editActions,
              addNode,
              insertFlow,
              duplicateNode,
              editNode,
              selectEdge: (edgeId) => select({ type: "edge", id: edgeId }),
              fitView: () => fitGraph(),
              tidy,
          })
        : null;

    // Delete / Backspace remove the selection — unless typing somewhere.
    useEffect(() => {
        if (!liveSelection || menu) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Delete" && e.key !== "Backspace") return;
            if (isTypingTarget(e.target)) return;
            e.preventDefault();
            if (liveSelection.type === "node") removeNode(liveSelection.id);
            else removeEdge(liveSelection.id);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [liveSelection, menu, removeNode, removeEdge]);

    const openMatch = (result: SearchFileResult, match: SearchMatch) => {
        if (result.nodeId) {
            setSelection({ type: "node", id: result.nodeId });
            focusNode(result.nodeId);
        }
        // helpers.ts lives in the header popup; every other file is an inspector tab.
        if (result.tab === "helpers") setCodeDialog("helpers");
        else setInspectorTab(result.tab);
        setReveal({
            tab: result.tab,
            line: match.line,
            column: match.column + 1,
            length: match.length,
            nonce: ++nextId,
        });
    };

    const onNodesChange = useCallback<OnNodesChange<StudioGraphNode>>(
        (changes) => {
            const positions = new Map<string, XYPosition>();
            for (const change of changes) {
                if (change.type !== "position" || !change.position) continue;
                positions.set(change.id, change.position);
            }
            if (positions.size > 0) actions.moveNodes(positions);
        },
        [actions]
    );

    const onNodeClick = useCallback<NodeMouseHandler<StudioGraphNode>>(
        (_, node) => selectNode(node.id),
        [selectNode]
    );

    const onNodeDragStart = useCallback<OnNodeDrag<StudioGraphNode>>(
        (_, node) => selectNode(node.id),
        [selectNode]
    );

    const onNodeContextMenu = useCallback<NodeMouseHandler<StudioGraphNode>>(
        (e, node) => {
            e.preventDefault();
            selectNode(node.id);
            openMenu({ type: "node", id: node.id }, { x: e.clientX, y: e.clientY });
        },
        [openMenu, selectNode]
    );

    const onEdgeClick = useCallback<EdgeMouseHandler<StudioGraphEdge>>(
        (_, edge) => select({ type: "edge", id: edge.id }),
        [select]
    );

    const onEdgeContextMenu = useCallback<EdgeMouseHandler<StudioGraphEdge>>(
        (e, edge) => {
            e.preventDefault();
            select({ type: "edge", id: edge.id });
            openMenu({ type: "edge", id: edge.id }, { x: e.clientX, y: e.clientY });
        },
        [openMenu, select]
    );

    const onPaneClick = useCallback(() => select(null), [select]);

    const onPaneContextMenu = useCallback(
        (e: MouseEvent | React.MouseEvent) => {
            e.preventDefault();
            openMenu({ type: "pane" }, { x: e.clientX, y: e.clientY });
        },
        [openMenu]
    );

    const onConnect = useCallback<OnConnect>(
        ({ source: from, sourceHandle, target: to }) => {
            const edge = actions.connect(
                from,
                to,
                undefined,
                getPinCase(sourceHandle) ?? undefined
            );
            if (edge) log("info", `Wired ${from} → ${to} (${edge.case ?? edge.kind})`);
        },
        [actions, log]
    );

    // A wire dropped on empty canvas opens the add-node menu, like Blueprint.
    const onConnectEnd = useCallback<OnConnectEnd>(
        (event, state) => {
            if (state.isValid || !state.fromNode || !state.fromHandle) return;
            const target = event.target;
            if (!(target instanceof Element) || !target.closest(".react-flow__pane")) return;
            const point = "changedTouches" in event ? event.changedTouches[0] : event;
            openMenu(
                {
                    type: "pane",
                    link: {
                        nodeId: state.fromNode.id,
                        side: state.fromHandle.type === "source" ? "source" : "target",
                        branchCase: getPinCase(state.fromHandle.id) ?? undefined,
                    },
                },
                { x: point.clientX, y: point.clientY }
            );
        },
        [openMenu]
    );

    const isValidConnection = useCallback<IsValidConnection<StudioGraphEdge>>(
        ({ source: from, sourceHandle, target: to }) => {
            if (from === to) return false;
            // A decision's case pin may be rewired; two cases may lead to the same node.
            if (getPinCase(sourceHandle) !== null) return true;
            return !graphRef.current.edges.some((edge) => edge.from === from && edge.to === to);
        },
        [graphRef]
    );

    const selectDockTab = (tab: DockTab) =>
        setDock((prev) =>
            prev.open && prev.tab === tab ? { ...prev, open: false } : { open: true, tab }
        );

    const sendMessage = (text: string) =>
        setMessages((prev) => [
            ...prev,
            { id: makeId(), role: "user", text },
            { id: makeId(), role: "assistant", text: AI_PLACEHOLDER_REPLY },
        ]);

    const rootStyle = {
        "--studio-dock-visible": dock.open ? "var(--studio-dock-h)" : `${DOCK_BAR_HEIGHT}px`,
        "--studio-explorer-visible": explorer.open
            ? "var(--studio-explorer-w)"
            : `${EXPLORER_RAIL_WIDTH}px`,
    } as CSSProperties;

    return (
        <div
            ref={rootRef}
            className="studio-editor relative min-h-0 w-full flex-1 overflow-hidden"
            data-inspector-max={isInspectorMaximized || undefined}
            style={rootStyle}
        >
            <EditorCanvas
                nodes={rfGraph.nodes}
                edges={rfGraph.edges}
                onNodesChange={onNodesChange}
                onNodeClick={onNodeClick}
                onNodeDragStart={onNodeDragStart}
                onNodeContextMenu={onNodeContextMenu}
                onEdgeClick={onEdgeClick}
                onEdgeContextMenu={onEdgeContextMenu}
                onPaneClick={onPaneClick}
                onPaneContextMenu={onPaneContextMenu}
                onConnect={onConnect}
                onConnectEnd={onConnectEnd}
                isValidConnection={isValidConnection}
                isEmpty={graph.nodes.length === 0}
                onTidy={tidy}
            />

            <EditorHeaderBar
                config={config}
                validity={validity}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
                onExit={onExit}
                onOpenHelpers={() => {
                    setReveal(null);
                    setCodeDialog("helpers");
                }}
                onViewRawConfig={() => setCodeDialog("config")}
                onViewTypes={() => setCodeDialog("types")}
                onDownloadConfig={downloadConfig}
                typesControl={
                    <TypesControl
                        types={specTypes}
                        onViewTypes={() => setCodeDialog("types")}
                        usecase={specTypes.usecase}
                        onUsecaseChange={setUsecaseChoice}
                        onDownloadSession={downloadSessionSchema}
                    />
                }
            />

            <ExplorerCard
                isOpen={explorer.open}
                onToggleOpen={() => setExplorer((prev) => ({ ...prev, open: !prev.open }))}
                tab={explorer.tab}
                onTabChange={(tab) => setExplorer({ open: true, tab })}
                isHidden={isInspectorMaximized}
                resizeHandleProps={explorerResize.handleProps}
                nodesTab={{
                    graph,
                    selection: liveSelection,
                    onSelectNode: (nodeId) => {
                        selectNode(nodeId);
                        focusNode(nodeId);
                    },
                    onRemoveNode: removeNode,
                }}
                searchTab={{ nodes: graph.nodes, helpers, onOpenMatch: openMatch }}
            />

            <BottomDock
                open={dock.open}
                tab={dock.tab}
                isHidden={isInspectorMaximized}
                onSelectTab={selectDockTab}
                onToggleOpen={() => setDock((prev) => ({ ...prev, open: !prev.open }))}
                resizeHandleProps={dockResize.handleProps}
                graphSummary={`${graph.nodes.length} ${graph.nodes.length === 1 ? "node" : "nodes"} · ${graph.edges.length} ${graph.edges.length === 1 ? "wire" : "wires"}`}
                entries={entries}
                onClearConsole={() => setEntries([])}
                messages={messages}
                onSendMessage={sendMessage}
                onClearChat={() => setMessages([])}
            />

            <InspectorCard
                isMaximized={isInspectorMaximized}
                onToggleMaximized={() => setInspectorMaximized((max) => !max)}
                resizeHandleProps={inspectorResize.handleProps}
                graph={graph}
                selection={liveSelection}
                activeTab={inspectorTab}
                onTabChange={(tab) => {
                    setInspectorTab(tab);
                    setReveal(null);
                }}
                actions={editActions}
                reveal={reveal}
                helperNames={compiledHelpers.names}
            />

            {menu && menuContent ? (
                <GraphMenu
                    anchor={menu.anchor}
                    title={menuContent.title}
                    subtitle={menuContent.subtitle}
                    sections={menuContent.sections}
                    searchable={menuContent.searchable}
                    getQueryItems={menuContent.getQueryItems}
                    onClose={closeMenu}
                />
            ) : null}

            <CodeDialog
                file={codeDialog}
                onClose={() => setCodeDialog(null)}
                container={rootRef.current}
                helpers={helpers}
                onHelpersChange={setHelpers}
                configJson={configJson}
                onDownloadConfig={downloadConfig}
                reveal={reveal}
                typeFiles={typeFiles}
                typesSummary={describeTypes(specTypes).join(" · ")}
            />
        </div>
    );
};

/** The graph's React Flow store wraps the whole editor, so panels can pan the canvas. */
export const StudioEditor = (props: IStudioEditorProps) => (
    <ReactFlowProvider>
        <StudioEditorContent {...props} />
    </ReactFlowProvider>
);

export default StudioEditor;
