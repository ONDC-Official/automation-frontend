import { useState } from "react";
import { toast } from "sonner";
import {
    ArrowTopRightOnSquareIcon,
    PlayIcon,
    StopIcon,
    CheckIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@components/Shadcn/Button";
import { Input } from "@components/Shadcn/Input";
import Alert from "@components/Shadcn/Alert";
import Spinner from "@components/Shadcn/Spinner";
import {
    fdRunReportUrl,
    useFinishFdRunMutation,
    usePlayFdRunMutation,
    useStartFdRunMutation,
    useStopFdRunMutation,
} from "@store/api";
import type { FdRun, FdSessionView } from "@pages/fd-session/types";
import { Empty, Mono, ScenarioText, StatusBadge, errorText, time } from "@pages/fd-session/ui";

/**
 * A certification run: a window of the session's messages that the judge then rules on.
 *   issuer        the workbench (as investor app) plays the plan's scenarios and a journey through
 *                 every request the issuer must answer
 *   investor app  the workbench (as issuer) runs the conformance pack and sends every webhook the
 *                 app must receive; the tester then sends the app's own requests to the workbench
 */
export const RunPanel = ({
    view,
    exchangeCount,
    busy,
    setBusy,
}: {
    view: FdSessionView;
    exchangeCount: number;
    busy: boolean;
    setBusy: (b: boolean) => void;
}) => {
    const sessionId = view.session.sessionId;
    const isIssuer = view.session.role === "DEPOSIT_ISSUER";
    const [knownPan, setKnownPan] = useState("");
    const [step, setStep] = useState("");
    const [selected, setSelected] = useState<string | null>(null);
    const [startRun] = useStartFdRunMutation();
    const [playRun] = usePlayFdRunMutation();
    const [finishRun, { isLoading: finishing }] = useFinishFdRunMutation();
    const [stopRun, { isLoading: stopping }] = useStopFdRunMutation();

    const runs = [...view.runs].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    const active = runs.find((r) => r.status === "RUNNING");
    const shown = runs.find((r) => r.runId === selected) ?? active ?? runs[0];

    const start = async () => {
        setBusy(true);
        try {
            setStep("Starting the run…");
            const run = await startRun({ sessionId }).unwrap();
            setSelected(run.runId);
            setStep(
                isIssuer
                    ? "Playing the certification scenarios and the coverage journey against your issuer…"
                    : "Running the investor-app pack and sending your app every webhook it must receive…"
            );
            await playRun({
                sessionId,
                runId: run.runId,
                ...(knownPan.trim() ? { knownPan: knownPan.trim() } : {}),
            }).unwrap();
            toast.success(
                isIssuer
                    ? "Played. Finish the run to judge it."
                    : "The workbench's part is done. Now send your app's requests, then finish."
            );
        } catch (e) {
            toast.error(errorText(e));
        } finally {
            setStep("");
            setBusy(false);
        }
    };

    const finish = async (run: FdRun) => {
        try {
            const done = await finishRun({ sessionId, runId: run.runId }).unwrap();
            toast.success(`Judged: ${done.verdict?.verdict ?? "done"}`);
        } catch (e) {
            toast.error(errorText(e));
        }
    };
    const stop = async (run: FdRun) => {
        try {
            await stopRun({ sessionId, runId: run.runId }).unwrap();
            toast.info("Run stopped, not judged");
        } catch (e) {
            toast.error(errorText(e));
        }
    };

    return (
        <div className="space-y-6">
            {!active && !busy && (
                <div className="space-y-4 rounded-lg border border-n-30 p-4 dark:border-border-default">
                    <div>
                        <h3 className="text-h6 font-semibold text-text-primary">
                            Start a certification run
                        </h3>
                        <p className="mt-1 text-body-2 text-n-300 dark:text-n-60">
                            {isIssuer ? (
                                <>
                                    The workbench plays an investor app against your issuer: every
                                    required scenario in the plan, then a journey through every
                                    request you must answer. It takes a minute or so.
                                </>
                            ) : (
                                <>
                                    The workbench plays an issuer: it runs the investor-app
                                    conformance pack and sends your app every webhook it must
                                    receive. After that, your app sends its own requests to the
                                    workbench's issuer, and you finish the run.
                                </>
                            )}
                        </p>
                    </div>
                    {!view.plan && (
                        <Alert
                            variant="warning"
                            className="py-3"
                            message="No plan"
                            description="This participant has no capability declaration, so a run cannot be planned. Start a new session with one."
                        />
                    )}
                    {isIssuer && (
                        <div className="max-w-sm">
                            <label
                                htmlFor="fd-known-pan"
                                className="text-caption-1 font-semibold uppercase tracking-wide text-n-300"
                            >
                                Known PAN (optional)
                            </label>
                            <Input
                                id="fd-known-pan"
                                value={knownPan}
                                onChange={(e) => setKnownPan(e.target.value)}
                                placeholder="A PAN your issuer already has a customer for"
                                className="mt-1 font-mono"
                            />
                            <p className="mt-1 text-caption-1 text-n-300 dark:text-n-60">
                                Used for the existing-customer scenario and journey.
                            </p>
                        </div>
                    )}
                    <Button onClick={start} disabled={!view.plan}>
                        <PlayIcon /> Start run
                    </Button>
                </div>
            )}

            {busy && (
                <div className="flex items-center gap-3 rounded-lg border border-brand-light-active bg-brand-light p-4 text-brand-normal dark:border-brand-normal/40 dark:bg-brand-normal/15">
                    <Spinner />
                    <div>
                        <p className="font-medium">{step || "Working…"}</p>
                        <p className="text-body-2">
                            {exchangeCount} messages so far. Watch them arrive in Exchanges.
                        </p>
                    </div>
                </div>
            )}

            {active && !busy && (
                <div className="space-y-3 rounded-lg border border-alert-200 bg-alert-50 p-4 text-alert-800 dark:border-alert-800 dark:bg-alert-800/20 dark:text-alert-200">
                    <p className="font-medium">
                        Run <Mono>{active.runId}</Mono> is open since {time(active.startedAt)}.
                    </p>
                    {!isIssuer && view.counterpart && (
                        <div className="space-y-1 text-body-2">
                            <p>
                                Now send your app's requests (quote, application, payment,
                                servicing, grievance…) to the workbench's issuer:
                            </p>
                            <p>
                                <Mono>{view.counterpart.subscriber_url}</Mono> (subscriber id{" "}
                                <Mono>{view.counterpart.subscriber_id}</Mono>)
                            </p>
                            <p>
                                Using the pretend participant? Run{" "}
                                <Mono>npm run participant:drive</Mono> in <Mono>fd/</Mono>.
                            </p>
                        </div>
                    )}
                    <p className="text-body-2">
                        Finish the run when you are done: the judge rules on every message in it.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={() => finish(active)} disabled={finishing}>
                            {finishing ? <Spinner /> : <CheckIcon />} Finish and judge
                        </Button>
                        <Button variant="outline" onClick={() => stop(active)} disabled={stopping}>
                            <StopIcon /> Stop without judging
                        </Button>
                    </div>
                </div>
            )}

            {shown ? (
                <RunResult sessionId={sessionId} run={shown} />
            ) : (
                !busy && <Empty>No runs yet.</Empty>
            )}

            {runs.length > 1 && (
                <div>
                    <h3 className="mb-2 text-h6 font-semibold text-text-primary">
                        All runs in this session
                    </h3>
                    <ul className="divide-y divide-n-30 rounded-lg border border-n-30 dark:divide-border-default dark:border-border-default">
                        {runs.map((r) => (
                            <li key={r.runId}>
                                <button
                                    type="button"
                                    onClick={() => setSelected(r.runId)}
                                    className="flex w-full flex-wrap items-center gap-3 px-3 py-2 text-left text-body-2 hover:bg-n-20 dark:hover:bg-surface-muted"
                                >
                                    <Mono>{r.runId}</Mono>
                                    <StatusBadge value={r.status} />
                                    {r.verdict && <StatusBadge value={r.verdict.verdict} />}
                                    <span className="text-n-300 dark:text-n-60">
                                        {time(r.startedAt)}
                                    </span>
                                    {shown?.runId === r.runId && (
                                        <span className="text-brand-normal">shown above</span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const RunResult = ({ sessionId, run }: { sessionId: string; run: FdRun }) => {
    const scenarios = (run.scenarios ?? []).filter((s) => s.outcome !== "skipped");
    const failedSteps = (run.sweep ?? []).filter((s) => !s.ok);
    return (
        <section className="space-y-4">
            <header className="flex flex-wrap items-center gap-3">
                <h3 className="text-h6 font-semibold text-text-primary">
                    Run <Mono>{run.runId}</Mono>
                </h3>
                <StatusBadge value={run.status} />
                {run.verdict && <StatusBadge value={run.verdict.verdict} className="text-sm" />}
                {run.verdict && (
                    <a
                        href={fdRunReportUrl(sessionId, run.runId)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-body-2 text-brand-normal hover:underline"
                    >
                        Full report <ArrowTopRightOnSquareIcon className="size-4" />
                    </a>
                )}
            </header>

            {run.verdict && (
                <div className="space-y-2">
                    <p className="text-body-2 text-n-300 dark:text-n-60">
                        {run.verdict.counts.exchanges} messages judged ·{" "}
                        {run.verdict.coverage.exercised.length} of{" "}
                        {run.verdict.coverage.required.length} of the role's actions exercised
                    </p>
                    {run.verdict.verdict === "INCOMPLETE" && (
                        <Alert
                            variant="info"
                            className="py-3"
                            message="Nothing failed. Some of the role's actions were not seen in this run."
                            description={`Not seen: ${run.verdict.coverage.required.filter((a) => !run.verdict!.coverage.exercised.includes(a)).join(", ")}. These are usually event-driven messages the workbench cannot cause. A certificate needs only the plan's required items, so this run can still give a VALID one.`}
                        />
                    )}
                    <ul className="grid gap-2 md:grid-cols-2">
                        {run.verdict.checks
                            .filter((c) => c.id !== "coverage")
                            .map((c) => (
                                <li
                                    key={c.id}
                                    className="rounded-lg border border-n-30 p-3 dark:border-border-default"
                                >
                                    <div className="flex items-center gap-2">
                                        <StatusBadge value={c.outcome} />
                                        <span className="font-medium text-text-primary">
                                            {c.title}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-body-2 text-n-300 dark:text-n-60">
                                        {c.summary}
                                    </p>
                                    {c.outcome === "fail" && c.items.length > 0 && (
                                        <ul className="mt-1 list-disc pl-5 text-body-2 text-error-500">
                                            {c.items.slice(0, 5).map((i, n) => (
                                                <li key={n}>
                                                    {i.seq ? `#${i.seq} ` : ""}
                                                    {i.action ? `${i.action}: ` : ""}
                                                    {i.message}
                                                </li>
                                            ))}
                                            {c.items.length > 5 && (
                                                <li>
                                                    … {c.items.length - 5} more in the full report
                                                </li>
                                            )}
                                        </ul>
                                    )}
                                </li>
                            ))}
                    </ul>
                </div>
            )}

            {scenarios.length > 0 && (
                <div>
                    <h4 className="mb-2 font-semibold text-text-primary">
                        Scenarios: {scenarios.filter((s) => s.outcome === "pass").length} of{" "}
                        {scenarios.length} passed
                    </h4>
                    <div className="overflow-x-auto rounded-lg border border-n-30 dark:border-border-default">
                        <table className="w-full text-left text-body-2">
                            <tbody>
                                {scenarios.map((s) => {
                                    const bad = s.steps?.find((x) => !x.ok);
                                    return (
                                        <tr
                                            key={s.number}
                                            className="border-t border-n-30 align-top first:border-t-0 dark:border-border-default"
                                        >
                                            <td className="w-12 px-3 py-2 tabular-nums text-n-300">
                                                {s.number}
                                            </td>
                                            <td className="px-3 py-2">
                                                <ScenarioText text={s.text} />
                                                {bad && (
                                                    <p className="mt-1 text-error-500">
                                                        {bad.name}: {bad.detail}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="w-24 px-3 py-2">
                                                <StatusBadge value={s.outcome} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {run.pack && run.pack.length > 0 && (
                <div>
                    <h4 className="mb-2 font-semibold text-text-primary">Investor-app pack</h4>
                    <ul className="space-y-1 text-body-2">
                        {run.pack.map((p) => (
                            <li key={p.id} className="flex items-start gap-2">
                                <StatusBadge value={p.outcome} />
                                <span>
                                    <Mono>{p.id}</Mono> {p.name}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {run.sweep && run.sweep.length > 0 && (
                <div>
                    <h4 className="mb-2 font-semibold text-text-primary">
                        Coverage journey: {run.sweep.length - failedSteps.length} of{" "}
                        {run.sweep.length} steps as expected
                    </h4>
                    <ul className="grid gap-1 text-body-2 md:grid-cols-2">
                        {run.sweep.map((s, i) => (
                            <li
                                key={i}
                                className={s.ok ? "text-n-300 dark:text-n-60" : "text-error-500"}
                            >
                                {s.ok ? "✓" : "✗"} {s.name}
                                {!s.ok && `: ${s.detail}`}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
};
