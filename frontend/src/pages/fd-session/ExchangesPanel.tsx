import type { FdExchange } from "@pages/fd-session/types";
import { Empty, Mono, pretty } from "@pages/fd-session/ui";
import { cn } from "@/lib/utils";

/**
 * Every message between the participant and the workbench in this session, newest first, with
 * what the workbench found wrong in it. Personal data is masked by the workbench before it
 * leaves (identifiers, contact details, dates of birth, addresses, account numbers, names).
 */
export const ExchangesPanel = ({
    exchanges,
    isLoading,
}: {
    exchanges: FdExchange[] | undefined;
    isLoading: boolean;
}) => {
    if (isLoading && !exchanges) return <Empty>Loading the exchanges…</Empty>;
    if (!exchanges?.length)
        return <Empty>No messages yet. Start a run, or send a request from your app.</Empty>;
    const rows = [...exchanges].reverse();
    return (
        <div className="space-y-2">
            <p className="text-body-2 text-n-300 dark:text-n-60">
                {exchanges.length} messages, newest first. Personal data in the bodies is masked.
            </p>
            {rows.map((e) => {
                const errors = e.findings.filter((f) => f.severity === "error");
                return (
                    <details
                        key={e.seq}
                        className={cn(
                            "group rounded-lg border bg-white dark:bg-surface-elevated",
                            errors.length
                                ? "border-error-200 dark:border-error-800"
                                : "border-n-30 dark:border-border-default"
                        )}
                    >
                        <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-body-2">
                            <span className="w-12 font-semibold tabular-nums">#{e.seq}</span>
                            <span className="tabular-nums text-n-300 dark:text-n-60">
                                {new Date(e.at).toLocaleTimeString()}
                            </span>
                            <span className="text-n-300 dark:text-n-60">
                                {e.direction === "in" ? "← from your app" : "→ to your app"}
                            </span>
                            <Mono>{e.action ?? e.method}</Mono>
                            <span
                                className={cn(
                                    "tabular-nums",
                                    (e.status ?? 0) >= 400
                                        ? "text-error-500"
                                        : "text-n-300 dark:text-n-60"
                                )}
                            >
                                HTTP {e.status ?? "—"}
                            </span>
                            <span className="tabular-nums text-n-300 dark:text-n-60">
                                {e.durationMs} ms
                            </span>
                            {e.fault && (
                                <span className="text-brand-normal">
                                    deliberate fault: {e.fault}
                                </span>
                            )}
                            {errors.length > 0 && (
                                <span className="font-semibold text-error-500">
                                    {errors.length} error{errors.length > 1 ? "s" : ""}
                                </span>
                            )}
                        </summary>
                        <div className="space-y-3 border-t border-n-30 px-3 py-3 dark:border-border-default">
                            <p className="break-all font-mono text-xs text-n-300 dark:text-n-60">
                                {e.method} {e.url}
                            </p>
                            {e.findings.length > 0 && (
                                <ul className="space-y-1 text-body-2">
                                    {e.findings.map((f, i) => (
                                        <li
                                            key={i}
                                            className={
                                                f.severity === "error"
                                                    ? "text-error-500"
                                                    : "text-n-300 dark:text-n-60"
                                            }
                                        >
                                            {f.severity} · <Mono>{f.code}</Mono> · {f.message}
                                            {f.fieldPath ? (
                                                <>
                                                    {" "}
                                                    · <Mono>{f.fieldPath}</Mono>
                                                </>
                                            ) : null}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {e.requestBody && (
                                <div>
                                    <h4 className="mb-1 text-caption-1 font-semibold uppercase tracking-wide text-n-300">
                                        Request
                                    </h4>
                                    <pre className="max-h-96 overflow-auto rounded-md bg-n-20 p-3 text-xs dark:bg-surface-muted">
                                        {pretty(e.requestBody)}
                                    </pre>
                                </div>
                            )}
                            {e.responseBody && (
                                <div>
                                    <h4 className="mb-1 text-caption-1 font-semibold uppercase tracking-wide text-n-300">
                                        Answer
                                    </h4>
                                    <pre className="max-h-96 overflow-auto rounded-md bg-n-20 p-3 text-xs dark:bg-surface-muted">
                                        {pretty(e.responseBody)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </details>
                );
            })}
        </div>
    );
};
