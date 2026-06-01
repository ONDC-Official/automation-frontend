import { useState, useEffect, FC } from "react";
import {
    LuHistory,
    LuFileText,
    LuLoader,
    LuCalendar,
    LuExternalLink,
    LuGlobe,
    LuTag,
    LuChevronDown,
    LuChevronUp,
    LuDownload,
} from "react-icons/lu";
import { toast } from "react-toastify";
import { FiCopy } from "react-icons/fi";

import { getReport, getSessions } from "@utils/request-utils";
import { openReportInNewTab } from "@utils/generic-utils";
import { apiClient } from "@services/apiClient";
import { API_ROUTES } from "@services/apiRoutes";
import { Session } from "@pages/history/types";
import { Domain, DomainVersion } from "@pages/schema-validation/types";

// --- Types ---
type PramaanFlow = {
    _id: string;
    "Pramaan ID": string;
    "Subscriber ID": string;
    "Subscriber URI": string;
    Environment: string;
    Domain: string;
    Role: string;
    Category: string;
    "Transaction Type": string;
    "API Version": string;
    "Report Generation Timestamp": string;
    "Flow ID": string;
    "Flow Display Name": string;
    "Optional Tests": number;
    "Mandatory Tests": number;
    "Total Tests": number;
    Passed: number;
    "Failed (Optional)": number;
    "Failed (Mandatory)": number;
    Failed: number;
    "Report Link": string;
    "Logs Link": string;
    created_at: string;
    updated_at: string;
};

type FlowDataResponse = {
    source: "pramaan" | "internal";
    enabled: boolean;
    domainVersionKey: string;
    data?: PramaanFlow[];
    message?: string;
};

// --- Helpers ---
const getOverallStatus = (flows: PramaanFlow[]) => {
    const anyFailed = flows.some((f) => f["Failed (Mandatory)"] > 0);
    if (anyFailed) return "Partially Cleared";
    return "Cleared";
};

const formatTs = (ts: string) => {
    const clean = ts.replace(/"/g, "");
    return new Date(clean).toLocaleString("en-IN", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
};

// --- Pramaan Report UI ---
const PramaanReportCard: FC<{ flows: PramaanFlow[] }> = ({ flows }) => {
    const [expanded, setExpanded] = useState(true);
    if (!flows.length) return null;

    const first = flows[0];
    const status = getOverallStatus(flows);
    const isCleared = status === "Cleared";
    // const attemptedFlows = flows.filter((f) => f["Total Tests"] > 0);
    const passedFlows = flows.filter((f) => f["Failed (Mandatory)"] === 0 && f["Total Tests"] > 0);

    const statusBadge = (
        <span
            className={`flex items-center gap-1.5 text-xs font-semibold ${isCleared ? "text-green-600" : "text-amber-600"}`}
        >
            <span
                className={`w-1.5 h-1.5 rounded-full ${isCleared ? "bg-green-500" : "bg-amber-500"}`}
            />
            {status}
        </span>
    );

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Report title bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white">
                <h2 className="text-base font-bold text-gray-800">Report</h2>
                <div className="flex items-center gap-4">
                    {first["Report Link"] && (
                        <a
                            href={first["Report Link"]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-700 font-medium"
                        >
                            <LuDownload size={14} />
                            Download
                        </a>
                    )}
                </div>
            </div>

            {/* Info bar — Domain / Role / Transaction Type / Status / Timestamp */}
            <div className="flex items-center gap-6 px-5 py-3 bg-orange-50 border-b border-orange-100 flex-wrap">
                <span className="text-sm text-gray-700">
                    <span className="font-medium">Domain:</span> {first["Domain"]}
                </span>
                <span className="text-sm text-gray-700">
                    <span className="font-medium">Role:</span> {first["Role"]}
                </span>
                <div className="ml-auto flex items-center gap-4">
                    {statusBadge}
                    <span className="text-xs text-gray-400">
                        {formatTs(first["Report Generation Timestamp"])}
                    </span>
                </div>
            </div>

            {/* Sub-header — API / UseCase / Subscriber + expand toggle */}
            <div
                className="flex items-center gap-6 px-5 py-3 bg-white border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded((v) => !v)}
            >
                <span className="text-sm text-gray-600">
                    <span className="font-medium">API :</span> {first["API Version"]}
                </span>
                <span className="text-sm text-gray-600">
                    Use Case : <span className="font-bold text-gray-800">{first["Category"]}</span>
                </span>
                <span className="text-sm text-gray-600">
                    Subscriber ID :{" "}
                    <span className="font-medium text-gray-800">{first["Subscriber ID"]}</span>
                </span>
                <div className="ml-auto flex items-center gap-3">
                    {statusBadge}
                    {expanded ? (
                        <LuChevronUp size={16} className="text-gray-400" />
                    ) : (
                        <LuChevronDown size={16} className="text-gray-400" />
                    )}
                </div>
            </div>

            {/* Expanded: flow summary + table */}
            {expanded && (
                <div className="bg-white">
                    {/* Summary pills */}
                    <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded px-3 py-1">
                            ✓ Completed mandatory flows: {passedFlows.length} out of {flows.length}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-200 rounded px-3 py-1">
                            Remaining mandatory flows: {flows.length - passedFlows.length} out of{" "}
                            {flows.length}
                        </span>
                    </div>

                    {/* Flow table — scrollable for long lists */}
                    <div className="overflow-y-auto max-h-[420px]">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[45%]">
                                        Flow Name
                                    </th>
                                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Flow Type
                                    </th>
                                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Flow Attempted
                                    </th>
                                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Flow Passed
                                    </th>
                                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Flow Pending
                                    </th>
                                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Report
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {flows.map((flow) => {
                                    const attempted = flow["Total Tests"] > 0;
                                    const passed = attempted && flow["Failed (Mandatory)"] === 0;
                                    const pending = !attempted;
                                    return (
                                        <tr
                                            key={flow["_id"]}
                                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-5 py-3 text-gray-700">
                                                {flow["Flow Display Name"]}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">mandatory</td>
                                            <td className="px-4 py-3 text-center font-bold">
                                                <span
                                                    className={
                                                        attempted
                                                            ? "text-gray-700"
                                                            : "text-gray-400"
                                                    }
                                                >
                                                    {attempted ? "Y" : "X"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold">
                                                <span
                                                    className={
                                                        passed ? "text-gray-700" : "text-gray-400"
                                                    }
                                                >
                                                    {passed ? "Y" : "X"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold">
                                                <span
                                                    className={
                                                        pending ? "text-gray-700" : "text-gray-400"
                                                    }
                                                >
                                                    {pending ? "Y" : "X"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {flow["Report Link"] && (
                                                    <a
                                                        href={flow["Report Link"]}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sky-500 hover:text-sky-700 transition-colors"
                                                        title="Download Report"
                                                    >
                                                        <LuExternalLink size={13} />
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main Page ---
const HistoryPage: FC = () => {
    const [subscriberId, setSubscriberId] = useState("");
    const [npType, setNpType] = useState("BAP");
    const [domain, setDomain] = useState("");
    const [version, setVersion] = useState("");

    const [domainList, setDomainList] = useState<Domain[]>([]);
    const [versionList, setVersionList] = useState<DomainVersion[]>([]);

    const [sessions, setSessions] = useState<Session[]>([]);
    const [flowData, setFlowData] = useState<FlowDataResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [isFetched, setIsFetched] = useState(false);
    const [viewingId, setViewingId] = useState<string | null>(null);

    useEffect(() => {
        apiClient
            .get<{ domain: Domain[] }>(API_ROUTES.CONFIG.SCENARIO_FORM_DATA)
            .then((res) => setDomainList(res.data.domain || []))
            .catch(() => console.error("Failed to fetch domain list"));
    }, []);

    useEffect(() => {
        const selected = domainList.find((d) => d.key === domain);
        setVersionList(selected?.version || []);
        setVersion("");
    }, [domain, domainList]);

    const handleFetchSessions = async () => {
        if (!subscriberId.trim()) return;
        setLoading(true);
        setFlowData(null);
        setSessions([]);
        try {
            if (domain && version) {
                const res = await apiClient.post<FlowDataResponse>(API_ROUTES.USER.FLOW_DATA, {
                    subscriberId,
                    domain,
                    version,
                    npType,
                });
                setFlowData(res.data);
                if (res.data.source === "internal") {
                    toast.info("This domain has internal workbench support.");
                }
            } else {
                const response = await getSessions(
                    subscriberId,
                    npType,
                    domain || undefined,
                    version || undefined
                );
                setSessions(
                    response.sessions
                        .slice()
                        .sort(
                            (a: Session, b: Session) =>
                                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        )
                );
            }
        } catch (e) {
            console.error("error while fetching", e);
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
            console.error("error while fetching report: ", e);
            toast.error("Report not available");
        } finally {
            setViewingId(null);
        }
    };

    const formatDateTime = (isoString: string) => {
        return new Date(isoString).toLocaleString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    return (
        <div className="w-full pb-12">
            {/* Banner */}
            <div className="bg-sky-100 w-full text-center px-6 py-10 mb-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">History</h1>
                <p className="text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
                    View and manage your previous sessions. You can check reports or resume a past
                    session anytime.
                    <br />
                    Enter subscriber id and NP type to view your testing sessions.
                </p>
            </div>

            {/* Form */}
            <div className="w-full px-6">
                <div className="flex items-end gap-4 flex-wrap">
                    {/* Subscriber Id */}
                    <div className="flex flex-col gap-1 flex-1 min-w-48">
                        <label
                            htmlFor="history-subscriber-id"
                            className="text-sm font-medium text-gray-700"
                        >
                            Subscriber Id <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="history-subscriber-id"
                            type="text"
                            value={subscriberId}
                            onChange={(e) => setSubscriberId(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleFetchSessions()}
                            placeholder="Enter ID"
                            className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 placeholder:text-gray-400 bg-white"
                        />
                    </div>

                    {/* Domain */}
                    <div className="flex flex-col gap-1 flex-1 min-w-40">
                        <label
                            htmlFor="history-domain"
                            className="text-sm font-medium text-gray-700"
                        >
                            Domain <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="history-domain"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 text-gray-700"
                        >
                            <option value="">Select domain</option>
                            {domainList.map((d) => (
                                <option key={d.key} value={d.key}>
                                    {d.key}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Version */}
                    <div className="flex flex-col gap-1 flex-1 min-w-40">
                        <label
                            htmlFor="history-version"
                            className="text-sm font-medium text-gray-700"
                        >
                            Version <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="history-version"
                            value={version}
                            onChange={(e) => setVersion(e.target.value)}
                            disabled={!domain || versionList.length === 0}
                            className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 text-gray-700 disabled:bg-gray-50 disabled:text-gray-400"
                        >
                            <option value="">Select version</option>
                            {versionList.map((v) => (
                                <option key={v.key} value={v.key}>
                                    {v.key}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* NP Type */}
                    <div className="flex flex-col gap-1 w-28">
                        <label
                            htmlFor="history-np-type"
                            className="text-sm font-medium text-gray-700"
                        >
                            NP Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="history-np-type"
                            value={npType}
                            onChange={(e) => setNpType(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 text-gray-700"
                        >
                            <option value="BAP">BAP</option>
                            <option value="BPP">BPP</option>
                        </select>
                    </div>

                    {/* Fetch */}
                    <button
                        id="history-fetch-btn"
                        onClick={handleFetchSessions}
                        disabled={loading || !subscriberId.trim()}
                        className="flex items-center gap-2 px-6 py-2 text-sm font-semibold
                                   bg-sky-600 text-white rounded hover:bg-sky-700
                                   disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 self-end"
                    >
                        {loading ? <LuLoader size={14} className="animate-spin" /> : null}
                        {loading ? "Fetching…" : "Fetch"}
                    </button>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 mt-8 mb-6" />

                {/* Results */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <LuLoader size={28} className="animate-spin mb-3 text-sky-400" />
                        <p className="text-sm text-gray-400 font-medium">Fetching sessions…</p>
                    </div>
                ) : !isFetched ? (
                    <p className="text-sm text-sky-600 text-center py-8">
                        Enter Subscriber ID, Domain, Version and NP Type to search for sessions.
                    </p>
                ) : flowData ? (
                    flowData.source === "pramaan" &&
                    Array.isArray(flowData.data) &&
                    flowData.data.length > 0 ? (
                        <PramaanReportCard flows={flowData.data} />
                    ) : flowData.source === "pramaan" &&
                      (!flowData.data || (flowData.data as PramaanFlow[]).length === 0) ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <LuFileText size={32} className="text-gray-200 mb-3" />
                            <p className="text-sm font-semibold text-gray-500">
                                No Pramaan data found
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                No integration report found for this subscriber.
                            </p>
                        </div>
                    ) : (
                        // Internal domain
                        <div className="border border-sky-100 rounded-lg p-6 bg-sky-50 text-center">
                            <p className="text-sm font-semibold text-sky-700">
                                Internal Workbench Flow
                            </p>
                            <p className="text-xs text-sky-500 mt-1">{flowData.message}</p>
                        </div>
                    )
                ) : sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <LuFileText size={32} className="text-gray-200 mb-3" />
                        <p className="text-sm font-semibold text-gray-500">No sessions found</p>
                        <p className="text-xs text-gray-400 mt-1">
                            No past sessions found for this subscriber.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {sessions.map((session) => (
                            <div
                                key={session.sessionId}
                                className="bg-white border border-gray-200 rounded-lg px-5 py-4 shadow-sm hover:shadow-md hover:border-sky-200 transition-all duration-200"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="p-2 rounded bg-sky-50 border border-sky-100 shrink-0 mt-0.5">
                                            <LuHistory size={13} className="text-sky-500" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p
                                                    className="text-[13px] font-mono font-medium text-gray-700 truncate"
                                                    title={session.sessionId}
                                                >
                                                    {session.sessionId}
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(
                                                            session.sessionId
                                                        );
                                                        toast.info("Session ID copied!");
                                                    }}
                                                    className="text-gray-300 hover:text-sky-500 transition-colors shrink-0"
                                                >
                                                    <FiCopy size={12} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <LuCalendar
                                                    size={10}
                                                    className="text-gray-300 shrink-0"
                                                />
                                                <p className="text-[11px] text-gray-400">
                                                    {formatDateTime(session.createdAt)}
                                                </p>
                                            </div>
                                            {(session.domain || session.version) && (
                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                    {session.domain && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-sky-50 text-sky-600 border border-sky-200 px-2 py-0.5 rounded-full">
                                                            <LuGlobe size={9} />
                                                            {session.domain}
                                                        </span>
                                                    )}
                                                    {session.version && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">
                                                            <LuTag size={9} />v{session.version}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {!session.reportExists && (
                                            <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                                                No report
                                            </span>
                                        )}
                                        <button
                                            id={`view-report-${session.sessionId}`}
                                            disabled={
                                                !session.reportExists ||
                                                viewingId === session.sessionId
                                            }
                                            onClick={() => viewReport(session.sessionId)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                                                       bg-sky-600 text-white rounded hover:bg-sky-700
                                                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                                        >
                                            {viewingId === session.sessionId ? (
                                                <LuLoader size={11} className="animate-spin" />
                                            ) : (
                                                <LuExternalLink size={11} />
                                            )}
                                            View Report
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryPage;
