import { useState } from "react";
import { toast } from "react-toastify";
import { ArrowsRightLeftIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

import { PairedStep } from "@components/FlowShared/mapped-flow";
import CustomTooltip from "@components/ui/mini-components/tooltip";
import FlippableWrapper from "@components/ui/flippable-div";
import { Badge } from "@/components/Shadcn/Badge";
import { Button } from "@/components/Shadcn/Button/button";
import { Switch } from "@/components/Shadcn/Switch/switch";
import { cn } from "@/lib/utils";

import { MappedStep } from "@/types/flow-state-type";
import { Flow } from "@/types/flow-types";
import { useSession } from "@context/context";
import { getCompletePayload, PayloadResponse, updateCustomFlow } from "@utils/request-utils";
import { openDevGuide } from "@utils/dev-guide-url-gen";

export default function PairedCard({
    pairedStep,
    flowId,
}: {
    pairedStep: PairedStep;
    flowId: string;
}) {
    const { first, second } = pairedStep;
    return (
        <div className="flex flex-col gap-2 py-1 sm:flex-row sm:items-stretch sm:gap-3">
            <div className="min-w-0 flex-1">
                <StepDisplay step={first} flowId={flowId} />
            </div>

            {second ? (
                <div className="flex shrink-0 items-center justify-center self-center">
                    <ArrowsRightLeftIcon className="size-5 text-text-secondary" />
                </div>
            ) : null}

            {second ? (
                <div className="min-w-0 flex-1">
                    <StepDisplay step={second} flowId={flowId} />
                </div>
            ) : null}
        </div>
    );
}

function StepDisplay({ step, flowId }: { step: MappedStep; flowId: string }) {
    const {
        activeFlowId,
        setRequestData,
        setResponseData,
        activeCallClickedToggle,
        setActiveCallClickedToggle,
        sessionData,
        setSessionData,
        sessionId,
        experimentalMode,
    } = useSession();
    const [isUpdatingManual, setIsUpdatingManual] = useState(false);

    const flowConfig = sessionData?.flowConfigs?.[flowId];
    const seqStep = flowConfig?.sequence.find((s) => s.key === step.actionId);
    const isManual = seqStep?.manual ?? false;
    const stepInput = step.input ?? seqStep?.input;
    const hasInput = Array.isArray(stepInput) ? stepInput.length > 0 : stepInput != null;

    const handleManualToggle = async (next: boolean) => {
        if (!sessionData || !setSessionData || !flowConfig || isUpdatingManual) return;
        const prevSessionData = sessionData;
        const updatedFlow: Flow = {
            ...flowConfig,
            sequence: flowConfig.sequence.map((s) =>
                s.key === step.actionId ? { ...s, manual: next } : s
            ),
        };
        setSessionData({
            ...sessionData,
            flowConfigs: { ...sessionData.flowConfigs, [flowId]: updatedFlow },
        });
        setIsUpdatingManual(true);
        try {
            await updateCustomFlow(sessionId, updatedFlow);
        } catch (e) {
            setSessionData(prevSessionData);
            toast.error("Failed to update manual mode");
            console.error(e);
        } finally {
            setIsUpdatingManual(false);
        }
    };

    const onClickFunc = async () => {
        if (step.status === "INPUT-REQUIRED") {
            setActiveCallClickedToggle(!activeCallClickedToggle);
        }

        if (step.status !== "COMPLETE") {
            setRequestData({ info: "Step not complete" });
            setResponseData({ info: "Step not complete" });
            return;
        }
        if (step.payloads?.entryType === "FORM") {
            setRequestData({ info: step.payloads });
            setResponseData({ info: step.payloads });
            return;
        }
        const payloadIds = step.payloads?.payloads.map((p) => p.payloadId) ?? [];
        const payloads = await getCompletePayload(payloadIds);
        setRequestData(payloads.map((p: PayloadResponse<unknown, unknown>) => p.req));
        setResponseData(payloads.map((p: PayloadResponse<unknown, unknown>) => p.res.response));
    };

    const status = step.status === "COMPLETE" ? (step.payloads?.subStatus ?? "ERROR") : step.status;
    const statusStyles = getStatusStyles(status);
    if (step.missedStep) {
        statusStyles.card =
            "border-purple-200 bg-linear-to-br from-purple-50 to-purple-100/80 shadow-xs shadow-purple-100 dark:from-purple-950 dark:to-purple-900/40";
    }
    const isInactive =
        flowId !== activeFlowId && ["LISTENING", "RESPONDING", "INPUT-REQUIRED"].includes(status);
    if (isInactive) {
        statusStyles.messageText = "INACTIVE";
    }
    const isFormType = ["HTML_FORM", "HTML_FORM_MULTI", "DYNAMIC_FORM"].includes(step.actionType);
    const apiCount = getCount(step);

    const showAutoToggle =
        !!experimentalMode &&
        !!seqStep &&
        !isFormType &&
        !hasInput &&
        step.status === "WAITING" &&
        step.owner !== sessionData?.npType;

    return (
        <FlippableWrapper flipTrigger={step.status}>
            <div
                role="button"
                tabIndex={0}
                className={cn(
                    "h-full w-full cursor-pointer select-none rounded-xl border p-3 text-left transition-[transform,filter] duration-150 hover:brightness-[0.97] active:scale-[0.97]",
                    statusStyles?.card
                )}
                onClick={onClickFunc}
                onKeyDown={(e) => e.key === "Enter" && onClickFunc()}
            >
                <div className="flex w-full flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                        <h1 className="min-w-0 flex-1 text-sm leading-snug font-semibold text-text-primary wrap-break-word">
                            {!step.missedStep ? (
                                <span className="mr-1 font-normal text-text-secondary">
                                    {step.index + 1}:
                                </span>
                            ) : null}
                            {isFormType ? step.actionId : step.actionType}
                            {step.label ? (
                                <span className="ml-1.5 text-sm font-normal text-text-secondary">
                                    ({step.label})
                                </span>
                            ) : null}
                        </h1>

                        <div className="flex shrink-0 items-center gap-1.5">
                            {step.unsolicited ? (
                                <Badge variant="secondary">unsolicited</Badge>
                            ) : null}
                            <CustomTooltip content="Developer Guide">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!sessionData) return;
                                        openDevGuide({
                                            domain: sessionData.domain,
                                            version: sessionData.version,
                                            useCase: sessionData.usecaseId,
                                            flowId,
                                            actionId: step.actionId,
                                        });
                                    }}
                                    className="h-auto rounded-md bg-brand-light px-2 py-0.5 text-caption-1 font-semibold text-brand-normal hover:bg-brand-light-hover dark:bg-brand-dark/30 dark:hover:bg-brand-dark/50"
                                >
                                    Docs
                                </Button>
                            </CustomTooltip>
                            <CustomTooltip content="Step information">
                                <InformationCircleIcon className="size-4 shrink-0 text-brand-normal" />
                            </CustomTooltip>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                        {statusStyles?.messageText ? (
                            <Badge
                                variant="status"
                                className={cn("gap-1.5", statusStyles.messageBg)}
                            >
                                {statusStyles.messageText}
                                {["LISTENING", "RESPONDING", "INPUT-REQUIRED", "WAITING"].includes(
                                    status
                                ) && flowId === activeFlowId ? (
                                    <span className="size-3 animate-spin-slow rounded-full border-2 border-t-transparent border-n-0" />
                                ) : null}
                            </Badge>
                        ) : null}
                        {step.missedStep ? (
                            <Badge className="border-purple-200 bg-purple-100 text-purple-800">
                                out-of-sequence
                            </Badge>
                        ) : null}
                        {isFormType ? <Badge variant="secondary">form</Badge> : null}
                        {hasInput && step.owner !== sessionData?.npType ? (
                            <Badge variant="inputs">inputs</Badge>
                        ) : null}
                        {step.owner === sessionData?.npType ? (
                            <Badge variant="alert">you send</Badge>
                        ) : null}
                        {step.owner !== sessionData?.npType ? (
                            <Badge variant="mock">mock</Badge>
                        ) : null}
                        {showAutoToggle ? (
                            <AutoToggle
                                isAuto={!isManual}
                                disabled={isUpdatingManual}
                                onToggle={(nextAuto) => handleManualToggle(!nextAuto)}
                            />
                        ) : null}
                        {apiCount > 0 ? (
                            <Badge className={getCountStyles(apiCount)}>
                                <span className="font-normal text-text-secondary">×</span> {apiCount}
                            </Badge>
                        ) : null}
                        {step.payloads?.timestamp ? (
                            <Badge variant="secondary">
                                {new Date(step.payloads.timestamp).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: true,
                                })}
                            </Badge>
                        ) : null}
                    </div>
                </div>
            </div>
        </FlippableWrapper>
    );
}

function AutoToggle({
    isAuto,
    disabled,
    onToggle,
}: {
    isAuto: boolean;
    disabled: boolean;
    onToggle: (next: boolean) => void;
}) {
    const stop = (e: React.SyntheticEvent) => {
        e.stopPropagation();
    };

    return (
        <CustomTooltip content="Toggle auto mode for this step">
            <div
                className="flex items-center gap-1.5"
                onPointerDown={stop}
                onMouseDown={stop}
                onClick={(e) => e.stopPropagation()}
            >
                <span className="text-caption-1 font-semibold uppercase tracking-wide text-text-secondary">
                    auto
                </span>
                <Switch
                    checked={isAuto}
                    disabled={disabled}
                    aria-label="Auto mode"
                    onCheckedChange={onToggle}
                />
            </div>
        </CustomTooltip>
    );
}

function getStatusStyles(
    status:
        | "ERROR"
        | "SUCCESS"
        | "LISTENING"
        | "RESPONDING"
        | "INPUT-REQUIRED"
        | "WAITING"
        | "PROCESSING"
        | "WAITING-SUBMISSION"
) {
    switch (status) {
        case "SUCCESS":
            return {
                card: "border-success-200 bg-success-50/80 shadow-xs dark:bg-success-800/20",
                messageText: "ACK",
                messageBg: "bg-success-500",
            };
        case "ERROR":
            return {
                card: "border-error-50 bg-error-50/80 shadow-xs dark:bg-error-500/10",
                messageText: "NACK",
                messageBg: "bg-error-500",
            };
        case "RESPONDING":
            return {
                card: "border-brand-light-active bg-brand-light/60 shadow-xs dark:border-border-default dark:bg-brand-dark/20",
                messageText: "SENDING",
                messageBg: "bg-brand-normal",
            };
        case "INPUT-REQUIRED":
            return {
                card: "border-brand-light-active bg-brand-light/60 shadow-xs dark:border-border-default dark:bg-brand-dark/20",
                messageText: "SENDING",
                messageBg: "bg-brand-normal",
            };
        case "LISTENING":
            return {
                card: "border-alert-200 bg-alert-50/80 shadow-xs dark:bg-alert-800/20",
                messageText: "WAITING",
                messageBg: "bg-alert-500",
            };
        case "WAITING":
            return {
                card: "border-n-30 bg-surface-muted shadow-xs dark:border-border-default",
                messageBg: "bg-n-500",
            };
        case "PROCESSING":
            return {
                card: "border-purple-200 bg-purple-50/80 shadow-xs dark:bg-purple-900/20",
                messageText: "PROCESSING",
                messageBg: "bg-purple-600",
            };
        case "WAITING-SUBMISSION":
            return {
                card: "border-indigo-200 bg-indigo-50/80 shadow-xs dark:bg-indigo-900/20",
                messageText: "WAITING-SUBMISSION",
                messageBg: "bg-indigo-600",
            };
    }
}

function getCount(step: MappedStep) {
    if (step.payloads?.entryType === "FORM") return 0;
    return step.status === "COMPLETE" ? (step.payloads?.payloads.length ?? 0) : 0;
}

function getCountStyles(count: number) {
    if (count === 1)
        return "border-n-30 bg-surface-elevated text-text-secondary dark:border-border-default";
    if (count <= 3)
        return "border-brand-light-active bg-brand-light text-brand-normal dark:border-border-default dark:bg-brand-dark/20";
    if (count <= 6)
        return "border-brand-light-active bg-brand-light text-brand-normal-hover dark:border-border-default dark:bg-brand-dark/30";
    if (count <= 10)
        return "border-brand-normal bg-brand-light text-brand-dark dark:border-brand-normal dark:bg-brand-dark/40";
    return "animate-pulse border-purple-300 bg-purple-50 text-purple-900 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-200";
}
