import { useMemo, useState } from "react";
import {
    ArrowsRightLeftIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    ClockIcon,
    ShareIcon,
} from "@heroicons/react/24/outline";
import { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/Shadcn/Button";
import AppJsonViewer from "@/components/AppJsonViewer";

type Step = MockPlaygroundConfigType["steps"][number];
type HistoryEntry = MockPlaygroundConfigType["transaction_history"][number];

interface TraceNode {
    entry: HistoryEntry;
    def?: Step;
    seq: number;
}

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

function ownerStyles(owner?: string) {
    if (owner === "BPP") {
        return "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30";
    }
    return "bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30";
}

function MessageBlock({ node, paired }: { node: TraceNode; paired: boolean }) {
    const [open, setOpen] = useState(false);
    const ctx = contextOf(node.entry.payload);
    const owner = node.def?.owner;
    const action = node.entry.action || node.def?.api || ctx.action || node.entry.action_id;

    return (
        <div>
            <Button
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-light dark:hover:bg-surface-muted"
            >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-text-secondary">
                    {node.seq}
                </span>

                <span
                    className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ring-1 ring-inset",
                        ownerStyles(owner)
                    )}
                >
                    {owner ?? "—"}
                </span>

                <div className="min-w-0 flex-1">
                    <div className="truncate font-mono text-sm font-semibold text-text-primary">
                        {action}
                    </div>
                    {node.entry.action_id !== action && (
                        <div className="truncate font-mono text-xs text-text-secondary">
                            {node.entry.action_id}
                        </div>
                    )}
                </div>

                {ctx.message_id && (
                    <span
                        title={`message_id: ${ctx.message_id}`}
                        className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px]",
                            paired
                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                                : "bg-surface-muted text-text-secondary"
                        )}
                    >
                        msg {shortId(ctx.message_id)}
                    </span>
                )}

                {open ? (
                    <ChevronDownIcon className="size-4 shrink-0 text-brand-normal" />
                ) : (
                    <ChevronRightIcon className="size-4 shrink-0 text-text-secondary" />
                )}
            </Button>

            {open && (
                <div className="px-4 pb-3">
                    {ctx.timestamp && (
                        <div className="mb-2 flex items-center gap-1.5 font-mono text-xs text-text-secondary">
                            <ClockIcon className="size-3.5 shrink-0 text-text-secondary" />
                            {ctx.timestamp}
                        </div>
                    )}
                    <div className="overflow-hidden rounded-lg border border-border-default bg-surface-muted p-2">
                        <AppJsonViewer value={node.entry.payload as object} collapsed={2} />
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
        "rounded-md border border-brand-light-active bg-brand-light px-2 py-0.5 text-xs font-medium text-brand-normal dark:border-border-default dark:bg-surface-muted dark:text-text-secondary";

    return (
        <div className="w-full">
            <div className="mb-4 flex flex-wrap items-center gap-1.5 text-xs">
                <span className={metaChip}>{config.meta.domain}</span>
                <span className={metaChip}>{config.meta.version}</span>
                <span className={metaChip}>{config.meta.flowId}</span>
                <span className="ml-1 text-text-secondary">
                    {config.transaction_history.length} message
                    {config.transaction_history.length === 1 ? "" : "s"}
                </span>
            </div>

            {rows.length === 0 ? (
                <div className="py-16 text-center">
                    <ShareIcon className="mx-auto mb-3 size-12 text-brand-light-active dark:text-border-default" />
                    <p className="text-sm font-medium text-text-secondary">No execution yet</p>
                    <p className="mt-1 text-xs text-text-secondary/80">
                        Run some steps to see the flow trace.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {rows.map((row, i) => (
                        <div
                            key={i}
                            className="divide-y divide-border-default overflow-hidden rounded-xl border border-border-default bg-surface-elevated shadow-xs"
                        >
                            {row.request && (
                                <MessageBlock node={row.request} paired={!!row.response} />
                            )}
                            {row.request && row.response && (
                                <div className="flex items-center justify-center gap-2 border-y border-border-default bg-brand-light/60 py-1.5 dark:bg-surface-muted">
                                    <ArrowsRightLeftIcon className="size-[11px] shrink-0 text-brand-normal" />
                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
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
    );
}
