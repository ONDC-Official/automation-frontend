import { type FC, useState, useMemo } from "react";
import type { SupportedActions } from "./types";

interface SupportedActionsViewProps {
    supportedActions: SupportedActions;
}

// ─── Layout constants ────────────────────────────────────────────
const NW = 132; // node width
const NH = 34;  // node height
const HG = 64;  // horizontal gap between columns
const VG = 12;  // vertical gap between nodes in column
const PX = 28;  // horizontal padding
const PY = 28;  // vertical padding

// ─── Treat "null" / "" as sentinel entry-point keys ─────────────
const isSentinelKey = (k: string) => k === "null" || k === "";

// ─── Layered layout (BFS from entry points) ──────────────────────
interface NodePos { x: number; y: number; layer: number }

function buildLayout(
    allApis: string[],
    actionMap: Record<string, string[]>,
    entryPoints: Set<string>,
): { pos: Map<string, NodePos>; svgW: number; svgH: number } {
    const layer = new Map<string, number>();
    const queue: string[] = [];
    for (const ep of entryPoints) {
        if (allApis.includes(ep)) { layer.set(ep, 0); queue.push(ep); }
    }
    let head = 0;
    while (head < queue.length) {
        const node = queue[head++];
        const nl = (layer.get(node) ?? 0) + 1;
        for (const next of actionMap[node] ?? []) {
            if (allApis.includes(next) && !layer.has(next)) {
                layer.set(next, nl); queue.push(next);
            }
        }
    }
    const maxL = layer.size ? Math.max(...layer.values()) : 0;
    for (const api of allApis) { if (!layer.has(api)) layer.set(api, maxL + 1); }

    // group into columns
    const cols = new Map<number, string[]>();
    for (const [api, l] of layer) {
        if (!cols.has(l)) cols.set(l, []);
        cols.get(l)!.push(api);
    }
    for (const [, nodes] of cols) {
        nodes.sort((a, b) => {
            const rank = (s: string) => (entryPoints.has(s) ? 0 : s.startsWith("on_") ? 2 : 1);
            return rank(a) - rank(b) || a.localeCompare(b);
        });
    }

    const pos = new Map<string, NodePos>();
    const sorted = [...cols.entries()].sort(([a], [b]) => a - b);
    let cx = PX;
    for (const [li, nodes] of sorted) {
        let cy = PY;
        for (const node of nodes) { pos.set(node, { x: cx, y: cy, layer: li }); cy += NH + VG; }
        cx += NW + HG;
    }
    const svgW = cx - HG + PX;
    const svgH = Math.max(...[...pos.values()].map(p => p.y + NH)) + PY + 48; // 48 = back-edge routing space
    return { pos, svgW, svgH };
}

// ─── Edge path helpers ───────────────────────────────────────────
function forwardPath(sx: number, sy: number, tx: number, ty: number) {
    const dx = (tx - sx) * 0.45;
    return `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
}

function backPath(sx: number, sy: number, tx: number, ty: number, svgH: number) {
    const bot = svgH - 14;
    const mx = (sx + tx) / 2;
    return `M ${sx} ${sy} Q ${sx} ${bot + 4} ${mx} ${bot + 4} Q ${tx} ${bot + 4} ${tx} ${ty}`;
}

// ─── GraphView ───────────────────────────────────────────────────
interface GraphViewProps {
    allApis: string[];
    actionMap: Record<string, string[]>;
    entryPoints: Set<string>;
    focused: string | null;
    onFocus: (api: string) => void;
}

const GraphView: FC<GraphViewProps> = ({ allApis, actionMap, entryPoints, focused, onFocus }) => {
    const { pos, svgW, svgH } = useMemo(
        () => buildLayout(allApis, actionMap, entryPoints),
        [allApis, actionMap, entryPoints],
    );

    const edges = useMemo(() => {
        const out: { from: string; to: string; isBack: boolean }[] = [];
        for (const api of allApis) {
            for (const next of actionMap[api] ?? []) {
                if (!pos.has(api) || !pos.has(next)) continue;
                const isBack = pos.get(next)!.layer <= pos.get(api)!.layer;
                out.push({ from: api, to: next, isBack });
            }
        }
        return out;
    }, [allApis, actionMap, pos]);

    const nodeColor = (api: string) => {
        if (!focused) {
            if (entryPoints.has(api)) return { bg: "#ecfdf5", border: "#34d399", fg: "#065f46" };
            if (api.startsWith("on_")) return { bg: "#eef2ff", border: "#818cf8", fg: "#3730a3" };
            return { bg: "#f0f9ff", border: "#38bdf8", fg: "#0369a1" };
        }
        if (api === focused) return { bg: "#0ea5e9", border: "#0284c7", fg: "#ffffff" };
        if ((actionMap[focused] ?? []).includes(api)) return { bg: "#bae6fd", border: "#38bdf8", fg: "#0c4a6e" };
        return { bg: "#f8fafc", border: "#e2e8f0", fg: "#94a3b8" };
    };

    const edgeColor = (from: string, to: string, isBack: boolean) => {
        if (focused === from) return "#0ea5e9";
        if (focused && (actionMap[focused] ?? []).includes(from)) return "#7dd3fc";
        if (focused) return "#e2e8f0";
        return isBack ? "#94a3b8" : "#7dd3fc";
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-auto">
            <svg
                width={svgW}
                height={svgH}
                style={{ minWidth: svgW, display: "block" }}
            >
                <defs>
                    <marker id="arrow-fwd" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L8,3 z" fill="#7dd3fc" />
                    </marker>
                    <marker id="arrow-fwd-focus" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L8,3 z" fill="#0ea5e9" />
                    </marker>
                    <marker id="arrow-back" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
                    </marker>
                    <marker id="arrow-dim" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L8,3 z" fill="#e2e8f0" />
                    </marker>
                </defs>

                {/* Edges — rendered first so nodes sit on top */}
                {edges.map(({ from, to, isBack }, i) => {
                    const s = pos.get(from)!;
                    const t = pos.get(to)!;
                    const color = edgeColor(from, to, isBack);
                    const isFocusedEdge = focused === from;
                    const isDim = focused && !isFocusedEdge && !(actionMap[focused] ?? []).includes(from);
                    const markerId = isFocusedEdge
                        ? "url(#arrow-fwd-focus)"
                        : isBack
                          ? "url(#arrow-back)"
                          : isDim
                            ? "url(#arrow-dim)"
                            : "url(#arrow-fwd)";

                    const path = isBack
                        ? backPath(s.x + NW / 2, s.y + NH, t.x + NW / 2, t.y + NH, svgH)
                        : forwardPath(s.x + NW, s.y + NH / 2, t.x, t.y + NH / 2);

                    return (
                        <path
                            key={i}
                            d={path}
                            fill="none"
                            stroke={color}
                            strokeWidth={isFocusedEdge ? 2 : 1.25}
                            strokeDasharray={isBack ? "4 3" : undefined}
                            markerEnd={markerId}
                            style={{ transition: "stroke 0.15s, stroke-width 0.15s" }}
                        />
                    );
                })}

                {/* Nodes */}
                {allApis.map((api) => {
                    const p = pos.get(api);
                    if (!p) return null;
                    const { bg, border, fg } = nodeColor(api);
                    return (
                        <g
                            key={api}
                            style={{ cursor: "pointer" }}
                            onClick={() => onFocus(api)}
                        >
                            <rect
                                x={p.x} y={p.y}
                                width={NW} height={NH}
                                rx={7}
                                fill={bg}
                                stroke={border}
                                strokeWidth={focused === api ? 2 : 1.25}
                                style={{ transition: "fill 0.15s, stroke 0.15s" }}
                            />
                            <text
                                x={p.x + NW / 2}
                                y={p.y + NH / 2 + 1}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize={11}
                                fontWeight={600}
                                fontFamily="ui-monospace, monospace"
                                fill={fg}
                                style={{ transition: "fill 0.15s", pointerEvents: "none", userSelect: "none" }}
                            >
                                {api}
                            </text>
                        </g>
                    );
                })}

                {/* Back-edge region label */}
                <text
                    x={PX}
                    y={svgH - 6}
                    fontSize={9}
                    fill="#cbd5e1"
                    fontFamily="ui-sans-serif, sans-serif"
                    style={{ userSelect: "none" }}
                >
                    ↩ back edges (dashed)
                </text>
            </svg>
        </div>
    );
};

// ─── Main component ──────────────────────────────────────────────
const SupportedActionsView: FC<SupportedActionsViewProps> = ({ supportedActions }) => {
    const [search, setSearch] = useState("");
    const [focused, setFocused] = useState<string | null>(null);
    const [view, setView] = useState<"cards" | "graph">("cards");

    const { supportedActions: actionMap, apiProperties } = supportedActions;

    const entryPoints = useMemo(() => {
        const all: string[] = [];
        for (const k of Object.keys(actionMap)) {
            if (isSentinelKey(k)) all.push(...(actionMap[k] ?? []));
        }
        return new Set(all);
    }, [actionMap]);

    const allApis = useMemo(
        () => Object.keys(actionMap).filter((k) => !isSentinelKey(k)),
        [actionMap],
    );

    const hasSearch = search.trim().length > 0;

    const filteredApis = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return allApis;
        return allApis.filter((api) => api.toLowerCase().includes(q));
    }, [allApis, search]);

    const getRelationship = (api: string): "focused" | "next" | "history" | "none" => {
        if (!focused) return "none";
        if (api === focused) return "focused";
        if ((actionMap[focused] ?? []).includes(api)) return "next";
        if (
            (apiProperties[focused]?.transaction_partner ?? []).includes(api) ||
            apiProperties[focused]?.async_predecessor === api
        )
            return "history";
        return "none";
    };

    const toggleFocus = (api: string) => setFocused((prev) => (prev === api ? null : api));

    return (
        <div className="w-full flex flex-col gap-6">
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 border border-sky-100 shadow-sm shrink-0">
                        <svg
                            className="h-5 w-5 text-sky-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.75}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                            />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-800 leading-tight">
                            Supported Actions
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                            <span className="font-medium text-slate-700">
                                {filteredApis.length}
                            </span>
                            {hasSearch ? ` of ${allApis.length} actions` : " actions"}
                            {entryPoints.size > 0 && !hasSearch && (
                                <span className="ml-2 text-emerald-600 font-medium">
                                    · {entryPoints.size} entry point
                                    {entryPoints.size !== 1 ? "s" : ""}
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* View toggle */}
                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 gap-0.5 shrink-0">
                        <button
                            onClick={() => setView("cards")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                view === "cards"
                                    ? "bg-white text-slate-800 shadow-sm border border-slate-200"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                            </svg>
                            Cards
                        </button>
                        <button
                            onClick={() => setView("graph")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                view === "graph"
                                    ? "bg-white text-slate-800 shadow-sm border border-slate-200"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            Graph
                        </button>
                    </div>

                    {/* Search — hidden in graph view when focused */}
                    {view === "cards" && (
                        <div className="relative w-full sm:w-72">
                            <svg
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                            </svg>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Filter actions…"
                                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400"
                            />
                            {hasSearch && (
                                <button
                                    onClick={() => setSearch("")}
                                    aria-label="Clear search"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Graph view ─────────────────────────────────────────── */}
            {view === "graph" && (
                <div className="flex flex-col gap-3">
                    {/* Graph legend */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                            <span className="w-10 h-px border-t-2 border-sky-300 inline-block" />
                            <span>Valid next</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-10 h-px border-t-2 border-dashed border-slate-400 inline-block" />
                            <span>Back edge</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="inline-block w-3 h-3 rounded bg-emerald-100 border border-emerald-400" />
                            <span>Entry point</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="inline-block w-3 h-3 rounded bg-sky-100 border border-sky-400" />
                            <span>Request</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="inline-block w-3 h-3 rounded bg-indigo-100 border border-indigo-400" />
                            <span>Response (on_*)</span>
                        </div>
                        <p className="italic text-slate-400 hidden sm:block">Click a node to focus</p>
                        {focused && (
                            <button
                                onClick={() => setFocused(null)}
                                className="ml-auto flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-800 transition"
                            >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Clear focus
                            </button>
                        )}
                    </div>
                    <GraphView
                        allApis={allApis}
                        actionMap={actionMap}
                        entryPoints={entryPoints}
                        focused={focused}
                        onFocus={toggleFocus}
                    />
                </div>
            )}

            {/* ── Cards view ─────────────────────────────────────────── */}
            {view === "cards" && (
                <>
                    {/* Legend */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-sm bg-sky-400 shrink-0" />
                            <span>
                                <strong className="text-slate-700">Valid Next</strong> — can
                                immediately follow this action
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-sm bg-slate-400 shrink-0" />
                            <span>
                                <strong className="text-slate-700">Required History</strong> — must
                                already exist in the transaction
                            </span>
                        </div>
                        <p className="sm:ml-1 text-slate-400 italic hidden sm:block">
                            Click any card or chip to focus
                        </p>
                        {focused && (
                            <button
                                onClick={() => setFocused(null)}
                                className="sm:ml-auto flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-800 transition"
                            >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Clear focus
                            </button>
                        )}
                    </div>

                    {/* Entry Points */}
                    {entryPoints.size > 0 && !hasSearch && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-5 py-4">
                            <div className="flex items-center gap-2 mb-1">
                                <svg className="h-3.5 w-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                                </svg>
                                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                                    Transaction Entry Points
                                </p>
                            </div>
                            <p className="text-xs text-emerald-700/60 mb-3 ml-5">
                                A transaction can only be started with one of these:
                            </p>
                            <div className="flex flex-wrap gap-2 ml-5">
                                {[...entryPoints].map((ep) => (
                                    <button
                                        key={ep}
                                        onClick={() => toggleFocus(ep)}
                                        className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all shadow-sm ${
                                            focused === ep
                                                ? "bg-emerald-600 text-white border-emerald-600"
                                                : "bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                                        }`}
                                    >
                                        {ep}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Cards */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        {filteredApis.map((api) => {
                            const props = apiProperties[api];
                            const nextActions = actionMap[api] ?? [];
                            const requiredHistory = props?.transaction_partner ?? [];
                            const asyncPredecessor = props?.async_predecessor ?? null;
                            const isEntry = entryPoints.has(api);
                            const isResponse = api.startsWith("on_");

                            const rel = getRelationship(api);

                            const ringClass =
                                rel === "focused"
                                    ? "ring-2 ring-sky-400 border-sky-300"
                                    : rel === "next"
                                      ? "ring-2 ring-sky-300 border-sky-200"
                                      : rel === "history"
                                        ? "ring-2 ring-slate-300 border-slate-300"
                                        : focused
                                          ? "opacity-35"
                                          : "hover:shadow-md hover:border-slate-300";

                            return (
                                <div
                                    key={api}
                                    className={`relative rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-200 ${ringClass}`}
                                >
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isResponse ? "bg-indigo-400" : "bg-sky-400"}`} />

                                    <div className="pl-4 pr-4 py-3 flex items-center gap-2 border-b border-slate-100 bg-slate-50/60">
                                        <button
                                            onClick={() => toggleFocus(api)}
                                            title="Focus this action"
                                            className="flex items-center gap-2 flex-1 min-w-0 text-left group"
                                        >
                                            <span className="font-mono text-sm font-bold text-slate-800 truncate">{api}</span>
                                            <svg className="h-3 w-3 text-slate-300 group-hover:text-slate-500 shrink-0 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <circle cx="11" cy="11" r="8" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                                            </svg>
                                        </button>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {isEntry && (
                                                <span className="inline-flex items-center rounded-md px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold uppercase tracking-wide">Entry</span>
                                            )}
                                            {isResponse && (
                                                <span className="inline-flex items-center rounded-md px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-semibold uppercase tracking-wide">Response</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pl-5 pr-4 py-3 space-y-3.5">
                                        {asyncPredecessor && (
                                            <div className="flex items-start gap-2 border-l-2 border-slate-300 pl-2.5 py-0.5">
                                                <p className="text-xs text-slate-500 leading-relaxed">
                                                    Async response to{" "}
                                                    <button onClick={() => toggleFocus(asyncPredecessor)} className="font-mono font-semibold text-slate-700 hover:text-sky-700 hover:underline transition">
                                                        {asyncPredecessor}
                                                    </button>{" "}
                                                    — must share the same <span className="font-semibold text-slate-700">message_id</span>.
                                                </p>
                                            </div>
                                        )}

                                        <div>
                                            <p className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-sm bg-sky-400 inline-block shrink-0" />
                                                Valid Next
                                            </p>
                                            {nextActions.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {nextActions.map((next) => (
                                                        <button
                                                            key={next}
                                                            onClick={() => toggleFocus(next)}
                                                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border transition-all ${
                                                                focused === next
                                                                    ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                                                                    : "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100"
                                                            }`}
                                                        >
                                                            {next}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic">Terminal — no further actions can follow.</p>
                                            )}
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-sm bg-slate-400 inline-block shrink-0" />
                                                Required History
                                            </p>
                                            {requiredHistory.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {requiredHistory.map((h) => (
                                                        <button
                                                            key={h}
                                                            onClick={() => toggleFocus(h)}
                                                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border transition-all ${
                                                                focused === h
                                                                    ? "bg-slate-700 text-white border-slate-700 shadow-sm"
                                                                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                                                            }`}
                                                        >
                                                            {h}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic">No prior history required.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredApis.length === 0 && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 py-16 text-center">
                            <div className="flex flex-col items-center gap-2">
                                <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                                </svg>
                                <p className="text-sm font-medium text-slate-500">No actions match your search.</p>
                                <p className="text-xs text-slate-400">Try a different keyword or clear the filter.</p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SupportedActionsView;


interface SupportedActionsViewProps {
    supportedActions: SupportedActions;
}

// Treat literal "null", empty string, and the JS null key as entry-point sentinels
const isSentinelKey = (k: string) => k === "null" || k === "";

const SupportedActionsView: FC<SupportedActionsViewProps> = ({ supportedActions }) => {
    const [search, setSearch] = useState("");
    const [focused, setFocused] = useState<string | null>(null);

    const { supportedActions: actionMap, apiProperties } = supportedActions;

    // APIs that can START a transaction (under the "null" / "" sentinel key)
    const entryPoints = useMemo(() => {
        const all: string[] = [];
        for (const k of Object.keys(actionMap)) {
            if (isSentinelKey(k)) all.push(...(actionMap[k] ?? []));
        }
        return new Set(all);
    }, [actionMap]);

    // All real API action keys, excluding sentinels
    const allApis = useMemo(
        () => Object.keys(actionMap).filter((k) => !isSentinelKey(k)),
        [actionMap]
    );

    const hasSearch = search.trim().length > 0;

    const filteredApis = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return allApis;
        return allApis.filter((api) => api.toLowerCase().includes(q));
    }, [allApis, search]);

    // Classify focus relationships
    const getRelationship = (api: string): "focused" | "next" | "history" | "none" => {
        if (!focused) return "none";
        if (api === focused) return "focused";
        if ((actionMap[focused] ?? []).includes(api)) return "next";
        if (
            (apiProperties[focused]?.transaction_partner ?? []).includes(api) ||
            apiProperties[focused]?.async_predecessor === api
        )
            return "history";
        return "none";
    };

    const toggleFocus = (api: string) => setFocused((prev) => (prev === api ? null : api));

    return (
        <div className="w-full flex flex-col gap-6">
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 border border-sky-100 shadow-sm shrink-0">
                        <svg
                            className="h-5 w-5 text-sky-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.75}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                            />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-800 leading-tight">
                            Supported Actions
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                            <span className="font-medium text-slate-700">
                                {filteredApis.length}
                            </span>
                            {hasSearch ? ` of ${allApis.length} actions` : " actions"}
                            {entryPoints.size > 0 && !hasSearch && (
                                <span className="ml-2 text-emerald-600 font-medium">
                                    · {entryPoints.size} entry point
                                    {entryPoints.size !== 1 ? "s" : ""}
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-72">
                    <svg
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
                        />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filter actions…"
                        className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400"
                    />
                    {hasSearch && (
                        <button
                            onClick={() => setSearch("")}
                            aria-label="Clear search"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* ── Legend ─────────────────────────────────────────────── */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-sky-400 shrink-0" />
                    <span>
                        <strong className="text-slate-700">Valid Next</strong> — can immediately
                        follow this action
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-slate-400 shrink-0" />
                    <span>
                        <strong className="text-slate-700">Required History</strong> — must already
                        exist in the transaction
                    </span>
                </div>
                <p className="sm:ml-1 text-slate-400 italic hidden sm:block">
                    Click any card or chip to focus
                </p>
                {focused && (
                    <button
                        onClick={() => setFocused(null)}
                        className="sm:ml-auto flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-800 transition"
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
                )}
            </div>

            {/* ── Entry Points ───────────────────────────────────────── */}
            {entryPoints.size > 0 && !hasSearch && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-5 py-4">
                    <div className="flex items-center gap-2 mb-1">
                        <svg
                            className="h-3.5 w-3.5 text-emerald-600 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
                            />
                        </svg>
                        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                            Transaction Entry Points
                        </p>
                    </div>
                    <p className="text-xs text-emerald-700/60 mb-3 ml-5">
                        A transaction can only be started with one of these:
                    </p>
                    <div className="flex flex-wrap gap-2 ml-5">
                        {[...entryPoints].map((ep) => (
                            <button
                                key={ep}
                                onClick={() => toggleFocus(ep)}
                                className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all shadow-sm ${
                                    focused === ep
                                        ? "bg-emerald-600 text-white border-emerald-600"
                                        : "bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                                }`}
                            >
                                {ep}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Action Cards ───────────────────────────────────────── */}
            <div className="grid gap-4 sm:grid-cols-2">
                {filteredApis.map((api) => {
                    const props = apiProperties[api];
                    const nextActions = actionMap[api] ?? [];
                    const requiredHistory = props?.transaction_partner ?? [];
                    const asyncPredecessor = props?.async_predecessor ?? null;
                    const isEntry = entryPoints.has(api);
                    const isResponse = api.startsWith("on_");

                    const rel = getRelationship(api);

                    const ringClass =
                        rel === "focused"
                            ? "ring-2 ring-sky-400 border-sky-300"
                            : rel === "next"
                              ? "ring-2 ring-sky-300 border-sky-200"
                              : rel === "history"
                                ? "ring-2 ring-slate-300 border-slate-300"
                                : focused
                                  ? "opacity-35"
                                  : "hover:shadow-md hover:border-slate-300";

                    return (
                        <div
                            key={api}
                            className={`relative rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-200 ${ringClass}`}
                        >
                            {/* Left accent bar */}
                            <div
                                className={`absolute left-0 top-0 bottom-0 w-1 ${isResponse ? "bg-indigo-400" : "bg-sky-400"}`}
                            />

                            {/* Card header */}
                            <div className="pl-4 pr-4 py-3 flex items-center gap-2 border-b border-slate-100 bg-slate-50/60">
                                <button
                                    onClick={() => toggleFocus(api)}
                                    title="Focus this action"
                                    className="flex items-center gap-2 flex-1 min-w-0 text-left group"
                                >
                                    <span className="font-mono text-sm font-bold text-slate-800 truncate">
                                        {api}
                                    </span>
                                    <svg
                                        className="h-3 w-3 text-slate-300 group-hover:text-slate-500 shrink-0 transition"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <circle cx="11" cy="11" r="8" />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M21 21l-4.35-4.35"
                                        />
                                    </svg>
                                </button>

                                {/* Badges — only meaningful ones */}
                                <div className="flex items-center gap-1 shrink-0">
                                    {isEntry && (
                                        <span className="inline-flex items-center rounded-md px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold uppercase tracking-wide">
                                            Entry
                                        </span>
                                    )}
                                    {isResponse && (
                                        <span className="inline-flex items-center rounded-md px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-semibold uppercase tracking-wide">
                                            Response
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Card body */}
                            <div className="pl-5 pr-4 py-3 space-y-3.5">
                                {/* Async predecessor note — clean inline style, no color */}
                                {asyncPredecessor && (
                                    <div className="flex items-start gap-2 border-l-2 border-slate-300 pl-2.5 py-0.5">
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Async response to{" "}
                                            <button
                                                onClick={() => toggleFocus(asyncPredecessor)}
                                                className="font-mono font-semibold text-slate-700 hover:text-sky-700 hover:underline transition"
                                            >
                                                {asyncPredecessor}
                                            </button>{" "}
                                            — must share the same{" "}
                                            <span className="font-semibold text-slate-700">
                                                message_id
                                            </span>
                                            .
                                        </p>
                                    </div>
                                )}

                                {/* Valid next */}
                                <div>
                                    <p className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-sm bg-sky-400 inline-block shrink-0" />
                                        Valid Next
                                    </p>
                                    {nextActions.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {nextActions.map((next) => (
                                                <button
                                                    key={next}
                                                    onClick={() => toggleFocus(next)}
                                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border transition-all ${
                                                        focused === next
                                                            ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                                                            : "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100"
                                                    }`}
                                                >
                                                    {next}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">
                                            Terminal — no further actions can follow.
                                        </p>
                                    )}
                                </div>

                                {/* Required history */}
                                <div>
                                    <p className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-sm bg-slate-400 inline-block shrink-0" />
                                        Required History
                                    </p>
                                    {requiredHistory.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {requiredHistory.map((h) => (
                                                <button
                                                    key={h}
                                                    onClick={() => toggleFocus(h)}
                                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border transition-all ${
                                                        focused === h
                                                            ? "bg-slate-700 text-white border-slate-700 shadow-sm"
                                                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                                                    }`}
                                                >
                                                    {h}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">
                                            No prior history required.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Empty state ────────────────────────────────────────── */}
            {filteredApis.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                        <svg
                            className="h-8 w-8 text-slate-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
                            />
                        </svg>
                        <p className="text-sm font-medium text-slate-500">
                            No actions match your search.
                        </p>
                        <p className="text-xs text-slate-400">
                            Try a different keyword or clear the filter.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportedActionsView;
