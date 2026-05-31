import { useContext, useEffect, useState } from "react";
import {
    LuFileText,
    LuExternalLink,
    LuLoader,
    LuCircleCheck,
    LuCircleX,
    LuClock3,
} from "react-icons/lu";
import { toast } from "react-toastify";

import { UserContext } from "@context/userContext";
import { apiClient } from "@services/apiClient";
import { API_ROUTES } from "@services/apiRoutes";
import { getReport } from "@utils/request-utils";
import { openReportInNewTab } from "@utils/generic-utils";

type FlowCategorySummary = {
    total: number;
    completed: number;
};

type FlowSummary = {
    REPORTABLE?: FlowCategorySummary;
    MANDATORY?: FlowCategorySummary;
    OPTIONAL?: FlowCategorySummary;
    [key: string]: FlowCategorySummary | undefined;
};

type PastReport = {
    test_id: string;
    total_tests?: number;
    passed_tests?: number;
    flow_summary?: FlowSummary;
    createdAt: string;
    updatedAt: string;
};

function truncateId(id: string, len = 32): string {
    if (id.length <= len) return id;
    return `${id.slice(0, len / 2)}…${id.slice(-len / 2)}`;
}

function PassRateBar({ passed, total }: { passed: number; total: number }) {
    const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
    const color = pct === 100 ? "bg-emerald-500" : pct >= 70 ? "bg-amber-400" : "bg-red-400";
    return (
        <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-[11px] font-semibold tabular-nums text-gray-500 shrink-0">
                {pct}%
            </span>
        </div>
    );
}

function FlowSummaryGrid({ summary }: { summary: FlowSummary }) {
    const CATEGORIES = ["MANDATORY", "OPTIONAL"] as const;

    const rows = CATEGORIES.map((cat) => {
        const stats = summary[cat];
        if (!stats) return null;
        const label = cat.charAt(0) + cat.slice(1).toLowerCase();
        const remaining = stats.total - stats.completed;
        const allDone = stats.completed === stats.total;

        return (
            <div
                key={cat}
                className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-gray-50 border border-gray-100"
            >
                {/* Category label */}
                <div className="flex items-center gap-2 min-w-0">
                    {allDone ? (
                        <LuCircleCheck className="text-emerald-500 shrink-0" size={14} />
                    ) : (
                        <LuClock3 className="text-amber-500 shrink-0" size={14} />
                    )}
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        {label}
                    </span>
                </div>

                {/* Mini progress bar + counts */}
                <div className="flex items-center gap-3 shrink-0">
                    {/* completed */}
                    <div className="flex items-center gap-1">
                        <span className="text-[11px] text-gray-400">Done</span>
                        <span
                            className={`text-[11px] font-bold tabular-nums ${
                                allDone ? "text-emerald-600" : "text-gray-700"
                            }`}
                        >
                            {stats.completed}/{stats.total}
                        </span>
                    </div>

                    {/* divider */}
                    <span className="text-gray-300 text-xs">·</span>

                    {/* remaining */}
                    <div className="flex items-center gap-1">
                        <span className="text-[11px] text-gray-400">Left</span>
                        <span
                            className={`text-[11px] font-bold tabular-nums ${
                                remaining === 0 ? "text-emerald-600" : "text-amber-600"
                            }`}
                        >
                            {remaining}
                        </span>
                    </div>

                    {/* inline progress pill */}
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${allDone ? "bg-emerald-500" : "bg-amber-400"}`}
                            style={{
                                width:
                                    stats.total > 0
                                        ? `${Math.round((stats.completed / stats.total) * 100)}%`
                                        : "0%",
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }).filter(Boolean);

    if (rows.length === 0) return null;

    return <div className="mt-2 flex flex-col gap-1.5">{rows}</div>;
}

export default function PastReportsSection() {
    const { userDetails } = useContext(UserContext);
    const [reports, setReports] = useState<PastReport[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewingId, setViewingId] = useState<string | null>(null);

    useEffect(() => {
        if (!userDetails?.username) return;
        setLoading(true);
        apiClient
            .get<PastReport[]>(API_ROUTES.USER.PAST_REPORTS(userDetails.username))
            .then((res) => {
                setReports(Array.isArray(res.data) ? res.data : []);
            })
            .catch((e) => {
                const status = e?.response?.status;
                if (status === 404 || status === 204) {
                    setReports([]);
                } else {
                    console.error("Error fetching past reports", e);
                    toast.error("Failed to load past reports.");
                }
            })
            .finally(() => setLoading(false));
    }, [userDetails?.username]);

    const handleViewReport = async (testId: string) => {
        setViewingId(testId);
        try {
            const report = await getReport(testId.replace(/^PW_/, ""));
            if (report?.data) {
                openReportInNewTab(report.data, testId);
            }
        } catch {
            toast.error("Failed to load report.");
        } finally {
            setViewingId(null);
        }
    };

    return (
        <section className="mt-6 px-1">
            {/* Header */}
            <div className="mb-5">
                <div className="flex items-center gap-2 mb-0.5">
                    <LuFileText className="text-sky-600" size={18} />
                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">Past Reports</h2>
                    {reports.length > 0 && (
                        <span className="ml-1 text-[11px] font-semibold bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full">
                            {reports.length}
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-400 ml-6">
                    Reports generated from your previous testing sessions.
                </p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-14 text-gray-400">
                    <LuLoader className="text-3xl mb-3 animate-spin text-sky-400" />
                    <p className="text-sm font-medium">Loading reports…</p>
                </div>
            ) : reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-gray-300">
                    <LuFileText className="text-5xl mb-3" />
                    <p className="text-sm font-semibold text-gray-400">No reports yet</p>
                    <p className="text-xs text-gray-300 mt-0.5">
                        Generate a report from your testing session to see it here.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {reports.map((report) => {
                        const hasStats = report.total_tests != null && report.passed_tests != null;
                        const allPassed = hasStats && report.passed_tests === report.total_tests;
                        const updatedDate = new Date(report.updatedAt).toLocaleDateString(
                            undefined,
                            { day: "numeric", month: "short", year: "numeric" }
                        );
                        const hasFlowSummary =
                            report.flow_summary &&
                            Object.values(report.flow_summary).some((v) => v != null);

                        return (
                            <div
                                key={report.test_id}
                                className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-sky-200 transition-all duration-200 overflow-hidden"
                            >
                                {/* Top accent strip — green if all passed, amber otherwise */}
                                <div
                                    className={`h-0.5 w-full ${
                                        !hasStats
                                            ? "bg-gray-200"
                                            : allPassed
                                              ? "bg-emerald-400"
                                              : "bg-amber-400"
                                    }`}
                                />

                                <div className="px-4 py-3.5">
                                    {/* Row 1: icon + id + view button */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-2.5 min-w-0">
                                            <div className="mt-0.5 p-1.5 rounded-md bg-sky-50 border border-sky-100 shrink-0">
                                                <LuFileText className="text-sky-500" size={13} />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className="text-[13px] font-mono font-medium text-gray-700 truncate leading-snug"
                                                    title={report.test_id}
                                                >
                                                    {truncateId(report.test_id)}
                                                </p>

                                                {/* Pass / fail line */}
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {hasStats ? (
                                                        <>
                                                            {allPassed ? (
                                                                <LuCircleCheck
                                                                    size={11}
                                                                    className="text-emerald-500 shrink-0"
                                                                />
                                                            ) : (
                                                                <LuCircleX
                                                                    size={11}
                                                                    className="text-amber-500 shrink-0"
                                                                />
                                                            )}
                                                            <span
                                                                className={`text-[11px] font-semibold tabular-nums ${
                                                                    allPassed
                                                                        ? "text-emerald-600"
                                                                        : "text-amber-500"
                                                                }`}
                                                            >
                                                                {report.passed_tests}/
                                                                {report.total_tests} passed
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-[11px] text-gray-400 italic">
                                                            No test stats
                                                        </span>
                                                    )}
                                                    <span className="text-gray-300 text-[11px]">
                                                        ·
                                                    </span>
                                                    <span className="text-[11px] text-gray-400">
                                                        {updatedDate}
                                                    </span>
                                                </div>

                                                {/* Progress bar */}
                                                {hasStats && (
                                                    <PassRateBar
                                                        passed={report.passed_tests!}
                                                        total={report.total_tests!}
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        {/* View button */}
                                        <button
                                            type="button"
                                            id={`view-report-${report.test_id}`}
                                            disabled={viewingId === report.test_id}
                                            onClick={() => handleViewReport(report.test_id)}
                                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                                       bg-sky-50 text-sky-600 border border-sky-200
                                                       hover:bg-sky-600 hover:text-white hover:border-sky-600
                                                       disabled:opacity-40 disabled:cursor-not-allowed
                                                       transition-all duration-150"
                                        >
                                            {viewingId === report.test_id ? (
                                                <LuLoader className="animate-spin" size={12} />
                                            ) : (
                                                <LuExternalLink size={12} />
                                            )}
                                            View
                                        </button>
                                    </div>

                                    {/* Flow summary grid */}
                                    {hasFlowSummary && (
                                        <FlowSummaryGrid summary={report.flow_summary!} />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
