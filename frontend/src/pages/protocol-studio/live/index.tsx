import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
    Cog6ToothIcon,
    ExclamationTriangleIcon,
    LinkIcon,
    PencilSquareIcon,
} from "@heroicons/react/24/outline";
import type { GraphNodeV2, ProtocolGraphV2 } from "@ondc/automation-mock-runner";

import "@pages/protocol-studio/live/studio-live.css";
import CircularProgress from "@components/DomainFlowRunner/CircularProgress";
import { CollapsibleSection } from "@components/DomainFlowRunner/CollapsibleSection";
import { EndpointsSection } from "@components/DomainFlowRunner/EndpointsSection";
import { FlowSettingsModal } from "@components/DomainFlowRunner/FlowSettingsModal";
import { InfoSection } from "@components/DomainFlowRunner/InfoSection";
import type { DifficultyCache } from "@components/DomainFlowRunner/types";
import { Button } from "@components/Shadcn/Button";
import { SwitchField } from "@components/Shadcn/Switch";
import { ROUTES } from "@constants/routes";
import Spinner from "@components/Shadcn/Spinner";
import { GetRequestEndpoint } from "@components/DomainFlowRunner/utils/get-request-endpoint";
import {
    useGetSessionByIdQuery,
    useGetStudioLiveStatusQuery,
    useGetStudioSessionQuery,
    type IStudioLiveStatus,
} from "@store/api";
import { useLiveRun, type LiveStart } from "@pages/protocol-studio/live/use-live-run";
import LiveErrorBoundary from "@pages/protocol-studio/live/live-error-boundary";
import { LiveJourneySummary } from "@pages/protocol-studio/live/live-next-up";
import { useLiveSettings } from "@pages/protocol-studio/live/use-live-settings";
import type { StudioLiveConfig } from "@pages/protocol-studio/live/live-session";
import {
    LiveJourneyCard,
    type ILiveJourneyCardProps,
    type LiveSelection,
} from "@pages/protocol-studio/live/live-journey-card";
import { LiveSidePanel, type LiveTab } from "@pages/protocol-studio/live/live-side-panel";
import {
    buildLiveModel,
    filterJourneys,
    getGroupNames,
    getJourneyState,
    getNextUp,
    type LiveJourneyState,
    type LiveModel,
    type LiveStep,
} from "@pages/protocol-studio/live/live-steps";
import { flattenGraph } from "@pages/protocol-studio/ui/editor/graph/flatten";
import { walkJourney, type WalkResult } from "@pages/protocol-studio/ui/editor/journeys/derive";
import { RunDialog } from "@pages/protocol-studio/ui/editor/journeys/run-dialog";
import type { NodeOwner, StudioJourney } from "@pages/protocol-studio/ui/editor/types";

/** How often the session (journey → transaction map) is read back. */
const SESSION_POLL_MS = 5000;

const INFO_LABELS: Record<string, string> = {
    sessionId: "Session ID",
    subscriberUrl: "Subscriber URL",
    role: "You are",
    mock: "Mock plays",
    domain: "Domain",
    version: "Version",
    journeys: "Journeys",
};

/** The session's fields this page reads. */
interface ILiveSessionData {
    flowMap?: Record<string, string | null>;
    sessionDifficulty?: Partial<DifficultyCache>;
}

const PageShell = ({
    children,
    sessionId,
    role,
}: {
    children: React.ReactNode;
    /** e2e hooks: which session and side this page is. */
    sessionId?: string;
    role?: string;
}) => (
    <div
        className="studio-live-page mx-auto flex min-h-screen w-full flex-1 flex-col bg-surface-page px-5 sm:px-8 md:px-10 lg:px-15 xl:px-20"
        data-session-id={sessionId}
        data-role={role}
    >
        {children}
    </div>
);

const Problem = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <PageShell>
        <div className="mx-auto mt-16 max-w-md rounded-xl border border-n-30 bg-surface-elevated p-6 shadow-xs dark:border-border-default">
            <p className="flex items-center gap-2 text-body-1 font-semibold text-text-primary">
                <ExclamationTriangleIcon className="size-5 text-alert-500" /> {title}
            </p>
            <p className="mt-2 text-body-2 text-text-secondary">{children}</p>
        </div>
    </PageShell>
);

/**
 * `/studio/live?sessionId&subscriberUrl&role` — a live session of a Studio
 * graph against a real network participant, opened in a new tab by
 * "Start live session". Laid out like v1's flow-testing page: session info
 * and endpoints, each picked journey as a flow card of step cards, and the
 * selected step's request and response on the right. The mock service plays
 * the other side on the same graph engine as the simulation.
 */
const StudioLivePage = () => {
    const [params] = useSearchParams();
    const sessionId = params.get("sessionId") ?? "";
    const subscriberUrl = params.get("subscriberUrl") ?? "";
    const role: NodeOwner = params.get("role") === "BPP" ? "BPP" : "BAP";

    const {
        data: docData,
        isLoading,
        isError,
    } = useGetStudioSessionQuery({ sessionId }, { skip: !sessionId });
    const { data: sessionData } = useGetSessionByIdQuery(
        { sessionId },
        { skip: !sessionId, pollingInterval: SESSION_POLL_MS }
    );
    const doc = docData as StudioLiveConfig | undefined;
    const session = sessionData as ILiveSessionData | undefined;

    if (!sessionId || !subscriberUrl)
        return (
            <Problem title="Invalid live session">
                The link needs a sessionId and a subscriberUrl. Start a live session from Studio.
            </Problem>
        );
    if (isLoading)
        return (
            <PageShell>
                <div className="flex flex-1 items-center justify-center py-24">
                    <Spinner className="size-8 text-brand-normal" />
                </div>
            </PageShell>
        );
    if (isError || !doc?.view)
        return (
            <Problem title="Live session not found">
                Session <span className="font-mono">{sessionId}</span> has no Studio graph. It may
                have expired (sessions last four days); start a new one from Studio.
            </Problem>
        );
    return (
        <LiveErrorBoundary>
            <LiveSession
                doc={doc}
                sessionId={sessionId}
                subscriberUrl={subscriberUrl}
                role={role}
                flowMap={session?.flowMap ?? NO_FLOWS}
                sessionDifficulty={session?.sessionDifficulty}
            />
        </LiveErrorBoundary>
    );
};

const NO_FLOWS: Record<string, string | null> = {};

const LiveSession = ({
    doc,
    sessionId,
    subscriberUrl,
    role,
    flowMap,
    sessionDifficulty,
}: {
    doc: StudioLiveConfig;
    sessionId: string;
    subscriberUrl: string;
    role: NodeOwner;
    flowMap: Record<string, string | null>;
    sessionDifficulty: Partial<DifficultyCache> | undefined;
}) => {
    const { root, journeys } = doc.view;
    const { domain, version } = doc.meta;
    const graph = doc.graph as ProtocolGraphV2;
    const flat = useMemo(() => flattenGraph(root), [root]);
    const graphNodes = useMemo(
        () => new Map<string, GraphNodeV2>(graph.nodes.map((n) => [n.id, n])),
        [graph]
    );
    const groupNames = useMemo(() => getGroupNames(root), [root]);
    const walks = useMemo(
        () => new Map(journeys.map((j) => [j.id, walkJourney(flat, j)])),
        [journeys, flat]
    );

    const [openId, setOpenId] = useState<string | null>(journeys[0]?.id ?? null);
    const [selection, setSelection] = useState<LiveSelection | null>(null);
    const [tab, setTab] = useState<LiveTab>("Request");
    const [dialogHost, setDialogHost] = useState<HTMLDivElement | null>(null);
    // Journeys started from this page, before the session shows their transaction. A
    // journey the participant opens has none yet: it is listening, and the transaction
    // is the participant's, read from flowMap once the api-service maps their request.
    // The flowMap entry seen at start is the previous run's, so it is not taken.
    const [started, setStarted] = useState<
        Record<string, { transactionId: string } | { awaiting: string; stale: string | null }>
    >({});
    const onStarted = useCallback(
        (id: string, how: LiveStart) =>
            setStarted((prev) => ({
                ...prev,
                [id]:
                    "transactionId" in how
                        ? how
                        : { awaiting: how.awaiting, stale: flowMap[id] ?? null },
            })),
        [flowMap]
    );
    const txOf = (id: string): string | null => {
        const how = started[id];
        if (!how) return flowMap[id] ?? null;
        if ("transactionId" in how) return how.transactionId;
        const mapped = flowMap[id] ?? null;
        return mapped && mapped !== how.stale ? mapped : null;
    };
    /** The request the participant must send to open the journey, while none has arrived. */
    const awaitingOf = (id: string): string | null => {
        const how = started[id];
        return how && "awaiting" in how && !txOf(id) ? how.awaiting : null;
    };

    const journey: StudioJourney | null = journeys.find((j) => j.id === openId) ?? null;
    const transactionId = journey ? txOf(journey.id) : null;
    // Settings come first: the run sends step-through with every start and proceed. A
    // changed step-through goes to the open run at once, through the run hook below.
    const applyStepThroughRef = useRef<(value: boolean) => void>(() => undefined);
    const settings = useLiveSettings(sessionId, sessionDifficulty, (value) =>
        applyStepThroughRef.current(value)
    );
    const { run, actions, live, reopenPending, problems, inputsSent, runStep, applyStepThrough } =
        useLiveRun({
            sessionId,
            journey,
            transactionId,
            graph,
            onStarted,
            stepThrough: settings.stepThrough,
        });
    applyStepThroughRef.current = transactionId ? applyStepThrough : () => undefined;

    const openWalk = journey ? walks.get(journey.id) : undefined;
    const openModel = useMemo(
        () =>
            openWalk
                ? buildLiveModel({ walk: openWalk, graphNodes, groupNames, role, status: live })
                : null,
        [openWalk, graphNodes, groupNames, role, live]
    );
    const selectedStep =
        selection?.kind === "step" && selection.journeyId === openId
            ? (openModel?.steps.get(selection.nodeId) ?? null)
            : null;

    const toggle = (id: string) => {
        setOpenId((current) => (current === id ? null : id));
        setSelection((current) => (current?.journeyId === id ? current : null));
    };
    const startJourney = (j: StudioJourney) => {
        setOpenId(j.id);
        setSelection(null);
        actions.start(j);
    };
    const selectStep = (journeyId: string) => (step: LiveStep) => {
        if (step.state === "input") reopenPending();
        setSelection({ kind: "step", journeyId, nodeId: step.nodeId });
        if (tab === "Session" || tab === "Log") setTab("Request");
    };

    const mockSide: NodeOwner = role === "BAP" ? "BPP" : "BAP";

    const journeyTags = useMemo(
        () => [...new Set(journeys.flatMap((j) => j.tags ?? []))].sort(),
        [journeys]
    );
    // A filter never hides the open journey or one with a run.
    const shown = useMemo(
        () =>
            filterJourneys(
                journeys,
                settings.selectedTags,
                new Set(journeys.filter((j) => j.id === openId || txOf(j.id)).map((j) => j.id))
            ),
        [journeys, settings.selectedTags, openId, started, flowMap]
    );
    const [states, setStates] = useState<Record<string, LiveJourneyState>>({});
    const onJourneyState = useCallback(
        (id: string, state: LiveJourneyState) =>
            setStates((prev) => (prev[id] === state ? prev : { ...prev, [id]: state })),
        []
    );

    // Auto-scroll (v1's setting): bring the step the run is on into view as it moves,
    // except while the tester is filling in the inputs popup.
    const plan = live?.plan;
    const currentNode = plan && "nodeId" in plan ? plan.nodeId : null;
    useEffect(() => {
        if (!settings.autoScroll || !openId || !currentNode || run.pending) return;
        const card = document.querySelector(
            `#live-journey-${CSS.escape(openId)} [data-node-id="${CSS.escape(currentNode)}"]`
        );
        card?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, [settings.autoScroll, openId, currentNode, run.pending]);

    const [anyStarted] = useState(() => Object.values(flowMap).some(Boolean));
    const copyLink = () =>
        void navigator.clipboard
            .writeText(window.location.href)
            .then(() => toast.success("Link to this live session copied"))
            .catch(() => toast.error("Could not copy the link"));

    return (
        <PageShell sessionId={sessionId} role={role}>
            <FlowSettingsModal
                {...settings.modalProps}
                flowTags={journeyTags}
                experimentalLabel="Step through"
                experimentalInfo="Pause before every payload the mock sends: each one goes out when you click Run step, so you can check your side at your own pace. v1's Experimental Mode, for Studio runs."
                filtersTitle="Journey filters"
                localSettings={
                    <SwitchField
                        id="studio-advanced-mode"
                        label="Advanced mode"
                        info="Also show the run's Session data and the mock's Log in the side panel."
                        checked={settings.advancedDraft}
                        onCheckedChange={settings.setAdvancedDraft}
                    />
                }
            />
            <div className="flex flex-col gap-3 py-6">
                <InfoSection
                    labels={INFO_LABELS}
                    data={{
                        sessionId,
                        subscriberUrl,
                        role: `${role} · your NP`,
                        mock: `${mockSide} · Studio graph`,
                        domain,
                        version,
                        journeys: String(journeys.length),
                    }}
                    headerActions={
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <Button
                                size="sm"
                                variant="secondary"
                                className="rounded-full"
                                aria-label="Settings"
                                title="Settings"
                                onClick={settings.open}
                            >
                                <Cog6ToothIcon className="size-4 text-brand-normal" />
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                aria-label="Copy link"
                                title="Copy a link to this live session"
                                onClick={copyLink}
                            >
                                <LinkIcon className="size-4" />
                                <span className="hidden sm:inline">Copy link</span>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                                <Link to={ROUTES.STUDIO_EDITOR}>
                                    <PencilSquareIcon className="size-4" />
                                    <span className="hidden sm:inline">Open in Studio</span>
                                </Link>
                            </Button>
                        </div>
                    }
                    pollingIndicator={
                        <CircularProgress
                            duration={SESSION_POLL_MS / 1000}
                            id="studio-live-session-poll"
                            loop={true}
                            onComplete={async () => undefined}
                            sqSize={16}
                            strokeWidth={2}
                        />
                    }
                />
                <CollapsibleSection title="Endpoints" defaultOpen={!anyStarted}>
                    <EndpointsSection
                        sendUrl={`${GetRequestEndpoint(domain, version, role)}/<action>`}
                        receiveUrl={`${subscriberUrl}/<action>`}
                    />
                </CollapsibleSection>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-4 pb-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <div className="flex min-w-0 flex-col gap-3">
                    <LiveJourneySummary
                        states={shown.map((j) => states[j.id] ?? "not-started")}
                        shown={shown.length}
                        total={journeys.length}
                        tags={settings.selectedTags}
                        onClearTags={settings.clearTags}
                    />
                    {shown.map((j) => {
                        const walk = walks.get(j.id);
                        if (!walk) return null;
                        const open = j.id === openId;
                        return (
                            <JourneySlot
                                key={j.id}
                                sessionId={sessionId}
                                graphNodes={graphNodes}
                                groupNames={groupNames}
                                role={role}
                                openModel={open ? openModel : null}
                                openStatus={open ? live : null}
                                problems={open ? problems : []}
                                onInputs={reopenPending}
                                onStep={runStep}
                                inputsSent={open && inputsSent}
                                onState={onJourneyState}
                                journey={j}
                                walk={walk}
                                transactionId={txOf(j.id)}
                                awaiting={awaitingOf(j.id)}
                                open={open}
                                onToggle={() => toggle(j.id)}
                                busy={open && run.busy}
                                onStart={() => startJourney(j)}
                                onFinish={actions.finish}
                                onTrigger={(nodeId) => void actions.trigger(nodeId)}
                                selection={selection}
                                onSelectStep={selectStep(j.id)}
                                onSelectRejected={(index) => {
                                    setSelection({ kind: "rejected", journeyId: j.id, index });
                                    if (tab === "Session" || tab === "Log") setTab("Request");
                                }}
                                root={root}
                                flat={flat}
                            />
                        );
                    })}
                </div>

                <LiveSidePanel
                    tab={tab}
                    onTab={setTab}
                    selection={selection?.journeyId === openId ? selection : null}
                    step={selectedStep}
                    status={live}
                    advanced={settings.advancedMode}
                />
            </div>

            {/* The inputs / form popup keeps the Studio theme it was built with. */}
            <div ref={setDialogHost} className="studio-editor studio-live-dialogs" />
            <RunDialog pending={run.pending} actions={actions} container={dialogHost} />
        </PageShell>
    );
};

type JourneySlotProps = Omit<
    ILiveJourneyCardProps,
    "model" | "status" | "journeyState" | "nextUp"
> & {
    /** The open journey's prompt was submitted; the mock has yet to move on. */
    inputsSent: boolean;
    /** Reports the journey's state up, for the page's summary. */
    onState: (journeyId: string, state: LiveJourneyState) => void;
    sessionId: string;
    graphNodes: Map<string, GraphNodeV2>;
    groupNames: Map<string, string>;
    role: NodeOwner;
    /** The open journey's model and status come from the page's live run. */
    openModel: LiveModel | null;
    openStatus: IStudioLiveStatus | null;
    walk: WalkResult;
};

/**
 * A journey card with its status: the page's live run for the open one, a
 * single read (no polling) for the others, so their progress still shows.
 */
const JourneySlot = ({
    sessionId,
    graphNodes,
    groupNames,
    role,
    openModel,
    openStatus,
    onState,
    inputsSent,
    ...card
}: JourneySlotProps) => {
    const tx = card.transactionId;
    const { data } = useGetStudioLiveStatusQuery(
        { sessionId, transactionId: tx ?? "" },
        { skip: !tx || card.open }
    );
    const readBack = data && data.transactionId === tx ? data : null;
    const status = card.open ? openStatus : readBack;
    const { walk } = card;
    const ownModel = useMemo(
        () => buildLiveModel({ walk, graphNodes, groupNames, role, status }),
        [walk, graphNodes, groupNames, role, status]
    );
    const model = card.open && openModel ? openModel : ownModel;
    const journeyState = card.awaiting && !status ? "waiting" : getJourneyState(status, model);
    const journeyId = card.journey.id;
    useEffect(() => onState(journeyId, journeyState), [onState, journeyId, journeyState]);
    const nextUp = getNextUp({
        status,
        model,
        journeyState: card.awaiting && !status ? "not-started" : journeyState,
        awaiting: card.awaiting,
        inputsSent,
    });
    return (
        <LiveJourneyCard
            {...card}
            model={model}
            status={status}
            journeyState={journeyState}
            nextUp={nextUp}
        />
    );
};

export default StudioLivePage;
