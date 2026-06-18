import { useState, useRef, FC, useContext, useEffect } from "react";
import {
    LuHistory,
    LuLoader,
    LuChevronDown,
    LuSearch,
    LuExternalLink,
    LuFileText,
    LuDownload,
} from "react-icons/lu";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
    getSessions,
    getReport,
    getSubscriberUrls,
    getPayloadsBySessionId,
} from "@utils/request-utils";
import { openReportInNewTab } from "@utils/generic-utils";
import { apiClient } from "@services/apiClient";
import { API_ROUTES } from "@services/apiRoutes";
import { Session, FlowSummaryEntry } from "@pages/history/types";
import { SessionCache } from "@/types/session-types";
import { Flow } from "@/types/flow-types";
import { IDomain } from "@/pages/schema-validation/types";
import { ROUTES } from "@constants/routes";
import { UserContext } from "@context/userContext";
import CustomTooltip from "@components/ui/mini-components/tooltip";

// --- Local types ---
type FlowStatus = "PASS" | "FAIL" | "RUN" | "NOT_RUN";

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
    const r = 20;
    const circumference = 2 * Math.PI * r;
    const pct = total > 0 ? done / total : 0;
    const offset = circumference * (1 - pct);

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative w-12 h-12">
                <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
                    <circle cx="24" cy="24" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
                    <circle
                        cx="24"
                        cy="24"
                        r={r}
                        fill="none"
                        stroke={color}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold leading-none" style={{ color }}>
                        {Math.round(pct * 100)}%
                    </span>
                    <span className="text-[8px] text-slate-400 font-semibold mt-0.5">
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
        RUN: { cls: "bg-amber-50 text-amber-600 border-amber-200", label: "⏳ Run" },
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
    const [hasPayloads, setHasPayloads] = useState(true);
    const [downloadingLogs, setDownloadingLogs] = useState(false);
    const detailFetched = useRef(false);
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;
        getPayloadsBySessionId(session.sessionId)
            .then((payloads) => {
                if (!cancelled) setHasPayloads((payloads?.length ?? 0) > 0);
            })
            .catch(() => {
                if (!cancelled) setHasPayloads(false);
            });
        return () => {
            cancelled = true;
        };
    }, [session.sessionId]);

    const handleDownloadLogs = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!hasPayloads || downloadingLogs) return;

        setDownloadingLogs(true);
        try {
            const payloads = await getPayloadsBySessionId(session.sessionId);
            const blob = new Blob([JSON.stringify(payloads, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${session.sessionId}-logs.json`;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Error downloading logs: ", error);
            toast.error("Failed to download logs");
        } finally {
            setDownloadingLogs(false);
        }
    };

    const rep: FlowSummaryEntry = session.flowSummary?.REPORTABLE ?? { total: 0, completed: 0 };
    const mand: FlowSummaryEntry = session.flowSummary?.MANDATORY ?? { total: 0, completed: 0 };
    const opt: FlowSummaryEntry = session.flowSummary?.OPTIONAL ?? { total: 0, completed: 0 };

    const buildRowsFromFlows = (
        flows: Record<string, Flow> | Flow[],
        deriveStatus: (id: string) => FlowStatus
    ): FlowRow[] => {
        const entries = Array.isArray(flows)
            ? flows.map((flow) => [flow.id, flow] as const)
            : Object.entries(flows);
        return entries.map(([id, flow]) => {
            const tags = flow.tags ?? [];
            const type = tags.find((t) => ["MANDATORY", "OPTIONAL"].includes(t)) ?? "OPTIONAL";
            const name = id;
            return { id, name, type, status: deriveStatus(id) };
        });
    };

    const handleExpand = async () => {
        const next = !expanded;
        setExpanded(next);
        if (next && !detailFetched.current) {
            detailFetched.current = true;
            setLoadingDetail(true);
            try {
                // Pass/Fail map from session analytics — used to derive flow status
                const resultMap = session.flowMap ?? {};
                const deriveStatusFromResult = (id: string): FlowStatus =>
                    resultMap[id] === "PASS" || resultMap[id] === "FAIL" || resultMap[id] === "RUN"
                        ? resultMap[id]
                        : "NOT_RUN";

                if (session.domain && session.version && session.usecaseId) {
                    // Fetch flow definitions directly from config service
                    const res = await apiClient.get<{ data: { flows: Flow[] } }>(
                        API_ROUTES.CONFIG.FLOWS,
                        {
                            params: {
                                domain: session.domain,
                                version: session.version,
                                usecase: session.usecaseId,
                            },
                        }
                    );
                    setFlowRows(
                        buildRowsFromFlows(res.data?.data?.flows ?? [], deriveStatusFromResult)
                    );
                } else {
                    // Fallback for older sessions without stored domain/version/usecaseId:
                    // pull flow configs from the (possibly expired) session cache
                    const res = await apiClient.get<SessionCache>(API_ROUTES.SESSIONS.BASE, {
                        params: {
                            session_id: (session as { sessionId?: string } | undefined)?.sessionId,
                        },
                    });
                    const detail = res.data;
                    const attemptedMap = detail.flowMap ?? {};
                    const flowConfigs = detail.flowConfigs ?? {};
                    if (Object.keys(flowConfigs).length > 0) {
                        setFlowRows(
                            buildRowsFromFlows(flowConfigs, (id) =>
                                resultMap[id] === "PASS" || resultMap[id] === "FAIL"
                                    ? resultMap[id]
                                    : id in attemptedMap
                                      ? "RUN"
                                      : "NOT_RUN"
                            )
                        );
                    } else {
                        setFlowRows(
                            Object.keys(attemptedMap).map((id) => ({
                                id,
                                name: id.replace(/_/g, " "),
                                type: "OPTIONAL",
                                status: "ATTEMPTED" as FlowStatus,
                            }))
                        );
                    }
                }
            } catch (e) {
                console.error("Failed to fetch session flows", e);
                toast.error("Failed to load session details");
                detailFetched.current = false;
            } finally {
                setLoadingDetail(false);
            }
        }
    };
    const isResumeDisabled =
        Date.now() - new Date(session.createdAt).getTime() > 48 * 60 * 60 * 1000;
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
                <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-sky-50 border border-sky-200 rounded-xl">
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
                <div className="hidden md:flex items-center gap-5 shrink-0">
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
                <div className="flex items-center gap-2 shrink-0 ml-2">
                    {(() => {
                        const resumeButton = (
                            <button
                                className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white text-xs font-bold rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sky-600"
                                onClick={handleResume}
                                disabled={isResumeDisabled}
                            >
                                Resume
                                <LuExternalLink size={12} />
                            </button>
                        );
                        return isResumeDisabled ? (
                            <CustomTooltip content="Session is older than 48 hours and can no longer be resumed.">
                                <span className="cursor-not-allowed">{resumeButton}</span>
                            </CustomTooltip>
                        ) : (
                            resumeButton
                        );
                    })()}
                    {(() => {
                        const downloadButton = (
                            <button
                                className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg bg-slate-50 text-slate-500 hover:border-sky-300 hover:text-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-slate-500"
                                onClick={handleDownloadLogs}
                                disabled={!hasPayloads || downloadingLogs}
                            >
                                {downloadingLogs ? (
                                    <LuLoader size={14} className="animate-spin" />
                                ) : (
                                    <LuDownload size={14} />
                                )}
                            </button>
                        );
                        return !hasPayloads ? (
                            <CustomTooltip content="No logs available to download for this session.">
                                <span className="cursor-not-allowed">{downloadButton}</span>
                            </CustomTooltip>
                        ) : (
                            downloadButton
                        );
                    })()}
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
                    {/* <div className="flex gap-3 flex-wrap mb-5">
                        <SummaryPill dotColor="#0b7ec8" label="Overall Completed" entry={rep} />
                        <SummaryPill dotColor="#16a34a" label="Mandatory Completed" entry={mand} />
                        <SummaryPill dotColor="#d97706" label="Optional Completed" entry={opt} />
                    </div> */}

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
    const { userDetails } = useContext(UserContext);
    const [subscriberId, setSubscriberId] = useState("");
    const [subscriberOptions, setSubscriberOptions] = useState<string[]>([]);
    const [loadingSubscribers, setLoadingSubscribers] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [npType, setNpType] = useState("BAP");
    const [domains, setDomains] = useState<IDomain[]>([]);
    const [selectedDomain, setSelectedDomain] = useState("");
    const [selectedVersion, setSelectedVersion] = useState("");
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(false);
    const [isFetched, setIsFetched] = useState(false);
    const [viewingId, setViewingId] = useState<string | null>(null);

    const versionOptions = domains.find((d) => d.key === selectedDomain)?.version ?? [];

    useEffect(() => {
        const fetchSubscribers = async () => {
            if (!userDetails?.username) return;
            setLoadingSubscribers(true);
            try {
                const urls = await getSubscriberUrls(userDetails?.username);
                setSubscriberOptions(urls);
            } catch {
                setSubscriberOptions([]);
            } finally {
                setLoadingSubscribers(false);
            }
        };
        const fetchDomains = async () => {
            try {
                const res = await apiClient.get<{ domain: IDomain[] }>(
                    API_ROUTES.CONFIG.SCENARIO_FORM_DATA
                );
                setDomains(res.data.domain ?? []);
            } catch {
                setDomains([]);
            }
        };
        fetchSubscribers();
        fetchDomains();
    }, [userDetails?.githubId]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = subscriberOptions.filter((url) =>
        url.toLowerCase().includes(searchText.toLowerCase())
    );

    const handleDomainChange = (domain: string) => {
        setSelectedDomain(domain);
        setSelectedVersion("");
    };

    const handleFetchSessions = async () => {
        if (!subscriberId.trim()) return;
        setLoading(true);
        setSessions([]);
        try {
            const response = await getSessions(
                subscriberId,
                npType,
                selectedDomain || undefined,
                selectedVersion || undefined
            );
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
            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-xs">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Enter Subscriber Details
                </p>
                <div className="flex gap-2.5 items-center flex-wrap">
                    {/* Searchable subscriber dropdown */}
                    <div className="relative flex-1 min-w-48" ref={dropdownRef}>
                        <div
                            className={`flex items-center bg-slate-50 border rounded-xl px-4 py-2.5 transition-all ${dropdownOpen ? "border-sky-400 ring-2 ring-sky-100 bg-white" : "border-slate-200"}`}
                            onClick={() => setDropdownOpen(true)}
                        >
                            {loadingSubscribers ? (
                                <LuLoader
                                    size={13}
                                    className="animate-spin text-slate-400 mr-2 shrink-0"
                                />
                            ) : (
                                <LuSearch size={13} className="text-slate-400 mr-2 shrink-0" />
                            )}
                            <input
                                type="text"
                                value={dropdownOpen ? searchText : subscriberId}
                                onChange={(e) => {
                                    setSearchText(e.target.value);
                                    setDropdownOpen(true);
                                }}
                                onFocus={() => setDropdownOpen(true)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        setDropdownOpen(false);
                                        handleFetchSessions();
                                    }
                                    if (e.key === "Escape") setDropdownOpen(false);
                                }}
                                placeholder={
                                    loadingSubscribers
                                        ? "Loading subscribers…"
                                        : "Select or type a Subscriber ID"
                                }
                                className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                            />
                        </div>

                        {dropdownOpen && (
                            <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                                {filteredOptions.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-slate-400 text-center">
                                        {loadingSubscribers ? "Loading…" : "No subscribers found"}
                                    </div>
                                ) : (
                                    filteredOptions.map((url) => (
                                        <button
                                            key={url}
                                            type="button"
                                            title={url}
                                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-sky-50 hover:text-sky-700 transition-colors truncate ${subscriberId === url ? "bg-sky-50 text-sky-700 font-semibold" : "text-slate-700"}`}
                                            onClick={() => {
                                                setSubscriberId(url);
                                                setSearchText("");
                                                setDropdownOpen(false);
                                            }}
                                        >
                                            {url}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                    <select
                        value={selectedDomain}
                        onChange={(e) => handleDomainChange(e.target.value)}
                        className="min-w-36 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:bg-white transition-all cursor-pointer"
                    >
                        <option value="">All Domains</option>
                        {domains.map((d) => (
                            <option key={d.key} value={d.key}>
                                {d.key}
                            </option>
                        ))}
                    </select>
                    <select
                        value={selectedVersion}
                        onChange={(e) => setSelectedVersion(e.target.value)}
                        disabled={!selectedDomain}
                        className="min-w-32 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:bg-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="">All Versions</option>
                        {versionOptions.map((v) => (
                            <option key={v.key} value={v.key}>
                                {v.key}
                            </option>
                        ))}
                    </select>
                    <select
                        value={npType}
                        onChange={(e) => setNpType(e.target.value)}
                        className="min-w-32 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-hidden focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:bg-white transition-all cursor-pointer"
                    >
                        <option value="BAP">BAP</option>
                        <option value="BPP">BPP</option>
                    </select>
                    <button
                        onClick={handleFetchSessions}
                        disabled={
                            loading || !subscriberId.trim() || !selectedDomain || !selectedVersion
                        }
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
