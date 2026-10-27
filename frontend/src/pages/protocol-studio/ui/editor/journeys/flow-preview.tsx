import {
    ArrowPathIcon,
    ClipboardDocumentIcon,
    ExclamationTriangleIcon,
    FlagIcon,
    ForwardIcon,
    PlayIcon,
    StopIcon,
} from "@heroicons/react/24/outline";

import type { StudioRun, StudioRunActions } from "@pages/protocol-studio/hooks/use-studio-run";
import type { WalkResult } from "@pages/protocol-studio/ui/editor/journeys/derive";
import type { RunStatus, StudioJourney } from "@pages/protocol-studio/ui/editor/types";

export interface IFlowPreviewProps {
    journey: StudioJourney | null;
    walk: WalkResult | null;
    openMode: boolean;
    run: StudioRun;
    actions: StudioRunActions;
    /** Opens the Run tab on a step's result. */
    onShowRun: () => void;
}

const shortId = (id: string) => (id.length > 13 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id);

/** One planned (preset) or realised (run) step. */
interface Row {
    key: string;
    nodeId: string;
    api: string;
    owner: string;
    note: string;
    status: RunStatus | undefined;
    /** Index into `run.runs`, when this row has a result. */
    runIndex: number | null;
    extra?: boolean;
}

/**
 * The journey as the linear flow it compiles to — one row per node on the
 * path — and, once a run starts, how far the run got: a status dot per row,
 * the one transaction_id of the run, and Run next / Run all / Reset. In open
 * mode the rows are the steps realised so far, and a fork card asks which
 * alternative to take. Clicking a row with a result opens it in the Run tab;
 * "▶ to here" runs up to a row.
 */
export const FlowPreview = ({
    journey,
    walk,
    openMode,
    run,
    actions,
    onShowRun,
}: IFlowPreviewProps) => {
    const planned = walk?.steps.filter((step) => step.type === "node") ?? [];
    const canStart = !run.blocked && (openMode || (journey !== null && !walk?.pending));
    const startTitle = run.blocked
        ? run.blocked
        : !openMode && walk?.pending
          ? "The journey stops at an open fork: resolve it first"
          : !openMode && !journey
            ? "Pick or create a journey"
            : "Start a run with one transaction_id";

    // Rows: the realised steps (with results), then the planned remainder.
    // A node that ran before (a repeat, a loop) is numbered by its run.
    const runCount = new Map<string, number>();
    const realised: Row[] = run.runs.map((r, index) => {
        const nth = (runCount.get(r.nodeId) ?? 0) + (r.ok && !r.event?.extra ? 1 : 0);
        runCount.set(r.nodeId, nth);
        const exit =
            r.event?.exitMet === false
                ? " · exit not met, runs again"
                : r.event?.exitMet
                  ? " · exit met"
                  : "";
        return {
            key: `run-${index}`,
            nodeId: r.nodeId,
            api: `${r.event?.api ?? r.kind}${nth > 1 ? ` #${nth}` : ""}`,
            owner: "",
            note: r.skipped
                ? "skipped · optional"
                : run.deviation?.nodeId === r.nodeId
                  ? `decided ${r.event?.case ?? ""} · journey expected ${run.deviation.expected}`
                  : r.ok
                    ? r.kind === "decision"
                        ? `case ${r.event?.case ?? ""}`
                        : `${r.event?.messageId ? `msg ${shortId(r.event.messageId)}` : ""}${exit}`
                    : (r.error ?? "failed"),
            status: r.skipped
                ? "skipped"
                : run.deviation?.nodeId === r.nodeId
                  ? "failed"
                  : r.ok
                    ? "done"
                    : "failed",
            runIndex: index,
            extra: r.event?.extra,
        };
    });
    // How far along the plan the run is: each main-path run advances to its node's next
    // place on the plan; running the same node again (a repeat) stays put.
    let progress = 0;
    for (const r of run.runs) {
        if (!r.ok || r.event?.extra) continue;
        const ahead = planned.findIndex(
            (step, i) => i >= progress && step.type === "node" && step.node.id === r.nodeId
        );
        if (ahead >= 0) progress = ahead + 1;
    }
    const plannedRows: Row[] = [];
    planned.forEach((step, index) => {
        if (step.type !== "node") return;
        const { node, via, skipped, repeats } = step;
        if (run.active && index < progress) return;
        const how = via?.label
            ? `via “${via.label}”`
            : via?.case
              ? `case ${via.case}`
              : node.responseFor
                ? `answers ${node.responseFor}`
                : "";
        plannedRows.push({
            key: `plan-${index}-${node.id}`,
            nodeId: node.id,
            api: node.api,
            owner: node.owner,
            note: [
                skipped ? "skipped · optional" : node.optional ? "optional" : "",
                repeats ? "↻ until exit()" : "",
                how,
            ]
                .filter(Boolean)
                .join(" · "),
            status: run.active ? (run.status[node.id] ?? "idle") : undefined,
            runIndex: null,
        });
    });
    const upcoming = plannedRows;
    const rows = run.active ? [...realised, ...upcoming] : upcoming;

    const fork = run.pending?.kind === "fork" ? run.pending.fork : null;
    const ended = run.active && (run.finished || (run.next?.end === true && !run.pending));
    const deviation = run.deviation;
    const failure = run.failure;
    const halted = run.busy || !!run.pending || ended || run.stale || !!deviation || !!failure;
    // At an End node the tester may stop here, though wires lead on.
    const finishable = run.active && !halted && run.next?.canEnd === true;
    // The step Next would run, when it may be passed over instead.
    const skippable = run.active && !halted && run.next?.auto?.optional ? run.next.auto : null;

    return (
        <div className="studio-well flex h-full flex-col">
            <div className="studio-hairline-b flex items-center gap-2 px-3 py-1.5">
                <span className="studio-eyebrow">{run.active ? "Run" : "Flow preview"}</span>
                <span className="studio-text-faint text-[11px]">
                    {run.active
                        ? `${run.runs.length} ${run.runs.length === 1 ? "step" : "steps"} run${
                              deviation
                                  ? " · stopped: journey unreachable"
                                  : failure
                                    ? " · stopped: exit condition never met"
                                    : run.finished
                                      ? " · finished at an End node"
                                      : ended
                                        ? " · end of protocol"
                                        : run.pending
                                          ? " · waiting for you"
                                          : ""
                          }`
                        : openMode
                          ? "interactive: the path is decided as it runs"
                          : journey
                            ? `${planned.length} ${planned.length === 1 ? "step" : "steps"}${walk?.pending ? " · stops at an open fork" : ""}`
                            : "no journey selected"}
                </span>
                {run.stale ? (
                    <span
                        className="studio-badge"
                        data-tone="warn"
                        title="Code or graph changed since the run started"
                    >
                        stale
                    </span>
                ) : null}
                <div className="ml-auto flex items-center gap-1">
                    {run.session ? (
                        <span
                            className="studio-chip"
                            title={`transaction_id of this run: ${run.session.transactionId}`}
                        >
                            <span className="studio-chip-label">tx</span>
                            <span className="studio-chip-value studio-mono">
                                {shortId(run.session.transactionId)}
                            </span>
                            <button
                                type="button"
                                className="studio-chip-action"
                                aria-label="Copy transaction_id"
                                title="Copy"
                                onClick={() =>
                                    void navigator.clipboard?.writeText(run.session!.transactionId)
                                }
                            >
                                <ClipboardDocumentIcon />
                            </button>
                        </span>
                    ) : null}
                    {run.active ? (
                        <>
                            <button
                                type="button"
                                className="studio-key studio-key-xs"
                                disabled={halted}
                                title="Run the next step"
                                onClick={() => void actions.runNext()}
                            >
                                <PlayIcon />
                                Next
                            </button>
                            {skippable ? (
                                <button
                                    type="button"
                                    className="studio-key studio-key-xs"
                                    title={`${skippable.id} is optional: pass over it without running it`}
                                    onClick={() => void actions.skip()}
                                >
                                    <ForwardIcon />
                                    Skip
                                </button>
                            ) : null}
                            {finishable ? (
                                <button
                                    type="button"
                                    className="studio-key studio-key-xs"
                                    title={`${run.runs.filter((r) => !r.event?.extra).at(-1)?.nodeId ?? "This step"} is an End node: finish the run here`}
                                    onClick={actions.finish}
                                >
                                    <FlagIcon />
                                    Finish
                                </button>
                            ) : null}
                            <button
                                type="button"
                                className="studio-key studio-key-xs"
                                disabled={halted}
                                title="Run until the end, or until something needs you"
                                onClick={() => void actions.runAll()}
                            >
                                <ForwardIcon />
                                All
                            </button>
                            <button
                                type="button"
                                className="studio-key studio-key-xs"
                                disabled={run.busy}
                                title="Drop this run (same transaction_id)"
                                onClick={actions.reset}
                            >
                                <StopIcon />
                                Reset
                            </button>
                            <button
                                type="button"
                                className="studio-key studio-key-xs studio-key-icon"
                                disabled={run.busy}
                                title="Reset with a new transaction_id"
                                aria-label="New transaction"
                                onClick={actions.newTransaction}
                            >
                                <ArrowPathIcon />
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            className="studio-key studio-key-xs"
                            disabled={!canStart}
                            title={startTitle}
                            onClick={() => actions.start(openMode ? null : journey)}
                        >
                            <PlayIcon />
                            Run
                        </button>
                    )}
                </div>
            </div>

            {!run.active && openMode ? (
                <p className="studio-text-faint px-3 py-3 text-[12px]">
                    No fixed step list: the mock follows the protocol and asks you at each fork.
                    Press Run.
                </p>
            ) : rows.length === 0 && !fork ? (
                <p className="studio-text-faint px-3 py-3 text-[12px]">
                    {run.active
                        ? "Press Next to run the first step."
                        : "Pick or create a journey to see the steps it compiles to."}
                </p>
            ) : (
                <ol className="studio-flow-rows min-h-0 flex-1 overflow-auto">
                    {rows.map((row, index) => (
                        <li
                            key={row.key}
                            className="studio-flow-row"
                            data-status={row.status}
                            data-extra={row.extra || undefined}
                            data-clickable={row.runIndex !== null || undefined}
                            onClick={() => {
                                if (row.runIndex === null) return;
                                actions.selectRun(row.runIndex);
                                onShowRun();
                            }}
                        >
                            <span className="studio-flow-index">{row.extra ? "+" : index + 1}</span>
                            {row.status ? (
                                <span
                                    className="studio-run-dot"
                                    data-status={row.status}
                                    aria-label={row.status}
                                />
                            ) : null}
                            <span className="studio-mono studio-flow-api">{row.api}</span>
                            {row.owner ? (
                                <span className="studio-owner" data-owner={row.owner}>
                                    {row.owner}
                                </span>
                            ) : null}
                            <span className="studio-mono studio-text-dim truncate">
                                {row.nodeId}
                            </span>
                            <span className="studio-text-faint ml-auto truncate text-[11px]">
                                {row.note}
                            </span>
                            {run.active && row.runIndex === null && !halted ? (
                                <button
                                    type="button"
                                    className="studio-key studio-key-xs studio-flow-runto"
                                    disabled={run.busy}
                                    title={`Run up to ${row.nodeId}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        void actions.runTo(row.nodeId);
                                    }}
                                >
                                    ▶ to here
                                </button>
                            ) : null}
                        </li>
                    ))}
                    {deviation ? (
                        <li className="studio-flow-fork studio-flow-deviation" role="alert">
                            <p className="studio-eyebrow">
                                <ExclamationTriangleIcon />
                                Journey unreachable
                            </p>
                            <p className="text-[12px]">
                                <span className="studio-mono">{deviation.nodeId}</span> decided{" "}
                                <span className="studio-mono">{deviation.actual}</span> from the
                                session data, but this journey expects{" "}
                                <span className="studio-mono">{deviation.expected}</span>. The
                                protocol decides at a decision; a journey only says which way it
                                expects the data to go, and here the data went the other way.
                            </p>
                            <p className="studio-text-dim text-[12px]">
                                Fix the authoring: make the earlier steps produce data that drives{" "}
                                <span className="studio-mono">{deviation.nodeId}</span> to{" "}
                                <span className="studio-mono">{deviation.expected}</span>, change
                                its <span className="studio-mono">decide</span>, or — if this is
                                really the tester's choice, not the protocol's — replace the
                                decision with alternatives.
                            </p>
                        </li>
                    ) : null}
                    {failure ? (
                        <li className="studio-flow-fork studio-flow-deviation" role="alert">
                            <p className="studio-eyebrow">
                                <ExclamationTriangleIcon />
                                Exit condition never met
                            </p>
                            <p className="text-[12px]">{failure.reason}.</p>
                            <p className="studio-text-dim text-[12px]">
                                <span className="studio-mono">{failure.nodeId}</span> repeats until
                                its <span className="studio-mono">exit</span> returns true, at most{" "}
                                <span className="studio-mono">repeat.max</span> times. Make its{" "}
                                <span className="studio-mono">generate</span> reach the final state,
                                fix <span className="studio-mono">exit</span>, or raise the limit.
                            </p>
                        </li>
                    ) : null}
                    {fork ? (
                        <li className="studio-flow-fork">
                            <p className="studio-eyebrow">
                                After <span className="studio-mono">{fork.nodeId}</span> the
                                protocol permits:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {fork.options.map((option) => (
                                    <button
                                        key={option.edge.id}
                                        type="button"
                                        className="studio-key studio-key-sm"
                                        disabled={run.busy}
                                        onClick={() =>
                                            void actions.choose(fork.key, option.target.id)
                                        }
                                        title={`Run ${option.target.id}`}
                                    >
                                        <PlayIcon />
                                        {option.edge.label || option.target.id}
                                        {option.edge.label ? (
                                            <span className="studio-mono studio-text-faint">
                                                {option.target.id}
                                            </span>
                                        ) : null}
                                    </button>
                                ))}
                            </div>
                        </li>
                    ) : null}
                    {run.active && run.next?.onDemand.length ? (
                        <li className="studio-flow-row studio-flow-extra">
                            <span className="studio-flow-index">+</span>
                            <span className="studio-text-dim text-[12px]">on demand:</span>
                            {run.next.onDemand.map((node) => (
                                <button
                                    key={node.id}
                                    type="button"
                                    className="studio-key studio-key-xs"
                                    disabled={run.busy || !!run.pending || run.stale}
                                    title={`Send ${node.id} now, without moving the main path`}
                                    onClick={() => void actions.trigger(node.id)}
                                >
                                    <PlayIcon />
                                    {node.id}
                                </button>
                            ))}
                        </li>
                    ) : !run.active && walk?.onDemand.length ? (
                        <li className="studio-flow-row studio-flow-extra">
                            <span className="studio-flow-index">+</span>
                            <span className="studio-text-dim text-[12px]">
                                on demand: {walk.onDemand.map((n) => n.id).join(", ")}
                            </span>
                        </li>
                    ) : null}
                </ol>
            )}
        </div>
    );
};

export default FlowPreview;
