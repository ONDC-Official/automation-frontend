import { useState } from "react";
import type { ExecutionResult, RecogniseResultV2, StepRunV2 } from "@ondc/automation-mock-runner";

import { InspectorCodePane } from "@pages/protocol-studio/ui/editor/inspector/code-pane";
import type { StudioRun, StudioRunActions } from "@pages/protocol-studio/hooks/use-studio-run";

export interface IRunResultPanelProps {
    run: StudioRun;
    actions: StudioRunActions;
}

type Pane = "payload" | "checks" | "saved" | "logs";

const PANES: { id: Pane; label: string }[] = [
    { id: "payload", label: "Payload" },
    { id: "checks", label: "Checks" },
    { id: "saved", label: "Saved" },
    { id: "logs", label: "Logs" },
];

const json = (value: unknown) => `${JSON.stringify(value ?? null, null, 2)}\n`;

/** A `{valid, code, description}` result as v1's L2 banner shows it. */
const CheckBanner = ({ title, result }: { title: string; result?: ExecutionResult }) => {
    if (!result) {
        return (
            <div className="studio-check" data-tone="muted">
                <span className="studio-mono">{title}</span>
                <span className="studio-text-faint">not run</span>
            </div>
        );
    }
    const value = result.result as
        | { valid?: boolean; code?: number; description?: string }
        | undefined;
    const ok = result.success && value?.valid !== false;
    return (
        <div className="studio-check" data-tone={ok ? "ok" : "error"}>
            <span className="studio-mono">{title}</span>
            <span>
                {result.success
                    ? `${value?.valid === false ? "invalid" : "valid"}${value?.code !== undefined ? ` · ${value.code}` : ""}${value?.description ? ` · ${value.description}` : ""}`
                    : `${result.error?.name ?? "Error"}: ${result.error?.message ?? "failed"}`}
            </span>
            {result.executionTime !== undefined ? (
                <span className="studio-text-faint ml-auto text-[11px]">
                    {result.executionTime} ms
                </span>
            ) : null}
        </div>
    );
};

/**
 * Would this payload have been recognised as this step, had it arrived from
 * a real counterparty? One line per candidate the protocol permitted here.
 */
const RecognitionBanner = ({ nodeId, seen }: { nodeId: string; seen?: RecogniseResultV2 }) => {
    if (!seen) return null;
    const ok = seen.node?.id === nodeId;
    const verdict = ok
        ? `recognised as ${nodeId}`
        : seen.reason === "ambiguous"
          ? `ambiguous: ${seen.matched.map((n) => n.id).join(", ")} all accept it`
          : seen.reason === "none"
            ? "no step accepts it"
            : seen.reason === "end"
              ? "nothing was expected here"
              : `recognised as ${seen.node?.id}`;
    return (
        <>
            <div className="studio-check" data-tone={ok ? "ok" : "error"}>
                <span className="studio-mono">recognise</span>
                <span>{verdict}</span>
                <span className="studio-text-faint ml-auto text-[11px]">
                    {seen.candidates.length}{" "}
                    {seen.candidates.length === 1 ? "candidate" : "candidates"}
                </span>
            </div>
            {seen.checks.length > 1
                ? seen.checks.map((check) => (
                      <div key={check.nodeId} className="studio-check" data-tone="muted">
                          <span className="studio-mono">· {check.nodeId}</span>
                          <span>
                              {!check.apiMatches
                                  ? "other API"
                                  : check.match && !check.match.success
                                    ? `match threw: ${check.match.error?.message ?? "error"}`
                                    : check.accepted
                                      ? check.match
                                          ? "match: true"
                                          : "no match: accepts any payload of its API"
                                      : "match: false"}
                          </span>
                      </div>
                  ))
                : null}
        </>
    );
};

const allLogs = (r: StepRunV2) =>
    (
        [
            ["requirements", r.requirements],
            ["generate", r.generate],
            ["decide", r.decide],
            ["validate", r.validate],
        ] as const
    ).flatMap(([name, result]) => (result?.logs ?? []).map((entry) => ({ name, ...entry })));

/**
 * The Run tab: one step's result — the payload it produced, its checks
 * (`meetsRequirements` / `validate`, with the same banner v1 uses), what it
 * saved into the session, and its console logs and error. A step strip on top
 * switches between the run's steps.
 */
export const RunResultPanel = ({ run, actions }: IRunResultPanelProps) => {
    const [pane, setPane] = useState<Pane>("payload");
    const selected = run.selectedRun;
    const index = selected ? run.runs.indexOf(selected) : -1;

    if (!run.active) {
        return (
            <div className="studio-well flex h-full flex-col">
                <p className="studio-text-faint px-3 py-3 text-[12px]">
                    Start a run from the Flow preview; each step's payload, checks and saved keys
                    show here.
                </p>
            </div>
        );
    }

    return (
        <div className="studio-well flex h-full min-h-0 flex-col">
            <div className="studio-hairline-b flex items-center gap-1 overflow-x-auto px-2 py-1.5">
                {run.runs.map((r, i) => (
                    <button
                        key={`${r.nodeId}-${i}`}
                        type="button"
                        className="studio-key studio-key-xs"
                        data-active={i === index || undefined}
                        onClick={() => actions.selectRun(i)}
                        title={r.ok ? "ran" : (r.error ?? "failed")}
                    >
                        <span className="studio-run-dot" data-status={r.ok ? "done" : "failed"} />
                        {r.nodeId}
                    </button>
                ))}
                {run.runs.length === 0 ? (
                    <span className="studio-text-faint text-[12px]">No step has run yet.</span>
                ) : null}
            </div>
            {selected ? (
                <>
                    <div className="flex items-center gap-2 px-3 py-1.5">
                        <div className="studio-segmented" role="tablist" aria-label="Result">
                            {PANES.map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    role="tab"
                                    className="studio-segment studio-segment-xs"
                                    data-state={pane === p.id ? "active" : undefined}
                                    aria-selected={pane === p.id}
                                    onClick={() => setPane(p.id)}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        <span className="studio-text-faint ml-auto truncate text-[11px]">
                            {selected.event
                                ? `${selected.event.api}${selected.event.messageId ? ` · msg ${selected.event.messageId}` : ""} · ${selected.event.ts}`
                                : (selected.error ?? "")}
                        </span>
                    </div>
                    <div className="min-h-0 flex-1">
                        {pane === "payload" ? (
                            selected.event ? (
                                <InspectorCodePane
                                    path={`studio://run/result/${index}/payload.json`}
                                    language="json"
                                    value={json(selected.event.payload)}
                                    readOnly
                                />
                            ) : (
                                <p className="studio-text-faint px-3 py-3 text-[12px]">
                                    No payload: {selected.error ?? "the step failed"}
                                </p>
                            )
                        ) : pane === "checks" ? (
                            <div className="flex flex-col gap-1.5 p-3">
                                {selected.kind === "decision" ? (
                                    <CheckBanner title="decide" result={selected.decide} />
                                ) : (
                                    <>
                                        <CheckBanner
                                            title="meetsRequirements"
                                            result={selected.requirements}
                                        />
                                        <CheckBanner title="generate" result={selected.generate} />
                                        <CheckBanner title="validate" result={selected.validate} />
                                        <RecognitionBanner
                                            nodeId={selected.nodeId}
                                            seen={run.recognitions[index]}
                                        />
                                    </>
                                )}
                            </div>
                        ) : pane === "saved" ? (
                            <InspectorCodePane
                                path={`studio://run/result/${index}/saved.json`}
                                language="json"
                                value={json(selected.saved)}
                                readOnly
                            />
                        ) : (
                            <div className="studio-run-logs">
                                {(() => {
                                    const logs = allLogs(selected);
                                    const error =
                                        selected.generate?.error ??
                                        selected.decide?.error ??
                                        selected.requirements?.error;
                                    return (
                                        <>
                                            {error ? (
                                                <pre className="studio-run-log" data-type="error">
                                                    {error.name}: {error.message}
                                                    {error.stack ? `\n${error.stack}` : ""}
                                                </pre>
                                            ) : null}
                                            {logs.length === 0 && !error ? (
                                                <p className="studio-text-faint px-3 py-3 text-[12px]">
                                                    No console output.
                                                </p>
                                            ) : null}
                                            {logs.map((entry, i) => (
                                                <pre
                                                    key={i}
                                                    className="studio-run-log"
                                                    data-type={entry.type}
                                                >
                                                    <span className="studio-text-faint">
                                                        [{entry.name}]{" "}
                                                    </span>
                                                    {entry.message}
                                                </pre>
                                            ))}
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </>
            ) : null}
        </div>
    );
};

export default RunResultPanel;
