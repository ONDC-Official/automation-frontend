import { useContext, useEffect, useState } from "react";
import { LuFileText, LuExternalLink, LuLoader, LuChevronDown, LuChevronUp } from "react-icons/lu";
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

function truncateId(id: string, len = 36): string {
    if (id.length <= len) return id;
    return `${id.slice(0, len / 2)}…${id.slice(-len / 2)}`;
}

// --- Circular donut ring ---
function CircleRing({
    pct,
    size = 72,
    stroke = 8,
    label,
    sublabel,
    color,
}: {
    pct: number;
    size?: number;
    stroke?: number;
    label: string;
    sublabel: string;
    color: string; // tailwind stroke color class — we use inline style instead
    colorHex: string;
}) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    const cx = size / 2;

    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                    {/* Track */}
                    <circle
                        cx={cx}
                        cy={cx}
                        r={r}
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth={stroke}
                    />
                    {/* Progress */}
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
                {/* Centre label */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[13px] font-bold text-gray-700">{pct}%</span>
                </div>
            </div>
            <div className="text-center">
                <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                    {label}
                </p>
                <p className="text-[10px] text-gray-400">{sublabel}</p>
            </div>
        </div>
    );
}

function FlowSummaryRings({ summary }: { summary: FlowSummary }) {
    const FLOW_CATEGORIES = ["MANDATORY", "OPTIONAL"] as const;
    const rows = FLOW_CATEGORIES.filter((cat) => summary[cat] != null);

    const colorMap: Record<string, string> = {
        MANDATORY: "#3b82f6", // blue-500
        OPTIONAL: "#a855f7", // purple-500
    };

    return (
        <div className="flex items-start justify-center gap-8 px-5 py-4">
            {rows.map((cat) => {
                const stats = summary[cat]!;
                const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                const allDone = stats.completed === stats.total;
                const hexColor = allDone ? "#10b981" : colorMap[cat]; // emerald if 100%
                return (
                    <CircleRing
                        key={cat}
                        pct={pct}
                        size={76}
                        stroke={8}
                        label={cat}
                        sublabel={`${stats.completed}/${stats.total} flows`}
                        color={hexColor}
                        colorHex={hexColor}
                    />
                );
            })}
        </div>
    );
}

function ReportCard({
    report,
    viewingId,
    onView,
}: {
    report: PastReport;
    viewingId: string | null;
    onView: (id: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const hasStats = report.total_tests != null && report.passed_tests != null;
    const allPassed = hasStats && report.passed_tests === report.total_tests;
    const passRate =
        hasStats && report.total_tests! > 0
            ? Math.round((report.passed_tests! / report.total_tests!) * 100)
            : null;

    const updatedDate = new Date(report.updatedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    const FLOW_CATEGORIES = ["MANDATORY", "OPTIONAL"] as const;
    const flowRows = FLOW_CATEGORIES.filter((cat) => report.flow_summary?.[cat] != null);
    const hasFlowData = flowRows.length > 0;

    return (
        <div className="border border-blue-100 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
            {/* Card header row */}
            <div className="flex items-center justify-between gap-4 px-5 py-4">
                {/* Left: icon + id */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-md bg-blue-50 border border-blue-100 shrink-0">
                        <LuFileText size={14} className="text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <p
                            className="text-[13px] font-mono text-gray-700 truncate font-medium"
                            title={report.test_id}
                        >
                            {truncateId(report.test_id)}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Updated {updatedDate}</p>
                    </div>
                </div>

                {/* Overall pass rate donut — always visible when stats present */}
                {hasStats && (
                    <div className="shrink-0">
                        <CircleRing
                            pct={passRate ?? 0}
                            size={52}
                            stroke={6}
                            label=""
                            sublabel=""
                            color={
                                passRate === 100
                                    ? "#10b981"
                                    : passRate! >= 70
                                      ? "#f59e0b"
                                      : "#ef4444"
                            }
                            colorHex=""
                        />
                    </div>
                )}

                {/* Right: view + expand */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        id={`view-report-${report.test_id}`}
                        disabled={viewingId === report.test_id}
                        onClick={() => onView(report.test_id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold
                                   bg-blue-600 text-white hover:bg-blue-700
                                   disabled:opacity-40 disabled:cursor-not-allowed
                                   transition-colors duration-150"
                    >
                        {viewingId === report.test_id ? (
                            <LuLoader size={12} className="animate-spin" />
                        ) : (
                            <LuExternalLink size={12} />
                        )}
                        View Report
                    </button>

                    {hasFlowData && (
                        <button
                            type="button"
                            onClick={() => setExpanded((v) => !v)}
                            className="p-1.5 rounded-md text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-150"
                            title={expanded ? "Hide flow summary" : "Show flow summary"}
                        >
                            {expanded ? <LuChevronUp size={14} /> : <LuChevronDown size={14} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Pass rate stats text (always visible when stats present) */}
            {hasStats && (
                <div className="px-5 pb-3 -mt-1 flex items-center gap-2 text-[11px] text-gray-400">
                    <span>
                        <span
                            className={`font-bold ${allPassed ? "text-emerald-600" : "text-amber-600"}`}
                        >
                            {report.passed_tests}/{report.total_tests}
                        </span>{" "}
                        passed
                    </span>
                </div>
            )}

            {/* Expandable flow summary — circular donut rings */}
            {hasFlowData && expanded && (
                <div className="border-t border-blue-100 bg-blue-50/30">
                    <p className="px-5 pt-3 text-[10px] font-semibold text-blue-400 uppercase tracking-widest">
                        Flow Coverage
                    </p>
                    <FlowSummaryRings summary={report.flow_summary!} />
                </div>
            )}
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
        <section className="mt-4">
            {/* Banner header — matches Pramaan UI style */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-6 py-5 mb-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                    <LuFileText size={18} className="text-blue-600" />
                    <h2 className="text-lg font-bold text-gray-800">Past Test Reports</h2>
                    {reports.length > 0 && (
                        <span className="text-[11px] font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                            {reports.length}
                        </span>
                    )}
                </div>
                <p className="text-sm text-blue-600 max-w-md mx-auto leading-snug">
                    View and manage reports from your previous testing sessions. Each report shows
                    test pass rate and flow coverage details.
                </p>
            </div>

            {/* Body */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-blue-300">
                    <LuLoader size={28} className="animate-spin mb-3" />
                    <p className="text-sm text-gray-400 font-medium">Loading reports…</p>
                </div>
            ) : reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border border-dashed border-blue-200 rounded-lg bg-blue-50/30">
                    <LuFileText size={36} className="text-blue-200 mb-3" />
                    <p className="text-sm font-semibold text-gray-500">No reports yet</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs text-center">
                        Generate a report from a testing session — it will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {reports.map((report) => (
                        <ReportCard
                            key={report.test_id}
                            report={report}
                            viewingId={viewingId}
                            onView={handleViewReport}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
