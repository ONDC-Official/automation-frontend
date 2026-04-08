import { type FC, useMemo, useCallback, useState, createContext, useContext, memo } from "react";
import { createPortal } from "react-dom";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    type Node,
    type Edge,
    type NodeProps,
    Handle,
    Position,
    BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { SupportedActions } from "./types";

// ── Sentinel detection ────────────────────────────────────────────────────────
const isSentinelKey = (k: string) => k === "null" || k === "";

// ── Layout constants ──────────────────────────────────────────────────────────
const NODE_W = 192;
const NODE_H = 70;
const COL_GAP = 268;
const ROW_GAP = 90;

function computeLayout(
    allApis: string[],
    actionMap: Record<string, string[]>,
    entryPoints: Set<string>
): Map<string, { x: number; y: number }> {
    // Assign layers via BFS from entry points
    const layer = new Map<string, number>();
    const queue: string[] = [];

    for (const ep of entryPoints) {
        if (allApis.includes(ep)) {
            layer.set(ep, 0);
            queue.push(ep);
        }
    }
    // Fallback: any node with no incoming edges gets layer 0
    if (queue.length === 0) {
        const hasIncoming = new Set<string>();
        for (const api of allApis) {
            for (const next of actionMap[api] ?? []) {
                hasIncoming.add(next);
            }
        }
        for (const api of allApis) {
            if (!hasIncoming.has(api)) {
                layer.set(api, 0);
                queue.push(api);
            }
        }
    }

    let head = 0;
    while (head < queue.length) {
        const node = queue[head++];
        const nodeLayer = layer.get(node) ?? 0;
        for (const next of actionMap[node] ?? []) {
            if (!layer.has(next)) {
                layer.set(next, nodeLayer + 1);
                queue.push(next);
            } else if ((layer.get(next) ?? 0) < nodeLayer + 1) {
                layer.set(next, nodeLayer + 1);
            }
        }
    }

    // Assign remaining nodes a layer
    for (const api of allApis) {
        if (!layer.has(api)) layer.set(api, 0);
    }

    // Group nodes by layer, sort within each layer (entry first, then alpha)
    const byLayer = new Map<number, string[]>();
    for (const api of allApis) {
        const l = layer.get(api) ?? 0;
        const arr = byLayer.get(l) ?? [];
        arr.push(api);
        byLayer.set(l, arr);
    }
    for (const [, arr] of byLayer) {
        arr.sort((a, b) => {
            const aE = entryPoints.has(a) ? -1 : 0;
            const bE = entryPoints.has(b) ? -1 : 0;
            if (aE !== bE) return aE - bE;
            return a.localeCompare(b);
        });
    }

    const positions = new Map<string, { x: number; y: number }>();
    for (const [col, nodes] of byLayer) {
        const totalH = nodes.length * (NODE_H + ROW_GAP) - ROW_GAP;
        const startY = -totalH / 2;
        nodes.forEach((api, row) => {
            positions.set(api, {
                x: col * (NODE_W + COL_GAP),
                y: startY + row * (NODE_H + ROW_GAP),
            });
        });
    }
    return positions;
}

// ── Graph context ─────────────────────────────────────────────────────────────
type ApiProps = { async_predecessor: string | null; transaction_partner: string[] };

interface GraphCtxValue {
    focused: string | null;
    toggleFocus: (api: string) => void;
    onHover: (api: string | null, x: number, y: number) => void;
    actionMap: Record<string, string[]>;
    apiProperties: Record<string, ApiProps>;
    entryPoints: Set<string>;
}

const GraphCtx = createContext<GraphCtxValue>(null!);

// ── Node data ─────────────────────────────────────────────────────────────────
interface ActionNodeData extends Record<string, unknown> {
    label: string;
    isEntry: boolean;
    isResponse: boolean;
    nextCount: number;
    historyCount: number;
}

// ── Custom node ───────────────────────────────────────────────────────────────
const ActionNode: FC<NodeProps<Node<ActionNodeData>>> = memo(({ data }) => {
    const { label, isEntry, isResponse, nextCount, historyCount } = data;
    const ctx = useContext(GraphCtx);

    const isFocused = ctx.focused === label;
    const isNext = ctx.focused !== null && (ctx.actionMap[ctx.focused] ?? []).includes(label);
    const isHistory =
        ctx.focused !== null &&
        ((ctx.apiProperties[ctx.focused]?.transaction_partner ?? []).includes(label) ||
            ctx.apiProperties[ctx.focused]?.async_predecessor === label);
    const isDimmed = ctx.focused !== null && !isFocused && !isNext && !isHistory;

    const accentColor = isEntry ? "#10b981" : isResponse ? "#818cf8" : "#38bdf8";
    const borderColor = isFocused
        ? "#0ea5e9"
        : isNext
          ? "#7dd3fc"
          : isHistory
            ? "#fbbf24"
            : "#e2e8f0";
    const bgColor = isEntry ? "#f0fdf4" : isResponse ? "#eef2ff" : "#ffffff";
    const boxShadow = isFocused
        ? "0 0 0 3px rgba(14,165,233,0.22), 0 4px 14px rgba(14,165,233,0.14)"
        : isNext
          ? "0 0 0 2px rgba(125,211,252,0.45)"
          : isHistory
            ? "0 0 0 2px rgba(251,191,36,0.45)"
            : "0 1px 3px rgba(0,0,0,0.06)";

    const typeLabel = isEntry ? "Entry" : isResponse ? "Response" : "Request";
    const typePill = isEntry
        ? { bg: "#ecfdf5", text: "#065f46", border: "#6ee7b7" }
        : isResponse
          ? { bg: "#eef2ff", text: "#4338ca", border: "#a5b4fc" }
          : { bg: "#f0f9ff", text: "#0369a1", border: "#7dd3fc" };

    return (
        <>
            <Handle
                type="target"
                position={Position.Left}
                style={{
                    width: 10,
                    height: 10,
                    background: accentColor,
                    border: "2px solid white",
                    boxShadow: `0 0 0 1px ${accentColor}40`,
                }}
            />
            <div
                onClick={() => ctx.toggleFocus(label)}
                onMouseEnter={(e) => ctx.onHover(label, e.clientX, e.clientY)}
                onMouseMove={(e) => ctx.onHover(label, e.clientX, e.clientY)}
                onMouseLeave={() => ctx.onHover(null, 0, 0)}
                style={{
                    width: NODE_W,
                    height: NODE_H,
                    background: bgColor,
                    border: `1.5px solid ${borderColor}`,
                    borderRadius: 12,
                    display: "flex",
                    overflow: "hidden",
                    boxShadow,
                    cursor: "pointer",
                    opacity: isDimmed ? 0.16 : 1,
                    transition:
                        "opacity 0.25s ease, box-shadow 0.18s ease, border-color 0.18s ease",
                    userSelect: "none",
                }}
            >
                {/* Left accent bar */}
                <div
                    style={{
                        width: 4,
                        flexShrink: 0,
                        background: `linear-gradient(180deg, ${accentColor}dd 0%, ${accentColor}88 100%)`,
                    }}
                />
                {/* Content */}
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        padding: "0 11px",
                        gap: 5,
                        overflow: "hidden",
                        minWidth: 0,
                    }}
                >
                    <span
                        style={{
                            fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
                            fontWeight: 700,
                            fontSize: 13,
                            color: isFocused ? "#0c4a6e" : "#0f172a",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            lineHeight: 1.25,
                            letterSpacing: "-0.01em",
                        }}
                    >
                        {label}
                    </span>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            flexWrap: "nowrap",
                        }}
                    >
                        <span
                            style={{
                                fontSize: 9,
                                fontWeight: 700,
                                letterSpacing: "0.07em",
                                textTransform: "uppercase",
                                padding: "1px 5px",
                                borderRadius: 4,
                                background: typePill.bg,
                                color: typePill.text,
                                border: `1px solid ${typePill.border}`,
                                lineHeight: "14px",
                                flexShrink: 0,
                            }}
                        >
                            {typeLabel}
                        </span>
                        {nextCount > 0 && (
                            <span
                                style={{
                                    fontSize: 9,
                                    fontWeight: 600,
                                    padding: "1px 5px",
                                    borderRadius: 4,
                                    background: "#f0f9ff",
                                    color: "#0284c7",
                                    border: "1px solid #bae6fd",
                                    lineHeight: "14px",
                                    flexShrink: 0,
                                }}
                            >
                                → {nextCount}
                            </span>
                        )}
                        {historyCount > 0 && (
                            <span
                                style={{
                                    fontSize: 9,
                                    fontWeight: 600,
                                    padding: "1px 5px",
                                    borderRadius: 4,
                                    background: "#fffbeb",
                                    color: "#92400e",
                                    border: "1px solid #fde68a",
                                    lineHeight: "14px",
                                    flexShrink: 0,
                                }}
                            >
                                ↑ {historyCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                style={{
                    width: 10,
                    height: 10,
                    background: accentColor,
                    border: "2px solid white",
                    boxShadow: `0 0 0 1px ${accentColor}40`,
                }}
            />
        </>
    );
});
ActionNode.displayName = "ActionNode";

const nodeTypes = { action: ActionNode };

// ── Tooltip portal ────────────────────────────────────────────────────────────
interface TooltipProps {
    api: string;
    x: number;
    y: number;
    actionMap: Record<string, string[]>;
    apiProperties: Record<string, ApiProps>;
    entryPoints: Set<string>;
}

const NodeTooltip: FC<TooltipProps> = ({ api, x, y, actionMap, apiProperties, entryPoints }) => {
    const nextActions = actionMap[api] ?? [];
    const history = apiProperties[api]?.transaction_partner ?? [];
    const asyncPred = apiProperties[api]?.async_predecessor ?? null;
    const isEntry = entryPoints.has(api);
    const isResponse = api.startsWith("on_");

    const typeLabel = isEntry ? "Entry" : isResponse ? "Response" : "Request";
    const typeColor = isEntry ? "#059669" : isResponse ? "#6366f1" : "#0284c7";
    const typeAlpha = isEntry ? "#05996918" : isResponse ? "#6366f118" : "#0284c718";
    const typeBorder = isEntry ? "#05996930" : isResponse ? "#6366f130" : "#0284c730";

    const tipX = Math.min(x + 18, window.innerWidth - 308);
    const tipY = y + 14;

    return createPortal(
        <div
            style={{
                position: "fixed",
                left: tipX,
                top: tipY,
                zIndex: 99999,
                pointerEvents: "none",
                width: 292,
            }}
        >
            <div
                style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    boxShadow: "0 12px 40px rgba(15,23,42,0.13), 0 3px 10px rgba(15,23,42,0.07)",
                    overflow: "hidden",
                    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                        borderBottom: "1px solid #e2e8f0",
                        padding: "11px 14px 10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                    }}
                >
                    <span
                        style={{
                            fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
                            fontWeight: 700,
                            fontSize: 14,
                            color: "#0f172a",
                            letterSpacing: "-0.01em",
                        }}
                    >
                        {api}
                    </span>
                    <span
                        style={{
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            padding: "2px 7px",
                            borderRadius: 5,
                            background: typeAlpha,
                            color: typeColor,
                            border: `1px solid ${typeBorder}`,
                            flexShrink: 0,
                        }}
                    >
                        {typeLabel}
                    </span>
                </div>

                {/* Body */}
                <div
                    style={{
                        padding: "11px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 11,
                    }}
                >
                    {asyncPred && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 7,
                                background: "#f5f3ff",
                                border: "1px solid #ddd6fe",
                                borderRadius: 8,
                                padding: "7px 10px",
                            }}
                        >
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                style={{ marginTop: 1, flexShrink: 0 }}
                            >
                                <circle
                                    cx="6"
                                    cy="6"
                                    r="5"
                                    fill="none"
                                    stroke="#a78bfa"
                                    strokeWidth="1.5"
                                />
                                <path
                                    d="M6 4v3M6 8.5v.3"
                                    stroke="#a78bfa"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <p
                                style={{
                                    fontSize: 11,
                                    color: "#5b21b6",
                                    lineHeight: 1.5,
                                    margin: 0,
                                }}
                            >
                                Async response to{" "}
                                <span
                                    style={{
                                        fontFamily: "monospace",
                                        fontWeight: 700,
                                        color: "#4f46e5",
                                    }}
                                >
                                    {asyncPred}
                                </span>
                                {" — "}must share the same{" "}
                                <span style={{ fontWeight: 700 }}>message_id</span>
                            </p>
                        </div>
                    )}

                    {/* Valid Next */}
                    <div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                marginBottom: 7,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: "#0284c7",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.07em",
                                }}
                            >
                                Valid Next
                            </span>
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: "#0284c7",
                                    background: "#f0f9ff",
                                    border: "1px solid #bae6fd",
                                    borderRadius: "50%",
                                    width: 18,
                                    height: 18,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                {nextActions.length}
                            </span>
                        </div>
                        {nextActions.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {nextActions.map((n) => (
                                    <span
                                        key={n}
                                        style={{
                                            fontFamily: "monospace",
                                            fontSize: 11,
                                            fontWeight: 600,
                                            padding: "3px 8px",
                                            borderRadius: 6,
                                            background: "#f0f9ff",
                                            color: "#0369a1",
                                            border: "1px solid #bae6fd",
                                        }}
                                    >
                                        {n}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p
                                style={{
                                    fontSize: 11,
                                    color: "#94a3b8",
                                    fontStyle: "italic",
                                    margin: 0,
                                }}
                            >
                                Terminal action — no valid successors
                            </p>
                        )}
                    </div>

                    {/* Required History */}
                    <div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                marginBottom: 7,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: "#b45309",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.07em",
                                }}
                            >
                                Required History
                            </span>
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: "#b45309",
                                    background: "#fffbeb",
                                    border: "1px solid #fde68a",
                                    borderRadius: "50%",
                                    width: 18,
                                    height: 18,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                {history.length}
                            </span>
                        </div>
                        {history.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {history.map((h) => (
                                    <span
                                        key={h}
                                        style={{
                                            fontFamily: "monospace",
                                            fontSize: 11,
                                            fontWeight: 600,
                                            padding: "3px 8px",
                                            borderRadius: 6,
                                            background: "#fffbeb",
                                            color: "#92400e",
                                            border: "1px solid #fde68a",
                                        }}
                                    >
                                        {h}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p
                                style={{
                                    fontSize: 11,
                                    color: "#94a3b8",
                                    fontStyle: "italic",
                                    margin: 0,
                                }}
                            >
                                No prior history required
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: "7px 14px",
                        borderTop: "1px solid #f1f5f9",
                        background: "#fafafa",
                    }}
                >
                    <p
                        style={{
                            fontSize: 10,
                            color: "#94a3b8",
                            fontStyle: "italic",
                            margin: 0,
                        }}
                    >
                        Click to focus · explore connections
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ── Main graph component ──────────────────────────────────────────────────────
interface SupportedActionsGraphProps {
    supportedActions: SupportedActions;
}

const SupportedActionsGraph: FC<SupportedActionsGraphProps> = ({ supportedActions }) => {
    const { supportedActions: actionMap, apiProperties } = supportedActions;

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
                        stroke: dimmed ? "#e2e8f0" : active ? baseColor : baseColor,
                        strokeWidth: active ? 2.5 : 1.8,
                        opacity: dimmed ? 0.2 : 1,
                        transition: "stroke 0.22s, stroke-width 0.22s, opacity 0.22s",
                    },
                    markerEnd: {
                        type: "arrowclosed" as const,
                        color: dimmed ? "#e2e8f0" : baseColor,
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
                            stroke: dimmed ? "#e0e7ff" : active ? "#6366f1" : "#a5b4fc",
                            strokeWidth: active ? 2.5 : 1.8,
                            strokeDasharray: "6 4",
                            opacity: dimmed ? 0.2 : 1,
                            transition: "stroke 0.22s, opacity 0.22s",
                        },
                        markerEnd: {
                            type: "arrowclosed" as const,
                            color: dimmed ? "#e0e7ff" : active ? "#6366f1" : "#a5b4fc",
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
            <div className="w-full rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
                {/* ── Legend bar ──────────────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
                        <span className="font-medium text-slate-700">Entry</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-sky-300 inline-block" />
                        <span className="font-medium text-slate-700">Request</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400 inline-block" />
                        <span className="font-medium text-slate-700">Response</span>
                    </span>
                    <span className="h-3.5 w-px bg-slate-200 mx-0.5 hidden sm:block" />
                    <span className="flex items-center gap-1.5">
                        <svg className="w-7 h-3 shrink-0" viewBox="0 0 28 12">
                            <line x1="0" y1="6" x2="22" y2="6" stroke="#10b981" strokeWidth="2.5" />
                            <polygon points="22,3 28,6 22,9" fill="#10b981" />
                        </svg>
                        from entry
                    </span>
                    <span className="flex items-center gap-1.5">
                        <svg className="w-7 h-3 shrink-0" viewBox="0 0 28 12">
                            <line x1="0" y1="6" x2="22" y2="6" stroke="#38bdf8" strokeWidth="2.5" />
                            <polygon points="22,3 28,6 22,9" fill="#38bdf8" />
                        </svg>
                        from request
                    </span>
                    <span className="flex items-center gap-1.5">
                        <svg className="w-7 h-3 shrink-0" viewBox="0 0 28 12">
                            <line x1="0" y1="6" x2="22" y2="6" stroke="#818cf8" strokeWidth="2.5" />
                            <polygon points="22,3 28,6 22,9" fill="#818cf8" />
                        </svg>
                        from response
                    </span>
                    <span className="flex items-center gap-1.5">
                        <svg className="w-7 h-3 shrink-0" viewBox="0 0 28 12">
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
                        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            → N
                        </span>
                        <span className="ml-1">next</span>
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            ↑ N
                        </span>
                        <span className="ml-1">history</span>
                    </span>
                    {focused ? (
                        <button
                            onClick={() => setFocused(null)}
                            className="ml-auto flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-800 transition-colors"
                        >
                            <svg
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
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
                            color="#e2e8f0"
                        />
                        <Controls
                            showInteractive={false}
                            style={{
                                boxShadow: "none",
                                border: "1px solid #e2e8f0",
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
                            style={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
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
