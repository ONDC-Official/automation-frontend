import React from "react";
import { toast } from "sonner";
import { useStartPreorderRunMutation, useGetRunStatusQuery } from "@store/api";
import type { RunMetricsData, StageMetric } from "@pages/seller-load-testing/types";

interface UsePreorderLoadTestParams {
    sessionId: string;
}

const buildStages = (data: Record<string, unknown>): StageMetric[] => {
    const metrics = (data.metrics || {}) as Record<string, Record<string, number>>;
    const stageKeys = ["select", "on_select", "init", "on_init", "confirm", "on_confirm"];
    return stageKeys.map((key) => {
        const stage = metrics[key] || {};
        return {
            stage: key,
            sent: stage.sent ?? 0,
            success: stage.success ?? 0,
            failure: stage.failure ?? 0,
            timeout: stage.timeout ?? 0,
            isChild: key.startsWith("on_"),
        };
    });
};

export const usePreorderLoadTest = ({ sessionId }: UsePreorderLoadTestParams) => {
    const [rps, setRps] = React.useState<number>(1);
    const [duration, setDuration] = React.useState<number>(1);
    const [isStarting, setIsStarting] = React.useState<boolean>(false);
    const [runMetrics, setRunMetrics] = React.useState<RunMetricsData | null>(null);
    const [runPoll, setRunPoll] = React.useState<{
        sessionId: string;
        runId: string;
        pollingInterval: number;
    } | null>(null);

    const [startPreorderRun] = useStartPreorderRunMutation();

    // Pattern A (spec §9.1) — poll until status === "completed"; the stop condition lives here.
    const { data: runStatusData, isError: runStatusIsError } = useGetRunStatusQuery(
        runPoll
            ? { sessionId: runPoll.sessionId, runId: runPoll.runId }
            : { sessionId: "", runId: "" },
        { skip: !runPoll, pollingInterval: runPoll?.pollingInterval ?? 0 }
    );

    React.useEffect(() => {
        if (!runPoll || !runStatusData) return;

        const data = runStatusData;
        const currentStatus = (data.status as string) || "";
        const completedStages = ["select", "on_select", "init", "on_init", "confirm", "on_confirm"];
        const metrics = (data.metrics || {}) as Record<string, Record<string, number>>;
        const doneCount = completedStages.filter((k) => (metrics[k]?.success ?? 0) > 0).length;
        const progress = Math.round((doneCount / completedStages.length) * 100);

        setRunMetrics({
            runId: runPoll.runId,
            status: currentStatus,
            progress,
            rps,
            duration: `${duration}s`,
            started: (data.started_at as string) || "",
            completed: (data.completed_at as string) || "",
            stages: buildStages(data),
        });

        if (currentStatus.trim() === "completed") {
            setRunPoll((prev) => (prev ? { ...prev, pollingInterval: 0 } : prev));
            setIsStarting(false);
        }
    }, [runStatusData]);

    React.useEffect(() => {
        if (!runPoll || !runStatusIsError) return;
        // A single failed poll doesn't mean the run stopped server-side — keep
        // polling on the existing schedule instead of freezing progress here.
        console.error("Error polling run status; will keep retrying");
    }, [runStatusIsError, runPoll]);

    const handleStartLoadTest = async () => {
        setIsStarting(true);
        setRunMetrics(null);
        try {
            const preorderRes = await startPreorderRun({ sessionId, rps, duration }).unwrap();
            setRunPoll({
                sessionId: preorderRes.session_id,
                runId: preorderRes.run_id,
                pollingInterval: 2000,
            });
        } catch (error) {
            console.error("Error starting load test:", error);
            toast.error("Failed to start load test");
            setIsStarting(false);
        }
    };

    return {
        rps,
        setRps,
        duration,
        setDuration,
        isStarting,
        runMetrics,
        handleStartLoadTest,
    };
};
