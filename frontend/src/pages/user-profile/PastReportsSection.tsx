import { useContext, useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthContext } from "@/context/authContext";
import { useGetPastReportsQuery, useLazyGetReportQuery } from "@store/api";
import { openReportInNewTab } from "@utils/generic-utils";
import Spinner from "@/components/Shadcn/Spinner";
import { PastReportCard } from "@pages/user-profile/components/PastReportCard";
import { ProfilePageHeader } from "@pages/user-profile/ProfilePageHeader";
import { useReportFlowDescriptions } from "@pages/user-profile/hooks/useReportFlowDescriptions";
import { PROFILE_PAGE_COPY } from "@pages/user-profile/constants";

export const PastReportsSection = () => {
    const { user } = useContext(AuthContext);
    const [viewingId, setViewingId] = useState<string | null>(null);

    const {
        data,
        isFetching: loading,
        error,
    } = useGetPastReportsQuery(user?.username ?? "", { skip: !user?.username });
    const reports = data ?? [];
    const [triggerGetReport] = useLazyGetReportQuery();

    useEffect(() => {
        if (!error) return;
        const status = (error as { status?: number })?.status;
        if (status === 404 || status === 204) return;
        console.error("Error fetching past reports", error);
        toast.error("Failed to load past reports.");
    }, [error]);

    const handleViewReport = async (testId: string) => {
        setViewingId(testId);
        try {
            const report = await triggerGetReport({
                sessionId: testId.replace(/^PW_/, ""),
            }).unwrap();
            if (report?.data) {
                openReportInNewTab(report.data, testId);
            }
        } catch {
            toast.error("Failed to load report.");
        } finally {
            setViewingId(null);
        }
    };

    const copy = PROFILE_PAGE_COPY.pastReports;
    const flowDescriptions = useReportFlowDescriptions(reports);

    return (
        <div className="min-w-0 flex-1 min-h-full p-5">
            <ProfilePageHeader
                title={copy.title}
                subtitle={copy.subtitle}
                badgeCount={reports.length}
            />

            {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
                    <Spinner className="size-8 mb-3" />
                    <p className="text-body-2 font-medium">Loading reports…</p>
                </div>
            ) : reports.length === 0 ? (
                <div className="text-center py-16 text-text-secondary">
                    <p className="text-body-2 font-semibold">No reports yet.</p>
                    <p className="text-caption-1 mt-1">Completed test reports will appear here.</p>
                </div>
            ) : (
                <div>
                    {reports.map((report) => (
                        <PastReportCard
                            key={report.test_id}
                            report={report}
                            isViewing={viewingId === report.test_id}
                            onView={handleViewReport}
                            flowDescription={flowDescriptions[report.test_id]}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PastReportsSection;
