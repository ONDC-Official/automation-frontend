import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { SubmitEventParams } from "@/types/flow-types";
import { SessionCache } from "@/types/session-types";
import { FlowActionButton } from "@components/FlowShared/ui/FlowActionButton";
import { Progress } from "@/components/Shadcn/Progress/progress";
import {
    clearFlowData,
    deleteExpectation,
    getCompletePayload,
    getMappedFlow,
    newFlow,
    proceedFlow,
    requestForFlowPermission,
    putCacheData,
    addFlowToSessionInDB,
} from "@utils/request-utils";
import { FlowMap } from "@/types/flow-state-type";
import DisplayFlow from "@components/FlowShared/mapped-flow";
import { getSequenceFromFlow } from "@utils/flow-utils";
import CircularProgress from "@components/ui/circular-cooldown";
import FormFlowDialog from "@/components/Shadcn/Dialog/form-flow-dialog";
import FormConfig, { FormConfigType } from "@components/ui/forms/config-form/config-form";
import { trackEvent } from "@utils/analytics";
import { generatePlaygroundConfigFromFlowConfig } from "@ondc/automation-mock-runner";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { IAccordionProps } from "@components/FlowShared/types";
import { useSession } from "@context/context";

export function Accordion({
    flow,
    activeFlow,
    setActiveFlow,
    sessionCache,
    sessionId,
    subUrl,
    onFlowStop,
    onFlowClear,
}: IAccordionProps) {
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
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { isFlowFormDialogOpen, acquireFlowFormDialogLock, releaseFlowFormDialogLock } =
        useSession();

    useEffect(() => {
        if (!inputPopUp) return;
        acquireFlowFormDialogLock?.();
        return () => releaseFlowFormDialogLock?.();
    }, [inputPopUp, acquireFlowFormDialogLock, releaseFlowFormDialogLock]);

    useEffect(() => {
        const executedFlowId = Object.keys(
            (sessionCache?.flowMap as Record<string, string | null>) || {}
        );

        if (executedFlowId.includes(flow.id) && sessionCache) {
            getCurrentState(sessionCache);
        }

        if (sessionCache?.activeFlow) {
            setActiveFlow(sessionCache.activeFlow);
        } else {
            setActiveFlow(null);
        }
    }, [flow, sessionCache]);

    const getCurrentState = async (sessionCache: SessionCache) => {
        const tx = sessionCache.flowMap?.[flow.id];
        if (tx) {
            try {
                const txData = await getMappedFlow(tx, sessionId);
                for (let i = 0; i < txData.sequence.length; i++) {
                    const payloads = txData.sequence[i].payloads;
                    if (payloads) {
                        if (!payloads.entryType) {
                            txData.sequence[i].payloads!.entryType = "API";
                        }
                    }
                }
                setMappedFlow(txData);
                apiCallFailCount.current = 0; // Reset fail count on successful fetch
            } catch (error) {
                apiCallFailCount.current = apiCallFailCount.current + 1;
                console.error("Failed to fetch transaction data:", error);
            }
        } else {
            setMappedFlow({
                sequence: getSequenceFromFlow(flow, sessionCache, activeFlow),
                missedSteps: [],
            });
        }
    };

    const fetchTransactionData = async () => {
        if (activeFlow !== flow.id || !sessionCache) {
            return;
        }
        getCurrentState(sessionCache);
    };

    useEffect(() => {
        if (contentRef.current) {
            setMaxHeight(isOpen ? `${contentRef.current.scrollHeight}px` : "0px");
        }
    }, [isOpen, mappedFlow]);

    async function handleFormForNewFlow(formData: SubmitEventParams) {
        try {
            await newFlow(sessionId, flow.id, uuidv4(), formData.jsonPath, formData.formData);
            setInputPopUp(false);
            toast.success("Flow started successfully");
        } catch (e) {
            toast.error("Error while submitting form");
            setInputPopUp(false);
            console.error(e);
        }
    }

    const startFlow = async () => {
        try {
            if (!sessionCache) return;
            const canStart = await canStartFlow(sessionCache, mappedFlow);

            if (!canStart) return;
            setActiveFlow(flow.id);
            const given = sessionCache.flowMap[flow.id];
            if (given) {
                toast.info("Resuming the flow!");
                await proceedFlow(sessionId, given);
            } else {
                const txId = uuidv4();
                const data = await newFlow(sessionId, flow.id, txId);
                if (data?.inputs) {
                    toast.info("Inputs are required to start the flow");
                    setActiveFormConfig(data.inputs);
                    setActiveFormTitle(flow.title ?? flow.id);
                    setInputPopUp(true);
                }
                // if (data.expectationAdded) {
                // 	toast.info("Expectation added successfully");
                // }
            }
            putCacheData({ activeFlow: flow.id }, sessionId);
            setIsOpen(true);
        } catch (e) {
            toast.error("Error while starting flow");
            console.error(e);
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
        const jsonData = (await getCompletePayload(payload_ids)) as {
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

        const jsonData = await getCompletePayload(payload_ids);
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

    function AccordionButtons() {
        return (
            <div className="flex items-center gap-2">
                {!activeFlow ? (
                    <FlowActionButton
                        label="Start flow"
                        variant="play"
                        onClick={async (e) => {
                            addFlowToSessionInDB(sessionId, {
                                id: flow.id,
                                status: "PENDING",
                            });
                            trackEvent({
                                category: "SCENARIO_TESTING-FLOWS",
                                action: `Started a flow: ${flow.id}`,
                            });
                            e.stopPropagation();
                            await startFlow();
                        }}
                    />
                ) : null}
                {activeFlow === flow.id ? (
                    <FlowActionButton
                        label="Stop flow"
                        variant="stop"
                        onClick={async (e) => {
                            trackEvent({
                                category: "SCENARIO_TESTING-FLOWS",
                                action: `Stopped a flow: ${flow.id}`,
                            });
                            e.stopPropagation();
                            setActiveFlow(null);
                            setIsOpen(false);
                            await deleteExpectation(sessionId, subUrl);
                            putCacheData({ activeFlow: "NONE" }, sessionId);
                            onFlowStop();
                        }}
                    />
                ) : null}
                {!activeFlow ? (
                    <FlowActionButton
                        label="Clear flow data"
                        variant="delete"
                        onClick={async (e) => {
                            trackEvent({
                                category: "SCENARIO_TESTING-FLOWS",
                                action: `Cleared a flow: ${flow.id}`,
                            });
                            e.stopPropagation();
                            setMappedFlow({
                                sequence: getSequenceFromFlow(
                                    sessionCache?.flowConfigs[flow.id] ?? flow,
                                    sessionCache,
                                    activeFlow
                                ),
                                missedSteps: [],
                            });
                            await clearFlowData(sessionId, flow.id);
                            onFlowClear();
                        }}
                    />
                ) : null}
                {mappedFlow?.sequence && mappedFlow?.sequence?.length > 0 ? (
                    <FlowActionButton
                        label="Download Logs"
                        variant="download"
                        onClick={async (e) => {
                            trackEvent({
                                category: "SCENARIO_TESTING-FLOWS",
                                action: `Download logs for flow: ${flow.id}`,
                            });
                            e.stopPropagation();
                            handleDownload();
                        }}
                    />
                ) : null}
                <CircularProgress
                    key={flow.id}
                    sqSize={24}
                    strokeWidth={3}
                    duration={3}
                    onComplete={async () => {
                        if (apiCallFailCount.current < 5) {
                            await fetchTransactionData();
                        }
                    }}
                    loop={true}
                    isActive={activeFlow === flow.id && !isFlowFormDialogOpen && !inputPopUp}
                    id="fetch-transaction-data"
                />
            </div>
        );
    }

    async function onAccordionClick() {
        setIsOpen((prev) => !prev);
    }

    async function playgroundClick() {
        try {
            clickCountRef.current += 1;

            // Reset timer on every click
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            timerRef.current = setTimeout(() => {
                clickCountRef.current = 0;
            }, 300); // ⏱️ max gap allowed between clicks

            if (clickCountRef.current === 4) {
                toast.info("Generating playground config...");
                await handlePlaygroundConversion();
                clickCountRef.current = 0; // reset after success
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
                                    <AccordionButtons />
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

async function canStartFlow(sessionData: SessionCache, mappedFlow: FlowMap) {
    const action = mappedFlow.sequence[0].actionType;
    if (mappedFlow.sequence[0].expect && sessionData.npType === "BAP") {
        return await requestForFlowPermission(action, sessionData.subscriberUrl);
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
