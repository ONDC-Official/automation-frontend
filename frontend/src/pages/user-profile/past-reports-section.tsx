import { LuFileText, LuExternalLink } from "react-icons/lu";

type PastReport = {
    sessionId: string;
    createdAt: string;
    domain: string;
    npType: string;
};

const DUMMY_REPORTS: PastReport[] = [];

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function truncateSessionId(id: string, len = 28): string {
    if (id.length <= len) return id;
    return `${id.slice(0, len / 2)}…${id.slice(-len / 2)}`;
}

const npTypeColors: Record<string, string> = {
    BAP: "bg-sky-100 text-sky-700",
    BPP: "bg-violet-100 text-violet-700",
};

export default function PastReportsSection() {
    return (
        <div className="bg-gray-100 p-2 rounded-md shadow-sm mt-4">
            <h2 className="text-xl font-bold text-gray-900 mb-1 mt-2">Past Reports</h2>
            <p className="text-sm text-gray-500 mb-4">
                Reports generated from your previous testing sessions.
            </p>

            {DUMMY_REPORTS.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <LuFileText className="text-4xl mb-2" />
                    <p className="text-sm">No reports generated yet.</p>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto space-y-2">
                    {DUMMY_REPORTS.map((report) => (
                        <div
                            key={report.sessionId}
                            className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200"
                        >
                            <div className="flex items-start gap-3 min-w-0">
                                <LuFileText className="text-gray-400 text-lg mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                    <p
                                        className="text-sm font-mono text-gray-700 truncate"
                                        title={report.sessionId}
                                    >
                                        {truncateSessionId(report.sessionId)}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {formatDate(report.createdAt)} &nbsp;·&nbsp; {report.domain}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 ml-4 shrink-0">
                                <span
                                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${npTypeColors[report.npType] ?? "bg-gray-100 text-gray-600"}`}
                                >
                                    {report.npType}
                                </span>
                                <button
                                    type="button"
                                    className="flex items-center gap-1 text-sky-500 hover:text-sky-700 text-sm font-medium"
                                    // onClick={() => handleViewReport(report.sessionId)}
                                >
                                    <LuExternalLink className="text-base" />
                                    View
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
