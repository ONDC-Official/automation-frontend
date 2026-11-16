import { useMemo } from "react";
import { CursorArrowRaysIcon } from "@heroicons/react/24/outline";

import SearchableJsonView from "@components/DomainFlowRunner/SearchableJsonView";
import { SESSION_SIDE_PANEL_MAX_HEIGHT } from "@components/DomainFlowRunner/constants";
import { Badge } from "@components/Shadcn/Badge";
import { FlowTabs, TabsContent } from "@components/Shadcn/Tabs";
import { cn } from "@/lib/utils";
import type { IStudioLiveStatus } from "@store/api";

import type { LiveSelection } from "@pages/protocol-studio/live/live-journey-card";
import type { LiveCall, LiveStep } from "@pages/protocol-studio/live/live-steps";

export type LiveTab = "Request" | "Response" | "Checks" | "Session" | "Log";

const TABS: { key: LiveTab; label: string }[] = [
    { key: "Request", label: "Request" },
    { key: "Response", label: "Response" },
    { key: "Checks", label: "Checks" },
    { key: "Session", label: "Session" },
    { key: "Log", label: "Log" },
];

/** The tabs only Advanced mode shows: the run's internals rather than the selected step. */
export const ADVANCED_TABS: ReadonlySet<LiveTab> = new Set<LiveTab>(["Session", "Log"]);
const BASIC_TABS = TABS.filter((t) => !ADVANCED_TABS.has(t.key));

/** An ACK / NACK chip: solid in light, a tint of its hue in dark (as the step cards). */
const ACK_STYLE = (ack: string) =>
    ack === "ACK"
        ? "bg-success-500 dark:bg-success-500/20 dark:text-success-200"
        : "bg-error-500 dark:bg-error-500/25 dark:text-error-50";

const NOTHING = { info: "Click a step that ran to see its payload" };
const NOT_COMPLETE = { info: "Step not complete" };

/** What the other side answered to one call; the mock's own ACK when the api-service has no record. */
const responseOf = (call: LiveCall): unknown => {
    if (call.exchange) return call.exchange.response;
    if (call.run.event?.direction === "in")
        return { message: { ack: { status: "ACK" } }, note: "the mock's reply" };
    return { info: "No response on record yet" };
};

const checksOf = (call: LiveCall) => {
    const { run } = call;
    const result = (r: typeof run.generate) =>
        r
            ? {
                  success: r.success,
                  ...(r.result !== undefined ? { result: r.result } : {}),
                  ...(r.error ? { error: r.error.message } : {}),
              }
            : undefined;
    return {
        ok: run.ok,
        ...(run.error ? { error: run.error } : {}),
        ...(run.requirements ? { meetsRequirements: result(run.requirements) } : {}),
        ...(run.generate ? { generate: result(run.generate) } : {}),
        ...(run.validate ? { validate: result(run.validate) } : {}),
        ...(run.decide ? { decide: result(run.decide) } : {}),
        ...(run.exit ? { exit: result(run.exit) } : {}),
        saved: run.saved,
    };
};

/** One call's value, or the list when the step ran several times (as v1 shows repeats). */
const oneOrMany = (values: unknown[]) => (values.length === 1 ? values[0] : values);

export interface ILiveSidePanelProps {
    tab: LiveTab;
    onTab: (tab: LiveTab) => void;
    selection: LiveSelection | null;
    /** The selected step, from the open journey's model. */
    step: LiveStep | null;
    /** The open journey's run, as the mock service reports it. */
    status: IStudioLiveStatus | null;
    /** Settings › Advanced mode: also show the Session and Log tabs. */
    advanced: boolean;
}

/**
 * The right-hand inspector of the live page, as v1's flow-testing panel:
 * the selected step's request and the sync response to it, plus its checks;
 * in Advanced mode also the run's session data and the mock's log.
 */
export const LiveSidePanel = ({
    tab,
    onTab,
    selection,
    step,
    status,
    advanced,
}: ILiveSidePanelProps) => {
    // A tab Advanced mode no longer shows falls back to Request.
    const shownTab = !advanced && ADVANCED_TABS.has(tab) ? "Request" : tab;
    const view = useMemo(() => {
        if (selection?.kind === "rejected") {
            const r = status?.rejected[selection.index];
            if (!r) return { request: NOTHING, response: NOTHING, checks: NOTHING };
            return {
                request: r.payload,
                response: {
                    message: { ack: { status: "NACK" } },
                    note: "The mock did not take this payload",
                },
                checks: { reason: r.reason, messageId: r.messageId, at: r.ts },
            };
        }
        if (!step) return { request: NOTHING, response: NOTHING, checks: NOTHING };
        if (!step.calls.length)
            return { request: NOT_COMPLETE, response: NOT_COMPLETE, checks: NOT_COMPLETE };
        return {
            request: oneOrMany(step.calls.map((c) => c.run.event?.payload ?? null)),
            response: oneOrMany(step.calls.map(responseOf)),
            checks: oneOrMany(step.calls.map(checksOf)),
        };
    }, [selection, step, status]);

    const last = step?.calls[step.calls.length - 1];
    const ack = last?.exchange?.ack ?? (last?.run.event?.direction === "in" ? "ACK" : null);

    return (
        <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
            {step || selection?.kind === "rejected" ? (
                <div className="mb-2 flex min-w-0 flex-wrap items-center gap-1.5 text-body-2 text-text-secondary">
                    <span className="font-semibold text-text-primary">
                        {selection?.kind === "rejected"
                            ? (status?.rejected[selection.index]?.action ?? "payload")
                            : step?.api}
                    </span>
                    {step?.label ? <span>({step.label})</span> : null}
                    {last?.run.event ? (
                        <>
                            <span className="truncate font-mono text-caption-1">
                                msg {last.run.event.messageId}
                            </span>
                            <span className="text-caption-1">
                                {new Date(last.run.event.ts).toLocaleTimeString()}
                            </span>
                        </>
                    ) : null}
                    {ack ? (
                        <Badge variant="status" className={ACK_STYLE(ack)}>
                            {ack}
                        </Badge>
                    ) : null}
                    {step && step.calls.length > 1 ? (
                        <span className="text-caption-1">{step.calls.length} calls</span>
                    ) : null}
                </div>
            ) : null}
            <FlowTabs
                options={advanced ? TABS : BASIC_TABS}
                value={shownTab}
                onValueChange={(value) => onTab(value as LiveTab)}
            >
                <Pane value="Request" data={view.request} />
                <Pane value="Response" data={view.response} />
                <Pane value="Checks" data={view.checks} />
                {advanced ? (
                    <>
                        <Pane
                            value="Session"
                            data={
                                status
                                    ? status.sessionData
                                    : { info: "Start the journey to see its session data" }
                            }
                        />
                        <TabsContent value="Log" className="pt-3 pb-4">
                            <LiveLog status={status} />
                        </TabsContent>
                    </>
                ) : null}
            </FlowTabs>
        </div>
    );
};

const Pane = ({ value, data }: { value: LiveTab; data: unknown }) => (
    <TabsContent value={value} className="pt-3 pb-4">
        {data === NOTHING ? (
            <EmptyHint />
        ) : (
            <div className="overflow-auto" style={{ maxHeight: SESSION_SIDE_PANEL_MAX_HEIGHT }}>
                <SearchableJsonView value={(data ?? {}) as object} />
            </div>
        )}
    </TabsContent>
);

const EmptyHint = () => (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-n-30 bg-surface-elevated px-6 py-12 text-center dark:border-border-default">
        <CursorArrowRaysIcon className="size-7 text-text-secondary" aria-hidden="true" />
        <p className="text-body-2 font-semibold text-text-primary">No step selected</p>
        <p className="max-w-xs text-body-2 text-text-secondary">
            Select a step on the left to see its request, the response to it and the checks it ran.
        </p>
    </div>
);

const LEVEL = {
    info: "text-text-secondary",
    success: "text-success-500",
    warn: "text-alert-500",
    error: "text-error-500",
} as const;

/** The mock's log of the run and the sync responses it recorded. */
const LiveLog = ({ status }: { status: IStudioLiveStatus | null }) => {
    if (!status)
        return (
            <p className="py-6 text-center text-body-2 text-text-secondary">
                Start the journey to see what the mock does.
            </p>
        );
    const acks = Object.entries(status.acks);
    return (
        <div
            className="flex flex-col gap-3 overflow-auto rounded-xl border border-n-30 bg-surface-elevated p-3 text-body-2 dark:border-border-default"
            style={{ maxHeight: SESSION_SIDE_PANEL_MAX_HEIGHT }}
        >
            {acks.length ? (
                <div className="flex flex-col gap-1">
                    <p className="text-caption-1 font-semibold uppercase tracking-wide text-text-secondary">
                        Sync responses
                    </p>
                    {acks.map(([key, ack]) => {
                        const [action, messageId] = key.split("::");
                        return (
                            <div key={key} className="flex min-w-0 items-center gap-2">
                                <span className="font-mono">{action}</span>
                                <Badge variant="status" className={ACK_STYLE(ack)}>
                                    {ack}
                                </Badge>
                                <span className="ml-auto truncate font-mono text-caption-1 text-text-secondary">
                                    msg {messageId}
                                </span>
                            </div>
                        );
                    })}
                </div>
            ) : null}
            <div className="flex flex-col gap-0.5">
                <p className="text-caption-1 font-semibold uppercase tracking-wide text-text-secondary">
                    Mock log
                </p>
                {status.logs.length ? (
                    status.logs.map((l, i) => (
                        <div key={`${l.ts}-${i}`} className={cn("flex gap-2", LEVEL[l.level])}>
                            <span className="shrink-0 font-mono text-caption-1 text-text-secondary">
                                {new Date(l.ts).toLocaleTimeString()}
                            </span>
                            <span className="min-w-0 wrap-break-word">{l.message}</span>
                        </div>
                    ))
                ) : (
                    <span className="text-text-secondary">Nothing logged yet.</span>
                )}
            </div>
        </div>
    );
};
