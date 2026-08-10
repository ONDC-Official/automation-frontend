import { FileSearch, TriangleAlert } from "lucide-react";
import Badge from "@dashboard/components/Badge";
import Button from "@dashboard/components/Button";
import EmptyState from "@dashboard/components/EmptyState";
import Table, {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@dashboard/components/Table";
import { formatDateTime, formatNumber, formatPercent } from "@dashboard/lib/utils";
import type { Report } from "@dashboard/services/types";

interface IProps {
    rows: Report[];
    isLoading: boolean;
    isError: boolean;
    errorMessage?: string;
    onOpenReport: (testId: string) => void;
}

const COLUMNS = [
    "Test id",
    "Session",
    "Domain",
    "Version",
    "User",
    "Tests",
    "Pass rate",
    "Created",
    "",
] as const;

const SKELETON_ROWS = 6;

const ReportsTable = ({ rows, isLoading, isError, errorMessage, onOpenReport }: IProps) => {
    if (isError) {
        return (
            <EmptyState
                icon={TriangleAlert}
                title="Could not load reports"
                description={errorMessage ?? "The dashboard API did not respond."}
                className="border-border bg-card rounded-lg border"
            />
        );
    }

    // An empty list is a 404 upstream, normalised to an empty envelope in
    // `useReports` — so it lands here as an EmptyState, never an error toast.
    if (!isLoading && rows.length === 0) {
        return (
            <EmptyState
                icon={FileSearch}
                title="No reports found"
                description="No generated report matches this search. Reports appear once an automation run finishes."
                className="border-border bg-card rounded-lg border"
            />
        );
    }

    return (
        <div className="border-border bg-card rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {COLUMNS.map((label, index) => (
                            <TableHead key={label || index}>{label}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading
                        ? Array.from({ length: SKELETON_ROWS }, (_, index) => (
                              <TableRow key={index}>
                                  {COLUMNS.map((label, column) => (
                                      <td key={label || column} className="px-3 py-2.5">
                                          <div className="bg-muted h-4 w-full animate-pulse rounded" />
                                      </td>
                                  ))}
                              </TableRow>
                          ))
                        : rows.map((report) => {
                              const total = report.total_tests ?? 0;
                              const passed = report.passed_tests ?? 0;
                              const rate = total > 0 ? passed / total : 0;

                              return (
                                  <TableRow key={report.test_id}>
                                      <TableCell className="max-w-56 truncate font-mono text-xs">
                                          {report.test_id}
                                      </TableCell>
                                      {/* The session is joined server-side, so showing context
                        here costs no extra request. Either field can be null:
                        an orphaned report, or a test_id without the PW_ prefix. */}
                                      <TableCell className="max-w-56 truncate font-mono text-xs">
                                          {report.sessionId ?? (
                                              <Badge variant="muted">No session id</Badge>
                                          )}
                                      </TableCell>
                                      <TableCell>{report.session?.domain ?? "—"}</TableCell>
                                      <TableCell>{report.session?.version ?? "—"}</TableCell>
                                      <TableCell className="text-muted-foreground">
                                          {report.user_id ?? "—"}
                                      </TableCell>
                                      <TableCell className="tabular-nums">
                                          {formatNumber(passed)} / {formatNumber(total)}
                                      </TableCell>
                                      <TableCell>
                                          <Badge
                                              variant={
                                                  total === 0
                                                      ? "muted"
                                                      : rate >= 1
                                                        ? "pass"
                                                        : "fail"
                                              }
                                          >
                                              {total === 0 ? "No tests" : formatPercent(rate)}
                                          </Badge>
                                      </TableCell>
                                      <TableCell className="text-muted-foreground">
                                          {formatDateTime(report.createdAt)}
                                      </TableCell>
                                      <TableCell className="text-right">
                                          <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => onOpenReport(report.test_id)}
                                          >
                                              View
                                          </Button>
                                      </TableCell>
                                  </TableRow>
                              );
                          })}
                </TableBody>
            </Table>
        </div>
    );
};

export default ReportsTable;
