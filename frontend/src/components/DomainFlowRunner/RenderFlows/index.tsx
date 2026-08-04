import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flow, MetadataField } from "@/types/flow-types";
import { ROUTES } from "@constants/routes";
import { buildDifficultyState } from "@components/DomainFlowRunner/FlowSettingsPanel";
import { InfoSection } from "@components/DomainFlowRunner/InfoSection";
import { EndpointsSection } from "@components/DomainFlowRunner/EndpointsSection";
import { CollapsibleSection } from "@components/DomainFlowRunner/CollapsibleSection";
import {
    POLL_INTERVAL,
    POLL_TIMEOUT,
    FLOW_DIALOG_OVERLAY_CLASS,
} from "@components/DomainFlowRunner/constants";
import type { IRenderFlowsProps } from "@components/DomainFlowRunner/types";
import { toast } from "sonner";
import { SessionCache } from "@/types/session-types";
import {
    useLazyGetCompletePayloadQuery,
    useLazyGetReportQuery,
    usePutCacheDataMutation,
    useLazyGetSessionByIdQuery,
} from "@store/api";
import { FlowRunAccordion } from "@/components/DomainFlowRunner/FlowRunAccordion";
import { useSession } from "@hooks/useSession";
import CircularProgress from "@components/DomainFlowRunner/CircularProgress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@components/Shadcn/Dialog";
import GuideModal from "@components/DomainFlowRunner/FlowGuide";
import {
    DocumentTextIcon,
    EyeIcon,
    PlusCircleIcon,
    QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import { GetRequestEndpoint } from "@components/DomainFlowRunner/utils/get-request-endpoint";
import { Button } from "@components/Shadcn/Button";
import { trackEvent } from "@utils/analytics";
import { openReportInNewTab } from "@utils/generic-utils";
import GenerateReportModal from "@components/DomainFlowRunner/GenerateReportModal";
import {
    FlowSettingsModal,
    type SettingsDraft,
} from "@components/DomainFlowRunner/FlowSettingsModal";
import { isRideMapEnabled } from "@components/DomainFlowRunner/RideMapUtils";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
    initializeFlowPage,
    resetFlowRuntime,
    selectFlowFilterTags,
    setFlowFilterTags,
} from "@store/slices/sessionSlice";
import { SESSION_EMPTY_METADATA, SESSION_EMPTY_RECORD } from "@store/slices/sessionConstants";
import { store } from "@store/index";
import { SessionSidePanel } from "@components/DomainFlowRunner/SessionSidePanel";
import {
    extractMetadataByFlowName,
    extractMetadataFromFlows,
    extractMetadataValues,
    sessionCacheMeaningfullyChanged,
    upsertFlowSession,
    type SideViewResponse,
    type SideViewState,
} from "@components/DomainFlowRunner/MetadataUtils";

function RenderFlows({ flows, subUrl, sessionId, newSession }: IRenderFlowsProps) {
    const dispatch = useAppDispatch();
    const selectedTags = useAppSelector(selectFlowFilterTags(sessionId));
    const {
        setSessionId,
        activeFlowId,
        setActiveFlowId,
        sessionData,
        setSessionData,
        sideView,
        setSideView,
        selectedTab,
        setSelectedTab,
        requestData,
        setRequestData,
        responseData,
        setResponseData,
        setMetadata,
        autoScrollEnabled,
        setAutoScrollEnabled,
        experimentalMode,
        setExperimentalMode,
        isFlowFormDialogOpen: flowFormDialogOpen,
    } = useSession();

    const activeFlowRef = useRef<string | null>(activeFlowId);
    const sessionDataPrimedRef = useRef(false);
    // Flows cleared locally but whose DELETE may not yet be visible to session GETs.
    // Session polls must not restore these flowMap entries (that snaps progress back).
    const pendingClearedFlowIdsRef = useRef<Set<string>>(new Set());
    const [difficultyCache, setDifficultyCache] = useState<SessionCache["sessionDifficulty"]>(
        {} as SessionCache["sessionDifficulty"]
    );
    const [isFlowStopped, setIsFlowStopped] = useState<boolean>(false);
    const apiCallFailCount = useRef(0);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [triggerGetCompletePayload] = useLazyGetCompletePayloadQuery();
    const [triggerGetReport] = useLazyGetReportQuery();
    const [putCacheData] = usePutCacheDataMutation();
    const [triggerGetSessionById] = useLazyGetSessionByIdQuery();
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const navigate = useNavigate();
    const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [gotReport, setGotReport] = useState(false);
    const [flowTags, setFlowTags] = useState<string[]>([]);
    const [isReportDialogOpen, setIsReportDialogOpen] = useState<boolean>(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsDraft, setSettingsDraft] = useState<SettingsDraft | null>(null);
    const [isSettingsSaving, setIsSettingsSaving] = useState(false);
    const [isViewingReport, setIsViewingReport] = useState(false);

    useEffect(() => {
        dispatch(initializeFlowPage(sessionId));
        sessionDataPrimedRef.current = false;
        return () => {
            dispatch(resetFlowRuntime());
        };
    }, [sessionId, dispatch]);

    const handleMetadataExtraction = useCallback(
        (requestPayload: Record<string, unknown>) => {
            if (!flows || flows.length === 0) {
                setMetadata(SESSION_EMPTY_METADATA);
                return;
            }

            const flowMetadataMap = extractMetadataFromFlows(flows);

            if (!Object.keys(flowMetadataMap).length) {
                setMetadata(SESSION_EMPTY_METADATA);
                return;
            }

            const currentActiveFlowId = store.getState().session.activeFlowId;
            let metadataToUse: MetadataField[] = [];

            if (currentActiveFlowId && flowMetadataMap[currentActiveFlowId]) {
                metadataToUse = extractMetadataByFlowName(flowMetadataMap, currentActiveFlowId);
            } else {
                metadataToUse = Object.values(flowMetadataMap).flat();
            }

            if (requestPayload && Object.keys(requestPayload).length > 0) {
                setMetadata(extractMetadataValues(requestPayload, metadataToUse));
            } else {
                setMetadata(SESSION_EMPTY_METADATA);
            }
        },
        [flows, setMetadata]
    );

    const test = useCallback(async () => {
        const currentSideView = store.getState().session.sideView as SideViewState | null;
        if (!currentSideView?.payloadId) return;
        const view = currentSideView;

        try {
            const data = await triggerGetCompletePayload({
                payloadIds: [(view.payloadId as string) ?? ""],
            }).unwrap();

            const requestPayload = (data?.[0]?.req ?? SESSION_EMPTY_RECORD) as Record<
                string,
                unknown
            >;
            let responsePayload: Record<string, unknown> = {};

            const sideResponse = view.response as SideViewResponse | undefined;
            if (sideResponse?.res?.[0]?.response) {
                responsePayload = sideResponse.res[0].response;
            } else if (sideResponse) {
                responsePayload = sideResponse as Record<string, unknown>;
            }

            setRequestData(requestPayload);
            setResponseData(responsePayload);
            handleMetadataExtraction(requestPayload);
        } catch (error: unknown) {
            const requestPayload = view.request ?? SESSION_EMPTY_RECORD;
            let responsePayload: Record<string, unknown> = {};

            const sideResponse = view.response as SideViewResponse | undefined;
            if (sideResponse?.res?.[0]?.response) {
                responsePayload = sideResponse.res[0].response;
            } else if (sideResponse) {
                responsePayload = sideResponse as Record<string, unknown>;
            }

            setRequestData(requestPayload);
            setResponseData(responsePayload);
            handleMetadataExtraction(requestPayload);
            console.error("Error while extracting metadata: ", error);
        }
    }, [triggerGetCompletePayload, setRequestData, setResponseData, handleMetadataExtraction]);

    useEffect(() => {
        if (sideView?.payloadId) {
            void test();
        } else {
            const empty = (sideView as SideViewState | null) || SESSION_EMPTY_RECORD;
            setRequestData(empty);
            setResponseData(empty);
        }
    }, [sideView, test, setRequestData, setResponseData]);

    useEffect(() => {
        activeFlowRef.current = activeFlowId;
    }, [activeFlowId]);

    useEffect(() => {
        if (!flows.length) {
            setMetadata(SESSION_EMPTY_METADATA);
            return;
        }
        const payload = (requestData ?? SESSION_EMPTY_RECORD) as Record<string, unknown>;
        handleMetadataExtraction(payload);
    }, [flows, requestData, activeFlowId, handleMetadataExtraction, setMetadata]);

    const mapEnabled = isRideMapEnabled(sessionData?.domain, sessionData?.version);

    const tabAutoDefaultedRef = useRef(false);
    useEffect(() => {
        if (tabAutoDefaultedRef.current) return;
        if (mapEnabled) {
            tabAutoDefaultedRef.current = true;
            setSelectedTab("Application");
        }
    }, [mapEnabled, setSelectedTab]);

    useEffect(() => {
        if (!mapEnabled && selectedTab === "Application") {
            setSelectedTab("Request");
        }
    }, [mapEnabled, selectedTab, setSelectedTab]);

    const fetchSessionData = useCallback(
        (options?: { force?: boolean }) => {
            triggerGetSessionById({ sessionId })
                .unwrap()
                .then((data) => {
                    let response = data as unknown as SessionCache;
                    // While Start/Stop has written local activeFlow but Redis may still be
                    // stale, keep the optimistic value so a concurrent poll cannot snap the UI back.
                    const { activeFlowLifecycleInFlight, activeFlowId } = store.getState().session;
                    if (activeFlowLifecycleInFlight) {
                        response = { ...response, activeFlow: activeFlowId };
                    }

                    // While Clear is in flight (or a late GET still carries the old mapping),
                    // keep pending-cleared flows out of local session state so progress cannot
                    // rehydrate from the prior transaction.
                    const pendingClears = pendingClearedFlowIdsRef.current;
                    if (pendingClears.size > 0 && response.flowMap) {
                        const nextFlowMap = { ...response.flowMap };
                        let nextTransactionIds = [...(response.transactionIds ?? [])];
                        const resolved: string[] = [];
                        for (const flowId of pendingClears) {
                            if (nextFlowMap[flowId]) {
                                const clearedTxId = nextFlowMap[flowId];
                                delete nextFlowMap[flowId];
                                if (clearedTxId) {
                                    nextTransactionIds = nextTransactionIds.filter(
                                        (id) => id !== clearedTxId
                                    );
                                }
                            } else {
                                resolved.push(flowId);
                            }
                        }
                        for (const flowId of resolved) {
                            pendingClears.delete(flowId);
                        }
                        response = {
                            ...response,
                            flowMap: nextFlowMap,
                            transactionIds: nextTransactionIds,
                        };
                    }

                    setDifficultyCache(response.sessionDifficulty);

                    const prev = store.getState().session.sessionData;
                    if (
                        options?.force ||
                        !prev ||
                        sessionCacheMeaningfullyChanged(prev, response)
                    ) {
                        setSessionData(response);
                    }

                    if (!sessionDataPrimedRef.current) {
                        sessionDataPrimedRef.current = true;
                        upsertFlowSession(response, sessionId);
                    }
                    apiCallFailCount.current = 0;
                })
                .catch((e: unknown) => {
                    console.error("Error while fetching session: ", e);
                    apiCallFailCount.current += 1;
                });
        },
        [sessionId, triggerGetSessionById, setSessionData]
    );

    useEffect(() => {
        fetchSessionData();
    }, [subUrl, sessionId, fetchSessionData]);

    // Catch up when returning from another tab (buyer/seller run in parallel tabs).
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === "visible") {
                fetchSessionData({ force: true });
            }
        };
        document.addEventListener("visibilitychange", onVisible);
        return () => document.removeEventListener("visibilitychange", onVisible);
    }, [fetchSessionData]);

    useEffect(() => {
        const allTags = new Set(Object.values(flows).flatMap((cfg) => cfg.tags ?? []));
        setFlowTags([...allTags].filter((tag) => tag !== "WORKBENCH"));
    }, [flows]);

    const onPollComplete = useCallback(async () => {
        if (apiCallFailCount.current < 5) {
            fetchSessionData();
        } else if (!isErrorModalOpen) {
            setIsErrorModalOpen(true);
        }
    }, [fetchSessionData, isErrorModalOpen]);

    const startPolling = () => {
        if (isPolling) return;
        setIsPolling(true);

        let stopped = false;

        const stopPolling = () => {
            stopped = true;
            if (pollingRef.current) clearTimeout(pollingRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setIsPolling(false);
        };

        const poll = async () => {
            if (stopped) return;

            try {
                const result = await triggerGetReport({ sessionId }).unwrap();

                if (result?.data) {
                    stopPolling();
                    toast.info("Report Generated");
                    setGotReport(true);
                    return;
                }
            } catch (err) {
                console.error("Polling error:", err);
            }

            pollingRef.current = setTimeout(poll, POLL_INTERVAL);
        };

        poll();

        timeoutRef.current = setTimeout(() => {
            toast.error("Something went wrong while fetching the report.");
            stopPolling();
        }, POLL_TIMEOUT);
    };

    let filteredFlows: Flow[] = [];

    if (selectedTags.length) {
        filteredFlows = Object.entries(flows)
            .filter(([_key, cfg]) => cfg.tags?.some((t) => selectedTags.includes(t)))
            .map(([_, cfg]) => cfg);
    } else {
        filteredFlows = flows;
    }

    const handleClearFlow = useCallback(
        (flowId: string) => {
            pendingClearedFlowIdsRef.current.add(flowId);
            setRequestData(SESSION_EMPTY_RECORD);
            setResponseData(SESSION_EMPTY_RECORD);
            setMetadata(SESSION_EMPTY_METADATA);
            // Drop the cleared flow from local session cache immediately so Start
            // cannot resume from a stale flowMap, and so progress cannot rehydrate
            // via the flowMapEntry → getCurrentState effect. Do NOT refetch yet —
            // a GET before DELETE settles would restore the old mapping and snap
            // the progress bar back (requiring a second Clear click).
            setSessionData((prev) => {
                if (!prev?.flowMap) return prev;
                const clearedTxId = prev.flowMap[flowId];
                const nextFlowMap = { ...prev.flowMap };
                delete nextFlowMap[flowId];
                const nextTransactionIds = clearedTxId
                    ? prev.transactionIds.filter((id) => id !== clearedTxId)
                    : prev.transactionIds;
                return {
                    ...prev,
                    flowMap: nextFlowMap,
                    transactionIds: nextTransactionIds,
                };
            });
        },
        [setRequestData, setResponseData, setMetadata, setSessionData]
    );

    const handleClearFlowSettled = useCallback(
        (_flowId: string) => {
            fetchSessionData({ force: true });
        },
        [fetchSessionData]
    );

    const handleFlowStop = useCallback(() => {
        setIsFlowStopped(true);
    }, []);

    const openSettings = () => {
        setSettingsDraft({
            autoScrollEnabled,
            experimentalMode,
            sessionDifficulty: buildDifficultyState(difficultyCache),
            selectedTags: [...selectedTags],
        });
        setIsSettingsOpen(true);
    };

    const closeSettings = () => {
        setIsSettingsOpen(false);
        setSettingsDraft(null);
    };

    const handleSettingsSave = async () => {
        if (!settingsDraft) return;

        setIsSettingsSaving(true);
        try {
            const sessionDifficulty = {
                ...difficultyCache,
                ...settingsDraft.sessionDifficulty,
            };
            await putCacheData({ data: { sessionDifficulty }, sessionId }).unwrap();

            setAutoScrollEnabled(settingsDraft.autoScrollEnabled);
            setExperimentalMode(settingsDraft.experimentalMode);
            dispatch(setFlowFilterTags({ sessionId, tags: settingsDraft.selectedTags }));
            setDifficultyCache(sessionDifficulty);
            closeSettings();
        } catch (e) {
            console.error("error while sending response", e);
            toast.error("Error while updating setting difficulty");
        } finally {
            setIsSettingsSaving(false);
        }
    };

    return (
        <>
            <Dialog
                open={isErrorModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        navigate(ROUTES.HOME);
                        setIsErrorModalOpen(false);
                    }
                }}
            >
                <DialogContent
                    overlayClassName={FLOW_DIALOG_OVERLAY_CLASS}
                    className="max-w-md gap-5 rounded-lg p-6"
                >
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-text-primary">
                            Alert
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-text-secondary">
                        We couldn&apos;t reach the server to keep this session updated.
                    </p>
                    <p className="text-sm text-text-secondary">Check support to raise a query.</p>
                </DialogContent>
            </Dialog>
            <GuideModal
                isOpen={isGuideOpen}
                onClose={() => setIsGuideOpen(false)}
                domain={sessionData?.domain}
            />
            <FlowSettingsModal
                isOpen={isSettingsOpen}
                onClose={closeSettings}
                draft={settingsDraft}
                onDraftChange={setSettingsDraft}
                onSave={handleSettingsSave}
                flowTags={flowTags}
                isSaving={isSettingsSaving}
            />

            <div className="flex min-h-screen w-full flex-1 flex-col bg-surface-page">
                <div className="space-y-3 py-6">
                    {sessionData ? (
                        <div className="flex flex-col gap-3">
                            <InfoSection
                                data={{
                                    sessionId: sessionId,
                                    subscriberUrl: subUrl,
                                    activeFlow: activeFlowId || "N/A",
                                    subscriberType: sessionData.npType,
                                    domain: sessionData.domain,
                                    version: sessionData.version,
                                    env: sessionData.env,
                                    use_case: sessionData.usecaseId,
                                }}
                                pollingIndicator={
                                    <CircularProgress
                                        duration={5}
                                        id="flow-cool-down"
                                        loop={true}
                                        isActive={!flowFormDialogOpen}
                                        onComplete={onPollComplete}
                                        sqSize={16}
                                        strokeWidth={2}
                                    />
                                }
                                headerActions={
                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="rounded-full"
                                            onClick={openSettings}
                                        >
                                            <Cog6ToothIcon className="size-4 text-brand-normal" />
                                        </Button>
                                        {newSession ? (
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setSessionId("");
                                                    newSession();
                                                }}
                                            >
                                                <PlusCircleIcon className="size-4" />
                                                New Session
                                            </Button>
                                        ) : null}
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                trackEvent({
                                                    category: "SCENARIO_TESTING-FLOWS",
                                                    action: "Generate report",
                                                });
                                                setIsReportDialogOpen(true);
                                            }}
                                            disabled={!isFlowStopped}
                                        >
                                            <DocumentTextIcon className="size-4" />
                                            Generate Report
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={async () => {
                                                setIsViewingReport(true);
                                                try {
                                                    const response = await triggerGetReport({
                                                        sessionId,
                                                    }).unwrap();
                                                    const decodedHtml = response.data;
                                                    openReportInNewTab(decodedHtml, sessionId);
                                                } catch (error) {
                                                    console.error(
                                                        "Failed to fetch or open report:",
                                                        error
                                                    );
                                                    toast.error("Failed to load the report");
                                                } finally {
                                                    setIsViewingReport(false);
                                                }
                                            }}
                                            disabled={!gotReport || isViewingReport}
                                        >
                                            <EyeIcon className="size-4" />
                                            View Report
                                        </Button>
                                        {newSession ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setIsGuideOpen(true)}
                                            >
                                                <QuestionMarkCircleIcon className="size-4" />
                                                Guide
                                            </Button>
                                        ) : null}
                                    </div>
                                }
                            />
                            <CollapsibleSection title="Endpoints" defaultOpen>
                                <EndpointsSection
                                    sendUrl={`${GetRequestEndpoint(
                                        sessionData.domain,
                                        sessionData.version,
                                        sessionData.npType
                                    )}/<action>`}
                                    receiveUrl={`${subUrl}/<action>`}
                                />
                            </CollapsibleSection>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-n-30 bg-surface-elevated p-6 shadow-xs dark:border-border-default">
                            <style>
                                {`
									@keyframes shimmer {
										0% { background-position: -200px 0; }
										100% { background-position: calc(200px + 100%) 0; }
									}
									.skeleton {
										background: linear-gradient(90deg, var(--color-brand-light) 25%, var(--color-brand-light-active) 50%, var(--color-brand-light) 75%);
										background-size: 200px 100%;
										animation: shimmer 1.5s infinite;
									}
								`}
                            </style>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="skeleton h-3 rounded"></div>
                                        <div className="skeleton h-3 w-4/5 rounded"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="skeleton h-3 rounded"></div>
                                        <div className="skeleton h-3 w-3/5 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid flex-1 grid-cols-1 gap-4 pb-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                    <div className="min-w-0 flex flex-col gap-3 overflow-y-auto">
                        {filteredFlows.map((flow: Flow) => (
                            <FlowRunAccordion
                                key={flow.id}
                                flow={flow}
                                activeFlow={activeFlowId}
                                sessionId={sessionId}
                                setActiveFlow={setActiveFlowId}
                                sessionCache={sessionData}
                                setSideView={setSideView as React.Dispatch<unknown>}
                                subUrl={subUrl}
                                onFlowStop={handleFlowStop}
                                onFlowClear={handleClearFlow}
                                onFlowClearSettled={handleClearFlowSettled}
                            />
                        ))}
                    </div>

                    <SessionSidePanel
                        sessionData={sessionData}
                        requestData={requestData}
                        responseData={responseData}
                        selectedTab={selectedTab}
                        setSelectedTab={setSelectedTab}
                        mapEnabled={mapEnabled}
                        activeFlowId={activeFlowId}
                    />
                </div>
            </div>

            {isReportDialogOpen && (
                <GenerateReportModal
                    flows={flows}
                    subUrl={subUrl}
                    sessionId={sessionId}
                    cacheSessionData={sessionData ?? null}
                    open={isReportDialogOpen}
                    onClose={() => setIsReportDialogOpen(false)}
                    startPolling={startPolling}
                    setGotReport={setGotReport}
                />
            )}
        </>
    );
}

export default RenderFlows;
