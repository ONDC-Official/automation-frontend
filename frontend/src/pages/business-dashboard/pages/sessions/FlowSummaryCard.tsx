import Card, {
    CardContent,
    CardHeader,
    CardTitle,
} from "@pages/business-dashboard/components/Card";
import { formatNumber } from "@pages/business-dashboard/lib/utils";
import type { FlowSummaryEntry } from "@pages/business-dashboard/services/types";
import { FLOW_SUMMARY_TAGS } from "./constants";
import { flowSummaryRows } from "./utils";

interface IProps {
    flowSummary: Record<string, FlowSummaryEntry> | null | undefined;
}

/**
 * `flowSummary` per tag (MANDATORY / REPORTABLE / OPTIONAL). The meter's filled
 * track carries completion; the unfilled track is a lighter step of the same
 * ramp, so state reads across the whole bar.
 */
const FlowSummaryCard = ({ flowSummary }: IProps) => {
    const rows = flowSummaryRows(flowSummary, FLOW_SUMMARY_TAGS);

    if (rows.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Flow summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">
                        No flow summary recorded for this session.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Flow summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                {rows.map(({ tag, total, completed }) => {
                    const ratio = total > 0 ? completed / total : 0;

                    return (
                        <div key={tag} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-medium">{tag}</span>
                                <span className="text-muted-foreground tabular-nums">
                                    {formatNumber(completed)} / {formatNumber(total)} completed
                                </span>
                            </div>
                            <div
                                role="meter"
                                aria-valuenow={completed}
                                aria-valuemin={0}
                                aria-valuemax={total}
                                aria-label={`${tag} flows completed`}
                                className="bg-status-pass-subtle h-1.5 w-full overflow-hidden rounded-full"
                            >
                                <div
                                    className="bg-status-pass h-full rounded-full"
                                    style={{ width: `${Math.round(ratio * 100)}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
};

export default FlowSummaryCard;
