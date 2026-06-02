import { useContext, useEffect, useState } from "react";
import { LuFileText, LuExternalLink, LuLoader, LuCircleCheck } from "react-icons/lu";
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

// Circular donut ring — centerText is "80%" for Overall or "1/9" for Mandatory/Optional
function DonutRing({
    pct,
    size = 64,
    stroke = 6,
    label,
    centerText,
    color,
}: {
    pct: number;
    size?: number;
    stroke?: number;
    label: string;
    centerText: string;
    color: string;
}) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    const cx = size / 2;

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                    <circle
                        cx={cx}
                        cy={cx}
                        r={r}
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth={stroke}
                    />
                    <circle
                        cx={cx}
                        cy={cx}
                        r={r}
                        fill="none"
                        stroke={color}
                        strokeWidth={stroke}
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 0.7s ease" }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11px] font-bold text-gray-700 leading-none">
                        {centerText}
                    </span>
                </div>
            </div>
            <span className="text-[10px] text-gray-500 font-medium">{label}</span>
        </div>
    );
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
                        const passRate =
                            hasStats && report.total_tests! > 0
                                ? Math.round((report.passed_tests! / report.total_tests!) * 100)
                                : 0;
                        const overallColor =
                            passRate === 100 ? "#10b981" : passRate >= 70 ? "#f59e0b" : "#ef4444";

                        const mandatoryStats = report.flow_summary?.MANDATORY;
                        const optionalStats = report.flow_summary?.OPTIONAL;

                        const mandatoryPct =
                            mandatoryStats && mandatoryStats.total > 0
                                ? Math.round(
                                      (mandatoryStats.completed / mandatoryStats.total) * 100
                                  )
                                : 0;
                        const optionalPct =
                            optionalStats && optionalStats.total > 0
                                ? Math.round((optionalStats.completed / optionalStats.total) * 100)
                                : 0;

                        const updatedDate = new Date(report.updatedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                        });

                        return (
                            <div
                                key={report.test_id}
                                className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 px-4 py-3.5"
                            >
                                {/* Left: doc icon + truncated id + passed badge + date */}
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="shrink-0 p-2 rounded-lg border border-gray-200 bg-white">
                                        <LuFileText size={16} className="text-gray-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p
                                            className="text-[13px] font-mono font-semibold text-gray-800 truncate"
                                            title={report.test_id}
                                        >
                                            {truncateId(report.test_id)}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                            {hasStats && (
                                                <span
                                                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-full border ${
                                                        allPassed
                                                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                                            : "text-amber-700 bg-amber-50 border-amber-200"
                                                    }`}
                                                >
                                                    <LuCircleCheck size={10} />
                                                    {report.passed_tests}/{report.total_tests}{" "}
                                                    passed
                                                </span>
                                            )}
                                            <span className="text-[11px] text-gray-400">
                                                · {updatedDate}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Center: 3 donut rings */}
                                <div className="flex items-center gap-4 shrink-0">
                                    {hasStats && (
                                        <DonutRing
                                            pct={passRate}
                                            size={48}
                                            stroke={5}
                                            label="Overall"
                                            centerText={`${passRate}%`}
                                            color={overallColor}
                                        />
                                    )}
                                    <DonutRing
                                        pct={mandatoryPct}
                                        size={48}
                                        stroke={5}
                                        label="Mandatory"
                                        centerText={
                                            mandatoryStats
                                                ? `${mandatoryStats.completed}/${mandatoryStats.total}`
                                                : "–"
                                        }
                                        color={mandatoryPct === 100 ? "#10b981" : "#f59e0b"}
                                    />
                                    <DonutRing
                                        pct={optionalPct}
                                        size={48}
                                        stroke={5}
                                        label="Optional"
                                        centerText={
                                            optionalStats
                                                ? `${optionalStats.completed}/${optionalStats.total}`
                                                : "–"
                                        }
                                        color={optionalPct === 100 ? "#10b981" : "#f59e0b"}
                                    />
                                </div>

                                {/* Right: View button */}
                                <button
                                    type="button"
                                    id={`view-report-${report.test_id}`}
                                    disabled={viewingId === report.test_id}
                                    onClick={() => handleViewReport(report.test_id)}
                                    className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold
                                               bg-sky-600 text-white border border-sky-600
                                               hover:bg-sky-700 hover:border-sky-700
                                               disabled:opacity-40 disabled:cursor-not-allowed
                                               transition-all duration-150"
                                    //className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 hover:border-sky-300 rounded-xl transition-all"
                                >
                                    {viewingId === report.test_id ? (
                                        <LuLoader className="animate-spin" size={13} />
                                    ) : (
                                        <LuExternalLink size={13} />
                                    )}
                                    View
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
