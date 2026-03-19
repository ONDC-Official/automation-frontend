import React from "react";
import type { RunMetricsProps } from "@pages/seller-load-testing/types";

const RunMetrics: React.FC<RunMetricsProps> = ({ data }) => {
    const total = data.stages
        .filter((s) => !s.isChild)
        .reduce(
            (acc, s) => ({
                sent: acc.sent + s.sent,
                success: acc.success + s.success,
                failure: acc.failure + s.failure,
                timeout: acc.timeout + s.timeout,
            }),
            { sent: 0, success: 0, failure: 0, timeout: 0 }
        );

    return (
        <div className="mt-6 rounded-2xl border border-sky-100 bg-white overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-sky-600 to-sky-500 flex items-center justify-between">
                <div>
                    <h2 className="font-semibold text-white text-base leading-tight">
                        Run Metrics
                    </h2>
                    <p className="text-sky-200 text-xs mt-0.5">{data.runId}</p>
                </div>
                <span className="text-xs bg-green-500/30 text-green-300 border border-green-400/30 px-3 py-1 rounded-full font-medium">
                    {data.status}
                </span>
            </div>

            <div className="px-5 py-4 space-y-4">
                {/* Progress */}
                <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Pipeline Progress</span>
                        <span>{data.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-sky-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${data.progress}%` }}
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-gray-400">RPS</p>
                        <p className="text-sm font-semibold text-gray-800">{data.rps}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Duration</p>
                        <p className="text-sm font-semibold text-gray-800">{data.duration}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Started</p>
                        <p className="text-sm font-semibold text-gray-800">{data.started}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Completed</p>
                        <p className="text-sm font-semibold text-gray-800">{data.completed}</p>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                                    Stage
                                </th>
                                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">
                                    Sent
                                </th>
                                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">
                                    Success
                                </th>
                                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">
                                    Failure
                                </th>
                                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">
                                    Timeout
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.stages.map((stage, index) => (
                                <tr key={index} className="border-b border-gray-100 last:border-0">
                                    <td
                                        className={`px-4 py-2 font-mono text-xs ${stage.isChild ? "pl-8 text-gray-400" : "text-gray-800 font-semibold"}`}
                                    >
                                        {stage.isChild ? `↳ ${stage.stage}` : stage.stage}
                                    </td>
                                    <td className="text-right px-4 py-2 text-xs text-gray-600">
                                        {stage.sent}
                                    </td>
                                    <td className="text-right px-4 py-2 text-xs text-green-500 font-medium">
                                        {stage.success}
                                    </td>
                                    <td className="text-right px-4 py-2 text-xs text-red-500 font-medium">
                                        {stage.failure}
                                    </td>
                                    <td className="text-right px-4 py-2 text-xs text-yellow-500 font-medium">
                                        {stage.timeout}
                                    </td>
                                </tr>
                            ))}
                            {/* Total row */}
                            <tr className="bg-gray-50 border-t border-gray-200">
                                <td className="px-4 py-2 text-xs font-bold text-gray-800">Total</td>
                                <td className="text-right px-4 py-2 text-xs font-bold text-gray-600">
                                    {total.sent}
                                </td>
                                <td className="text-right px-4 py-2 text-xs font-bold text-green-500">
                                    {total.success}
                                </td>
                                <td className="text-right px-4 py-2 text-xs font-bold text-red-500">
                                    {total.failure}
                                </td>
                                <td className="text-right px-4 py-2 text-xs font-bold text-yellow-500">
                                    {total.timeout}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RunMetrics;
