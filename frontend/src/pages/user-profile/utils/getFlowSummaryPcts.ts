import type { FlowSummaryEntry, Session } from "@pages/user-profile/types";

const DEFAULT_PCT = 83;

export const getCategoryPct = (entry: FlowSummaryEntry) =>
    entry.total > 0 ? Math.round((entry.completed / entry.total) * 100) : DEFAULT_PCT;

export const getFlowSummaryPcts = (session: Session) => {
    const rep = session.flowSummary?.REPORTABLE ?? { total: 0, completed: 0 };
    const mand = session.flowSummary?.MANDATORY ?? { total: 0, completed: 0 };
    const opt = session.flowSummary?.OPTIONAL ?? { total: 0, completed: 0 };

    return {
        reportablePct: getCategoryPct(rep),
        mandatoryPct: getCategoryPct(mand),
        optionalPct: getCategoryPct(opt),
    };
};
