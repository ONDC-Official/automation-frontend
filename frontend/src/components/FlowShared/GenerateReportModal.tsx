import { useState } from "react";
import { toast } from "sonner";

import { Flow } from "@/types/flow-types";
import { ApiData, SessionCache } from "@/types/session-types";
import { useGenerateReportMutation, useLazyGetTransactionDataQuery } from "@store/api";
import Modal from "@components/Modal";
import { CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { Button } from "@components/Shadcn/Button/button";
import SpinnerDialog from "@components/Shadcn/SpinnerDialog";
import { useAuth } from "@hooks/useAuth";
import type {
    FlowCategorySummary,
    FlowSummary,
} from "@/types/apiShared/userProfile/userProfile.types";

const TRACKED_TAGS = ["REPORTABLE", "MANDATORY", "OPTIONAL"] as const;

const GenerateReportModal = ({
    flows,
    subUrl,
    sessionId,
    cacheSessionData,
    open,
    onClose,
    startPolling,
    setGotReport,
}: {
    flows: Flow[];
    subUrl: string;
    sessionId: string;
    cacheSessionData: SessionCache | null;
    open: boolean;
    onClose: () => void;
    startPolling: () => void;
    setGotReport: (gotReport: boolean) => void;
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [triggerGetTransactionData] = useLazyGetTransactionDataQuery();
    const [generateReport] = useGenerateReportMutation();

    const generateReportHandler = async () => {
        if (completedReportableFlows?.length == 0) {
            toast.error("No completed reportable flows ready for report generation");
            onClose();
            return;
        }

        setLoading(true);
        try {
            const body: Record<string, string[]> = {};

            if (!cacheSessionData) {
                setLoading(false);
                toast.error("Error while generating report");
                return;
            }

            for (const flow in cacheSessionData.flowMap) {
                const transactionId = cacheSessionData.flowMap[flow];
                if (!transactionId) continue;
                const result = await triggerGetTransactionData({
                    transactionId,
                    subscriberUrl: subUrl,
                });
                const transData = result.data as { apiList?: ApiData[] } | undefined;
                if (!transData) continue;
                const apiList = transData.apiList;

                body[flow] = (apiList || []).map((data) => data.payloadId);
            }

            const flowSummary: FlowSummary = {};
            for (const tag of TRACKED_TAGS) {
                const flowsWithTag = flows.filter((f) => f.tags?.includes(tag));
                if (flowsWithTag.length === 0) continue;
                const completedWithTag = flowsWithTag.filter(
                    (f) =>
                        f.id in cacheSessionData.flowMap && cacheSessionData.flowMap[f.id] !== null
                );
                flowSummary[tag] = {
                    total: flowsWithTag.length,
                    completed: completedWithTag.length,
                } satisfies FlowCategorySummary;
            }

            const response = await generateReport({
                sessionId,
                userId: user?.username,
                body,
                flowSummary: flowSummary as Record<string, { total: number; completed: number }>,
            }).unwrap();

            setLoading(false);

            if (response?.data?.html) {
                toast.info("Report Generated");
                const decodedHtml = response.data.html;
                const blob = new Blob([decodedHtml], { type: "text/html" });
                const url = URL.createObjectURL(blob);
                window.open(url, "_blank");
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                    onClose();
                }, 5000);
            } else if (response?.data?.message?.ack?.status === "ACK") {
                toast.info("Generating report. It can take upto 90 sec. Please wait...");
                setGotReport(false);
                setTimeout(() => {
                    startPolling();
                }, 30000);
                onClose();
            } else if (response?.data?.message?.ack?.status === "NACK") {
                toast.error("Error while generating report");
                onClose();
            }
        } catch (error) {
            setLoading(false);
            console.error(error);
            toast.error("Error while generating report");
        }
    };

    const getCompletedReportableFlows = (): Flow[] => {
        if (!cacheSessionData || !cacheSessionData.flowMap) {
            return [];
        }

        return flows.filter((flow) => {
            const isCompleted =
                flow.id in cacheSessionData.flowMap && cacheSessionData.flowMap[flow.id] !== null;
            const hasReportableTag = flow.tags?.includes("REPORTABLE") ?? false;
            return isCompleted && hasReportableTag;
        });
    };

    const completedReportableFlows = getCompletedReportableFlows();

    return (
        <>
            {loading && <SpinnerDialog />}
            <Modal isOpen={open} onClose={onClose} className="max-w-xl">
                <div className="w-full">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Generate Report</h2>

                    {completedReportableFlows.length > 0 ? (
                        <div className="rounded-lg bg-linear-to-br from-green-50 to-emerald-50 border border-green-200 p-5 mb-6 shadow-xs">
                            <div className="flex items-start gap-3">
                                <div className="shrink-0 mt-0.5">
                                    <div className="rounded-full bg-green-100 p-1.5">
                                        <CheckCircleIcon
                                            aria-hidden="true"
                                            className="size-5 text-green-600"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-semibold text-green-900 mb-3">
                                        {completedReportableFlows.length} completed flow
                                        {completedReportableFlows.length > 1 ? "s" : ""} ready for
                                        report generation
                                    </h3>
                                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                        {completedReportableFlows.map((flow) => (
                                            <div
                                                key={flow.id}
                                                className="flex items-start gap-3 px-3 py-2.5 bg-white rounded-md border border-green-100 hover:border-green-200 hover:shadow-xs transition-all duration-150"
                                            >
                                                <span className="text-sm font-medium text-gray-800 wrap-break-word min-w-0 flex-1">
                                                    {flow.title || flow.id}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-lg bg-linear-to-br from-red-50 to-red-10 border border-red-200 p-5 mb-6 shadow-xs">
                            <div className="flex items-start gap-3">
                                <div className="shrink-0 mt-0.5">
                                    <div className="rounded-full bg-red-100 p-1.5">
                                        <ExclamationCircleIcon
                                            aria-hidden="true"
                                            className="size-5 text-red-400"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-semibold text-red-700">
                                        None of the flows run in this session are reportable
                                    </h3>
                                    <p className="text-sm text-red-600 mt-1">
                                        Complete flows with the "REPORTABLE" tag to generate
                                        reports.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            variant="default"
                            onClick={generateReportHandler}
                            isLoading={loading}
                        >
                            {loading ? "Generating Report..." : "Ok"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default GenerateReportModal;
