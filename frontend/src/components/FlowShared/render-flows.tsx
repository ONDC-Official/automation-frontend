import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flow, MetadataField } from "@/types/flow-types";
import { ROUTES } from "@constants/routes";
import { buildDifficultyState } from "@components/ui/difficulty-cards";
import { InfoSection } from "@components/FlowShared/ui/InfoSection";
import { EndpointsSection } from "@components/FlowShared/ui/EndpointsSection";
import { CollapsibleSection } from "@components/FlowShared/ui/CollapsibleSection";
import axios, { AxiosResponse } from "axios";
import { toast } from "react-toastify";
import { SessionCache } from "@/types/session-types";
import { getCompletePayload, getReport, putCacheData } from "@utils/request-utils";
import { Accordion } from "@components/FlowShared/complete-flow";
import { useSession } from "@context/context";
import { Spinner } from "@/components/Shadcn/Spinner/spinner";
import SearchableJsonView from "@components/FlowShared/searchable-json-view";
import { FlowTabs, TabsContent } from "@/components/Shadcn/Tabs";
import { SessionContext } from "@context/context";
import CircularProgress from "@components/ui/circular-cooldown";
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

type ExtractedMetadataValue = { name?: string; value: unknown; errorMessage?: string };

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

type SessionPayloadData = Record<string, unknown> | unknown[] | null;
type SessionSideView = Record<string, unknown> | null;
type SessionMetadata = Record<string, ExtractedMetadataValue> | null;

const EMPTY_RECORD = {} as Record<string, unknown>;
const EMPTY_METADATA = {} as Record<string, ExtractedMetadataValue>;

function extractMetadataFromFlows(flows: Flow[]): Record<string, MetadataField[]> {
    const flowMetadataMap: Record<string, MetadataField[]> = {};

    flows.forEach((flow) => {
        const flowMetadata: MetadataField[] = [];

        // Extract metadata from each sequence step (API call)
        flow.sequence.forEach((step) => {
            // Look for meta-data array (with hyphen) in the sequence object
            const metadataArray = step["meta-data"] || step.metadata;

            if (metadataArray && Array.isArray(metadataArray) && metadataArray.length > 0) {
                flowMetadata.push(...metadataArray);
            } else {
                console.error(`  ❌ No metadata array found for API call ${step.key}`);
            }
        });

        // Store metadata for this specific flow
        flowMetadataMap[flow.id] = flowMetadata;
    });

    return flowMetadataMap;
}

// Function to extract metadata for a specific flow by flow name
function extractMetadataByFlowName(
    flowMetadataMap: Record<string, MetadataField[]>,
    flowName: string
): MetadataField[] {
    const flowMetadata = flowMetadataMap[flowName] || [];

    return flowMetadata;
}

// Function to extract values from payload using metadata
function extractMetadataValues(
    payload: Record<string, unknown> | Record<string, unknown>[],
    metadataFields: MetadataField[]
): Record<string, ExtractedMetadataValue> {
    const extractedData: Record<string, ExtractedMetadataValue> = {};

    metadataFields.forEach((meta) => {
        try {
            const payloadData = Array.isArray(payload) ? payload[0] : payload;
            const result = queryJsonPath(payloadData, meta.path);

            const value = result.length > 0 ? result[0] : null;

            // Filter out empty, null, undefined values and show "Data not available at this moment"
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

function RenderFlows({
    flows,
    subUrl,
    sessionId,
    // setStep,
    // setReport,
    newSession,
}: {
    flows: Flow[];
    subUrl: string;
    sessionId: string;
    newSession?: () => void;
    // setStep: React.Dispatch<React.SetStateAction<number>>;
    // setReport: React.Dispatch<React.SetStateAction<string>>;
}) {
    const [activeFlow, setActiveFlow] = useState<string | null>(null);
    const activeFlowRef = useRef<string | null>(activeFlow);
    const [cacheSessionData, setCacheSessionData] = useState<SessionCache | null>(null);
    const [sideView, setSideView] = useState<SideViewState>({});
    const [difficultyCache, setDifficultyCache] = useState<SessionCache["sessionDifficulty"]>(
        {} as SessionCache["sessionDifficulty"]
    );
    const [isFlowStopped, setIsFlowStopped] = useState<boolean>(false);
    const [selectedTab, setSelectedTab] = useState<
        "Request" | "Response" | "Metadata" | "Guide" | "Application"
    >("Request");
    const [requestData, setRequestData] = useState<Record<string, unknown>>({});
    const [responseData, setResponseData] = useState<Record<string, unknown> | SideViewResponse>(
        {}
    );
    const [metadata, setMetadata] = useState<Record<string, ExtractedMetadataValue>>({});
    const apiCallFailCount = useRef(0);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const navigate = useNavigate();
    const { setSessionId } = useSession();
    const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [gotReport, setGotReport] = useState(false);
    const [flowTags, setFlowTags] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [activeCallClickedToggle, setActiveCallClickedToggle] = useState<boolean>(false);
    const [isReportDialogOpen, setIsReportDialogOpen] = useState<boolean>(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsDraft, setSettingsDraft] = useState<SettingsDraft | null>(null);
    const [isSettingsSaving, setIsSettingsSaving] = useState(false);
    // Frontend-only UI prefs (persisted in localStorage; NOT saved to the backend session).
    // Auto-scroll defaults on; experimental mode defaults off.
    const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(() => {
        try {
            return localStorage.getItem("flow-auto-scroll-enabled") !== "false";
        } catch {
            return true;
        }
    });
    useEffect(() => {
        try {
            localStorage.setItem("flow-auto-scroll-enabled", String(autoScrollEnabled));
        } catch {
            /* ignore storage failures */
        }
    }, [autoScrollEnabled]);
    const [experimentalMode, setExperimentalMode] = useState<boolean>(() => {
        try {
            return localStorage.getItem("flow-experimental-mode") === "true";
        } catch {
            return false;
        }
    });
    useEffect(() => {
        try {
            localStorage.setItem("flow-experimental-mode", String(experimentalMode));
        } catch {
            /* ignore storage failures */
        }
    }, [experimentalMode]);

    const startPolling = () => {
        if (isPolling) return; // Prevent multiple starts
        setIsPolling(true);

        const POLL_INTERVAL = 5000; // 5 seconds
        const TIMEOUT = 90000; // 90 seconds
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
                const result = await getReport(sessionId);

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

        // Start first poll
        poll();

        // Set timeout to stop polling after 90s
        timeoutRef.current = setTimeout(() => {
            toast.error("Something went wrong while fetching the report.");
            stopPolling();
        }, TIMEOUT);
    };

    useEffect(() => {
        fetchSessionData();
    }, [subUrl]);

    useEffect(() => {
        const allTags = new Set(Object.values(flows).flatMap((cfg) => cfg.tags ?? []));
        const tagsArray = [...allTags].filter((tag) => tag !== "WORKBENCH");
        setFlowTags(tagsArray);
    }, [flows]);

    useEffect(() => {
        if (sideView?.payloadId) {
            test();
        } else {
            setRequestData(sideView || EMPTY_RECORD);
            setResponseData(sideView || EMPTY_RECORD);
            setMetadata(EMPTY_METADATA);
        }

        extractMetadataFromFlows(flows);
    }, [sideView, flows, activeFlow]);

    const test = async () => {
        try {
            // ✅ Fetch payload
            const data = await getCompletePayload([(sideView.payloadId as string) ?? ""]);

            const requestPayload = (data?.[0]?.req ?? EMPTY_RECORD) as Record<string, unknown>;
            let responsePayload: Record<string, unknown> = {};

            // ✅ Extract response payload safely
            if (sideView?.response?.res?.[0]?.response) {
                responsePayload = sideView.response.res[0].response;
            } else if (sideView?.response) {
                responsePayload = sideView.response;
            }

            setRequestData(requestPayload);
            setResponseData(responsePayload);

            // ✅ Extract metadata if flows are available
            handleMetadataExtraction(requestPayload);
        } catch (error: unknown) {
            const requestPayload = sideView?.request ?? EMPTY_RECORD;
            let responsePayload: Record<string, unknown> = {};

            if (sideView?.response?.res?.[0]?.response) {
                responsePayload = sideView.response.res[0].response;
            } else if (sideView?.response) {
                responsePayload = sideView.response;
            }

            setRequestData(requestPayload);
            setResponseData(responsePayload);

            // ✅ Extract metadata from fallback
            handleMetadataExtraction(requestPayload);
            console.error("Error while extracting metadata: ", error);
        }
    };

    /**
     * Helper function to handle metadata extraction from flows
     */
    const handleMetadataExtraction = (requestPayload: Record<string, unknown>) => {
        if (!flows || flows.length === 0) {
            setMetadata(EMPTY_METADATA);
            return;
        }

        const flowMetadataMap = extractMetadataFromFlows(flows);

        if (!Object.keys(flowMetadataMap).length) {
            setMetadata(EMPTY_METADATA);
            return;
        }

        // Use active flow if available, otherwise use first flow or all flows combined
        let metadataToUse: MetadataField[] = [];

        if (activeFlow && flowMetadataMap[activeFlow]) {
            metadataToUse = extractMetadataByFlowName(flowMetadataMap, activeFlow);
        } else {
            // Combine metadata from all flows if no specific flow is active
            metadataToUse = Object.values(flowMetadataMap).flat();
        }

        if (requestPayload && Object.keys(requestPayload).length > 0) {
            const Metadata = extractMetadataValues(requestPayload, metadataToUse);
            setMetadata(Metadata);
        } else {
            setMetadata(EMPTY_METADATA);
        }
    };

    // Update the ref whenever activeFlow changes
    useEffect(() => {
        activeFlowRef.current = activeFlow;
    }, [activeFlow]);

    // The ride-map feature (Application tab + live map) is only available for ONDC:TRV10 2.0.1.
    const mapEnabled = isRideMapEnabled(cacheSessionData?.domain, cacheSessionData?.version);

    // For the map-enabled domain, surface the live map by default: auto-select the "Application"
    // tab once the session loads so the map is visible the moment start/end locations are entered
    // — on both buyer (BPP) and seller (BAP) sides. Runs once so it never fights a manual tab
    // change the user makes afterwards.
    const tabAutoDefaultedRef = useRef(false);
    useEffect(() => {
        if (tabAutoDefaultedRef.current) return;
        if (mapEnabled) {
            tabAutoDefaultedRef.current = true;
            setSelectedTab("Application");
        }
    }, [mapEnabled]);

    // If the session is not map-enabled, never leave the UI on the (now hidden) Application tab.
    useEffect(() => {
        if (!mapEnabled && selectedTab === "Application") {
            setSelectedTab("Request");
        }
    }, [mapEnabled, selectedTab]);

    // Extract metadata whenever flows are provided
    useEffect(() => {
        if (flows && flows.length > 0) {
            handleMetadataExtraction(requestData);
        } else {
            setMetadata(EMPTY_METADATA);
        }
    }, [flows, requestData, responseData]);

    function fetchSessionData() {
        axios
            .get(`${import.meta.env.VITE_BACKEND_URL}/sessions`, {
                params: {
                    session_id: sessionId,
                },
            })
            .then((response: AxiosResponse<SessionCache>) => {
                const filteredData = Object.entries(response.data)
                    .filter(([_, value]) => typeof value === "string")
                    .reduce((acc: Record<string, unknown>, [key, value]) => {
                        acc[key] = value;
                        return acc;
                    }, {});
                delete filteredData["active_session_id"];
                setDifficultyCache(response.data.sessionDifficulty);
                setCacheSessionData(response.data);

                if (cacheSessionData === null) {
                    updateLocalStorageSession(response.data, sessionId);
                }
                apiCallFailCount.current = 0; // Reset fail count on successful fetch
            })
            .catch((e: unknown) => {
                console.error("Error while fetching session: ", e);
                apiCallFailCount.current = apiCallFailCount.current + 1;
            });
    }

    let filteredFlows: Flow[] = [];

    if (selectedTags.length) {
        filteredFlows = Object.entries(flows)
            .filter(([_key, cfg]) => cfg.tags?.some((t) => selectedTags.includes(t)))
            .map(([_, cfg]) => cfg);
    } else {
        filteredFlows = flows;
    }

    const handleClearFlow = () => {
        setRequestData(EMPTY_RECORD);
        setResponseData(EMPTY_RECORD);
        setMetadata(EMPTY_METADATA);
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
            await putCacheData({ sessionDifficulty }, sessionId);

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
        <SessionContext.Provider
            value={{
                sessionId,
                setSessionId,
                activeFlowId: activeFlow,
                sessionData: cacheSessionData,
                setSessionData: setCacheSessionData,
                selectedTab: selectedTab,
                requestData,
                responseData,
                sideView: sideView as unknown as SessionSideView,
                metadata: metadata as unknown as SessionMetadata,
                setRequestData: setRequestData as unknown as React.Dispatch<
                    React.SetStateAction<SessionPayloadData>
                >,
                setResponseData: setResponseData as unknown as React.Dispatch<
                    React.SetStateAction<SessionPayloadData>
                >,
                setSideView: setSideView as unknown as React.Dispatch<
                    React.SetStateAction<SessionSideView>
                >,
                setMetadata: setMetadata as unknown as React.Dispatch<
                    React.SetStateAction<SessionMetadata>
                >,
                setActiveCallClickedToggle: setActiveCallClickedToggle,
                activeCallClickedToggle: activeCallClickedToggle,
                autoScrollEnabled: autoScrollEnabled,
                setAutoScrollEnabled: setAutoScrollEnabled,
                experimentalMode: experimentalMode,
                setExperimentalMode: setExperimentalMode,
            }}
        >
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
                domain={cacheSessionData?.domain}
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
                    {cacheSessionData ? (
                        <div className="flex flex-col gap-3">
                            <InfoSection
                                data={{
                                    sessionId: sessionId,
                                    subscriberUrl: subUrl,
                                    activeFlow: activeFlow || "N/A",
                                    subscriberType: cacheSessionData.npType,
                                    domain: cacheSessionData.domain,
                                    version: cacheSessionData.version,
                                    env: cacheSessionData.env,
                                    use_case: cacheSessionData.usecaseId,
                                }}
                                pollingIndicator={
                                    <CircularProgress
                                        duration={5}
                                        id="flow-cool-down"
                                        loop={true}
                                        onComplete={async () => {
                                            if (apiCallFailCount.current < 5) {
                                                fetchSessionData();
                                            } else if (
                                                apiCallFailCount.current >= 5 &&
                                                !isErrorModalOpen
                                            ) {
                                                setIsErrorModalOpen(true);
                                            }
                                        }}
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
                                                onClick={async () => {
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
                                            onClick={async () => {
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
                                                const response = await getReport(sessionId);
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
                                        cacheSessionData.domain,
                                        cacheSessionData.version,
                                        cacheSessionData.npType
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
                            <Accordion
                                key={flow.id}
                                flow={flow}
                                activeFlow={activeFlow}
                                sessionId={sessionId}
                                setActiveFlow={setActiveFlow}
                                sessionCache={cacheSessionData}
                                setSideView={setSideView as unknown as React.Dispatch<unknown>}
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
                                onValueChange={(value) =>
                                    setSelectedTab(
                                        value as
                                            | "Request"
                                            | "Response"
                                            | "Metadata"
                                            | "Guide"
                                            | "Application"
                                    )
                                }
                            >
                                <TabsContent value="Request" className="pb-4 pt-3">
                                    {cacheSessionData ? (
                                        <div
                                            className="overflow-auto"
                                            style={{ maxHeight: "600px" }}
                                        >
                                            <SearchableJsonView value={requestData} />
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center py-16">
                                            <Spinner className="size-8 text-brand-normal" />
                                        </div>
                                    )}
                                </TabsContent>
                                <TabsContent value="Response" className="pb-4 pt-3">
                                    {cacheSessionData ? (
                                        <div
                                            className="overflow-auto"
                                            style={{ maxHeight: "600px" }}
                                        >
                                            <SearchableJsonView value={responseData} />
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center py-16">
                                            <Spinner className="size-8 text-brand-normal" />
                                        </div>
                                    )}
                                </TabsContent>
                                <TabsContent value="Guide" className="pb-4 pt-3">
                                    {cacheSessionData ? (
                                        <div
                                            className="overflow-auto rounded-lg border border-n-40 bg-surface-elevated p-3 dark:border-border-default dark:bg-surface-muted"
                                            style={{ maxHeight: "600px" }}
                                        >
                                            <FlowHelperTab
                                                domain={cacheSessionData?.domain}
                                                version={cacheSessionData?.version}
                                                npType={cacheSessionData?.npType}
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
                                        {cacheSessionData ? (
                                            <div
                                                className="overflow-auto rounded-lg border border-n-40 bg-surface-elevated p-3 dark:border-border-default dark:bg-surface-muted"
                                                style={{ maxHeight: "600px" }}
                                            >
                                                <RideMapTab
                                                    key={activeFlow ?? "none"}
                                                    flowId={activeFlow}
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
                    cacheSessionData={cacheSessionData}
                    open={isReportDialogOpen}
                    onClose={() => setIsReportDialogOpen(false)}
                    startPolling={startPolling}
                    setGotReport={setGotReport}
                />
            )}
        </SessionContext.Provider>
    );
}

export default RenderFlows;

function updateLocalStorageSession(sessionData: SessionCache, sessionId: string) {
    if (sessionData.usecaseId === "PLAYGROUND-FLOW") {
        return;
    }
    const now = new Date();
    const data = {
        sessionId: sessionId,
        subscriberUrl: sessionData.subscriberUrl,
        role: sessionData.npType,
        timestamp: now.toISOString(),
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    };
    const currentData = JSON.parse(localStorage.getItem("flowTestingSessions") || "[]");
    const existingIndex = currentData.findIndex(
        (item: { sessionId: string }) => item.sessionId === sessionId
    );
    if (existingIndex !== -1) {
        currentData[existingIndex] = {
            ...data,
            timestamp: currentData[existingIndex].timestamp,
            expiresAt: currentData[existingIndex].expiresAt,
        };
    } else {
        currentData.push(data);
    }
    localStorage.setItem("flowTestingSessions", JSON.stringify(currentData));
}
