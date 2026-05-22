import { useMemo, useState } from "react";
import JsonView from "@uiw/react-json-view";
import { FaExchangeAlt } from "react-icons/fa";
import {
    IoChevronDown,
    IoChevronForward,
    IoGitNetworkOutline,
    IoTimeOutline,
} from "react-icons/io5";
import { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";

type Step = MockPlaygroundConfigType["steps"][number];
type HistoryEntry = MockPlaygroundConfigType["transaction_history"][number];

interface TraceNode {
    entry: HistoryEntry;
    def?: Step;
    seq: number; // 1-based execution order
}

// A row is either a request paired with its response (same message_id +
// responseFor mapping), or a single unpaired message.
interface TraceRow {
    request?: TraceNode;
    response?: TraceNode;
}

interface PayloadContext {
    action?: string;
    message_id?: string;
    transaction_id?: string;
    timestamp?: string;
}

function contextOf(payload: unknown): PayloadContext {
    if (payload && typeof payload === "object" && "context" in payload) {
        const ctx = (payload as { context?: unknown }).context;
        if (ctx && typeof ctx === "object") return ctx as PayloadContext;
    }
    return {};
}

const shortId = (id?: string) => (id && id.length > 10 ? `${id.slice(0, 8)}…` : id);

// Owner-driven accent palette — BAP (sky) vs BPP (violet).
function ownerStyles(owner?: string) {
    if (owner === "BPP") {
        return { badge: "bg-violet-100 text-violet-700 ring-violet-200" };
    }
    return { badge: "bg-sky-100 text-sky-700 ring-sky-200" };
}

function MessageBlock({ node, paired }: { node: TraceNode; paired: boolean }) {
    const [open, setOpen] = useState(false);
    const ctx = contextOf(node.entry.payload);
    const owner = node.def?.owner;
    const action = node.entry.action || node.def?.api || ctx.action || node.entry.action_id;
    const s = ownerStyles(owner);

    return (
        <div>
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-sky-50/50 transition-colors"
            >
                {/* Sequence */}
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold flex items-center justify-center">
                    {node.seq}
                </span>

                {/* Owner */}
                <span
                    className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ring-1 ring-inset ${s.badge}`}
                >
                    {owner ?? "—"}
                </span>

                {/* Action + id */}
                <div className="min-w-0 flex-1">
                    <div className="font-mono text-sm font-semibold text-gray-900 truncate">
                        {action}
                    </div>
                    {node.entry.action_id !== action && (
                        <div className="font-mono text-xs text-gray-400 truncate">
                            {node.entry.action_id}
                        </div>
                    )}
                </div>

                {/* message_id — highlighted within a pair to show the link */}
                {ctx.message_id && (
                    <span
                        title={`message_id: ${ctx.message_id}`}
                        className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-mono ${
                            paired ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
                        }`}
                    >
                        msg {shortId(ctx.message_id)}
                    </span>
                )}

                {open ? (
                    <IoChevronDown className="flex-shrink-0 text-sky-400" />
                ) : (
                    <IoChevronForward className="flex-shrink-0 text-sky-300" />
                )}
            </button>

            {open && (
                <div className="px-4 pb-3">
                    {ctx.timestamp && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2 font-mono">
                            <IoTimeOutline size={13} />
                            {ctx.timestamp}
                        </div>
                    )}
                    <div className="rounded-lg border border-sky-100 bg-sky-50/30 p-2 overflow-hidden">
                        <JsonView value={node.entry.payload as object} collapsed={2} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TraceView({ config }: { config: MockPlaygroundConfigType }) {
    const rows = useMemo<TraceRow[]>(() => {
        const defMap = new Map<string, Step>();
        [...config.steps, ...(config.extra_steps?.steps ?? [])].forEach((s) =>
            defMap.set(s.action_id, s)
        );

        const out: TraceRow[] = [];
        // `${requestActionId}::${messageId}` -> index of an open request row.
        const pending = new Map<string, number>();

        config.transaction_history.forEach((entry, i) => {
            const def = defMap.get(entry.action_id);
            const messageId = contextOf(entry.payload).message_id;
            const responseFor =
                def?.responseFor && def.responseFor !== "NONE" ? def.responseFor : undefined;
            const node: TraceNode = { entry, def, seq: i + 1 };

            // A response pairs with its request when responseFor + message_id match.
            if (responseFor && messageId) {
                const key = `${responseFor}::${messageId}`;
                const idx = pending.get(key);
                if (idx !== undefined && out[idx] && !out[idx].response) {
                    out[idx].response = node;
                    pending.delete(key);
                    return;
                }
            }

            if (responseFor) {
                // Unmatched response — show on its own.
                out.push({ response: node });
            } else {
                const rowIdx = out.length;
                out.push({ request: node });
                if (messageId) pending.set(`${entry.action_id}::${messageId}`, rowIdx);
            }
        });

        return out;
    }, [config]);

    const metaChip =
        "px-2 py-0.5 rounded-md bg-white border border-sky-100 text-sky-700 font-medium";

    return (
        <div className="w-full -m-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-50 to-white border-b border-sky-100 px-5 py-4 pr-16">
                <div className="flex items-center gap-2 mb-2">
                    <IoGitNetworkOutline className="text-sky-500 text-2xl" />
                    <h2 className="text-lg font-bold text-gray-900">Execution Trace</h2>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className={metaChip}>{config.meta.domain}</span>
                    <span className={metaChip}>{config.meta.version}</span>
                    <span className={metaChip}>{config.meta.flowId}</span>
                    <span className="text-gray-400 ml-1">
                        {config.transaction_history.length} message
                        {config.transaction_history.length === 1 ? "" : "s"}
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="p-5">
                {rows.length === 0 ? (
                    <div className="text-center py-16">
                        <IoGitNetworkOutline className="text-sky-200 text-5xl mx-auto mb-3" />
                        <p className="text-gray-500 text-sm font-medium">No execution yet</p>
                        <p className="text-gray-400 text-xs mt-1">
                            Run some steps to see the flow trace.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {rows.map((row, i) => (
                            <div
                                key={i}
                                className="rounded-xl border border-sky-100 bg-white shadow-sm overflow-hidden divide-y divide-sky-50"
                            >
                                {row.request && (
                                    <MessageBlock node={row.request} paired={!!row.response} />
                                )}
                                {row.request && row.response && (
                                    <div className="flex items-center justify-center gap-2 bg-indigo-50/60 py-1">
                                        <FaExchangeAlt className="text-indigo-400" size={11} />
                                        <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wide">
                                            paired · same message_id
                                        </span>
                                    </div>
                                )}
                                {row.response && (
                                    <MessageBlock node={row.response} paired={!!row.request} />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
