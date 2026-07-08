import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flow, MetadataField } from "@/types/flow-types";
import { ROUTES } from "@constants/routes";
import { buildDifficultyState } from "@/pages/scenario/FlowSettingsPanel";
import { InfoSection } from "@components/FlowShared/ui/InfoSection";
import { EndpointsSection } from "@components/FlowShared/ui/EndpointsSection";
import { CollapsibleSection } from "@components/FlowShared/ui/CollapsibleSection";
import { toast } from "sonner";
import { SessionCache, SessionMetadataValue } from "@/types/session-types";
import {
    useLazyGetCompletePayloadQuery,
    useLazyGetReportQuery,
    usePutCacheDataMutation,
    useLazyGetSessionByIdQuery,
} from "@store/api";
import { FlowRunAccordion } from "@components/FlowShared/complete-flow";
import { useSession } from "@hooks/useSession";
import Spinner from "@/components/Shadcn/Spinner";
import SearchableJsonView from "@components/FlowShared/searchable-json-view";
import { FlowTabs, TabsContent } from "@/components/Shadcn/Tabs";
import CircularProgress from "@/components/FlowShared/ui/CircularProgress";
import Modal from "@components/Modal";
import GuideModal from "@components/FlowShared/flow-guide";
import {
    DocumentTextIcon,
    EyeIcon,
    PlusCircleIcon,
    QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import { queryJsonPath } from "../../utils/jsonpath-query";
import FlowHelperTab from "@components/FlowShared/helper-tab";
import { GetRequestEndpoint } from "@components/FlowShared/guides";
import { Button } from "@/components/Shadcn/Button/button";
import { trackEvent } from "@utils/analytics";
import { openReportInNewTab } from "@utils/generic-utils";
import GenerateReportModal from "@components/FlowShared/GenerateReportModal";
import { FlowSettingsModal, type SettingsDraft } from "@components/FlowShared/FlowSettingsModal";
import RideMapTab from "@components/FlowShared/ride-map-tab";
import { isRideMapEnabled } from "@components/FlowShared/ride-map-utils";
import { useAppDispatch } from "@store/hooks";
import { initializeFlowPage, resetFlowRuntime, type SessionTab } from "@store/slices/sessionSlice";
import { SESSION_EMPTY_METADATA, SESSION_EMPTY_RECORD } from "@store/slices/sessionConstants";
import { upsertSession } from "@store/slices/sessionHistorySlice";
import { store } from "@store/index";

type SideViewResponse = {
    res?: Array<{ response?: Record<string, unknown> }>;
    [key: string]: unknown;
};

type SideViewState = {
    payloadId?: string;
    request?: Record<string, unknown>;
    response?: SideViewResponse;
    [key: string]: unknown;
};

function extractMetadataFromFlows(flows: Flow[]): Record<string, MetadataField[]> {
    const flowMetadataMap: Record<string, MetadataField[]> = {};

    flows.forEach((flow) => {
        const flowMetadata: MetadataField[] = [];

        flow.sequence.forEach((step) => {
            const metadataArray = step["meta-data"] || step.metadata;

            if (metadataArray && Array.isArray(metadataArray) && metadataArray.length > 0) {
                flowMetadata.push(...metadataArray);
            }
        });

        flowMetadataMap[flow.id] = flowMetadata;
    });

    return flowMetadataMap;
}

function extractMetadataByFlowName(
    flowMetadataMap: Record<string, MetadataField[]>,
    flowName: string
): MetadataField[] {
    return flowMetadataMap[flowName] || [];
}

function extractMetadataValues(
    payload: Record<string, unknown> | Record<string, unknown>[],
    metadataFields: MetadataField[]
): Record<string, SessionMetadataValue> {
    const extractedData: Record<string, SessionMetadataValue> = {};

    metadataFields.forEach((meta) => {
        try {
            const payloadData = Array.isArray(payload) ? payload[0] : payload;
            const result = queryJsonPath(payloadData, meta.path);

            const value = result.length > 0 ? result[0] : null;

            const displayValue =
                value === null ||
                value === undefined ||
                value === "" ||
                (typeof value === "string" && value.trim() === "") ||
                (Array.isArray(value) && value.length === 0) ||
                (typeof value === "object" && value !== null && Object.keys(value).length === 0)
                    ? "Data not available"
                    : value;

            extractedData[meta.description.name] = {
                value: displayValue,
            };
        } catch (error: unknown) {
            extractedData[meta.description.name] = {
                name: meta.description.name,
                value: "Data not available",
                errorMessage: error instanceof Error ? error.message : "Unknown error",
            };
        }
    });

    return extractedData;
}

function sessionCacheMeaningfullyChanged(prev: SessionCache, next: SessionCache): boolean {
    return (
        prev.activeFlow !== next.activeFlow ||
        JSON.stringify(prev.flowMap) !== JSON.stringify(next.flowMap)
    );
}

function RenderFlows({
    flows,
    subUrl,
    sessionId,
    newSession,
}: {
    flows: Flow[];
    subUrl: string;
    sessionId: string;
    newSession?: () => void;
}) {
    const dispatch = useAppDispatch();
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
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isReportDialogOpen, setIsReportDialogOpen] = useState<boolean>(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsDraft, setSettingsDraft] = useState<SettingsDraft | null>(null);
    const [isSettingsSaving, setIsSettingsSaving] = useState(false);

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
                    const response = data as unknown as SessionCache;
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
                        updateLocalStorageSession(response, sessionId);
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

        const POLL_INTERVAL = 5000;
        const TIMEOUT = 90000;
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
        }, TIMEOUT);
    };

    let filteredFlows: Flow[] = [];

    if (selectedTags.length) {
        filteredFlows = Object.entries(flows)
            .filter(([_key, cfg]) => cfg.tags?.some((t) => selectedTags.includes(t)))
            .map(([_, cfg]) => cfg);
    } else {
        filteredFlows = flows;
    }

    const handleClearFlow = () => {
        setRequestData(SESSION_EMPTY_RECORD);
        setResponseData(SESSION_EMPTY_RECORD);
        setMetadata(SESSION_EMPTY_METADATA);
        fetchSessionData();
    };

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
            setSelectedTags(settingsDraft.selectedTags);
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
            <Modal
                isOpen={isErrorModalOpen}
                onClose={() => {
                    navigate(ROUTES.HOME);
                    setIsErrorModalOpen(false);
                }}
            >
                <h1 className="text-lg font-semibold text-text-primary">Alert</h1>
                <p className="text-sm text-text-secondary">Sesson has expired.</p>
                <p className="text-sm text-text-secondary">Check support to raise a query.</p>
            </Modal>
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
                <div className="space-y-3 py-6 px-15 xl:px-0">
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
                                                const response = await triggerGetReport({
                                                    sessionId,
                                                }).unwrap();
                                                try {
                                                    const decodedHtml = response.data;
                                                    openReportInNewTab(decodedHtml, sessionId);
                                                } catch (error) {
                                                    console.error(
                                                        "Failed to decode or open Base64 HTML:",
                                                        error
                                                    );
                                                }
                                            }}
                                            disabled={!gotReport}
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

                <div className="grid flex-1 grid-cols-1 gap-4 px-15 xl:px-0 pb-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
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
                                onFlowStop={() => setIsFlowStopped(true)}
                                onFlowClear={() => handleClearFlow()}
                            />
                        ))}
                    </div>

                    <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
                        <div>
                            <FlowTabs
                                options={[
                                    { key: "Request", label: "Request" },
                                    { key: "Response", label: "Response" },
                                    { key: "Guide", label: "Guide" },
                                    ...(mapEnabled
                                        ? [{ key: "Application", label: "Application" }]
                                        : []),
                                ]}
                                value={selectedTab}
                                onValueChange={(value) => setSelectedTab(value as SessionTab)}
                            >
                                <TabsContent value="Request" className="pb-4 pt-3">
                                    {sessionData ? (
                                        <div
                                            className="overflow-auto"
                                            style={{ maxHeight: "600px" }}
                                        >
                                            <SearchableJsonView
                                                value={requestData ?? SESSION_EMPTY_RECORD}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center py-16">
                                            <Spinner className="size-8 text-brand-normal" />
                                        </div>
                                    )}
                                </TabsContent>
                                <TabsContent value="Response" className="pb-4 pt-3">
                                    {sessionData ? (
                                        <div
                                            className="overflow-auto"
                                            style={{ maxHeight: "600px" }}
                                        >
                                            <SearchableJsonView
                                                value={responseData ?? SESSION_EMPTY_RECORD}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center py-16">
                                            <Spinner className="size-8 text-brand-normal" />
                                        </div>
                                    )}
                                </TabsContent>
                                <TabsContent value="Guide" className="pb-4 pt-3">
                                    {sessionData ? (
                                        <div
                                            className="overflow-auto rounded-lg border border-n-40 bg-surface-elevated p-3 dark:border-border-default dark:bg-surface-muted"
                                            style={{ maxHeight: "600px" }}
                                        >
                                            <FlowHelperTab
                                                domain={sessionData?.domain}
                                                version={sessionData?.version}
                                                npType={sessionData?.npType}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center py-16">
                                            <Spinner className="size-8 text-brand-normal" />
                                        </div>
                                    )}
                                </TabsContent>
                                {mapEnabled ? (
                                    <TabsContent value="Application" className="px-4 pb-4 pt-3">
                                        {sessionData ? (
                                            <div
                                                className="overflow-auto rounded-lg border border-n-40 bg-surface-elevated p-3 dark:border-border-default dark:bg-surface-muted"
                                                style={{ maxHeight: "600px" }}
                                            >
                                                <RideMapTab
                                                    key={activeFlowId ?? "none"}
                                                    flowId={activeFlowId}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center py-16">
                                                <Spinner className="size-8 text-brand-normal" />
                                            </div>
                                        )}
                                    </TabsContent>
                                ) : null}
                            </FlowTabs>
                        </div>
                    </div>
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

function updateLocalStorageSession(sessionData: SessionCache, sessionId: string) {
    if (sessionData.usecaseId === "PLAYGROUND-FLOW") {
        return;
    }
    const now = new Date();
    store.dispatch(
        upsertSession({
            sessionId: sessionId,
            subscriberUrl: sessionData.subscriberUrl,
            role: sessionData.npType,
            timestamp: now.toISOString(),
            expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        })
    );
}
