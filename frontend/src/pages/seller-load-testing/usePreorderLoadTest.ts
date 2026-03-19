import React from "react";
import axios from "axios";
import type { RunMetricsData, StageMetric } from "@pages/seller-load-testing/types";

interface UsePreorderLoadTestParams {
    sessionId: string;
}

export const usePreorderLoadTest = ({ sessionId }: UsePreorderLoadTestParams) => {
    const [rps, setRps] = React.useState<number>(1);
    const [duration, setDuration] = React.useState<number>(1);
    const [isStarting, setIsStarting] = React.useState<boolean>(false);
    const [runMetrics, setRunMetrics] = React.useState<RunMetricsData | null>(null);

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

    const pollRunStatus = async (sessionIdParam: string, runId: string) => {
        const interval = setInterval(async () => {
            try {
                const runRes = await axios.get<Record<string, unknown>>(
                    `${import.meta.env.VITE_LOAD_TEST_BACKEND_URL}/sessions/${sessionIdParam}/runs/${runId}`
                );
                const data = runRes.data;
                const currentStatus = (data.status as string) || "";
                const completedStages = [
                    "select",
                    "on_select",
                    "init",
                    "on_init",
                    "confirm",
                    "on_confirm",
                ];
                const metrics = (data.metrics || {}) as Record<string, Record<string, number>>;
                const doneCount = completedStages.filter(
                    (k) => (metrics[k]?.success ?? 0) > 0
                ).length;
                const progress = Math.round((doneCount / completedStages.length) * 100);

                setRunMetrics({
                    runId,
                    status: currentStatus,
                    progress,
                    rps,
                    duration: `${duration}s`,
                    started: (data.started_at as string) || "",
                    completed: (data.completed_at as string) || "",
                    stages: buildStages(data),
                });

                if (currentStatus.trim() === "completed") {
                    clearInterval(interval);
                    setIsStarting(false);
                }
            } catch {
                clearInterval(interval);
                setIsStarting(false);
            }
        }, 2000);
    };

    const handleStartLoadTest = async () => {
        setIsStarting(true);
        setRunMetrics(null);
        try {
            const preorderRes = await axios.post<{ session_id: string; run_id: string }>(
                `${import.meta.env.VITE_LOAD_TEST_BACKEND_URL}/sessions/${sessionId}/preorder`,
                { rps, duration_sec: duration }
            );

            const { session_id, run_id } = preorderRes.data;
            await pollRunStatus(session_id, run_id);
        } catch {
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
