import { Link } from "react-router-dom";
import { ROUTES } from "@constants/routes";
import { TriangleAlert } from "lucide-react";

import Badge from "@dashboard/components/Badge";
import EmptyState from "@dashboard/components/EmptyState";
import Sheet, {
    SheetBody,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@dashboard/components/Sheet";
import Table, {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@dashboard/components/Table";
import { formatDateTime, formatNumber, formatPercent } from "@dashboard/lib/utils";
import type { ParticipantDetail, ParticipantRow } from "@dashboard/services/types";
import { judgedSummary, passRateTone } from "./utils";

interface IProps {
    host: string | null;
    detail: ParticipantDetail | null;
    /** The list row, shown immediately while the detail fetch is in flight. */
    fallback: ParticipantRow | null;
    isLoading: boolean;
    isError: boolean;
    errorMessage?: string;
    onClose: () => void;
}

const Figure = ({ label, value }: { label: string; value: string }) => (
    <div className="border-border rounded-md border p-2.5">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
    </div>
);

const ParticipantDetailSheet = ({
    host,
    detail,
    fallback,
    isLoading,
    isError,
    errorMessage,
    onClose,
}: IProps) => {
    const row = detail ?? fallback;

    return (
        <Sheet
            open={Boolean(host)}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <SheetContent className="sm:max-w-3xl">
                <SheetHeader>
                    <SheetTitle className="font-mono text-sm break-all">{host}</SheetTitle>
                    <SheetDescription>
                        {row ? judgedSummary(row) : "Loading participant…"}
                    </SheetDescription>
                </SheetHeader>

                <SheetBody className="flex flex-col gap-4 pt-4">
                    {isError && (
                        <EmptyState
                            icon={TriangleAlert}
                            title="Could not load this participant"
                            description={errorMessage ?? "The dashboard API did not respond."}
                        />
                    )}

                    {row && (
                        <>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                <Figure label="Sessions" value={formatNumber(row.sessions)} />
                                <Figure
                                    label="Flows attempted"
                                    value={formatNumber(row.flowsAttempted)}
                                />
                                <Figure
                                    label="Flows judged"
                                    value={formatNumber(row.flowsJudged)}
                                />
                                <Figure label="Pass rate" value={formatPercent(row.passRate)} />
                            </div>

                            <dl className="border-border grid grid-cols-1 gap-2 rounded-md border p-3 text-sm sm:grid-cols-2">
                                <div>
                                    <dt className="text-muted-foreground text-xs">First session</dt>
                                    <dd>{formatDateTime(row.firstSessionAt)}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground text-xs">First payload</dt>
                                    <dd>
                                        {row.firstPayloadAt
                                            ? formatDateTime(row.firstPayloadAt)
                                            : "Never sent one"}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground text-xs">Last session</dt>
                                    <dd>{formatDateTime(row.lastSessionAt)}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground text-xs">Role</dt>
                                    <dd className="flex flex-wrap gap-1">
                                        {row.npTypes.map((npType) => (
                                            <Badge key={npType} variant="outline">
                                                {npType}
                                            </Badge>
                                        ))}
                                    </dd>
                                </div>
                            </dl>

                            <div>
                                <p className="text-muted-foreground mb-1.5 text-xs">
                                    Subscriber URLs collapsed into this participant
                                </p>
                                <ul className="flex flex-col gap-1">
                                    {row.npIds.map((npId) => (
                                        <li
                                            key={npId}
                                            className="text-foreground font-mono text-xs break-all"
                                        >
                                            {npId}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex flex-wrap gap-1">
                                {row.domains.map((domain) => (
                                    <Badge key={domain} variant="secondary">
                                        {domain}
                                    </Badge>
                                ))}
                                {row.versions.map((version) => (
                                    <Badge key={version} variant="muted">
                                        v{version}
                                    </Badge>
                                ))}
                            </div>
                        </>
                    )}

                    {isLoading && !detail && (
                        <div className="bg-muted h-40 w-full animate-pulse rounded-lg" />
                    )}

                    {detail && detail.flows.length > 0 && (
                        <div>
                            <p className="mb-1.5 text-sm font-medium">Flow verdicts</p>
                            {/* Verdict counts, not distinct flows: the point of the
                  drill-down is to show a flow that passed twice and failed
                  once, which the headline figures deliberately flatten. */}
                            <div className="border-border max-h-64 overflow-auto rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Flow</TableHead>
                                            <TableHead className="text-right">Passed</TableHead>
                                            <TableHead className="text-right">Failed</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {detail.flows.map((flow) => (
                                            <TableRow key={flow.flowId}>
                                                <TableCell className="font-mono text-xs break-all">
                                                    {flow.flowId}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {formatNumber(flow.passed)}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {formatNumber(flow.failed)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {detail && detail.recentSessions.length > 0 && (
                        <div>
                            <p className="mb-1.5 text-sm font-medium">Recent sessions</p>
                            <div className="border-border max-h-72 overflow-auto rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Session</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead className="text-right">Judged</TableHead>
                                            <TableHead className="text-right">Passed</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {detail.recentSessions.map((session) => (
                                            <TableRow key={session.sessionId}>
                                                <TableCell className="font-mono text-xs break-all">
                                                    <Link
                                                        to={{
                                                            pathname: ROUTES.BUSINESS_SESSIONS,
                                                            search: `q=${encodeURIComponent(session.sessionId)}`,
                                                        }}
                                                        className="hover:underline"
                                                    >
                                                        {session.sessionId}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {formatDateTime(session.createdAt)}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {formatNumber(session.flowsJudged)}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {formatNumber(session.flowsPassed)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {row && (
                        <p className="text-muted-foreground text-xs">
                            Pass rate is{" "}
                            <Badge variant={passRateTone(row.passRate)}>
                                {formatPercent(row.passRate)}
                            </Badge>{" "}
                            of judged flows only. Flows still awaiting a report are not counted as
                            failures.
                        </p>
                    )}
                </SheetBody>
            </SheetContent>
        </Sheet>
    );
};

export default ParticipantDetailSheet;
