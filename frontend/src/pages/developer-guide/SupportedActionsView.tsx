import { type FC, useState, useMemo, lazy, Suspense } from "react";
import type { SupportedActions } from "./types";

const SupportedActionsGraph = lazy(() => import("./SupportedActionsGraph"));

interface SupportedActionsViewProps {
    supportedActions: SupportedActions;
}

// Treat literal "null", empty string, and the JS null key as entry-point sentinels
const isSentinelKey = (k: string) => k === "null" || k === "";

const SupportedActionsView: FC<SupportedActionsViewProps> = ({ supportedActions }) => {
    const [search, setSearch] = useState("");
    const [focused, setFocused] = useState<string | null>(null);
    const [view, setView] = useState<"cards" | "graph">("cards");

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

                {/* View toggle + Search */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Cards / Graph toggle */}
                    <div className="flex rounded-xl border border-slate-200 overflow-hidden shadow-sm shrink-0 bg-white">
                        <button
                            onClick={() => setView("cards")}
                            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors ${
                                view === "cards"
                                    ? "bg-sky-500 text-white"
                                    : "text-slate-500 hover:bg-slate-50"
                            }`}
                        >
                            <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                                />
                            </svg>
                            Cards
                        </button>
                        <button
                            onClick={() => setView("graph")}
                            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors border-l border-slate-200 ${
                                view === "graph"
                                    ? "bg-sky-500 text-white"
                                    : "text-slate-500 hover:bg-slate-50"
                            }`}
                        >
                            <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <circle cx="5" cy="12" r="2" fill="currentColor" stroke="none" />
                                <circle cx="19" cy="5" r="2" fill="currentColor" stroke="none" />
                                <circle cx="19" cy="19" r="2" fill="currentColor" stroke="none" />
                                <path strokeLinecap="round" d="M7 12h5M12 12l5-5M12 12l5 5" />
                            </svg>
                            Graph
                        </button>
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
            </div>
            {/* ── Legend ─────────────────────────────────────────────── */}
            {view === "cards" && (
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
            )}{" "}
            {/* end view === "cards" legend */}
            {/* ── Graph view ─────────────────────────────────────────── */}
            {view === "graph" && (
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center h-64 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-400">
                            Loading graph…
                        </div>
                    }
                >
                    <SupportedActionsGraph supportedActions={supportedActions} />
                </Suspense>
            )}
            {/* ── Entry Points ───────────────────────────────────────── */}
            {view === "cards" && entryPoints.size > 0 && !hasSearch && (
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
            {view === "cards" && (
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
            )}{" "}
            {/* end view === "cards" grid */}
            {/* ── Empty state ────────────────────────────────────────── */}
            {view === "cards" && filteredApis.length === 0 && (
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
