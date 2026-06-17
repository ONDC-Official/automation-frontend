import { Accordion } from "@/components/Shadcn/Accordion/accordion";
import { HistorySessionAccordionItem } from "@pages/user-profile/components/HistorySessionAccordionItem";
import type { IActivityHistoryAccordionProps } from "@pages/user-profile/types";

export const ActivityHistoryAccordion = ({
    sessions,
    expandedId,
    onExpandedChange,
    onViewReport,
    viewingId,
    subscriberUrl,
    npType,
}: IActivityHistoryAccordionProps) => (
    <div className="space-y-3 p-5 border border-n-30 rounded-lg dark:border-border-default">
        <p className="text-h6 font-semibold text-text-primary uppercase tracking-wider">
            {sessions.length} Session{sessions.length !== 1 ? "s" : ""} Found
        </p>
        <Accordion
            type="single"
            collapsible
            value={expandedId}
            onValueChange={onExpandedChange}
            className="space-y-3"
        >
            {sessions.map((session) => (
                <HistorySessionAccordionItem
                    key={session.sessionId}
                    session={session}
                    isExpanded={expandedId === session.sessionId}
                    onViewReport={onViewReport}
                    viewingId={viewingId}
                    subscriberUrl={subscriberUrl}
                    npType={npType}
                />
            ))}
        </Accordion>
    </div>
);
