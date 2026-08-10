import { CircleCheck, FileText, Layers, XCircle } from "lucide-react";
import StatTile from "@dashboard/components/StatTile";
import { formatCompact, formatPercent } from "@dashboard/lib/utils";
import type { SessionStatsResponse } from "@dashboard/services/types";

interface IProps {
    totals?: SessionStatsResponse["totals"];
    sparkline: number[];
    isLoading: boolean;
}

/**
 * Pass rate wears the reserved status scale; the label always says what it is.
 * A null rate means nothing has been judged — that is not a failing grade, so
 * it stays on the neutral token and renders as an em-dash.
 */
function passRateTone(passRate: number | null | undefined) {
    if (passRate === null || passRate === undefined) return "default" as const;
    if (passRate >= 0.9) return "pass" as const;
    if (passRate >= 0.7) return "pending" as const;
    return "fail" as const;
}

const KpiRow = ({ totals, sparkline, isLoading }: IProps) => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
            label="Sessions"
            value={formatCompact(totals?.sessions)}
            hint="In the selected window"
            icon={Layers}
            trend={sparkline}
            isLoading={isLoading}
        />
        <StatTile
            label="Flow pass rate"
            value={formatPercent(totals?.passRate)}
            hint={`${formatCompact(totals?.flowsPassed)} of ${formatCompact(totals?.flowsTotal)} flows`}
            icon={CircleCheck}
            tone={passRateTone(totals?.passRate)}
            isLoading={isLoading}
        />
        <StatTile
            label="Flows failed"
            value={formatCompact(totals?.flowsFailed)}
            hint="Across all sessions in range"
            icon={XCircle}
            tone={totals && totals.flowsFailed > 0 ? "fail" : "default"}
            isLoading={isLoading}
        />
        <StatTile
            label="Reports generated"
            value={formatCompact(totals?.withReports)}
            hint={`of ${formatCompact(totals?.sessions)} sessions`}
            icon={FileText}
            isLoading={isLoading}
        />
    </div>
);

export default KpiRow;
