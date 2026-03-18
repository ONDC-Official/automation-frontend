import React from "react";
import LoadingButton from "@/components/ui/forms/loading-button";
import RunMetrics from "@pages/seller-load-testing/RunMetrics";
import type { PreorderLoadTestProps } from "@pages/seller-load-testing/types";
import { usePreorderLoadTest } from "@pages/seller-load-testing/usePreorderLoadTest";

const PreorderLoadTest: React.FC<PreorderLoadTestProps> = ({
    sessionId,
    status,
    discoveryComplete,
}) => {
    const { rps, setRps, duration, setDuration, isStarting, runMetrics, handleStartLoadTest } =
        usePreorderLoadTest({ sessionId });

    return (
        <>
            <div className="mt-6 rounded-2xl border border-sky-100 bg-white overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-sky-600 to-sky-500 flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold text-white text-base leading-tight">
                            Preorder Load Test
                        </h2>
                        <p className="text-sky-200 text-xs mt-0.5">
                            Runs select → init → confirm pipeline using the stored catalog.
                        </p>
                    </div>
                    <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-medium">
                        {status}
                    </span>
                </div>

                <div className="px-5 py-4 space-y-4">
                    <div className="flex items-end gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600">RPS</label>
                            <input
                                type="number"
                                min={1}
                                value={rps}
                                onChange={(e) => setRps(Number(e.target.value))}
                                className="w-20 border border-gray-900 rounded-md px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600">
                                Duration (sec)
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                className="w-20 border border-gray-900 rounded-md px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                        </div>
                        <div className={!discoveryComplete ? "opacity-40 cursor-not-allowed" : ""}>
                            <LoadingButton
                                type="button"
                                buttonText="Start Load Test"
                                isLoading={isStarting}
                                onClick={handleStartLoadTest}
                                disabled={!discoveryComplete}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {runMetrics && <RunMetrics data={runMetrics} />}
        </>
    );
};

export default PreorderLoadTest;
