import { useState, useRef, FC } from "react";
import {
    LuHistory,
    LuLoader,
    LuChevronDown,
    LuSearch,
    LuExternalLink,
    LuFileText,
} from "react-icons/lu";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { getSessions, getReport } from "@utils/request-utils";
import { openReportInNewTab } from "@utils/generic-utils";
import { apiClient } from "@services/apiClient";
import { API_ROUTES } from "@services/apiRoutes";
import { Session, FlowSummaryEntry } from "@pages/history/types";
import { SessionCache } from "@/types/session-types";
import { ROUTES } from "@constants/routes";

// --- Local types ---
type FlowStatus = "PASS" | "FAIL" | "ATTEMPTED" | "NOT_RUN";

interface FlowRow {
    id: string;
    name: string;
    type: string;
    status: FlowStatus;
}

// --- Circular progress ring ---
const CircleProgress: FC<{ done: number; total: number; color: string; label: string }> = ({
    done,
    total,
    color,
    label,
}) => {
    const r = 30;
    const circumference = 2 * Math.PI * r;
    const pct = total > 0 ? done / total : 0;
    const offset = circumference * (1 - pct);

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative w-16 h-16">
                <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
                    <circle cx="32" cy="32" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5.5" />
                    <circle
                        cx="32"
                        cy="32"
                        r={r}
                        fill="none"
                        stroke={color}
                        strokeWidth="5.5"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold leading-none" style={{ color }}>
                        {Math.round(pct * 100)}%
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                        {done}/{total}
                    </span>
                </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 text-center leading-tight">
                {label}
            </span>
        </div>
    );
};

// --- Flow status badge ---
const StatusBadge: FC<{ status: FlowStatus }> = ({ status }) => {
    const config: Record<FlowStatus, { cls: string; label: string }> = {
        PASS: { cls: "bg-green-50 text-green-600 border-green-200", label: "✓ Passed" },
        FAIL: { cls: "bg-red-50 text-red-600 border-red-200", label: "✗ Failed" },
        ATTEMPTED: { cls: "bg-amber-50 text-amber-600 border-amber-200", label: "⏳ Pending" },
        NOT_RUN: { cls: "bg-slate-100 text-slate-400 border-slate-200", label: "– Not Run" },
    };
    const { cls, label } = config[status] ?? config.NOT_RUN;
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap ${cls}`}
        >
            {label}
        </span>
    );
};

// --- Summary pill ---
const SummaryPill: FC<{ dotColor: string; label: string; entry: FlowSummaryEntry }> = ({
    dotColor,
    label,
    entry,
}) => (
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <span className="text-sm font-bold text-slate-800 ml-1">
            {entry.completed} / {entry.total}
        </span>
    </div>
);

// --- Session card ---
interface SessionCardProps {
    session: Session;
    onViewReport: (sessionId: string) => void;
    viewingId: string | null;
    subscriberUrl: string;
    npType: string;
}

const SessionCard: FC<SessionCardProps> = ({
    session,
    onViewReport,
    viewingId,
    subscriberUrl,
    npType,
}) => {
    const [expanded, setExpanded] = useState(false);
    const [flowRows, setFlowRows] = useState<FlowRow[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const detailFetched = useRef(false);
    const navigate = useNavigate();

    const rep: FlowSummaryEntry = session.flowSummary?.REPORTABLE ?? { total: 0, completed: 0 };
    const mand: FlowSummaryEntry = session.flowSummary?.MANDATORY ?? { total: 0, completed: 0 };
    const opt: FlowSummaryEntry = session.flowSummary?.OPTIONAL ?? { total: 0, completed: 0 };

    const handleExpand = async () => {
        const next = !expanded;
        setExpanded(next);
        if (next && !detailFetched.current) {
            detailFetched.current = true;
            setLoadingDetail(true);
            try {
                const res = await apiClient.get<SessionCache>(API_ROUTES.SESSIONS.BASE, {
                    params: { session_id: session.sessionId },
                });
                const detail = res.data;
                // flowMap from detail API → attempted flows (flowId → transactionId | null)
                const attemptedMap = detail.flowMap ?? {};
                const flowConfigs = detail.flowConfigs ?? {};

                // All flows come from flowConfigs; flowMap presence determines ATTEMPTED vs NOT_RUN
                const deriveStatus = (id: string): FlowStatus => {
                    if (id in attemptedMap) return "ATTEMPTED";
                    return "NOT_RUN";
                };

                let rows: FlowRow[];

                if (Object.keys(flowConfigs).length > 0) {
                    rows = Object.entries(flowConfigs).map(([id, flow]) => {
                        const tags = flow.tags ?? [];
                        const type =
                            tags.find((t) => ["MANDATORY", "OPTIONAL"].includes(t)) ?? "OPTIONAL";
                        const name = flow.description || flow.title || id;
                        return { id, name, type, status: deriveStatus(id) };
                    });
                } else {
                    // Fallback when no flowConfigs: show attempted flows from flowMap
                    rows = Object.keys(attemptedMap).map((id) => ({
                        id,
                        name: id.replace(/_/g, " "),
                        type: "OPTIONAL",
                        status: "ATTEMPTED" as FlowStatus,
                    }));
                }
                setFlowRows(rows);
            } catch (e) {
                console.error("Failed to fetch session detail", e);
                toast.error("Failed to load session details");
                detailFetched.current = false;
            } finally {
                setLoadingDetail(false);
            }
        }
    };
    const handleResume = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(
            `${ROUTES.FLOW_TESTING}?sessionId=${session.sessionId}&subscriberUrl=${encodeURIComponent(subscriberUrl)}&role=${npType}`
        );
    };

    const fmt = (iso: string) =>
        new Date(iso).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });

    return (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-sky-300 hover:shadow-md transition-all duration-200">
            {/* Header row */}
            <div
                className="flex items-center gap-4 px-6 py-4 cursor-pointer select-none border-b border-slate-100"
                onClick={handleExpand}
            >
                {/* Icon */}
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-sky-50 border border-sky-200 rounded-xl">
                    <LuFileText className="text-sky-600 w-5 h-5" />
                </div>

                {/* Meta */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-sky-600 truncate font-mono">
                        {session.sessionId}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                        🕐 {fmt(session.createdAt)}&nbsp;·&nbsp;
                        {session.reportExists ? (
                            <span className="text-green-600 font-semibold">✓ Report Available</span>
                        ) : (
                            <span className="text-red-500 font-semibold">✗ No Report</span>
                        )}
                    </p>
                </div>

                {/* Circular progress rings */}
                <div className="hidden md:flex items-center gap-5 flex-shrink-0">
                    <CircleProgress
                        done={rep.completed}
                        total={rep.total}
                        color="#0b7ec8"
                        label="Overall"
                    />
                    <div className="w-px h-12 bg-slate-200" />
                    <CircleProgress
                        done={mand.completed}
                        total={mand.total}
                        color="#16a34a"
                        label="Mandatory"
                    />
                    <div className="w-px h-12 bg-slate-200" />
                    <CircleProgress
                        done={opt.completed}
                        total={opt.total}
                        color="#d97706"
                        label="Optional"
                    />
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <button
                        className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white text-xs font-bold rounded-lg hover:bg-sky-700 transition-colors"
                        onClick={handleResume}
                    >
                        Resume
                        <LuExternalLink size={12} />
                    </button>
                    <div
                        className={`w-8 h-8 flex items-center justify-center border rounded-lg bg-slate-50 transition-all ${
                            expanded
                                ? "border-sky-400 text-sky-600"
                                : "border-slate-200 text-slate-400 hover:border-sky-300 hover:text-sky-500"
                        }`}
                    >
                        <LuChevronDown
                            size={14}
                            className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                        />
                    </div>
                </div>
            </div>

            {/* Expanded body */}
            {expanded && (
                <div className="px-6 py-5">
                    {/* Summary pills */}
                    <div className="flex gap-3 flex-wrap mb-5">
                        <SummaryPill dotColor="#0b7ec8" label="Overall Completed" entry={rep} />
                        <SummaryPill dotColor="#16a34a" label="Mandatory Completed" entry={mand} />
                        <SummaryPill dotColor="#d97706" label="Optional Completed" entry={opt} />
                    </div>

                    {/* Flows table */}
                    {loadingDetail ? (
                        <div className="flex items-center justify-center py-8 text-slate-400">
                            <LuLoader size={20} className="animate-spin mr-2" />
                            <span className="text-sm">Loading flows…</span>
                        </div>
                    ) : flowRows.length > 0 ? (
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            Flow Name
                                        </th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {flowRows.map((flow) => (
                                        <tr
                                            key={flow.id}
                                            className="border-b border-slate-100 last:border-0 hover:bg-sky-50 transition-colors"
                                        >
                                            <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                                                {flow.name}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide border ${
                                                        flow.type === "OPTIONAL"
                                                            ? "bg-slate-100 text-slate-500 border-slate-200"
                                                            : "bg-sky-50 text-sky-600 border-sky-200"
                                                    }`}
                                                >
                                                    {flow.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={flow.status} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end">
                                                    <button
                                                        disabled={
                                                            !session.reportExists ||
                                                            viewingId === session.sessionId
                                                        }
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onViewReport(session.sessionId);
                                                        }}
                                                        className="flex items-center gap-1 px-3 py-1 text-xs font-bold bg-sky-50 text-sky-600 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        {viewingId === session.sessionId ? (
                                                            <LuLoader
                                                                size={10}
                                                                className="animate-spin"
                                                            />
                                                        ) : null}
                                                        View
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            No flow data available for this session.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Main page ---
const HistoryPage: FC = () => {
    const [subscriberId, setSubscriberId] = useState("");
    const [npType, setNpType] = useState("BAP");
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(false);
    const [isFetched, setIsFetched] = useState(false);
    const [viewingId, setViewingId] = useState<string | null>(null);

    const handleFetchSessions = async () => {
        if (!subscriberId.trim()) return;
        setLoading(true);
        setSessions([]);
        try {
            const response = await getSessions(subscriberId, npType);
            setSessions(
                (response.sessions as Session[])
                    .slice()
                    .sort(
                        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
            );
        } catch (e) {
            console.error("error while fetching sessions", e);
            toast.error("Something went wrong.");
        } finally {
            setLoading(false);
            setIsFetched(true);
        }
    };

    const viewReport = async (sessionId: string) => {
        setViewingId(sessionId);
        try {
            const report = await getReport(sessionId);
            if (!report?.data) {
                toast.error("Report not available");
                return;
            }
            openReportInNewTab(report.data, sessionId);
        } catch (e) {
            console.error("error while fetching report", e);
            toast.error("Report not available");
        } finally {
            setViewingId(null);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-7 py-10">
            {/* Page header */}
            <div className="flex items-center gap-2.5 mb-1.5">
                <LuHistory className="text-sky-600 w-6 h-6" />
                <h1 className="text-2xl font-bold text-slate-800">History</h1>
            </div>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                View and manage your previous sessions. Check reports or resume a past session
                anytime.
            </p>

            {/* Search card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Enter Subscriber Details
                </p>
                <div className="flex gap-2.5 items-center flex-wrap">
                    <input
                        type="text"
                        value={subscriberId}
                        onChange={(e) => setSubscriberId(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleFetchSessions()}
                        placeholder="Subscriber ID (e.g. preprod.profittuners.bwsindia.com)"
                        className="flex-1 min-w-48 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:bg-white transition-all"
                    />
                    <select
                        value={npType}
                        onChange={(e) => setNpType(e.target.value)}
                        className="min-w-32 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:bg-white transition-all cursor-pointer"
                    >
                        <option value="BAP">BAP</option>
                        <option value="BPP">BPP</option>
                    </select>
                    <button
                        onClick={handleFetchSessions}
                        disabled={loading || !subscriberId.trim()}
                        className="flex items-center gap-1.5 px-6 py-2.5 bg-sky-600 text-white text-sm font-bold rounded-xl hover:bg-sky-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                    >
                        {loading ? (
                            <LuLoader size={13} className="animate-spin" />
                        ) : (
                            <LuSearch size={13} />
                        )}
                        Fetch Sessions
                    </button>
                </div>
            </div>

            {/* Results area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <LuLoader size={28} className="animate-spin mb-3" />
                    <p className="text-sm font-medium">Fetching sessions…</p>
                </div>
            ) : !isFetched ? (
                <div className="text-center py-16 text-slate-400">
                    <div className="text-3xl mb-3">🔍</div>
                    <p className="text-sm">
                        Enter Subscriber ID and NP Type to search for sessions.
                    </p>
                </div>
            ) : sessions.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <div className="text-3xl mb-3">📭</div>
                    <p className="text-sm font-semibold">No sessions found.</p>
                    <p className="text-xs mt-1">No past sessions found for this subscriber.</p>
                </div>
            ) : (
                <div className="space-y-3.5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                        {sessions.length} Session{sessions.length !== 1 ? "s" : ""} Found
                    </p>
                    {sessions.map((session) => (
                        <SessionCard
                            key={session.sessionId}
                            session={session}
                            onViewReport={viewReport}
                            viewingId={viewingId}
                            subscriberUrl={subscriberId}
                            npType={npType}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
