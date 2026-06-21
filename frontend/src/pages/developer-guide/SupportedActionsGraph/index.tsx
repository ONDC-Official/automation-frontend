import { useMemo, useCallback, useState, type FC } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    type Node,
    type Edge,
    BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./SupportedActionsGraph.css";
import { useTheme } from "@/context/theme/themeContext";
import type { SupportedActions } from "../types";
import { GraphCtx, type GraphCtxValue } from "./graphContext";
import { isSentinelKey, computeLayout } from "./computeLayout";
import { nodeTypes, type ActionNodeData } from "./ActionNode";
import { NodeTooltip } from "./NodeTooltip";

interface SupportedActionsGraphProps {
    supportedActions: SupportedActions;
}

const SupportedActionsGraph: FC<SupportedActionsGraphProps> = ({ supportedActions }) => {
    const { supportedActions: actionMap, apiProperties } = supportedActions;
    const { isDark } = useTheme();
    const dimmedEdgeColor = isDark ? "#334155" : "#e2e8f0";
    const dimmedAsyncEdgeColor = isDark ? "#3730a3" : "#e0e7ff";

    const [focused, setFocused] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<{ api: string; x: number; y: number } | null>(null);

    const entryPoints = useMemo(() => {
        const all: string[] = [];
        for (const k of Object.keys(actionMap))
            if (isSentinelKey(k)) all.push(...(actionMap[k] ?? []));
        return new Set(all);
    }, [actionMap]);

    const allApis = useMemo(
        () => Object.keys(actionMap).filter((k) => !isSentinelKey(k)),
        [actionMap]
    );

    const positions = useMemo(
        () => computeLayout(allApis, actionMap, entryPoints),
        [allApis, actionMap, entryPoints]
    );

    const toggleFocus = useCallback(
        (api: string) => setFocused((prev) => (prev === api ? null : api)),
        []
    );

    const onHover = useCallback((api: string | null, x: number, y: number) => {
        setTooltip(api ? { api, x, y } : null);
    }, []);

    const ctxValue = useMemo<GraphCtxValue>(
        () => ({ focused, toggleFocus, onHover, actionMap, apiProperties, entryPoints }),
        [focused, toggleFocus, onHover, actionMap, apiProperties, entryPoints]
    );

    const nodes: Node<ActionNodeData>[] = useMemo(
        () =>
            allApis.map((api) => ({
                id: api,
                type: "action",
                position: positions.get(api) ?? { x: 0, y: 0 },
                data: {
                    label: api,
                    isEntry: entryPoints.has(api),
                    isResponse: api.startsWith("on_"),
                    nextCount: (actionMap[api] ?? []).length,
                    historyCount: (apiProperties[api]?.transaction_partner ?? []).length,
                },
            })),
        [allApis, positions, entryPoints, actionMap, apiProperties]
    );

    const edges: Edge[] = useMemo(() => {
        const list: Edge[] = [];
        for (const api of allApis) {
            const srcFocused = focused === api;
            // Base color driven by source node type — always visible
            const baseColor = entryPoints.has(api)
                ? "#10b981" // emerald — entry point
                : api.startsWith("on_")
                  ? "#818cf8" // indigo  — response API
                  : "#38bdf8"; // sky     — request API

            for (const next of actionMap[api] ?? []) {
                if (!allApis.includes(next)) continue;
                const active = srcFocused || focused === next;
                const dimmed = focused !== null && !active;
                list.push({
                    id: `${api}->${next}`,
                    source: api,
                    target: next,
                    type: "smoothstep",
                    animated: srcFocused || !focused, // always animate when nothing focused, or when this src is focused
                    style: {
                        stroke: dimmed ? dimmedEdgeColor : active ? baseColor : baseColor,
                        strokeWidth: active ? 2.5 : 1.8,
                        opacity: dimmed ? 0.2 : 1,
                        transition: "stroke 0.22s, stroke-width 0.22s, opacity 0.22s",
                    },
                    markerEnd: {
                        type: "arrowclosed" as const,
                        color: dimmed ? dimmedEdgeColor : baseColor,
                        width: active ? 18 : 14,
                        height: active ? 18 : 14,
                    },
                });
            }
            const pred = apiProperties[api]?.async_predecessor;
            if (pred && allApis.includes(pred)) {
                const alreadyExists = list.some((e) => e.id === `${pred}->${api}`);
                if (!alreadyExists) {
                    const active = focused === pred || focused === api;
                    const dimmed = focused !== null && !active;
                    list.push({
                        id: `${pred}..>${api}`,
                        source: pred,
                        target: api,
                        type: "smoothstep",
                        animated: true,
                        style: {
                            stroke: dimmed ? dimmedAsyncEdgeColor : active ? "#6366f1" : "#a5b4fc",
                            strokeWidth: active ? 2.5 : 1.8,
                            strokeDasharray: "6 4",
                            opacity: dimmed ? 0.2 : 1,
                            transition: "stroke 0.22s, opacity 0.22s",
                        },
                        markerEnd: {
                            type: "arrowclosed" as const,
                            color: dimmed ? dimmedAsyncEdgeColor : active ? "#6366f1" : "#a5b4fc",
                            width: active ? 16 : 14,
                            height: active ? 16 : 14,
                        },
                    });
                }
            }
        }
        return list;
    }, [allApis, actionMap, apiProperties, focused, entryPoints]);

    return (
        <GraphCtx.Provider value={ctxValue}>
            <div className="guide-actions-graph w-full rounded-2xl border border-slate-200 overflow-hidden shadow-xs bg-white dark:bg-surface-elevated">
                {/* ── Legend bar ──────────────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 border-b border-slate-100 bg-linear-to-r from-slate-50/80 to-white dark:from-surface-muted/50 dark:to-surface-elevated text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400 inline-block" />
                        <span className="font-medium text-slate-700">Entry</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-sky-300 inline-block" />
                        <span className="font-medium text-slate-700">Request</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-indigo-400 inline-block" />
                        <span className="font-medium text-slate-700">Response</span>
                    </span>
                    <span className="h-3.5 w-px bg-slate-200 mx-0.5 hidden sm:block" />
                    <span className="flex items-center gap-1.5">
                        <svg className="w-7 h-3 shrink-0" viewBox="0 0 28 12" aria-hidden="true">
                            <line x1="0" y1="6" x2="22" y2="6" stroke="#10b981" strokeWidth="2.5" />
                            <polygon points="22,3 28,6 22,9" fill="#10b981" />
                        </svg>
                        from entry
                    </span>
                    <span className="flex items-center gap-1.5">
                        <svg className="w-7 h-3 shrink-0" viewBox="0 0 28 12" aria-hidden="true">
                            <line x1="0" y1="6" x2="22" y2="6" stroke="#38bdf8" strokeWidth="2.5" />
                            <polygon points="22,3 28,6 22,9" fill="#38bdf8" />
                        </svg>
                        from request
                    </span>
                    <span className="flex items-center gap-1.5">
                        <svg className="w-7 h-3 shrink-0" viewBox="0 0 28 12" aria-hidden="true">
                            <line x1="0" y1="6" x2="22" y2="6" stroke="#818cf8" strokeWidth="2.5" />
                            <polygon points="22,3 28,6 22,9" fill="#818cf8" />
                        </svg>
                        from response
                    </span>
                    <span className="flex items-center gap-1.5">
                        <svg className="w-7 h-3 shrink-0" viewBox="0 0 28 12" aria-hidden="true">
                            <line
                                x1="0"
                                y1="6"
                                x2="22"
                                y2="6"
                                stroke="#a5b4fc"
                                strokeWidth="2"
                                strokeDasharray="4 3"
                            />
                            <polygon points="22,3 28,6 22,9" fill="#a5b4fc" />
                        </svg>
                        async pair
                    </span>
                    <span className="h-3.5 w-px bg-slate-200 mx-0.5 hidden sm:block" />
                    <span className="flex items-center gap-1">
                        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30">
                            → N
                        </span>
                        <span className="ml-1">next</span>
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                            ↑ N
                        </span>
                        <span className="ml-1">history</span>
                    </span>
                    {focused ? (
                        <button
                            type="button"
                            onClick={() => setFocused(null)}
                            className="ml-auto flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 transition-colors"
                        >
                            <svg
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                            Clear focus
                        </button>
                    ) : (
                        <p className="ml-auto text-slate-400 italic hidden sm:block">
                            Click node to focus · hover for details
                        </p>
                    )}
                </div>

                {/* ── Canvas ──────────────────────────────────────────── */}
                <div style={{ height: 580 }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.22 }}
                        minZoom={0.15}
                        maxZoom={2.5}
                        proOptions={{ hideAttribution: true }}
                        nodesDraggable
                        nodesConnectable={false}
                        elementsSelectable={false}
                    >
                        <Background
                            variant={BackgroundVariant.Dots}
                            gap={22}
                            size={1.2}
                            color={isDark ? "#334155" : "#e2e8f0"}
                        />
                        <Controls
                            showInteractive={false}
                            style={{
                                boxShadow: "none",
                                border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                                borderRadius: 8,
                            }}
                        />
                        <MiniMap
                            nodeColor={(n) => {
                                const d = n.data as ActionNodeData;
                                if (d.isEntry) return "#34d399";
                                if (d.isResponse) return "#818cf8";
                                return "#7dd3fc";
                            }}
                            maskColor={isDark ? "rgba(0,0,0,0.6)" : undefined}
                            style={{
                                borderRadius: 8,
                                border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                            }}
                            pannable
                            zoomable
                        />
                    </ReactFlow>
                </div>
            </div>

            {/* Tooltip portal */}
            {tooltip && (
                <NodeTooltip
                    api={tooltip.api}
                    x={tooltip.x}
                    y={tooltip.y}
                    actionMap={actionMap}
                    apiProperties={apiProperties}
                    entryPoints={entryPoints}
                />
            )}
        </GraphCtx.Provider>
    );
};

export default SupportedActionsGraph;
