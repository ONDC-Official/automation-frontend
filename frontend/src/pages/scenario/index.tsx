import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import RenderFlows from "@components/FlowShared/render-flows";
import Card from "@/components/Shadcn/Card";
import Accordion from "@/components/Shadcn/Accordion";
import { ReportPage } from "@components/FlowShared/report";
import { GetRequestEndpoint } from "@components/FlowShared/guides";
import { useSession } from "@hooks/useSession";
import { trackEvent } from "@utils/analytics";
import { useWorkbenchFlows } from "@hooks/useWorkbenchFlow";
import { IDomain } from "@/pages/schema-validation/types";
import { Flow } from "@/types/flow-types";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
    pruneExpiredSessions,
    setSessions,
    type IFlowTestingSessionEntry,
} from "@store/slices/sessionHistorySlice";
import { setScenarioSession } from "@store/slices/supportSessionSlice";
import { PreviousSessionsPanel } from "@/pages/scenario/PreviousSessionPanel";
import { IPreviousSessionItem } from "@/pages/scenario/types";
import {
    useLazyGetScenarioFormDataQuery,
    useLazyGetScenarioPreferencesQuery,
    useCreateSessionMutation,
    usePutCacheDataMutation,
    useLazyGetSessionByIdQuery,
} from "@store/api";
import { useAuth } from "@hooks/useAuth";
import { IScenarioFormData, ISessionResponse, ISavedPrefAPI } from "@/pages/scenario/types";
import { openSessionInNewTab } from "@/pages/scenario/helpers";
import NewSessionForm from "@/pages/scenario/NewSessionForm";
import Spinner from "@/components/Shadcn/Spinner";
import { SCENARIO_GUIDE_STEPS, SCENARIO_TIP_BANNER_MESSAGE } from "@/pages/scenario/constants";
import { Button } from "@/components/Shadcn/Button";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { ROUTES } from "@/constants/routes";

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
    const { user } = useAuth();
    const navigate = useNavigate();
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
    const [savedPreferences, setSavedPreferences] = useState<Record<string, IScenarioFormData>>({});
    const initialSavedConfigKey = searchParams.get("config") ?? "";
    const [triggerGetScenarioFormData] = useLazyGetScenarioFormDataQuery();
    const [triggerGetScenarioPreferences] = useLazyGetScenarioPreferencesQuery();
    const [createSession] = useCreateSessionMutation();
    const [putCacheData] = usePutCacheDataMutation();
    const [triggerGetSessionById] = useLazyGetSessionByIdQuery();

    const createAndOpenSession = async (data: IScenarioFormData, newTab = true) => {
        try {
            data = {
                ...data,
                subscriberUrl: data?.subscriberUrl?.replace(/\/+$/, ""),
            };

            const response = await createSession({
                ...data,
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
                window.open(newTabUrl, "_blank");
            } else {
                window.location.href = newTabUrl;
            }
        } catch (e) {
            toast.error("Error while creating session");
            console.error("error while sending response", e);
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

    const fetchFormFieldData = async (): Promise<IDomain[]> => {
        try {
            const result = await triggerGetScenarioFormData();
            const fetchedDomains: IDomain[] = result.data?.domain || [];
            setDomains(fetchedDomains);
            return fetchedDomains;
        } catch (e) {
            console.error("error while fetching form field data", e);
            return [];
        }
    };

    const fetchAndApplyPreferences = async (): Promise<Record<string, IScenarioFormData>> => {
        try {
            const result = await triggerGetScenarioPreferences();
            const raw = result.data as Record<string, ISavedPrefAPI> | undefined;
            if (!raw) return {};

            const mapped: Record<string, IScenarioFormData> = {};
            Object.entries(raw).forEach(([key, val]) => {
                mapped[key] = {
                    subscriberUrl: val.subscriber_url,
                    domain: val.domain,
                    version: val.version,
                    usecaseId: val.usecase_id,
                    npType: val.np_type,
                    env: val.env,
                };
            });
            setSavedPreferences(mapped);
            return mapped;
        } catch {
            console.warn("Could not fetch saved preferences, possibly not logged in");
            return {};
        }
    };

    useEffect(() => {
        dispatch(pruneExpiredSessions());
        Promise.all([fetchFormFieldData(), fetchAndApplyPreferences()]).finally(() =>
            setIsInitializing(false)
        );
    }, []);

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

    const handleCreateConfigClick = () => {
        if (user) {
            navigate(ROUTES.PROFILE);
            return;
        }

        const backendUrl = import.meta.env.VITE_DEVELOPER_GUIDE_BACKEND_URL;
        window.location.href = `${backendUrl}/login`;
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

    useEffect(() => {
        const id = setTimeout(() => {
            toast(SCENARIO_TIP_BANNER_MESSAGE, {
                duration: Infinity,
                style: { alignItems: "flex-start" },
                position: "top-right",
                icon: <InformationCircleIcon className="size-5 text-brand-normal" />,
            });
        }, 0);
        return () => {
            clearTimeout(id);
            toast.dismiss();
        };
    }, []);

    const Body = () => {
        switch (flowStepNum) {
            case 1:
                if (!flows) return <Spinner />;
                return (
                    <RenderFlows
                        flows={flows}
                        subUrl={subscriberUrl}
                        sessionId={session}
                        newSession={newSession}
                    />
                );
            case 2:
                if (!session) return <Spinner />;
                return <ReportPage sessionId={session} report={report} setStep={setFlowStepNum} />;
            case 0:
            default:
                return (
                    <div className="flex w-full flex-col gap-6">
                        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(280px,2fr)_minmax(0,3fr)]">
                            <Accordion title="Scenario Testing" steps={SCENARIO_GUIDE_STEPS} />

                            <Card
                                title="Create a new Session"
                                description="Fill the details to begin flow testing."
                                headerAction={
                                    !user ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCreateConfigClick}
                                        >
                                            Create config in profile
                                        </Button>
                                    ) : undefined
                                }
                            >
                                {isInitializing ? (
                                    <div className="flex items-center justify-center">
                                        <Spinner />
                                    </div>
                                ) : (
                                    <NewSessionForm
                                        domains={domains}
                                        savedPreferences={savedPreferences}
                                        initialSavedConfigKey={initialSavedConfigKey}
                                        isSubmitting={isFormSubmitted}
                                        onSubmit={onSubmitHandler}
                                    />
                                )}
                            </Card>
                        </div>

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
                    </div>
                );
        }
    };
    return (
        <div className="w-full">
            <div className="mx-auto px-20 py-6">
                <Body />
            </div>
        </div>
    );
};

export default Scenario;
