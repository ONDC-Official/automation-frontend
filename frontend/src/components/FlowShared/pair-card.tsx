import { MdSyncAlt } from "react-icons/md";
import { HiOutlineBookOpen } from "react-icons/hi";

import { PairedStep } from "@components/FlowShared/mapped-flow";
import CustomTooltip from "@components/ui/mini-components/tooltip";
import FlippableWrapper from "@components/ui/flippable-div";

import { MappedStep } from "@/types/flow-state-type";
import { useSession } from "@context/context";
import { getCompletePayload, PayloadResponse } from "@utils/request-utils";
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
        <div className="flex flex-col sm:flex-row sm:items-stretch gap-2 sm:gap-3 py-1.5">
            <div className="flex-1 min-w-0">
                <StepDisplay step={first} flowId={flowId} />
            </div>

            {second && (
                <div className="flex justify-center items-center shrink-0">
                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                        <MdSyncAlt className="text-base text-black" />
                    </div>
                </div>
            )}

            {second && (
                <div className="flex-1 min-w-0">
                    <StepDisplay step={second} flowId={flowId} />
                </div>
            )}
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
    } = useSession();

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
            "border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/80 shadow-sm shadow-purple-100";
    }
    const isInactive =
        flowId !== activeFlowId && ["LISTENING", "RESPONDING", "INPUT-REQUIRED"].includes(status);
    if (isInactive) {
        statusStyles.messageText = "INACTIVE";
    }
    const isFormType = ["HTML_FORM", "HTML_FORM_MULTI", "DYNAMIC_FORM"].includes(step.actionType);
    const apiCount = getCount(step);

    return (
        <FlippableWrapper flipTrigger={step.status}>
            <div
                role="button"
                tabIndex={0}
                className={`${statusStyles?.card} w-full h-full rounded-xl p-3.5 border hover:brightness-[0.97] active:scale-[0.97] transition-all duration-150 text-left cursor-pointer select-none`}
                onClick={onClickFunc}
                onKeyDown={(e) => e.key === "Enter" && onClickFunc()}
            >
                <div className="w-full flex flex-col gap-2">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-1.5 min-w-0 flex-1">
                            <h1 className="text-sm font-semibold text-gray-800 leading-snug min-w-0 break-words">
                                {!step.missedStep && (
                                    <span className="text-black font-normal mr-1">
                                        {step.index + 1}.
                                    </span>
                                )}
                                {isFormType ? step.actionId : step.actionType}
                                {step.label && (
                                    <span className="text-sm font-normal text-gray-500 ml-1.5">
                                        ({step.label})
                                    </span>
                                )}
                            </h1>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            {step.unsolicited && (
                                <span className="bg-white/80 text-gray-600 text-sm font-semibold border border-gray-200 rounded-full px-2 py-0.5">
                                    unsolicited
                                </span>
                            )}
                            {/* Dev Guide */}
                            <CustomTooltip content="Developer Guide">
                                <button
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
                                    className="py-1 px-2 text-sm bg-white/80 text-sky-600 hover:text-sky-700 hover:bg-sky-50 border border-sky-200 hover:border-sky-400 rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 shadow-sm"
                                >
                                    <HiOutlineBookOpen className="text-sm mr-1" />
                                    <span className="text-xs font-bold leading-none">docs</span>
                                </button>
                            </CustomTooltip>
                            {/* Info */}
                            {/* <CustomTooltip
                                content={step.description ?? "No additional info available"}
                            >
                                <div className="bg-white/80 py-1 px-2  text-gray-500 hover:text-gray-700 hover:bg-white border border-gray-200 hover:border-gray-300 rounded-full flex items-center justify-center transition-all duration-150 cursor-default">
                                    <HiOutlineBookOpen className="text-sm mr-1" />
                                    <span className="text-xs font-bold leading-none">info</span>
                                </div>
                            </CustomTooltip> */}
                        </div>
                    </div>

                    {/* Status + badges row */}
                    <div className="flex items-center flex-wrap gap-1.5">
                        {statusStyles?.messageText && (
                            <span
                                className={`${statusStyles.messageBg} text-white text-sm font-semibold rounded-full px-2.5 py-0.5 flex items-center gap-1.5`}
                            >
                                {statusStyles?.messageText}
                                {["LISTENING", "RESPONDING", "INPUT-REQUIRED", "WAITING"].includes(
                                    status
                                ) &&
                                    flowId === activeFlowId && (
                                        <span className="w-3 h-3 border-2 border-t-transparent border-white rounded-full animate-spin-slow" />
                                    )}
                            </span>
                        )}
                        {step.missedStep && (
                            <span className="bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-semibold rounded-full px-2.5 py-0.5">
                                out-of-sequence
                            </span>
                        )}
                        <span className="bg-white/80 text-black text-xs font-semibold border border-gray-200 rounded-full px-2 py-0.5 uppercase tracking-wide">
                            {isFormType ? "form" : "api"}
                        </span>
                        {apiCount > 0 && (
                            <span
                                className={`${getCountStyles(apiCount)} text-sm font-semibold rounded-full px-2.5 py-0.5`}
                            >
                                <span className="text-gray-400 font-normal">×</span> {apiCount}
                            </span>
                        )}
                        {step.payloads?.timestamp && (
                            <span className="bg-white/80 text-gray-700 text-sm font-medium border border-gray-200 rounded-full px-2.5 py-0.5">
                                {new Date(step.payloads.timestamp).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: true,
                                })}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </FlippableWrapper>
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
                card: "border-green-200 bg-gradient-to-br from-green-50 to-green-100/80 shadow-sm shadow-green-100",
                messageText: "ACK",
                messageBg: "bg-gradient-to-r from-green-600 to-green-500",
            };
        case "ERROR":
            return {
                card: "border-red-200 bg-gradient-to-br from-red-50 to-red-100/80 shadow-sm shadow-red-100",
                messageText: "NACK",
                messageBg: "bg-gradient-to-r from-red-600 to-red-500",
            };
        case "RESPONDING":
            return {
                card: "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/80 shadow-sm shadow-blue-100",
                messageText: "SENDING",
                messageBg: "bg-gradient-to-r from-blue-600 to-blue-400",
            };
        case "INPUT-REQUIRED":
            return {
                card: "border-sky-200 bg-gradient-to-br from-sky-50 to-sky-100/80 shadow-sm shadow-sky-100",
                messageText: "SENDING",
                messageBg: "bg-gradient-to-r from-sky-600 to-sky-400",
            };
        case "LISTENING":
            return {
                card: "border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-100/80 shadow-sm shadow-amber-100",
                messageText: "WAITING",
                messageBg: "bg-gradient-to-r from-amber-500 to-yellow-400",
            };
        case "WAITING":
            return {
                card: "border-gray-200 bg-gradient-to-br from-slate-50 to-slate-100/80 shadow-sm shadow-slate-100",
                messageBg: "bg-slate-400",
            };
        case "PROCESSING":
            return {
                card: "border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/80 shadow-sm shadow-purple-100",
                messageText: "PROCESSING",
                messageBg: "bg-gradient-to-r from-purple-600 to-purple-500",
            };
        case "WAITING-SUBMISSION":
            return {
                card: "border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100/80 shadow-sm shadow-indigo-100",
                messageText: "WAITING-SUBMISSION",
                messageBg: "bg-gradient-to-r from-indigo-600 to-indigo-500",
            };
    }
}

function getCount(step: MappedStep) {
    if (step.payloads?.entryType === "FORM") return 0;
    return step.status === "COMPLETE" ? (step.payloads?.payloads.length ?? 0) : 0;
}

function getCountStyles(count: number) {
    if (count === 1) return "bg-white text-gray-600 border border-gray-200";
    if (count <= 3) return "bg-white text-blue-600 border border-blue-100";
    if (count <= 6) return "bg-white text-blue-700 border border-blue-200";
    if (count <= 10) return "bg-white text-indigo-800 border border-indigo-200";
    return "bg-white text-violet-900 border border-violet-200 animate-pulse";
}
