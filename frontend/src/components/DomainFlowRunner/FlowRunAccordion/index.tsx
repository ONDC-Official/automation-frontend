import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { SubmitEventParams } from "@/types/flow-types";
import { SessionCache } from "@/types/session-types";
import { FlowActionButton } from "@components/DomainFlowRunner/FlowActionButton";
import { Progress } from "@components/Shadcn/Progress/progress";
import {
    useClearFlowDataMutation,
    useDeleteExpectationMutation,
    useLazyGetCompletePayloadQuery,
    useLazyGetMappedFlowQuery,
    useLazyGetSessionByIdQuery,
    useNewFlowMutation,
    useProceedFlowMutation,
    usePutCacheDataMutation,
    useAddFlowToSessionInDBMutation,
    sessionApi,
} from "@store/api";
import { store } from "@store/index";
import { FlowMap } from "@/types/flow-state-type";
import DisplayFlow from "@components/DomainFlowRunner/MappedFlow";
import { getSequenceFromFlow } from "@utils/flow-utils";
import CircularProgress from "@components/DomainFlowRunner/CircularProgress";
import FormFlowDialog from "@components/Shadcn/Dialog/form-flow-dialog";
import { FormConfigType } from "@components/Forms/config-form/types";
import { FormConfig } from "@components/Forms/config-form";
import { trackEvent } from "@utils/analytics";
import { generatePlaygroundConfigFromFlowConfig } from "@ondc/automation-mock-runner";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { IFlowRunAccordionProps } from "@components/DomainFlowRunner/types";
import { useSession } from "@hooks/useSession";
import { useAppSelector } from "@store/hooks";
import { selectActiveFlowLifecycleInFlight } from "@store/slices/sessionSlice";

function normalizeServerActiveFlow(activeFlow: string | null | undefined): string | null {
    if (!activeFlow || activeFlow === "NONE") return null;
    return activeFlow;
}

export function FlowRunAccordion({
    flow,
    activeFlow,
    setActiveFlow,
    sessionCache,
    sessionId,
    subUrl,
    onFlowStop,
    onFlowClear,
    onFlowClearSettled,
}: IFlowRunAccordionProps) {
    const [inputPopUp, setInputPopUp] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [mappedFlow, setMappedFlow] = useState<FlowMap>({
        sequence: getSequenceFromFlow(
            sessionCache?.flowConfigs[flow.id] ?? flow,
            sessionCache,
            activeFlow
        ),
        missedSteps: [],
    });
    const [activeFormConfig, setActiveFormConfig] = useState<FormConfigType | null>(null);
    const [activeFormTitle, setActiveFormTitle] = useState<string | undefined>(undefined);
    const contentRef = useRef<HTMLDivElement>(null);
    const [maxHeight, setMaxHeight] = useState("0px");
    const apiCallFailCount = useRef(0);
    const clickCountRef = useRef(0);
    const [isBusy, setIsBusy] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const activeFlowRef = useRef(activeFlow);
    activeFlowRef.current = activeFlow;
    const lifecycleGenRef = useRef(0);
    const isClearingRef = useRef(false);

    const {
        isFlowFormDialogOpen,
        acquireFlowFormDialogLock,
        releaseFlowFormDialogLock,
        applyOptimisticActiveFlow,
        beginActiveFlowLifecycle,
        endActiveFlowLifecycle,
    } = useSession();
    const lifecycleInFlight = useAppSelector(selectActiveFlowLifecycleInFlight);

    const [clearFlowData] = useClearFlowDataMutation();
    const [deleteExpectation] = useDeleteExpectationMutation();
    const [triggerGetCompletePayload] = useLazyGetCompletePayloadQuery();
    const [triggerGetMappedFlow] = useLazyGetMappedFlowQuery();
    const [triggerGetSessionById] = useLazyGetSessionByIdQuery();
    const [newFlow] = useNewFlowMutation();
    const [proceedFlow] = useProceedFlowMutation();
    const [putCacheData] = usePutCacheDataMutation();
    const [addFlowToSessionInDB] = useAddFlowToSessionInDBMutation();

    useEffect(() => {
        if (!inputPopUp) return;
        acquireFlowFormDialogLock?.();
        return () => releaseFlowFormDialogLock?.();
    }, [inputPopUp, acquireFlowFormDialogLock, releaseFlowFormDialogLock]);

    const getCurrentState = useCallback(
        async (cache: SessionCache) => {
            const tx = cache.flowMap?.[flow.id];
            if (tx) {
                try {
                    const txData = await triggerGetMappedFlow({
                        transactionId: tx,
                        sessionId,
                    }).unwrap();
                    for (let i = 0; i < txData.sequence.length; i++) {
                        const payloads = txData.sequence[i].payloads;
                        if (payloads) {
                            if (!payloads.entryType) {
                                txData.sequence[i].payloads!.entryType = "API";
                            }
                        }
                    }
                    setMappedFlow(txData);
                    apiCallFailCount.current = 0;
                } catch (error) {
                    apiCallFailCount.current = apiCallFailCount.current + 1;
                    console.error("Failed to fetch transaction data:", error);
                }
            } else {
                setMappedFlow({
                    sequence: getSequenceFromFlow(
                        cache?.flowConfigs[flow.id] ?? flow,
                        cache,
                        activeFlowRef.current
                    ),
                    missedSteps: [],
                });
            }
        },
        [flow, sessionId, triggerGetMappedFlow]
    );

    const fetchTransactionData = useCallback(async () => {
        if (activeFlow !== flow.id || !sessionCache) {
            return;
        }
        await getCurrentState(sessionCache);
    }, [activeFlow, flow.id, sessionCache, getCurrentState]);

    const onMappedFlowPollComplete = useCallback(async () => {
        if (apiCallFailCount.current < 5) {
            await fetchTransactionData();
        }
    }, [fetchTransactionData]);

    // Refresh mapped-flow for flows that already have a transaction — do not touch activeFlow here.
    const flowMapEntry = sessionCache?.flowMap?.[flow.id];
    useEffect(() => {
        // Skip while Clear is resetting — a stale session poll must not rehydrate progress.
        if (isClearingRef.current) return;
        if (flowMapEntry && sessionCache) {
            void getCurrentState(sessionCache);
        }
    }, [flow.id, flowMapEntry, sessionCache, getCurrentState]);

    // Adopt server activeFlow only when a lifecycle write is not in flight.
    useEffect(() => {
        if (lifecycleInFlight) return;
        const serverActive = normalizeServerActiveFlow(sessionCache?.activeFlow);
        setActiveFlow(serverActive);
    }, [sessionCache?.activeFlow, lifecycleInFlight, setActiveFlow]);

    // Catch up mapped-flow state when returning to this tab (e.g. buyer tab while seller
    // requests run in another tab or via Postman).
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState !== "visible") return;
            if (activeFlow !== flow.id || !sessionCache) return;
            void getCurrentState(sessionCache);
        };
        document.addEventListener("visibilitychange", onVisible);
        return () => document.removeEventListener("visibilitychange", onVisible);
    }, [activeFlow, flow.id, sessionCache, getCurrentState]);

    useEffect(() => {
        if (contentRef.current) {
            setMaxHeight(isOpen ? `${contentRef.current.scrollHeight}px` : "0px");
        }
    }, [isOpen, mappedFlow]);

    async function handleFormForNewFlow(formData: SubmitEventParams) {
        try {
            await newFlow({
                sessionId,
                flowId: flow.id,
                transactionId: uuidv4(),
                jsonPathChanges: formData.jsonPath,
                inputs: formData.formData,
            });
            setInputPopUp(false);
            toast.success("Flow started successfully");
        } catch (e) {
            toast.error("Error while submitting form");
            setInputPopUp(false);
            console.error(e);
        }
    }

    const revertActiveFlow = useCallback(
        (previous: string | null) => {
            applyOptimisticActiveFlow(previous);
        },
        [applyOptimisticActiveFlow]
    );

    const startFlow = async () => {
        if (!sessionCache) return;
        const previousActive = activeFlowRef.current;
        const gen = ++lifecycleGenRef.current;

        beginActiveFlowLifecycle();
        applyOptimisticActiveFlow(flow.id);
        setIsOpen(true);
        // Release the dual-click guard now that Stop is visible — network work continues under the lifecycle lock.
        setIsBusy(false);

        try {
            // Always decide resume vs new from the latest server session so a
            // just-cleared flow never resumes from a stale React/Redux cache.
            let latestSession = sessionCache;
            try {
                const refreshed = await triggerGetSessionById({ sessionId }).unwrap();
                latestSession = refreshed as SessionCache;
            } catch (refreshError) {
                console.error(
                    "Failed to refresh session before start; using cached session",
                    refreshError
                );
            }

            const canStart = await canStartFlow(latestSession, mappedFlow);
            if (gen !== lifecycleGenRef.current) return;
            if (!canStart) {
                revertActiveFlow(previousActive);
                return;
            }

            const given = latestSession.flowMap?.[flow.id];
            if (given) {
                toast.info("Resuming the flow!");
                await proceedFlow({ sessionId, transactionId: given }).unwrap();
            } else {
                const txId = uuidv4();
                const result = await newFlow({ sessionId, flowId: flow.id, transactionId: txId });
                const data = result.data;
                if (data?.inputs) {
                    toast.info("Inputs are required to start the flow");
                    setActiveFormConfig(data.inputs as unknown as FormConfigType);
                    setActiveFormTitle(flow.title ?? flow.id);
                    setInputPopUp(true);
                }
            }
            if (gen !== lifecycleGenRef.current) return;
            await putCacheData({ data: { activeFlow: flow.id }, sessionId });
        } catch (e) {
            if (gen !== lifecycleGenRef.current) return;
            revertActiveFlow(previousActive);
            toast.error("Error while starting flow");
            console.error(e);
        } finally {
            if (gen === lifecycleGenRef.current) {
                endActiveFlowLifecycle();
            }
        }
    };

    const handleStartClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (isBusy || lifecycleInFlight) return;
        setIsBusy(true);
        try {
            void addFlowToSessionInDB({
                sessionId,
                flow: {
                    id: flow.id,
                    status: "PENDING",
                },
            });
            trackEvent({
                category: "SCENARIO_TESTING-FLOWS",
                action: `Started a flow: ${flow.id}`,
            });
            await startFlow();
        } finally {
            setIsBusy(false);
        }
    };

    const handleStopClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        // Allow Stop during an in-flight Start so the user can cancel immediately.
        if (isBusy) return;
        const gen = ++lifecycleGenRef.current;
        setIsBusy(true);
        beginActiveFlowLifecycle();
        applyOptimisticActiveFlow(null);
        setIsOpen(false);
        onFlowStop();

        try {
            trackEvent({
                category: "SCENARIO_TESTING-FLOWS",
                action: `Stopped a flow: ${flow.id}`,
            });
            // Persist stop before enabling Clear so a concurrent clearFlow write
            // cannot be overwritten by a late putCacheData RMW of the session.
            void deleteExpectation({ sessionId, subscriberUrl: subUrl });
            await putCacheData({ data: { activeFlow: "NONE" }, sessionId });
        } catch (err) {
            console.error(err);
            toast.error("Error while stopping flow");
        } finally {
            if (gen === lifecycleGenRef.current) {
                endActiveFlowLifecycle();
            }
            setIsBusy(false);
        }
    };

    const handleClearClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        // Block Clear while Stop/Start is still persisting session state.
        if (isBusy || lifecycleInFlight || isClearingRef.current) return;
        setIsBusy(true);
        isClearingRef.current = true;
        try {
            trackEvent({
                category: "SCENARIO_TESTING-FLOWS",
                action: `Cleared a flow: ${flow.id}`,
            });
            setMappedFlow({
                sequence: getSequenceFromFlow(
                    sessionCache?.flowConfigs[flow.id] ?? flow,
                    sessionCache,
                    null
                ),
                missedSteps: [],
            });
            // Optimistically drop the flow from the parent session cache so Start
            // cannot resume from a stale flowMap and progress cannot rehydrate.
            onFlowClear(flow.id);
            await clearFlowData({ sessionId, flowId: flow.id });
            onFlowClearSettled(flow.id);
        } finally {
            isClearingRef.current = false;
            setIsBusy(false);
        }
    };

    if (!sessionCache) {
        return (
            <div className="mb-3 w-full rounded-xl border border-n-30 bg-surface-elevated p-5 shadow-xs dark:border-border-default">
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
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="h-5 w-56 rounded skeleton" />
                        <div className="size-5 rounded skeleton" />
                    </div>
                    <div className="h-1.5 w-full rounded-full skeleton" />
                    <div className="flex items-center justify-between gap-3">
                        <div className="h-4 w-40 rounded skeleton" />
                        <div className="flex items-center gap-2">
                            <div className="size-10 rounded-full skeleton" />
                            <div className="size-10 rounded-full skeleton" />
                            <div className="size-10 rounded-full skeleton" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const handlePlaygroundConversion = async () => {
        const payload_ids = mappedFlow?.sequence.flatMap((s) => {
            if (s.payloads?.entryType === "FORM") {
                return [];
            }
            return s.payloads?.payloads.map((p) => p.payloadId) ?? [];
        });

        if (!payload_ids) {
            return;
        }
        const jsonData = (await triggerGetCompletePayload({
            payloadIds: payload_ids,
        }).unwrap()) as unknown as {
            req: {
                context: {
                    domain: string;
                    action: string;
                    version?: string;
                    core_version?: string;
                    timestamp: string;
                };
            };
        }[];
        const allPayloads = jsonData.map((data) => data.req);
        const playroundConfig = await generatePlaygroundConfigFromFlowConfig(allPayloads, flow);
        const blob = new Blob([JSON.stringify(playroundConfig, null, 2)], {
            type: "application/json",
        });

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `${flow?.id}-playground-config.json`;
        document.body.appendChild(a);

        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const handleDownload = async () => {
        const payload_ids = mappedFlow?.sequence.flatMap((s) => {
            if (s.payloads?.entryType === "FORM") {
                return [];
            }
            return s.payloads?.payloads.map((p) => p.payloadId) ?? [];
        });

        if (!payload_ids) {
            return;
        }

        const jsonData = await triggerGetCompletePayload({ payloadIds: payload_ids }).unwrap();
        const jsonString = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `${flow?.id}-${activeFlow}.json`;
        document.body.appendChild(a);

        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    async function onAccordionClick() {
        setIsOpen((prev) => !prev);
    }

    async function playgroundClick() {
        try {
            clickCountRef.current += 1;

            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            timerRef.current = setTimeout(() => {
                clickCountRef.current = 0;
            }, 300);

            if (clickCountRef.current === 4) {
                toast.info("Generating playground config...");
                await handlePlaygroundConversion();
                clickCountRef.current = 0;
            }
        } catch (err) {
            console.error("Error in downloading playground config", err);
            toast.error("Error in downloading playground config");
        }
    }

    const isActiveFlow = activeFlow === flow.id;
    const flowPercent = getPercent(mappedFlow);
    const flowTitle = flow.title || flow.id.split("_").join(" ");

    return (
        <div className="mb-3 w-full">
            <div
                className={cn(
                    "overflow-hidden rounded-xl border border-n-30 shadow-xs dark:border-border-default",
                    isActiveFlow ? "bg-brand-light/40 dark:bg-brand-dark/20" : "bg-surface-elevated"
                )}
            >
                <div
                    className="cursor-pointer px-5 py-4"
                    onClick={async () => await onAccordionClick()}
                    aria-expanded={isOpen}
                    aria-controls={`accordion-content-${flow.id}`}
                >
                    <div className="flex items-center justify-between gap-3">
                        <h2
                            className="min-w-0 flex-1 wrap-break-word text-body-1 font-semibold text-text-primary"
                            onClick={playgroundClick}
                        >
                            {flowTitle}
                        </h2>
                        <ChevronDownIcon
                            className={cn(
                                "size-5 shrink-0 text-text-secondary transition-transform duration-300",
                                isOpen && "rotate-180"
                            )}
                        />
                    </div>

                    <div className="mt-3">
                        <FlowProgress
                            percent={flowPercent}
                            description={flow.description}
                            actions={
                                <div onClick={(e) => e.stopPropagation()}>
                                    <AccordionButtons
                                        activeFlow={activeFlow}
                                        flowId={flow.id}
                                        isBusy={isBusy}
                                        hasSequence={Boolean(
                                            mappedFlow?.sequence && mappedFlow.sequence.length > 0
                                        )}
                                        isMappedFlowPollActive={
                                            activeFlow === flow.id &&
                                            !isFlowFormDialogOpen &&
                                            !inputPopUp
                                        }
                                        onStart={handleStartClick}
                                        onStop={handleStopClick}
                                        onClear={handleClearClick}
                                        onDownload={async (e) => {
                                            trackEvent({
                                                category: "SCENARIO_TESTING-FLOWS",
                                                action: `Download logs for flow: ${flow.id}`,
                                            });
                                            e.stopPropagation();
                                            await handleDownload();
                                        }}
                                        onMappedFlowPollComplete={onMappedFlowPollComplete}
                                    />
                                </div>
                            }
                        />
                    </div>
                </div>

                <div
                    ref={contentRef}
                    id={`accordion-content-${flow.id}`}
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ maxHeight }}
                >
                    <div className="border-t border-n-30 px-5 pb-5 pt-4 dark:border-border-default">
                        <DisplayFlow mappedFlow={mappedFlow} flowId={flow.id} />
                    </div>
                </div>
            </div>
            {inputPopUp && activeFormConfig && (
                <FormFlowDialog open={inputPopUp} disableClose width="2xl" title={activeFormTitle}>
                    <FormConfig
                        formConfig={activeFormConfig}
                        submitEvent={handleFormForNewFlow}
                        referenceData={mappedFlow.reference_data}
                        flowId={flow.id}
                    />
                </FormFlowDialog>
            )}
        </div>
    );
}

function AccordionButtons({
    activeFlow,
    flowId,
    isBusy,
    hasSequence,
    isMappedFlowPollActive,
    onStart,
    onStop,
    onClear,
    onDownload,
    onMappedFlowPollComplete,
}: {
    activeFlow: string | null;
    flowId: string;
    isBusy: boolean;
    hasSequence: boolean;
    isMappedFlowPollActive: boolean;
    onStart: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
    onStop: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
    onClear: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
    onDownload: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
    onMappedFlowPollComplete: () => Promise<void>;
}) {
    return (
        <div className="flex items-center gap-2">
            {!activeFlow ? (
                <FlowActionButton
                    label="Start flow"
                    variant="play"
                    disabled={isBusy}
                    onClick={onStart}
                />
            ) : null}
            {activeFlow === flowId ? (
                <FlowActionButton
                    label="Stop flow"
                    variant="stop"
                    disabled={isBusy}
                    onClick={onStop}
                />
            ) : null}
            {!activeFlow ? (
                <FlowActionButton
                    label="Clear flow data"
                    variant="delete"
                    disabled={isBusy}
                    onClick={onClear}
                />
            ) : null}
            {hasSequence ? (
                <FlowActionButton label="Download Logs" variant="download" onClick={onDownload} />
            ) : null}
            <CircularProgress
                key={flowId}
                sqSize={24}
                strokeWidth={3}
                duration={3}
                onComplete={onMappedFlowPollComplete}
                loop={true}
                isActive={isMappedFlowPollActive}
                id={`fetch-transaction-data-${flowId}`}
            />
        </div>
    );
}

async function canStartFlow(sessionData: SessionCache, mappedFlow: FlowMap) {
    const action = mappedFlow.sequence[0].actionType;
    if (mappedFlow.sequence[0].expect && sessionData.npType === "BAP") {
        const result = await store.dispatch(
            sessionApi.endpoints.requestForFlowPermission.initiate({
                action,
                subscriberUrl: sessionData.subscriberUrl,
            })
        );
        return result.data?.valid;
    }
    return true;
}

const FlowProgress = ({
    percent,
    description,
    actions,
}: {
    percent: number;
    description: string;
    actions?: ReactNode;
}) => (
    <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Progress
                value={percent}
                className="h-1.5 w-full bg-n-30 **:data-[slot=progress-indicator]:bg-brand-normal dark:bg-surface-muted"
            />
            <div className="flex min-w-0 items-center gap-3">
                <span className="min-w-0 flex-1 wrap-break-word text-body-2 font-regular text-text-secondary">
                    {description}
                </span>
                <span className="shrink-0 text-body-2 font-bold text-brand-normal">
                    {percent.toFixed(0)}%
                </span>
            </div>
        </div>
        {actions ? <div className="flex shrink-0 items-center">{actions}</div> : null}
    </div>
);

function getPercent(mappedFlow: FlowMap) {
    const totalSteps = mappedFlow.sequence.length;
    if (totalSteps === 0) return 0;
    const completedSteps = mappedFlow.sequence.filter((step) => step.status === "COMPLETE").length;
    return (completedSteps / totalSteps) * 100;
}
