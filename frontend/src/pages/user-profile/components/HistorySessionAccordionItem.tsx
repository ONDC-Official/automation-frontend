import { useNavigate } from "react-router-dom";

import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/Shadcn/Accordion/accordion";
import Spinner from "@/components/Shadcn/Spinner";
import { ROUTES } from "@constants/routes";
import { HistorySessionHeader } from "@pages/user-profile/components/HistorySessionHeader";
import { SessionFlowsTable } from "@pages/user-profile/components/SessionFlowsTable";
import { useSessionFlows } from "@pages/user-profile/hooks/useSessionFlows";
import { useSessionLogs } from "@pages/user-profile/hooks/useSessionLogs";
import { formatLastRunText } from "@pages/user-profile/utils/formatLastRunText";
import { getFlowSummaryPcts } from "@pages/user-profile/utils/getFlowSummaryPcts";
import type { IHistorySessionAccordionItemProps } from "@pages/user-profile/types";

export const HistorySessionAccordionItem = ({
    session,
    isExpanded,
    onViewReport,
    viewingId,
    subscriberUrl,
    npType,
}: IHistorySessionAccordionItemProps) => {
    const navigate = useNavigate();
    const { flowRows, loadingDetail } = useSessionFlows(session, isExpanded);
    const { hasPayloads, downloadingLogs, handleDownloadLogs } = useSessionLogs(session.sessionId);
    const { reportablePct, mandatoryPct, optionalPct } = getFlowSummaryPcts(session);
    const lastRunText = formatLastRunText(session.createdAt, reportablePct);
    const isResumeDisabled =
        Date.now() - new Date(session.createdAt).getTime() > 48 * 60 * 60 * 1000;

    const handleResume = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(
            `${ROUTES.FLOW_TESTING}?sessionId=${session.sessionId}&subscriberUrl=${encodeURIComponent(subscriberUrl)}&role=${npType}`
        );
    };

    return (
        <AccordionItem
            value={session.sessionId}
            className="rounded-xl border border-n-30 bg-brand-light/40 overflow-hidden border-b-0 dark:border-border-default dark:bg-surface-muted"
        >
            <AccordionTrigger className="px-5 py-4 hover:no-underline [&>svg]:shrink-0">
                <HistorySessionHeader
                    session={session}
                    lastRunText={lastRunText}
                    reportablePct={reportablePct}
                    mandatoryPct={mandatoryPct}
                    optionalPct={optionalPct}
                    isResumeDisabled={isResumeDisabled}
                    hasPayloads={hasPayloads}
                    downloadingLogs={downloadingLogs}
                    onResume={handleResume}
                    onDownloadLogs={handleDownloadLogs}
                />
            </AccordionTrigger>

            <AccordionContent className="px-5 pb-5 border-t border-n-30 dark:border-border-default">
                {loadingDetail ? (
                    <div className="flex items-center justify-center py-8 text-text-secondary">
                        <Spinner className="size-5 mr-2" />
                        <span className="text-body-2">Loading flows…</span>
                    </div>
                ) : flowRows.length > 0 ? (
                    <SessionFlowsTable
                        flowRows={flowRows}
                        reportExists={session.reportExists}
                        sessionId={session.sessionId}
                        viewingId={viewingId}
                        onViewReport={onViewReport}
                    />
                ) : (
                    <div className="text-center py-8 text-text-secondary text-body-2">
                        No flow data available for this session.
                    </div>
                )}
            </AccordionContent>
        </AccordionItem>
    );
};
