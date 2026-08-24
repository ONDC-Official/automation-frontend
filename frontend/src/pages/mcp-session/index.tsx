import { useCallback, useState } from "react";
import { ExclamationTriangleIcon, LinkSlashIcon } from "@heroicons/react/24/outline";
import { InfoPill } from "@components/DomainFlowRunner/InfoPill";
import { CollapsibleSection } from "@components/DomainFlowRunner/CollapsibleSection";
import SearchableJsonView from "@components/DomainFlowRunner/SearchableJsonView";
import { Badge } from "@components/Shadcn/Badge";
import { FlowTabs, TabsContent } from "@components/Shadcn/Tabs";
import type { MappedStep } from "@/types/flow-state-type";
import { MCP_INSPECTOR_MAX_HEIGHT } from "./constants";
import { McpRunCard } from "./McpRunCard";
import { useMcpSessionPage } from "./useMcpSessionPage";
import { expiresIn } from "./utils";

/**
 * A live, read-only view of one session on an `ondc-mcp` engine.
 *
 * Reached only by the link `session_create` hands out, which is why there is no
 * nav entry for it: without an engine to name, the page has nothing to show.
 *
 * **This page is hosted here; the data is not.** Every request goes straight
 * from the reader's browser to their own engine, so no payload passes through
 * this app or anything in front of it. That is also why it can show whole
 * payload bodies where the workbench runner shows what its backend chose to
 * keep — a browser has no context budget to protect.
 *
 * Read-only on purpose. The model driving the run owns the loop; a person
 * pressing "proceed" here would race the lock that keeps a step from going out
 * twice, and the loser puts a duplicate protocol call on a third party's wire.
 */
export default function McpSessionPage() {
    const {
        target,
        session,
        runs,
        isLoading,
        error,
        inspector,
        inspectStep,
        openRunId,
        setOpenRunId,
        revision,
    } = useMcpSessionPage();

    // Sticky across steps, like the workbench's own side panel: someone
    // comparing responses down a flow should not have to re-pick the tab on
    // every step.
    const [payloadTab, setPayloadTab] = useState<"Request" | "Response">("Request");

    const onInspect = useCallback(
        (step: MappedStep) => {
            const ids =
                step.payloads?.entryType === "API"
                    ? step.payloads.payloads.map((p) => p.payloadId)
                    : [];
            void inspectStep(`${step.actionType}${step.label ? ` (${step.label})` : ""}`, ids);
        },
        [inspectStep]
    );

    // Three states, not two: `undefined` means the tab is still being asked
    // whether it remembers this engine, and rendering the incomplete-link
    // message during that moment is what a reload would show.
    if (target === undefined) return <Resolving />;
    if (target === null) return <Unopenable />;

    if (error) {
        return (
            <Centered
                icon={<ExclamationTriangleIcon className="mx-auto mb-4 size-16 text-error-500" />}
                title="Could not reach that engine"
                body={
                    <>
                        The link points at <code className="font-mono">{target.engine}</code>, and
                        this browser could not read it. The engine may have stopped, the token in
                        the link may have been minted by an earlier run of it, or it may not be
                        reachable from this network.
                    </>
                }
            />
        );
    }

    return (
        <div className="mx-auto flex w-full flex-col gap-4 px-5 py-6 sm:px-8 md:px-10 lg:px-15 xl:px-20">
            <header className="rounded-xl border border-n-30 bg-surface-elevated p-4 shadow-xs dark:border-border-default">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h1 className="text-h5 font-bold text-text-primary">Mock session</h1>
                    <Badge variant="secondary">read-only</Badge>
                </div>

                {isLoading || !session ? (
                    <p className="text-caption-1 text-text-secondary">Loading session…</p>
                ) : (
                    <>
                        <div className="flex flex-wrap gap-2">
                            <InfoPill label="Session" value={session.session_id} copyable />
                            <InfoPill
                                label="Under test"
                                value={`${session.np.type} at ${session.np.subscriber_url}`}
                                copyable
                            />
                            <InfoPill label="Mock plays" value={session.mock_role} />
                            <InfoPill
                                label="Build"
                                value={`${session.build.domain} ${session.build.version} / ${session.build.usecase}`}
                            />
                            <InfoPill label="Expires" value={expiresIn(session.expires_at)} />
                        </div>

                        <div className="mt-3">
                            <CollapsibleSection title="Endpoints" defaultOpen={false}>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <Endpoint
                                        label="The participant sends its callbacks to"
                                        value={`${session.callback_url}/{action}`}
                                    />
                                    <Endpoint
                                        label="The mock sends to"
                                        value={`${session.np.subscriber_url}/{action}`}
                                    />
                                </div>
                            </CollapsibleSection>
                        </div>
                    </>
                )}
            </header>

            <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <div className="flex min-w-0 flex-col gap-3">
                    <h2 className="text-caption-1 font-semibold uppercase tracking-wide text-text-secondary">
                        Flows ({runs.length})
                    </h2>

                    {runs.length === 0 && !isLoading ? (
                        <p className="rounded-xl border border-n-30 bg-surface-elevated p-4 text-caption-1 text-text-secondary dark:border-border-default">
                            No flow has been started in this session yet. The page will fill in as
                            the run moves.
                        </p>
                    ) : null}

                    {session
                        ? runs.map((run) => (
                              <McpRunCard
                                  key={run.flow_id}
                                  run={run}
                                  target={target}
                                  npType={session.np.type}
                                  isOpen={openRunId === run.flow_id}
                                  onToggle={() =>
                                      setOpenRunId(openRunId === run.flow_id ? null : run.flow_id)
                                  }
                                  revision={revision}
                                  onInspect={onInspect}
                              />
                          ))
                        : null}
                </div>

                <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
                    <div
                        className="flex flex-col rounded-xl border border-n-30 bg-surface-elevated p-4 shadow-xs dark:border-border-default"
                        style={{ maxHeight: MCP_INSPECTOR_MAX_HEIGHT }}
                    >
                        <h2 className="mb-2 shrink-0 text-caption-1 font-semibold uppercase tracking-wide text-text-secondary">
                            {inspector ? inspector.title : "Payload"}
                        </h2>
                        {inspector === null ? (
                            <p className="text-caption-1 text-text-secondary">
                                Select a completed step to read what crossed the wire.
                            </p>
                        ) : inspector.loading ? (
                            <p className="text-caption-1 text-text-secondary">Loading payload…</p>
                        ) : (
                            /*
                             * Tabs rather than one on top of the other: a
                             * protocol payload is thousands of lines, so
                             * stacking them means the response is always
                             * somewhere below the fold and the panel scrolls
                             * past a whole catalog to reach it.
                             */
                            <FlowTabs
                                options={[
                                    { key: "Request", label: "Request" },
                                    { key: "Response", label: "Response" },
                                ]}
                                value={payloadTab}
                                onValueChange={(value) =>
                                    setPayloadTab(value as "Request" | "Response")
                                }
                                variant="line"
                                className="min-h-0 flex-1"
                            >
                                <TabsContent
                                    value="Request"
                                    className="min-h-0 overflow-auto pt-3 scrollbar-thin"
                                >
                                    <SearchableJsonView value={inspector.request} />
                                </TabsContent>
                                <TabsContent
                                    value="Response"
                                    className="min-h-0 overflow-auto pt-3 scrollbar-thin"
                                >
                                    {inspector.response !== null &&
                                    inspector.response !== undefined ? (
                                        <SearchableJsonView value={inspector.response} />
                                    ) : (
                                        // The tab stays put when there is nothing in it — a
                                        // tab strip that changes shape per step is harder to
                                        // read than an empty tab that says so.
                                        <p className="text-caption-1 text-text-secondary">
                                            No response body was recorded for this step.
                                        </p>
                                    )}
                                </TabsContent>
                            </FlowTabs>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Endpoint({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0">
            <p className="mb-1 text-caption-1 text-text-secondary">{label}</p>
            <p className="truncate rounded-lg border border-n-30 bg-surface-muted px-3 py-2 font-mono text-caption-1 text-text-primary dark:border-border-default">
                {value}
            </p>
        </div>
    );
}

function Resolving() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-surface-page">
            <p className="text-body-2 text-text-secondary">Opening session…</p>
        </div>
    );
}

function Unopenable() {
    return (
        <Centered
            icon={<LinkSlashIcon className="mx-auto mb-4 size-16 text-alert-500" />}
            title="This link is incomplete"
            body={
                <>
                    A session viewer link carries its engine address, session id and token in the
                    part of the URL after <code className="font-mono">#</code>. Some tools strip
                    that when a link is forwarded — ask for the original, exactly as the assistant
                    printed it.
                </>
            }
        />
    );
}

function Centered({
    icon,
    title,
    body,
}: {
    icon: React.ReactNode;
    title: string;
    body: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-surface-page px-6">
            <div className="max-w-lg text-center">
                {icon}
                <h2 className="mb-2 text-h5 font-semibold text-text-primary">{title}</h2>
                <p className="text-body-2 text-text-secondary">{body}</p>
            </div>
        </div>
    );
}
