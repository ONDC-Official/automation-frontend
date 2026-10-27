import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { loader, type Monaco } from "@monaco-editor/react";
import {
    MockRunnerV2,
    SANDBOX_GLOBALS_DTS_V2,
    type MockPlaygroundConfigV2Type,
} from "@ondc/automation-mock-runner";
import { CircleStackIcon, ListBulletIcon, PlayIcon } from "@heroicons/react/24/outline";
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
import { useSettledValue } from "@pages/protocol-studio/hooks/use-settled-value";
import { useSpecTypes } from "@pages/protocol-studio/hooks/use-spec-types";
import { useRecognitionCheck } from "@pages/protocol-studio/hooks/use-recognition-check";
import { useRunGraph } from "@pages/protocol-studio/hooks/use-run-graph";
import { useStudioRun } from "@pages/protocol-studio/hooks/use-studio-run";
import { useStudioGraph } from "@pages/protocol-studio/hooks/use-studio-graph";
import { useStudioJourneys } from "@pages/protocol-studio/hooks/use-studio-journeys";
import { useStudioShortcuts } from "@pages/protocol-studio/hooks/use-studio-shortcuts";
import { useStudioDraft } from "@pages/protocol-studio/persistence/studio-draft";
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
    STAGES,
} from "@pages/protocol-studio/ui/editor/constants";
import { CodeDialog } from "@pages/protocol-studio/ui/editor/code-dialog";
import { BottomDock } from "@pages/protocol-studio/ui/editor/dock";
import { EditorCanvas } from "@pages/protocol-studio/ui/editor/editor-canvas";
import { ExplorerCard } from "@pages/protocol-studio/ui/editor/explorer";
import { decodeHelpers } from "@pages/protocol-studio/ui/editor/flows/action-files";
import { toGraphFragment } from "@pages/protocol-studio/ui/editor/flows/published-flow";
import {
    createGroupNode,
    createNode,
    getUniqueNodeId,
    inferEdgeKind,
    isUnpairedCallbackOf,
    makeEdgeId,
    NODE_KINDS,
    slugify,
} from "@pages/protocol-studio/ui/editor/graph/catalog";
import { tidyLayout } from "@pages/protocol-studio/ui/editor/graph/auto-layout";
import {
    copyFragment,
    instantiateFragment,
    parseFragment,
    serializeFragment,
    type FragmentPlacement,
} from "@pages/protocol-studio/ui/editor/graph/clipboard";
import {
    findEdge,
    findNode,
    getAllNodeIds,
    isBoundary,
} from "@pages/protocol-studio/ui/editor/graph/flatten";
import { GraphMenu } from "@pages/protocol-studio/ui/editor/graph/graph-menu";
import {
    BP,
    buildGraph,
    EXEC_PIN_TOP,
    getGraphBounds,
    getNodeRect,
    type GraphRect,
} from "@pages/protocol-studio/ui/editor/graph/layout";
import { countProblems, lintProtocol } from "@pages/protocol-studio/ui/editor/graph/lint";
import { getMenuContent, type NodeLink } from "@pages/protocol-studio/ui/editor/graph/menu-content";
import {
    getLiveSelection,
    getSelectedNodeIds,
    selectNodeIds,
} from "@pages/protocol-studio/ui/editor/graph/selection";
import { getFreeCase, getPinCase } from "@pages/protocol-studio/ui/editor/graph/decision";
import { isModKey } from "@pages/protocol-studio/ui/editor/shortcuts";
import { GroupDialog } from "@pages/protocol-studio/ui/editor/group-dialog";
import { EditorHeaderBar } from "@pages/protocol-studio/ui/editor/header-bar";
import { InspectorCard } from "@pages/protocol-studio/ui/editor/inspector";
import {
    configureStudioTypeScript,
    setStudioTypeLibs,
} from "@pages/protocol-studio/ui/editor/inspector/typescript-setup";
import {
    enumeratePaths,
    getCoverage,
    getDefaultEntry,
    getForks,
    lintJourneys,
    walkJourney,
    type JourneyCandidate,
} from "@pages/protocol-studio/ui/editor/journeys/derive";
import { DeriveDialog } from "@pages/protocol-studio/ui/editor/journeys/derive-dialog";
import { FlowPreview } from "@pages/protocol-studio/ui/editor/journeys/flow-preview";
import { RunDialog } from "@pages/protocol-studio/ui/editor/journeys/run-dialog";
import { RunResultPanel } from "@pages/protocol-studio/ui/editor/journeys/run-result";
import { SessionPanel } from "@pages/protocol-studio/ui/editor/dock/session-panel";
import {
    JourneysCard,
    type JourneyStatus,
} from "@pages/protocol-studio/ui/editor/journeys/journey-list";
import { JourneyInspectorCard } from "@pages/protocol-studio/ui/editor/journeys/journey-properties";
import { PathStrip } from "@pages/protocol-studio/ui/editor/journeys/path-strip";
import { ReviewStage } from "@pages/protocol-studio/ui/editor/stages/review";
import { SpecificationStage } from "@pages/protocol-studio/ui/editor/stages/specification";
import { getEntryNodes } from "@pages/protocol-studio/ui/editor/graph/flatten";
import type {
    ChatMessage,
    CodeDialogFile,
    ConfigValidity,
    ConsoleEntry,
    ConsoleLevel,
    DockTab,
    ExplorerTab,
    GraphHighlight,
    GraphMenuState,
    GraphMenuTarget,
    GraphSelection,
    IMultiSelectionActions,
    InspectorTabId,
    IStudioEditorProps,
    NodeTemplate,
    ProtocolProblem,
    PublishedFlow,
    RevealRequest,
    SearchFileResult,
    SearchMatch,
    StageStatus,
    StudioEdge,
    StudioGraph,
    StudioGraphActions,
    StudioGraphEdge,
    StudioGraphNode,
    StudioStage,
    StudioTypeFile,
} from "@pages/protocol-studio/ui/editor/types";

let nextId = 0;
const makeId = () => `studio-${++nextId}`;

/** How long after the last edit the draft is written. */
const DRAFT_SAVE_DELAY_MS = 400;

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

/** How far a duplicate lands from its original, and each repeated paste from the last. */
const DUPLICATE_OFFSET = 32;

/**
 * The last nodes copied, for the menu's Paste (a menu cannot read the system
 * clipboard without a permission prompt). Module-level, so it outlives the
 * editor when Studio is left and re-entered.
 */
let lastCopied: StudioGraph | null = null;

/** Numbers drags, so each one is a single undo step. */
let nextGesture = 0;

/** `search`, or `3 nodes`, for the console. */
const describeNodes = (nodeIds: readonly string[]) =>
    nodeIds.length === 1 ? nodeIds[0] : `${nodeIds.length} nodes`;

/** A flat (composite, `outer>inner`) wire id → the raw wire ids it is made of. */
const rawEdgeIds = (flatEdgeId: string) => flatEdgeId.split(">");

/**
 * Studio editor, filling the window under the app header. Four stages share
 * one shell — a header with the stage bar, floating frosted-glass panels, a
 * canvas:
 * - Specification: the config's meta, the spec's APIs and types, helpers.ts;
 * - Protocol: the graph canvas with the explorer, inspector and dock;
 * - Journeys: the same canvas read-only with a journey's path lit, the
 *   journeys list on the left, the journey's forks on the right, its flow
 *   preview in the dock;
 * - Review: counts, problems, coverage and export.
 * The config, graph, journeys and helpers are mirrored into the local draft.
 */
const StudioEditorContent = ({
    config,
    draft,
    onConfigChange,
    stage,
    onStageChange,
    onExit,
}: IStudioEditorProps) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const validity = useMemo(() => getValidity(config), [config]);
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(rootRef);
    const { getViewport, setViewport, screenToFlowPosition } = useReactFlow();

    const {
        root,
        graph,
        path,
        levels,
        flat,
        graphRef,
        rootRef: graphRootRef,
        actions,
        history,
    } = useStudioGraph(draft?.graph);
    const inGroup = path.length > 0;
    const journeysState = useStudioJourneys(draft?.journeys);
    const {
        journeys,
        selectedId: selectedJourneyId,
        selected: selectedJourney,
        isOpenMode,
    } = journeysState;
    const journeyActions = journeysState.actions;
    const published = usePublishedFlows(config.meta.domain, config.meta.version);
    // helpers.ts: its TypeScript source when the config has one, else the
    // JavaScript helperLib (valid TypeScript as it stands).
    const [helpers, setHelpers] = useState(() =>
        draft?.helpers !== undefined
            ? draft.helpers
            : decodeHelpers(config.helperLibTs ?? config.helperLib)
    );

    // The local draft: everything a reload would otherwise lose, written a
    // moment after it changes (see `persistence/studio-draft.ts`).
    const { save: saveDraft } = useStudioDraft();
    useEffect(() => {
        const timer = window.setTimeout(() => {
            saveDraft({ config, graph: root, journeys, helpers });
        }, DRAFT_SAVE_DELAY_MS);
        return () => window.clearTimeout(timer);
    }, [config, root, journeys, helpers, saveDraft]);

    // What step code is typed against: the spec's API schemas, the chosen use
    // case's session data (undefined = picked from the config's use_case_id),
    // the sandbox's globals, and helpers.ts's declarations. Each step file is
    // checked on its own with these, so nodes never see each other's functions.
    const [usecaseChoice, setUsecaseChoice] = useState<string | null | undefined>(undefined);
    // The graph's saveData keys join the inferred SessionData; keyed by content
    // and settled, so typing in the Session table doesn't re-infer per keystroke.
    const graphStepsKey = useMemo(
        () =>
            JSON.stringify(
                flat.nodes
                    .filter((n) => !n.decision && !n.group && n.saveData)
                    .map((n) => [n.api, n.id, n.saveData])
            ),
        [flat]
    );
    const settledGraphStepsKey = useSettledValue(graphStepsKey, 1500);
    const graphSteps = useMemo(
        () =>
            (JSON.parse(settledGraphStepsKey) as [string, string, Record<string, string>][]).map(
                ([api, action_id, saveData]) => ({ api, action_id, saveData })
            ),
        [settledGraphStepsKey]
    );
    const specTypes = useSpecTypes(config.meta.domain, config.meta.version, {
        usecase: usecaseChoice,
        hint: config.meta.use_case_id,
        graphSteps,
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
    // their globals visible to every other node: drop their models. Nodes at
    // every level count — entering a group must not drop the top level's.
    const nodeIdsKey = useMemo(() => [...getAllNodeIds(root)].join("\n"), [root]);
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
    const [groupDialog, setGroupDialog] = useState<{ open: boolean; preselected: string[] }>({
        open: false,
        preselected: [],
    });
    const [derive, setDerive] = useState<{
        open: boolean;
        candidates: JourneyCandidate[];
        truncated: boolean;
    }>({ open: false, candidates: [], truncated: false });

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

    // ─── Simulation: the graph compiled for the executor, and the current run ──

    const runGraph = useRunGraph(monaco, flat, config, compiledHelpers);
    const runBlocked = runGraph.compiling
        ? "Compiling the graph…"
        : flat.nodes.length === 0
          ? "The graph is empty"
          : runGraph.problems.some((p) => p.level === "error")
            ? `${runGraph.problems.length} compile ${runGraph.problems.length === 1 ? "problem" : "problems"} · see Problems`
            : null;
    const { run, actions: runActions } = useStudioRun({
        executor: runGraph.executor,
        blockedReason: runBlocked,
        log,
        decodeBase64: MockRunnerV2.decodeBase64,
    });

    // ─── Derived: lint, forks, journeys ────────────────────────────────────

    const protocolProblems = useMemo(() => lintProtocol(root, flat), [root, flat]);
    const forks = useMemo(() => getForks(flat), [flat]);
    const journeyProblems = useMemo(() => lintJourneys(flat, journeys), [flat, journeys]);
    const coverage = useMemo(() => getCoverage(flat, journeys), [flat, journeys]);
    // Can every fork's alternatives be told apart by an incoming payload?
    const recognition = useRecognitionCheck(runGraph.executor, flat, forks);
    const allProblems = useMemo(
        () => [
            ...protocolProblems,
            ...journeyProblems,
            ...runGraph.problems,
            ...recognition.problems,
        ],
        [protocolProblems, journeyProblems, runGraph.problems, recognition.problems]
    );
    const walk = useMemo(
        () => (selectedJourney ? walkJourney(flat, selectedJourney) : null),
        [flat, selectedJourney]
    );
    const journeyStatus = useMemo(() => {
        const status = new Map<string, JourneyStatus>();
        for (const journey of journeys) {
            const w = walkJourney(flat, journey);
            status.set(journey.id, {
                pending: w.pending !== null,
                length: w.nodeIds.length,
                end: w.end,
            });
        }
        return status;
    }, [flat, journeys]);
    const entryNodes = useMemo(
        () => getEntryNodes(flat).filter((node) => node.kind !== "on_demand"),
        [flat]
    );

    /** The journey's path as the canvas draws it: raw wire ids and the groups the path passes through. */
    const runStatus = run.active ? run.status : undefined;
    const highlight = useMemo<GraphHighlight | undefined>(() => {
        if (stage !== "journeys") return undefined;
        if (isOpenMode) {
            // Open mode: every fork's options are what the tester will be asked about.
            const pending = new Set<string>();
            for (const fork of forks) {
                for (const option of fork.options)
                    rawEdgeIds(option.edge.id).forEach((id) => pending.add(id));
            }
            return {
                nodes: new Set(flat.nodes.map((n) => n.id)),
                edges: new Set(),
                pendingEdges: pending,
                runStatus,
            };
        }
        if (!walk) return { nodes: new Set(), edges: new Set(), runStatus };
        const nodes = new Set<string>();
        for (const id of walk.nodeIds) {
            nodes.add(id);
            let group = flat.groupOf.get(id);
            while (group) {
                nodes.add(group);
                group = flat.groupOf.get(group);
            }
        }
        const edges = new Set<string>();
        for (const id of walk.edgeIds) rawEdgeIds(id).forEach((raw) => edges.add(raw));
        const pendingEdges = new Set<string>();
        for (const option of walk.pending?.options ?? []) {
            rawEdgeIds(option.edge.id).forEach((raw) => pendingEdges.add(raw));
        }
        return { nodes, edges, pendingEdges, runStatus };
    }, [stage, isOpenMode, walk, flat, forks, runStatus]);

    /** Raw wire id → the open fork option it belongs to, so clicking a wire resolves the fork. */
    const pendingByRaw = useMemo(() => {
        const map = new Map<
            string,
            {
                forkKey: string;
                nodeId: string;
                kind: "alternatives" | "decision";
                targetId: string;
                caseValue?: string;
            }
        >();
        for (const option of walk?.pending?.options ?? []) {
            for (const raw of rawEdgeIds(option.edge.id)) {
                map.set(raw, {
                    forkKey: walk!.pending!.key,
                    nodeId: walk!.pending!.nodeId,
                    kind: walk!.pending!.kind,
                    targetId: option.target.id,
                    caseValue: option.edge.case,
                });
            }
        }
        return map;
    }, [walk]);

    const stageStatus = useMemo<Record<StudioStage, StageStatus>>(() => {
        const protocol = countProblems(protocolProblems);
        const journey = countProblems(journeyProblems);
        const groups = [...flat.groupOf.values()].filter((v, i, a) => a.indexOf(v) === i).length;
        return {
            specification: {
                summary:
                    specTypes.status === "ready"
                        ? `${specTypes.apiCount} APIs · ${compiledHelpers.names.length} helpers`
                        : specTypes.status === "loading"
                          ? "loading spec…"
                          : "spec types unavailable",
                errors: 0,
                warnings: specTypes.status === "unavailable" ? 1 : 0,
            },
            protocol: {
                summary: `${flat.nodes.length} ${flat.nodes.length === 1 ? "node" : "nodes"} · ${forks.length} ${forks.length === 1 ? "fork" : "forks"}${groups > 0 ? ` · ${groups} ${groups === 1 ? "group" : "groups"}` : ""}`,
                ...protocol,
            },
            journeys: {
                summary: `${journeys.length} ${journeys.length === 1 ? "journey" : "journeys"} · ${coverage.uncovered.length} uncovered`,
                ...journey,
            },
            review: {
                summary: `${protocol.errors + journey.errors} errors · ${protocol.warnings + journey.warnings} warnings`,
                errors: protocol.errors + journey.errors,
                warnings: protocol.warnings + journey.warnings,
            },
        };
    }, [
        protocolProblems,
        journeyProblems,
        flat,
        forks,
        journeys,
        coverage,
        specTypes,
        compiledHelpers.names.length,
    ]);

    // ⌘1–⌘4 (Ctrl elsewhere) switch stages.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
            const index = Number(e.key) - 1;
            const next = STAGES[index];
            if (!next) return;
            e.preventDefault();
            onStageChange(next.id);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onStageChange]);

    // Entering the Journeys stage opens the flow preview; leaving it goes back to the console.
    useEffect(() => {
        setDock((prev) =>
            stage === "journeys"
                ? { open: true, tab: "preview" }
                : prev.tab === "preview" || prev.tab === "run" || prev.tab === "session"
                  ? { ...prev, tab: "console" }
                  : prev
        );
        setMenu(null);
    }, [stage]);

    // A selection whose node / edge was deleted (or renamed away, or is on another level) is no selection.
    const liveSelection = useMemo(() => getLiveSelection(selection, graph), [selection, graph]);
    const selectedNodeIds = useMemo(() => getSelectedNodeIds(liveSelection), [liveSelection]);
    const rfGraph = useMemo(
        () => buildGraph(graph, liveSelection, { boundary: inGroup, highlight }),
        [graph, liveSelection, inGroup, highlight]
    );

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

    const fileStem = useCallback(
        (suffix: string) =>
            `${config.meta.domain}_${config.meta.version}_${suffix}.json`.replace(/[^\w.-]+/g, "_"),
        [config.meta]
    );
    const downloadConfig = useCallback(() => {
        downloadJson(fileStem("config"), configJson);
        log("success", "Downloaded config.json");
    }, [fileStem, configJson, log]);
    const downloadJourneys = useCallback(() => {
        downloadJson(
            fileStem("journeys"),
            JSON.stringify({ meta: config.meta, protocol: root, journeys }, null, 2)
        );
        log("success", "Downloaded journeys.json");
    }, [fileStem, config.meta, root, journeys, log]);

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
            const rootEl = rootRef.current;
            const area = rootEl?.querySelector<HTMLElement>(".studio-canvas-area");
            if (!rootEl || !area) return;
            const rootBox = rootEl.getBoundingClientRect();
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

    // A node on another level is focused once that level is showing.
    const pendingFocus = useRef<string | null>(null);
    useEffect(() => {
        const id = pendingFocus.current;
        if (id && graph.nodes.some((n) => n.id === id)) {
            pendingFocus.current = null;
            focusNode(id);
        }
    }, [graph, focusNode]);

    /** Shows the level a node lives on, selects it and pans to it. */
    const revealNode = useCallback(
        (nodeId: string) => {
            const found = findNode(graphRootRef.current, nodeId);
            if (!found) return;
            if (found.path.join("/") !== path.join("/")) {
                actions.openLevel(found.path);
                pendingFocus.current = nodeId;
            } else focusNode(nodeId);
            setSelection({ type: "node", id: nodeId });
            setReveal(null);
        },
        [graphRootRef, path, actions, focusNode]
    );

    /** Fits the whole level (or `target`, a graph about to be shown) into the visible canvas, not under the panels. */
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

    // Entering a group, leaving one, or arriving on a canvas stage fits the level into view.
    const levelKey = path.join("/");
    useEffect(() => {
        if (stage !== "protocol" && stage !== "journeys") return;
        const timer = window.setTimeout(() => fitGraph(), 50);
        return () => window.clearTimeout(timer);
    }, [levelKey, stage, fitGraph]);

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

    // The graph's edits as panels and the menu see them: deletes, renames and level changes are logged.
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
            enterGroup: (groupId) => {
                actions.enterGroup(groupId);
                setSelection(null);
                setMenu(null);
                const node = graphRef.current.nodes.find((n) => n.id === groupId);
                log("info", `Opened group ${node?.group?.name ?? groupId}`);
            },
            exitToLevel: (depth) => {
                actions.exitToLevel(depth);
                setSelection(null);
                setMenu(null);
            },
            ungroup: (groupId) => {
                const node = graphRef.current.nodes.find((n) => n.id === groupId);
                actions.ungroup(groupId);
                setSelection(null);
                log("info", `Ungrouped ${node?.group?.name ?? groupId}`);
            },
        }),
        [actions, removeNode, removeEdge, graphRef, log]
    );

    /**
     * Adds a node from the menu. Wired to `link`, the new node's matching pin
     * lands on `at` (where the wire was dropped); otherwise `at` is its top-left.
     */
    const addNode = useCallback(
        (template: NodeTemplate, at: XYPosition, link?: NodeLink) => {
            const { nodes } = graphRef.current;
            const linked = link ? nodes.find((n) => n.id === link.nodeId) : undefined;
            const linkedBoundary = link && isBoundary(link.nodeId) ? link.nodeId : null;
            const id = getUniqueNodeId(template.api, getAllNodeIds(graphRootRef.current));
            let position = at;
            if ((linked || linkedBoundary) && link?.side === "source") {
                position = { x: at.x, y: at.y - EXEC_PIN_TOP };
            }
            if ((linked || linkedBoundary) && link?.side === "target") {
                position = { x: at.x - BP.width, y: at.y - EXEC_PIN_TOP };
            }
            const node = createNode(template, id, position, config.meta.version);

            const edges: StudioEdge[] = [];
            if (linkedBoundary) {
                // Out of the group's Entry, or into its Exit.
                edges.push(
                    link?.side === "source"
                        ? {
                              id: makeEdgeId(),
                              from: linkedBoundary,
                              to: node.id,
                              kind: "next",
                              mandated: true,
                          }
                        : {
                              id: makeEdgeId(),
                              from: node.id,
                              to: linkedBoundary,
                              kind: "next",
                              mandated: true,
                          }
                );
            } else if (linked) {
                const [from, to] = link?.side === "source" ? [linked, node] : [node, linked];
                // A request wired to its own lone callback: the callback answers it.
                const answers = isUnpairedCallbackOf(from, to);
                if (answers && to === node) node.responseFor = from.id;
                // A second callback for the same request answers it too: an alternative.
                if (!answers && to === node && template.responseFor)
                    node.responseFor = template.responseFor;
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
                    kind:
                        answers || node.responseFor === from.id
                            ? "response"
                            : inferEdgeKind(from, to),
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
        [actions, graphRef, graphRootRef, log, select]
    );

    const addGroup = useCallback(
        (template: { name: string; description: string }, at: XYPosition) => {
            const id = getUniqueNodeId(slugify(template.name), getAllNodeIds(graphRootRef.current));
            actions.addFragment({
                nodes: [createGroupNode(id, at, template.name, template.description)],
                edges: [],
            });
            select({ type: "node", id });
            log("info", `Added group ${template.name}`);
        },
        [actions, graphRootRef, log, select]
    );

    const createGroup = useCallback(
        (nodeIds: string[], name: string, description: string) => {
            const id = actions.groupNodes(nodeIds, name, description);
            setGroupDialog({ open: false, preselected: [] });
            if (!id) return;
            select({ type: "node", id });
            log(
                "success",
                `Grouped ${nodeIds.length} ${nodeIds.length === 1 ? "node" : "nodes"} as ${name}`
            );
        },
        [actions, log, select]
    );

    // ─── Clipboard: copy / cut / paste / duplicate, on one node or a selection ──

    const [canPaste, setCanPaste] = useState(() => lastCopied !== null);
    /** The pointer over the canvas (client coordinates), where ⌘V pastes; null when elsewhere. */
    const pointerRef = useRef<XYPosition | null>(null);
    useEffect(() => {
        const onPointerMove = (e: PointerEvent) => {
            const overCanvas = e.target instanceof Element && e.target.closest(".studio-canvas");
            pointerRef.current = overCanvas ? { x: e.clientX, y: e.clientY } : null;
        };
        window.addEventListener("pointermove", onPointerMove);
        return () => window.removeEventListener("pointermove", onPointerMove);
    }, []);
    /** The last paste: pasting the same thing at the same spot again steps each copy down-right. */
    const lastPaste = useRef<{ text: string; anchor: XYPosition | null; count: number } | null>(
        null
    );

    /** Adds a copied fragment to the level (fresh ids, one undo step) and selects what it added. */
    const placeFragment = useCallback(
        (copied: StudioGraph, placement: FragmentPlacement) => {
            const { fragment, ids } = instantiateFragment(copied, graphRootRef.current, placement);
            actions.addFragment(fragment);
            select(selectNodeIds(ids));
            return ids;
        },
        [actions, graphRootRef, select]
    );

    /** A node's menu acts on the whole selection when the node is part of it. */
    const getTargetIds = useCallback(
        (nodeId: string) => (selectedNodeIds.includes(nodeId) ? selectedNodeIds : [nodeId]),
        [selectedNodeIds]
    );

    const removeNodes = useCallback(
        (nodeIds: readonly string[]) => {
            if (nodeIds.length === 1) return removeNode(nodeIds[0]);
            actions.removeNodes(nodeIds);
            log("info", `Deleted ${describeNodes(nodeIds)}`);
        },
        [actions, removeNode, log]
    );

    const duplicateNodes = useCallback(
        (nodeIds: readonly string[]) => {
            if (nodeIds.length === 0) return false;
            const ids = placeFragment(copyFragment(graphRef.current, nodeIds), {
                offset: { x: DUPLICATE_OFFSET, y: DUPLICATE_OFFSET },
            });
            log(
                "info",
                nodeIds.length === 1
                    ? `Duplicated ${nodeIds[0]} as ${ids[0]}`
                    : `Duplicated ${describeNodes(nodeIds)}`
            );
            return true;
        },
        [graphRef, placeFragment, log]
    );
    const duplicateNode = useCallback(
        (nodeId: string) => duplicateNodes(getTargetIds(nodeId)),
        [duplicateNodes, getTargetIds]
    );

    /** Keeps nodes (and the wires between them) for pasting; returns them as clipboard text. */
    const copyNodes = useCallback(
        (nodeIds: readonly string[]) => {
            if (nodeIds.length === 0) return null;
            lastCopied = copyFragment(graphRef.current, nodeIds);
            lastPaste.current = null;
            setCanPaste(true);
            return serializeFragment(lastCopied);
        },
        [graphRef]
    );

    const cutNodes = useCallback(
        (nodeIds: readonly string[]) => {
            const text = copyNodes(nodeIds);
            if (text === null) return null;
            if (nodeIds.length === 1) actions.removeNode(nodeIds[0]);
            else actions.removeNodes(nodeIds);
            log("info", `Cut ${describeNodes(nodeIds)}`);
            return text;
        },
        [copyNodes, actions, log]
    );

    /** From a menu: no clipboard event to write to, so the system clipboard is best-effort. */
    const copyFromMenu = useCallback(
        (nodeIds: readonly string[], cut = false) => {
            const text = cut ? cutNodes(nodeIds) : copyNodes(nodeIds);
            if (text === null) return;
            if (!cut) log("info", `Copied ${describeNodes(nodeIds)}`);
            navigator.clipboard?.writeText(text).catch(() => undefined);
        },
        [copyNodes, cutNodes, log]
    );

    /**
     * Pastes clipboard text, if it is Studio nodes: at `at`, else at the
     * pointer when it is over the canvas, else just off where they were copied
     * from. Returns false for anything else, which is left to the browser.
     */
    const pasteText = useCallback(
        (text: string, at?: XYPosition) => {
            const copied = parseFragment(text);
            if (!copied) return false;
            const anchor =
                at ?? (pointerRef.current ? screenToFlowPosition(pointerRef.current) : null);
            const prev = lastPaste.current;
            const samePlace =
                prev !== null &&
                prev.text === text &&
                (prev.anchor === null || anchor === null
                    ? prev.anchor === anchor
                    : Math.abs(prev.anchor.x - anchor.x) < 1 &&
                      Math.abs(prev.anchor.y - anchor.y) < 1);
            const count = samePlace ? prev.count + 1 : anchor ? 0 : 1;
            lastPaste.current = { text, anchor, count };
            const step = count * DUPLICATE_OFFSET;
            const ids = placeFragment(
                copied,
                anchor
                    ? { at: { x: anchor.x + step, y: anchor.y + step } }
                    : { offset: { x: step, y: step } }
            );
            log("success", `Pasted ${describeNodes(ids)}`);
            return true;
        },
        [screenToFlowPosition, placeFragment, log]
    );

    const insertFlow = useCallback(
        (flow: PublishedFlow, at: XYPosition) => {
            const fragment = toGraphFragment(flow, at, getAllNodeIds(graphRootRef.current));
            actions.addFragment(fragment);
            log("success", `Inserted ${flow.title} · ${fragment.nodes.length} nodes`);
        },
        [actions, graphRootRef, log]
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
              inGroup,
              published,
              actions: editActions,
              addNode,
              addGroup,
              openGroupDialog: (preselected) => setGroupDialog({ open: true, preselected }),
              insertFlow,
              duplicateNode,
              copyNode: (nodeId) => copyFromMenu(getTargetIds(nodeId)),
              cutNode: (nodeId) => copyFromMenu(getTargetIds(nodeId), true),
              selectedNodeIds,
              paste: (at) => {
                  if (lastCopied) pasteText(serializeFragment(lastCopied), at);
              },
              canPaste,
              selectAll: () => select(selectNodeIds(graphRef.current.nodes.map((n) => n.id))),
              editNode,
              selectEdge: (edgeId) => select({ type: "edge", id: edgeId }),
              fitView: () => fitGraph(),
              tidy,
          })
        : null;

    const undo = useCallback(() => {
        const done = history.undo();
        if (done) log("info", "Undo");
        return done;
    }, [history, log]);
    const redo = useCallback(() => {
        const done = history.redo();
        if (done) log("info", "Redo");
        return done;
    }, [history, log]);
    const canvasHistory = useMemo(
        () => ({ undo, redo, canUndo: history.canUndo, canRedo: history.canRedo }),
        [undo, redo, history.canUndo, history.canRedo]
    );

    const multiActions = useMemo<IMultiSelectionActions>(
        () => ({
            onDuplicate: () => duplicateNodes(selectedNodeIds),
            onCopy: () => copyFromMenu(selectedNodeIds),
            onGroup: () => setGroupDialog({ open: true, preselected: selectedNodeIds }),
            onDelete: () => removeNodes(selectedNodeIds),
        }),
        [duplicateNodes, copyFromMenu, removeNodes, selectedNodeIds]
    );

    // The canvas's editing shortcuts — on the Protocol stage, with no menu or dialog open,
    // and never while typing (see `useStudioShortcuts`).
    useStudioShortcuts({
        enabled:
            stage === "protocol" &&
            !menu &&
            !groupDialog.open &&
            !derive.open &&
            codeDialog === null &&
            !run.pending,
        copy: () => {
            const text = copyNodes(selectedNodeIds);
            if (text !== null) log("info", `Copied ${describeNodes(selectedNodeIds)}`);
            return text;
        },
        cut: () => cutNodes(selectedNodeIds),
        paste: (text) => pasteText(text),
        duplicate: () => duplicateNodes(selectedNodeIds),
        undo,
        redo,
        selectAll: () => {
            select(selectNodeIds(graphRef.current.nodes.map((n) => n.id)));
            return true;
        },
        remove: () => {
            if (!liveSelection) return false;
            if (liveSelection.type === "edge") removeEdge(liveSelection.id);
            else removeNodes(selectedNodeIds);
            return true;
        },
        // A maximized inspector takes Esc first (it restores).
        clearSelection: () => {
            if (isInspectorMaximized || !liveSelection) return false;
            select(null);
            return true;
        },
    });

    const openMatch = (result: SearchFileResult, match: SearchMatch) => {
        if (result.nodeId) revealNode(result.nodeId);
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

    /** A Problems row: show what it points at. */
    const revealProblem = useCallback(
        (problem: ProtocolProblem) => {
            if (problem.journeyId) {
                journeyActions.select(problem.journeyId);
                if (stage !== "journeys") onStageChange("journeys");
                return;
            }
            if (stage !== "protocol") onStageChange("protocol");
            if (problem.edgeId) {
                const found = findEdge(graphRootRef.current, problem.edgeId);
                if (found) {
                    if (found.path.join("/") !== path.join("/")) actions.openLevel(found.path);
                    setSelection({ type: "edge", id: problem.edgeId });
                    if (problem.nodeId) pendingFocus.current = problem.nodeId;
                    return;
                }
            }
            if (problem.nodeId) revealNode(problem.nodeId);
        },
        [journeyActions, stage, onStageChange, graphRootRef, path, actions, revealNode]
    );

    /** The drag in progress, so all of its moves are one undo step. */
    const dragGesture = useRef<string | undefined>(undefined);

    const onNodesChange = useCallback<OnNodesChange<StudioGraphNode>>(
        (changes) => {
            const positions = new Map<string, XYPosition>();
            let dragging = false;
            const picked: [id: string, selected: boolean][] = [];
            for (const change of changes) {
                if (change.type === "select") {
                    if (!isBoundary(change.id)) picked.push([change.id, change.selected]);
                    continue;
                }
                if (change.type !== "position" || !change.position) continue;
                if (isBoundary(change.id)) continue;
                positions.set(change.id, change.position);
                if (change.dragging !== undefined) dragging = true;
            }
            if (positions.size > 0) {
                actions.moveNodes(positions, dragging ? dragGesture.current : undefined);
            }
            // React Flow's clicks, ⌘-clicks and ⇧-drag boxes, applied to the editor's selection.
            if (picked.length > 0) {
                setSelection((prev) => {
                    const ids = new Set(getSelectedNodeIds(prev));
                    for (const [id, selected] of picked) {
                        if (selected) ids.add(id);
                        else ids.delete(id);
                    }
                    // Unselecting every node leaves a selected edge alone.
                    return selectNodeIds([...ids]) ?? (prev?.type === "edge" ? prev : null);
                });
            }
        },
        [actions]
    );

    const onNodeClick = useCallback<NodeMouseHandler<StudioGraphNode>>(
        (e, node) => {
            if (isBoundary(node.id)) return;
            // ⇧ / ⌘-click toggles the node: React Flow reports that as a `select` change.
            if (e.shiftKey || isModKey(e)) return;
            selectNode(node.id);
        },
        [selectNode]
    );

    const onNodeDoubleClick = useCallback<NodeMouseHandler<StudioGraphNode>>(
        (_, node) => {
            if (node.data.node.group && !node.data.boundary) editActions.enterGroup(node.id);
        },
        [editActions]
    );

    const onNodeDragStart = useCallback<OnNodeDrag<StudioGraphNode>>(
        (_, node) => {
            dragGesture.current = `drag:${++nextGesture}`;
            // Dragging a node of the selection moves the selection; any other node becomes it.
            if (!isBoundary(node.id) && !selectedNodeIds.includes(node.id)) selectNode(node.id);
        },
        [selectNode, selectedNodeIds]
    );

    const onNodeContextMenu = useCallback<NodeMouseHandler<StudioGraphNode>>(
        (e, node) => {
            e.preventDefault();
            if (stage !== "protocol" || isBoundary(node.id)) return;
            if (!selectedNodeIds.includes(node.id)) selectNode(node.id);
            openMenu({ type: "node", id: node.id }, { x: e.clientX, y: e.clientY });
        },
        [stage, openMenu, selectNode, selectedNodeIds]
    );

    const onEdgeClick = useCallback<EdgeMouseHandler<StudioGraphEdge>>(
        (_, edge) => {
            // Journeys stage: clicking an option of the open fork resolves it.
            if (stage === "journeys" && selectedJourney) {
                const option = pendingByRaw.get(edge.id);
                if (option) {
                    if (option.kind === "decision" && option.caseValue !== undefined) {
                        journeyActions.expect(selectedJourney.id, option.nodeId, option.caseValue);
                    } else
                        journeyActions.choose(selectedJourney.id, option.forkKey, option.targetId);
                    log("info", `${selectedJourney.title}: ${option.nodeId} → ${option.targetId}`);
                }
                return;
            }
            select({ type: "edge", id: edge.id });
        },
        [stage, selectedJourney, pendingByRaw, journeyActions, log, select]
    );

    const onEdgeContextMenu = useCallback<EdgeMouseHandler<StudioGraphEdge>>(
        (e, edge) => {
            e.preventDefault();
            if (stage !== "protocol") return;
            select({ type: "edge", id: edge.id });
            openMenu({ type: "edge", id: edge.id }, { x: e.clientX, y: e.clientY });
        },
        [stage, openMenu, select]
    );

    const onPaneClick = useCallback(() => select(null), [select]);

    const onPaneContextMenu = useCallback(
        (e: MouseEvent | React.MouseEvent) => {
            e.preventDefault();
            if (stage !== "protocol") return;
            openMenu({ type: "pane" }, { x: e.clientX, y: e.clientY });
        },
        [stage, openMenu]
    );

    const onConnect = useCallback<OnConnect>(
        ({ source: from, sourceHandle, target: to }) => {
            const edge = actions.connect(
                from,
                to,
                undefined,
                getPinCase(sourceHandle) ?? undefined
            );
            if (edge) {
                const siblings = graphRef.current.edges.filter(
                    (e) => e.from === from && e.case === undefined
                ).length;
                log(
                    "info",
                    `Wired ${from} → ${to} (${edge.case ?? edge.kind})${siblings >= 1 && edge.case === undefined ? ` · ${from} now has ${siblings + 1} alternatives` : ""}`
                );
            }
        },
        [actions, graphRef, log]
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

    // ─── Journeys ──────────────────────────────────────────────────────────

    const newJourney = useCallback(() => {
        const entry = getDefaultEntry(flat);
        if (!entry) return;
        const id = journeyActions.add(`Journey ${journeys.length + 1}`, entry.id);
        journeyActions.select(id);
        log("info", `New journey from ${entry.id}`);
    }, [flat, journeys.length, journeyActions, log]);

    const openDerive = useCallback(() => {
        const entry = getDefaultEntry(flat);
        if (!entry) return;
        const result = enumeratePaths(flat, entry.id);
        setDerive({ open: true, ...result });
    }, [flat]);

    const existingPathKeys = useMemo(() => {
        const keys = new Set<string>();
        for (const journey of journeys) keys.add(walkJourney(flat, journey).nodeIds.join(">"));
        return keys;
    }, [flat, journeys]);

    const createDerived = useCallback(
        (picked: { candidate: JourneyCandidate; title: string }[]) => {
            const entry = getDefaultEntry(flat);
            if (!entry) return;
            const ids = journeyActions.addMany(
                picked.map(({ candidate, title }) => ({
                    title,
                    entry: entry.id,
                    extra: { choices: candidate.choices, expects: candidate.expects },
                }))
            );
            setDerive((prev) => ({ ...prev, open: false }));
            if (ids[0]) journeyActions.select(ids[0]);
            log("success", `Derived ${ids.length} ${ids.length === 1 ? "journey" : "journeys"}`);
        },
        [flat, journeyActions, log]
    );

    const usedApis = useMemo(() => {
        const map = new Map<string, number>();
        for (const node of flat.nodes) {
            if (node.kind === "decision") continue;
            map.set(node.api, (map.get(node.api) ?? 0) + 1);
        }
        return map;
    }, [flat]);

    const breadcrumb = useMemo(
        () =>
            levels.map((level, index) => ({
                label: level.label,
                onSelect: () => editActions.exitToLevel(index),
            })),
        [levels, editActions]
    );

    const rootStyle = {
        "--studio-dock-visible": dock.open ? "var(--studio-dock-h)" : `${DOCK_BAR_HEIGHT}px`,
        "--studio-explorer-visible": explorer.open
            ? "var(--studio-explorer-w)"
            : `${EXPLORER_RAIL_WIDTH}px`,
    } as CSSProperties;

    const showsCanvas = stage === "protocol" || stage === "journeys";
    const graphSummary = `${flat.nodes.length} ${flat.nodes.length === 1 ? "node" : "nodes"} · ${flat.edges.length} ${flat.edges.length === 1 ? "wire" : "wires"}${inGroup ? ` · in ${levels[levels.length - 1]?.label}` : ""}`;

    return (
        <div
            ref={rootRef}
            className="studio-editor relative min-h-0 w-full flex-1 overflow-hidden"
            data-inspector-max={isInspectorMaximized || undefined}
            data-stage={stage}
            data-path-strip={(stage === "journeys" && selectedJourneyId !== null) || undefined}
            style={rootStyle}
        >
            {showsCanvas ? (
                <EditorCanvas
                    nodes={rfGraph.nodes}
                    edges={rfGraph.edges}
                    onNodesChange={onNodesChange}
                    onNodeClick={onNodeClick}
                    onNodeDoubleClick={onNodeDoubleClick}
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
                    history={canvasHistory}
                    readOnly={stage === "journeys"}
                    breadcrumb={breadcrumb}
                    emptyHint={
                        stage === "journeys"
                            ? {
                                  title: "Nothing to walk yet",
                                  sub: "Build the protocol first; journeys are extracted from it",
                              }
                            : inGroup
                              ? {
                                    title: "Empty group",
                                    sub: "Right-click to add nodes; wire them from Entry and to Exit",
                                }
                              : undefined
                    }
                />
            ) : null}

            <EditorHeaderBar
                config={config}
                validity={validity}
                stage={stage}
                onStageChange={onStageChange}
                stageStatus={stageStatus}
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
            />

            {stage === "specification" ? (
                <SpecificationStage
                    config={config}
                    onConfigChange={onConfigChange}
                    specTypes={specTypes}
                    usecase={specTypes.usecase}
                    onUsecaseChange={setUsecaseChoice}
                    onDownloadSession={downloadSessionSchema}
                    helpers={helpers}
                    onHelpersChange={setHelpers}
                    helperNames={compiledHelpers.names}
                    typeFiles={typeFiles}
                    usedApis={usedApis}
                    reveal={reveal}
                />
            ) : null}

            {stage === "review" ? (
                <ReviewStage
                    config={config}
                    root={root}
                    flat={flat}
                    forks={forks}
                    journeys={journeys}
                    problems={allProblems}
                    coverage={coverage}
                    onReveal={revealProblem}
                    onGoToStage={onStageChange}
                    onDownloadConfig={downloadConfig}
                    onDownloadJourneys={downloadJourneys}
                />
            ) : null}

            {stage === "protocol" ? (
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
                        onEnterGroup: editActions.enterGroup,
                    }}
                    searchTab={{ nodes: flat.nodes, helpers, onOpenMatch: openMatch }}
                />
            ) : null}

            {stage === "journeys" ? (
                <>
                    <JourneysCard
                        isHidden={false}
                        resizeHandleProps={explorerResize.handleProps}
                        journeys={journeys}
                        selectedId={selectedJourneyId}
                        status={journeyStatus}
                        forkCount={forks.length}
                        canCreate={flat.nodes.length > 0}
                        onSelect={journeyActions.select}
                        onNew={newJourney}
                        onDerive={openDerive}
                        onRemove={(id) => {
                            journeyActions.remove(id);
                            log("info", `Deleted journey ${id}`);
                        }}
                    />
                    {selectedJourneyId ? (
                        <PathStrip
                            title={
                                isOpenMode
                                    ? "The UI asks at each fork"
                                    : (selectedJourney?.title ?? selectedJourneyId)
                            }
                            subtitle={
                                isOpenMode
                                    ? undefined
                                    : selectedJourney
                                      ? `from ${selectedJourney.entry}`
                                      : undefined
                            }
                            steps={walk?.steps ?? []}
                            end={walk?.end ?? "no-entry"}
                            selectedNodeId={
                                liveSelection?.type === "node" ? liveSelection.id : null
                            }
                            onSelectNode={revealNode}
                            onChoose={(fork, option) => {
                                if (!selectedJourney) return;
                                if (fork.kind === "decision" && option.edge.case !== undefined) {
                                    journeyActions.expect(
                                        selectedJourney.id,
                                        fork.nodeId,
                                        option.edge.case
                                    );
                                } else
                                    journeyActions.choose(
                                        selectedJourney.id,
                                        fork.key,
                                        option.target.id
                                    );
                            }}
                            onClear={(fork) =>
                                selectedJourney &&
                                journeyActions.clear(selectedJourney.id, fork.key)
                            }
                            openMode={isOpenMode}
                            forks={forks}
                        />
                    ) : null}
                    <JourneyInspectorCard
                        resizeHandleProps={inspectorResize.handleProps}
                        journey={isOpenMode ? null : selectedJourney}
                        openMode={isOpenMode}
                        flat={flat}
                        forks={forks}
                        walk={walk}
                        entries={entryNodes}
                        actions={journeyActions}
                    />
                </>
            ) : null}

            {showsCanvas ? (
                <BottomDock
                    open={dock.open}
                    tab={dock.tab}
                    isHidden={isInspectorMaximized}
                    onSelectTab={selectDockTab}
                    onToggleOpen={() => setDock((prev) => ({ ...prev, open: !prev.open }))}
                    resizeHandleProps={dockResize.handleProps}
                    graphSummary={graphSummary}
                    entries={entries}
                    onClearConsole={() => setEntries([])}
                    problems={allProblems}
                    onRevealProblem={revealProblem}
                    messages={messages}
                    onSendMessage={sendMessage}
                    onClearChat={() => setMessages([])}
                    extraTabs={
                        stage === "journeys"
                            ? [
                                  {
                                      id: "preview",
                                      label: run.active ? "Run steps" : "Flow preview",
                                      Icon: ListBulletIcon,
                                      content: (
                                          <FlowPreview
                                              journey={isOpenMode ? null : selectedJourney}
                                              walk={walk}
                                              openMode={isOpenMode}
                                              run={run}
                                              actions={runActions}
                                              onShowRun={() => setDock({ open: true, tab: "run" })}
                                          />
                                      ),
                                  },
                                  {
                                      id: "run",
                                      label: "Result",
                                      Icon: PlayIcon,
                                      count: run.runs.length,
                                      content: <RunResultPanel run={run} actions={runActions} />,
                                  },
                                  {
                                      id: "session",
                                      label: "Session",
                                      Icon: CircleStackIcon,
                                      count: run.active ? Object.keys(run.sessionData).length : 0,
                                      content: <SessionPanel run={run} />,
                                  },
                              ]
                            : undefined
                    }
                />
            ) : null}

            {stage === "protocol" ? (
                <InspectorCard
                    isMaximized={isInspectorMaximized}
                    onToggleMaximized={() => setInspectorMaximized((max) => !max)}
                    resizeHandleProps={inspectorResize.handleProps}
                    graph={graph}
                    inGroup={inGroup}
                    selection={liveSelection}
                    activeTab={inspectorTab}
                    onTabChange={(tab) => {
                        setInspectorTab(tab);
                        setReveal(null);
                    }}
                    actions={editActions}
                    reveal={reveal}
                    multiActions={multiActions}
                    helperNames={compiledHelpers.names}
                    domain={config.meta.domain}
                    version={config.meta.version}
                    lastSaved={run.lastSaved}
                />
            ) : null}

            {menu && menuContent && stage === "protocol" ? (
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

            <RunDialog pending={run.pending} actions={runActions} container={rootRef.current} />

            <GroupDialog
                open={groupDialog.open}
                nodes={graph.nodes}
                preselected={groupDialog.preselected}
                container={rootRef.current}
                onClose={() => setGroupDialog({ open: false, preselected: [] })}
                onCreate={createGroup}
            />

            <DeriveDialog
                open={derive.open}
                container={rootRef.current}
                candidates={derive.candidates}
                truncated={derive.truncated}
                existing={existingPathKeys}
                onClose={() => setDerive((prev) => ({ ...prev, open: false }))}
                onCreate={createDerived}
            />

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
                typesSummary={`${specTypes.apiCount} APIs · ${compiledHelpers.names.length} helpers`}
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
