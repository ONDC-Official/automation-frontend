import { useContext, useEffect, useState } from "react";
import { LuFileText, LuExternalLink, LuLoader } from "react-icons/lu";
import { toast } from "react-toastify";

import { UserContext } from "@context/userContext";
import { apiClient } from "@services/apiClient";
import { API_ROUTES } from "@services/apiRoutes";
import { getReport } from "@utils/request-utils";
import { openReportInNewTab } from "@utils/generic-utils";

type PastReport = {
    test_id: string;
};

function truncateId(id: string, len = 28): string {
    if (id.length <= len) return id;
    return `${id.slice(0, len / 2)}…${id.slice(-len / 2)}`;
}

export default function PastReportsSection() {
    const { userDetails } = useContext(UserContext);
    const [reports, setReports] = useState<PastReport[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewingId, setViewingId] = useState<string | null>(null);

    useEffect(() => {
        if (!userDetails?.githubId) return;

        setLoading(true);
        apiClient
            .get<PastReport[]>(API_ROUTES.USER.PAST_REPORTS(userDetails.githubId))
            .then((res) => setReports(Array.isArray(res.data) ? res.data : []))
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
    }, [userDetails?.githubId]);

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
        <div className="bg-gray-100 p-2 rounded-md shadow-sm mt-4">
            <h2 className="text-xl font-bold text-gray-900 mb-1 mt-2">Past Reports</h2>
            <p className="text-sm text-gray-500 mb-4">
                Reports generated from your previous testing sessions.
            </p>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <LuLoader className="text-4xl mb-2 animate-spin" />
                    <p className="text-sm">Loading reports…</p>
                </div>
            ) : reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <LuFileText className="text-4xl mb-2" />
                    <p className="text-sm">No reports generated yet.</p>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto space-y-2">
                    {reports.map((report) => (
                        <div
                            key={report.test_id}
                            className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <LuFileText className="text-gray-400 text-lg shrink-0" />
                                <p
                                    className="text-sm font-mono text-gray-700 truncate"
                                    title={report.test_id}
                                >
                                    {truncateId(report.test_id)}
                                </p>
                            </div>

                            <button
                                type="button"
                                disabled={viewingId === report.test_id}
                                className="flex items-center gap-1 text-sky-500 hover:text-sky-700 text-sm font-medium disabled:opacity-50 ml-4 shrink-0"
                                onClick={() => handleViewReport(report.test_id)}
                            >
                                {viewingId === report.test_id ? (
                                    <LuLoader className="text-base animate-spin" />
                                ) : (
                                    <LuExternalLink className="text-base" />
                                )}
                                View
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
