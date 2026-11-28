import { useState, useEffect, useLayoutEffect, useMemo, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CircleHelp, Plus } from "lucide-react";
import { toast } from "sonner";
import RenderFlows from "@components/DomainFlowRunner/RenderFlows";
import Alert from "@components/Shadcn/Alert";
import Card from "@components/Shadcn/Card";
import { ReportPage } from "@pages/scenario/ReportPage";
import { GetRequestEndpoint } from "@components/DomainFlowRunner/utils/get-request-endpoint";
import { useSession } from "@hooks/useSession";
import { trackEvent } from "@utils/analytics";
import { useWorkbenchFlows } from "@hooks/useWorkbenchFlow";
import { IDomain } from "@pages/schema-validation/types";
import { Flow } from "@/types/flow-types";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { setScenarioSelectedConfig } from "@store/slices/scenarioDraftSlice";
import {
    pruneExpiredSessions,
    setSessions,
    type IFlowTestingSessionEntry,
} from "@store/slices/sessionHistorySlice";
import { setScenarioSession } from "@store/slices/supportSessionSlice";
import { PreviousSessionsPanel } from "@pages/scenario/PreviousSessionPanel";
import { IPreviousSessionItem } from "@pages/scenario/types";
import {
    useLazyGetScenarioFormDataQuery,
    useLazyGetScenarioPreferencesQuery,
    useCreateSessionMutation,
    usePutCacheDataMutation,
    useLazyGetSessionByIdQuery,
} from "@store/api";
import { useAuth } from "@hooks/useAuth";
import { useActiveOrganisation } from "@hooks/useActiveOrganisation";
import { useGitHubLogin } from "@hooks/useGitHubLogin";
import { IScenarioFormData, ISessionResponse, ISavedPrefAPI } from "@pages/scenario/types";
import {
    buildConfigCards,
    configsForOrganisation,
    npPortalConfigsFromUser,
    openSessionInNewTab,
} from "@pages/scenario/helpers";
import NewSessionForm from "@pages/scenario/NewSessionForm";
import { LoginGate } from "@pages/scenario/LoginGate";
import Spinner from "@components/Shadcn/Spinner";
import { ScenarioGuideDialog } from "@pages/scenario/ScenarioGuideDialog";
import { ConfigList } from "@pages/scenario/ConfigList";
import { ConfigDetailPanel } from "@pages/scenario/ConfigDetailPanel";
import { Button } from "@components/Shadcn/Button";
import { ROUTES } from "@constants/routes";
import { cn } from "@/lib/utils";
import { fdSessionPath, isFdDomain } from "@pages/fd-session/constants";

const Scenario = () => {
    const {
        flowStepNum,
        setFlowStepNum,
        session,
        setSession,
        subscriberUrl,
        setSubscriberUrl,
        flows,
        setFlows,
        report,
    } = useWorkbenchFlows();
    const [isFormSubmitted, setIsFormSubmitted] = useState(false);
    const [domains, setDomains] = useState<IDomain[]>([]);
    const { sessionId: contextSessionId } = useSession();
    const { user, token, isAuthLoading } = useAuth();
    const { startLogin, isLoginRedirecting } = useGitHubLogin();
    const [searchParams] = useSearchParams();
    const dispatch = useAppDispatch();

    const storedSessions = useAppSelector((state) => state.sessionHistory.sessions);
    const existingSessions = useMemo<IPreviousSessionItem[]>(
        () =>
            [...storedSessions].sort(
                (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            ),
        [storedSessions]
    );
    const setExistingSessions = (sessions: IFlowTestingSessionEntry[]) =>
        dispatch(setSessions(sessions));
    const [isInitializing, setIsInitializing] = useState(true);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    // Logged-in view: the config shown on the right (the top one until the user picks
    // another), whether small screens show its details instead of the list, and
    // whether the New session page shows.
    const persistedSelectedConfigId = useAppSelector((s) => s.scenarioDraft.selectedConfigId);
    const [selectedConfigId, setSelectedConfigId] = useState<string | null>(
        persistedSelectedConfigId
    );
    const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
    // The New session form (and the guest form) has its own address, /scenario?view=new,
    // so browser Back, Cancel and the "Scenario Testing" breadcrumb all return to the list
    // (or the login box), and refresh / Forward keep the form.
    const navigate = useNavigate();
    const location = useLocation();
    const isNewSessionOpen = searchParams.get("view") === "new";
    const openNewSession = () => {
        const params = new URLSearchParams(searchParams);
        params.set("view", "new");
        navigate({ search: params.toString() }, { state: { openedFromScenario: true } });
        window.scrollTo({ top: 0, left: 0 });
    };
    const closeNewSession = () => {
        // Opened from this page: step back, exactly like the browser's Back button.
        // Opened directly (link, refresh): go to the list without leaving the site.
        if ((location.state as { openedFromScenario?: boolean } | null)?.openedFromScenario) {
            navigate(-1);
            return;
        }
        const params = new URLSearchParams(searchParams);
        params.delete("view");
        navigate({ search: params.toString() }, { replace: true });
    };
    const [savedPreferences, setSavedPreferences] = useState<Record<string, IScenarioFormData>>({});
    const initialSavedConfigKey = searchParams.get("config") ?? "";
    const [triggerGetScenarioFormData] = useLazyGetScenarioFormDataQuery();
    const [triggerGetScenarioPreferences] = useLazyGetScenarioPreferencesQuery();
    const [createSession] = useCreateSessionMutation();
    const [putCacheData] = usePutCacheDataMutation();
    const [triggerGetSessionById] = useLazyGetSessionByIdQuery();

    const createAndOpenSession = async (data: IScenarioFormData, newTab = true) => {
        if (isFdDomain(data.domain)) {
            await createAndOpenFdSession(data);
            return;
        }
        try {
            // The FD registration fields belong to FD sessions only.
            const { fd: _fd, ...rest } = data;
            data = {
                ...rest,
                subscriberUrl: data?.subscriberUrl?.replace(/\/+$/, ""),
            };

            const response = await createSession({
                ...data,
                orgId: data.orgId || undefined,
                userId: user?.username,
                difficulty_cache: {
                    stopAfterFirstNack: true,
                    timeValidations: true,
                    protocolValidations: true,
                    useGateway: true,
                    headerValidaton: true,
                },
            }).unwrap();
            const sessionID = response.sessionId;
            dispatch(setScenarioSession(response.sessionId));
            const currentUrl = window.location.origin;
            const newTabUrl = `${currentUrl}/flow-testing?sessionId=${sessionID}&subscriberUrl=${encodeURIComponent(data.subscriberUrl)}&role=${data.npType}`;
            if (newTab) {
                const newWindow = window.open(newTabUrl, "_blank");
                if (!newWindow) {
                    toast.error(
                        "Your browser blocked the popup. Please allow popups for this site and try again."
                    );
                }
            } else {
                window.location.href = newTabUrl;
            }
        } catch (e) {
            toast.error("Error while creating session");
            console.error("error while sending response", e);
        }
    };

    /**
     * An FD session opens on the FD workbench (registering the participant), then on the FD
     * session page. The workbench's refusal (a bad key, a declaration that does not validate)
     * is shown as it is, so the tester can fix the field.
     */
    const createAndOpenFdSession = async (data: IScenarioFormData) => {
        try {
            const response = await createSession({
                ...data,
                subscriberUrl: data.subscriberUrl.trim().replace(/\/+$/, ""),
                orgId: data.orgId || undefined,
                userId: user?.username,
            }).unwrap();
            dispatch(setScenarioSession(response.sessionId));
            navigate(fdSessionPath(response.sessionId));
        } catch (e) {
            const message = (e as { message?: string })?.message;
            toast.error(
                message
                    ? `Could not open the FD session: ${message}`
                    : "Error while creating session"
            );
            console.error("error while creating the FD session", e);
        }
    };

    const onSubmit = async (data: IScenarioFormData) => {
        try {
            if (
                data.subscriberUrl.trim() === "https://testing" ||
                data.subscriberUrl.trim() === "http://testing"
            ) {
                const dataCopy = JSON.parse(JSON.stringify(data)) as IScenarioFormData;
                dataCopy.npType = "BPP";
                dataCopy.subscriberUrl = GetRequestEndpoint(data.domain, data.version, "BAP");
                await createAndOpenSession(dataCopy);
                dataCopy.npType = "BAP";
                dataCopy.subscriberUrl = GetRequestEndpoint(data.domain, data.version, "BPP");
                await createAndOpenSession(dataCopy);
                return;
            }
            await createAndOpenSession(data, false);
        } catch (err) {
            console.error("Error in onSubmit: ", err);
        }
    };

    const onSubmitHandler = async (data: IScenarioFormData) => {
        trackEvent({
            category: "SCHEMA_VALIDATION-FORM",
            action: "Form submitted",
        });
        setIsFormSubmitted(true);
        await onSubmit(data);
        setIsFormSubmitted(false);
    };

    useEffect(() => {
        dispatch(pruneExpiredSessions());

        let cancelled = false;

        const initFormData = async () => {
            setIsInitializing(true);
            try {
                try {
                    const result = await triggerGetScenarioFormData();
                    if (cancelled) return;
                    setDomains(result.data?.domain || []);
                } catch (e) {
                    console.error("error while fetching form field data", e);
                    if (!cancelled) setDomains([]);
                }

                if (!token) {
                    if (!cancelled) setSavedPreferences({});
                    return;
                }

                try {
                    // unwrap() rejects on error; avoids applying stale cache data after logout
                    const raw = (await triggerGetScenarioPreferences().unwrap()) as
                        | Record<string, ISavedPrefAPI>
                        | undefined;
                    if (cancelled) return;
                    if (!raw) {
                        setSavedPreferences({});
                        return;
                    }

                    const mapped: Record<string, IScenarioFormData> = {};
                    Object.entries(raw).forEach(([key, val]) => {
                        mapped[key] = {
                            subscriberUrl: val.subscriber_url,
                            domain: val.domain,
                            version: val.version,
                            usecaseId: val.usecase_id,
                            npType: val.np_type,
                            env: val.env,
                            orgId: val.org_id,
                        };
                    });
                    setSavedPreferences(mapped);
                } catch {
                    console.warn("Could not fetch saved preferences, possibly not logged in");
                    if (!cancelled) setSavedPreferences({});
                }
            } finally {
                if (!cancelled) setIsInitializing(false);
            }
        };

        void initFormData();
        return () => {
            cancelled = true;
        };
    }, [token, dispatch, triggerGetScenarioFormData, triggerGetScenarioPreferences]);

    const fetchSessionData = (sessId: string) => {
        triggerGetSessionById({ sessionId: sessId })
            .unwrap()
            .then((data) => {
                const response = data as unknown as ISessionResponse;
                if (response.flowConfigs) {
                    setFlows(Object.values(response.flowConfigs) as Flow[]);
                }
                setSubscriberUrl(response.subscriberUrl);
                setSession(sessId);

                const step = response.activeStep;
                setFlowStepNum(step === 0 || step === 1 || step === 2 ? step : 0);
            })
            .catch((e: unknown) => {
                console.error("Error while fetching session: ", e);
            });
    };

    const newSession = () => {
        setIsFormSubmitted(false);
        setFlowStepNum(0);
    };

    useEffect(() => {
        if (contextSessionId && !isFormSubmitted) {
            fetchSessionData(contextSessionId);
        }
    }, [contextSessionId, isFormSubmitted]);

    useEffect(() => {
        if (session) {
            putCacheData({ data: { activeStep: flowStepNum }, sessionId: session });
        }
    }, [flowStepNum, session]);

    // Cards: the NP Portal configs SSO sent with the user's organisations, plus the
    // user's saved profile configs. Nothing extra is fetched: both are already loaded.
    // Only the organisation the user is working for: its NP Portal configs, and saved
    // configs made for it (or saved without an organisation).
    const { activeOrganisation } = useActiveOrganisation();
    const activeOrgId = activeOrganisation?.organisationId;
    const { npPortalConfigs, savedPreferences: visibleSavedPreferences } = useMemo(
        () => configsForOrganisation(npPortalConfigsFromUser(user), savedPreferences, activeOrgId),
        [user, savedPreferences, activeOrgId]
    );
    const configCards = useMemo(
        () => buildConfigCards(npPortalConfigs, visibleSavedPreferences, domains),
        [npPortalConfigs, visibleSavedPreferences, domains]
    );
    // Grouping keeps first-seen order, so the first card is the top-most one in the list.
    const selectedConfig =
        configCards.find((card) => card.id === selectedConfigId) ?? configCards[0] ?? null;
    const selectConfig = (id: string) => {
        setSelectedConfigId(id);
        setIsMobileDetailOpen(true);
        dispatch(setScenarioSelectedConfig(id));
    };

    // The Profile page's "Launch Test" links here with ?config=<name>: open that config's details.
    const [isDeepLinkHandled, setIsDeepLinkHandled] = useState(false);
    useEffect(() => {
        if (isDeepLinkHandled || isInitializing || !initialSavedConfigKey) return;
        setIsDeepLinkHandled(true);
        if (savedPreferences[initialSavedConfigKey]) {
            selectConfig(`saved|${initialSavedConfigKey}`);
        }
    }, [isDeepLinkHandled, isInitializing, initialSavedConfigKey, savedPreferences]);

    // Open at the top on refresh: the browser's native
    // scroll restoration fires after mount and would re-scroll to the old position,
    // so disable it while this page is mounted. On unmount, reset to the browser
    // default ("auto") rather than a captured previous value — after a refresh here
    // the entry is already "manual", and restoring that would leak manual mode to
    // every other page in the tab.
    useLayoutEffect(() => {
        if (!("scrollRestoration" in window.history)) {
            return;
        }
        window.history.scrollRestoration = "manual";
        window.scrollTo({ top: 0, left: 0 });
        return () => {
            window.history.scrollRestoration = "auto";
        };
    }, []);

    // Render via a switch expression (not a nested component) so parent
    // re-renders — e.g. isFormSubmitted toggling — don't remount the form
    // and wipe local state like showManualForm.
    const historyPanel = (
        <PreviousSessionsPanel
            sessions={existingSessions}
            onSessionsChange={setExistingSessions}
            onOpenSession={(selectedSession) =>
                openSessionInNewTab(
                    selectedSession.sessionId,
                    selectedSession.subscriberUrl,
                    selectedSession.role
                )
            }
        />
    );

    // "Home / Scenario Testing / New session": shared by the logged-out form and the
    // logged-in New session page. "Scenario Testing" goes back like Cancel.
    const breadcrumbs = (
        <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-body-2 text-text-secondary">
                <li>
                    <Link
                        to={ROUTES.HOME}
                        className="hover:text-brand-normal hover:underline underline-offset-4"
                    >
                        Home
                    </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                    <button
                        type="button"
                        onClick={closeNewSession}
                        className="hover:text-brand-normal hover:underline underline-offset-4 focus-visible:underline focus-visible:outline-none"
                    >
                        Scenario Testing
                    </button>
                </li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="font-semibold text-text-primary">
                    New session
                </li>
            </ol>
        </nav>
    );

    // Logged in: a split view, configs on the left and the picked one's details on the right.
    // New session swaps it for the same full-page form the logged-out view uses.
    const loggedInBody = (
        <div className="flex w-full flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-h6 font-bold text-text-primary">Scenario Testing</h1>
                    <p className="text-body-2 text-text-secondary">
                        Pick one of your configs to start testing, or start a new session yourself.
                    </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-3 self-start sm:self-auto">
                    <Button
                        variant="outline"
                        onClick={() => setIsGuideOpen(true)}
                        className="h-10 gap-2"
                    >
                        <CircleHelp className="size-4" aria-hidden="true" />
                        How it works
                    </Button>
                    {isNewSessionOpen ? null : (
                        <Button onClick={openNewSession} className="h-10 gap-2">
                            <Plus className="size-4" aria-hidden="true" />
                            New session
                        </Button>
                    )}
                </div>
            </div>

            {isNewSessionOpen ? (
                <div className="flex flex-col gap-4">
                    {breadcrumbs}
                    <Card
                        title="Create a new Session"
                        description="Fill the details to begin flow testing."
                    >
                        <NewSessionForm
                            domains={domains}
                            isSubmitting={isFormSubmitted}
                            onSubmit={onSubmitHandler}
                            onCancel={closeNewSession}
                        />
                    </Card>
                </div>
            ) : (
                <div
                    className={cn(
                        "grid items-start gap-5",
                        configCards.length > 0 && "lg:grid-cols-[minmax(320px,400px)_1fr]"
                    )}
                >
                    <section
                        aria-label="Your configs"
                        className={cn(
                            "flex-col overflow-hidden rounded-2xl border border-n-30 bg-n-0 dark:border-border-default dark:bg-surface-elevated lg:flex",
                            configCards.length > 0 &&
                                "lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:min-h-[520px]",
                            isMobileDetailOpen && selectedConfig ? "hidden" : "flex"
                        )}
                    >
                        {isInitializing ? (
                            <div className="flex items-center justify-center py-10">
                                <Spinner />
                            </div>
                        ) : (
                            <ConfigList
                                items={configCards}
                                selectedId={selectedConfig?.id ?? null}
                                onSelect={selectConfig}
                                onNewSession={openNewSession}
                            />
                        )}
                    </section>

                    {selectedConfig && !isInitializing ? (
                        <section
                            aria-label="Config details"
                            className={cn(
                                "overflow-hidden rounded-2xl border border-n-30 bg-n-0 dark:border-border-default dark:bg-surface-elevated lg:flex lg:flex-col lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]",
                                isMobileDetailOpen ? "block" : "hidden"
                            )}
                        >
                            <ConfigDetailPanel
                                key={selectedConfig.id}
                                item={selectedConfig}
                                domains={domains}
                                isSubmitting={isFormSubmitted}
                                onLaunch={onSubmitHandler}
                                onBack={() => setIsMobileDetailOpen(false)}
                            />
                        </section>
                    ) : null}
                </div>
            )}

            {historyPanel}
        </div>
    );

    let body: ReactNode;
    switch (flowStepNum) {
        case 1:
            body = !flows ? (
                <Spinner />
            ) : (
                <RenderFlows
                    flows={flows}
                    subUrl={subscriberUrl}
                    sessionId={session}
                    newSession={newSession}
                />
            );
            break;
        case 2:
            body = !session ? (
                <Spinner />
            ) : (
                <ReportPage sessionId={session} report={report} setStep={setFlowStepNum} />
            );
            break;
        case 0:
        default:
            body = user ? (
                loggedInBody
            ) : (
                <div className="flex w-full flex-col gap-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-h6 font-bold text-text-primary">
                                Scenario Testing
                            </h1>
                            <p className="text-body-2 text-text-secondary">
                                Pick one of your configs to start testing, or start a new session
                                yourself.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setIsGuideOpen(true)}
                            className="h-10 shrink-0 gap-2 self-start sm:self-auto"
                        >
                            <CircleHelp className="size-4" aria-hidden="true" />
                            How it works
                        </Button>
                    </div>

                    {isInitializing ? (
                        <div className="flex items-center justify-center py-10">
                            <Spinner />
                        </div>
                    ) : (
                        <LoginGate
                            isGuest={isNewSessionOpen}
                            onContinueWithoutLogin={openNewSession}
                            onLeaveGuest={closeNewSession}
                            isLoggedOut={!user && !isAuthLoading}
                            isLoginRedirecting={isLoginRedirecting}
                            onLogin={() => startLogin(ROUTES.SCENARIO)}
                        >
                            {({ isGuest, leaveGuest }) => (
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        {breadcrumbs}
                                        {isGuest ? (
                                            <p className="text-body-2 text-text-secondary">
                                                Already have an account?{" "}
                                                <button
                                                    type="button"
                                                    onClick={() => startLogin(ROUTES.SCENARIO)}
                                                    disabled={isLoginRedirecting}
                                                    className="font-semibold text-brand-normal underline-offset-4 hover:underline disabled:opacity-50"
                                                >
                                                    Login
                                                </button>
                                            </p>
                                        ) : null}
                                    </div>

                                    {isGuest ? (
                                        <Alert
                                            variant="warning"
                                            className="py-2 dark:border-alert-800 dark:bg-alert-800/30 dark:text-alert-200"
                                            message="You're not logged in"
                                            description="Sessions you start now aren't linked to an account or organisation."
                                        />
                                    ) : null}

                                    <Card
                                        title="Create a new Session"
                                        description="Fill the details to begin flow testing."
                                    >
                                        <NewSessionForm
                                            domains={domains}
                                            savedPreferences={savedPreferences}
                                            initialSavedConfigKey={initialSavedConfigKey}
                                            isSubmitting={isFormSubmitted}
                                            onSubmit={onSubmitHandler}
                                            onCancel={isGuest ? leaveGuest : undefined}
                                        />
                                    </Card>
                                </div>
                            )}
                        </LoginGate>
                    )}

                    {historyPanel}
                </div>
            );
    }

    return (
        <div className="w-full">
            <div className="mx-auto px-5 sm:px-8 md:px-10 lg:px-15 xl:px-20 py-6">
                {body}
                <ScenarioGuideDialog open={isGuideOpen} onOpenChange={setIsGuideOpen} />
            </div>
        </div>
    );
};

export default Scenario;
