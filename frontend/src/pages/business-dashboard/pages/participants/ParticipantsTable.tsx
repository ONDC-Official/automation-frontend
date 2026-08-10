import { ArrowDown, ArrowUp, SearchX, TriangleAlert } from "lucide-react";

import { Badge } from "@components/Shadcn/Badge";
import EmptyState from "@pages/business-dashboard/components/EmptyState";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@components/Shadcn/Table/table";
import {
    cn,
    formatDateTime,
    formatNumber,
    formatPercent,
} from "@pages/business-dashboard/lib/utils";
import type { ParticipantRow } from "@pages/business-dashboard/services/types";
import { TABLE_COLUMNS } from "./constants";
import { passRateTone } from "./utils";

interface IProps {
    rows: ParticipantRow[];
    sort?: string;
    order?: "asc" | "desc";
    isLoading: boolean;
    isError: boolean;
    errorMessage?: string;
    selectedHost: string | null;
    onSelectHost: (host: string) => void;
    onSortChange: (sortKey: string) => void;
}

const SKELETON_ROWS = 8;

const ParticipantsTable = ({
    rows,
    sort,
    order,
    isLoading,
    isError,
    errorMessage,
    selectedHost,
    onSelectHost,
    onSortChange,
}: IProps) => {
    if (isError) {
        return (
            <EmptyState
                icon={TriangleAlert}
                title="Could not load participants"
                description={errorMessage ?? "The dashboard API did not respond."}
                className="border-border bg-card rounded-lg border"
            />
        );
    }

    if (!isLoading && rows.length === 0) {
        return (
            <EmptyState
                icon={SearchX}
                title="No participants match these filters"
                description="Widen the date range or clear a filter to see more."
                className="border-border bg-card rounded-lg border"
            />
        );
    }

    return (
        <div className="border-border bg-card rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {TABLE_COLUMNS.map(({ label, sortKey, align }) => {
                            const isActive = Boolean(sortKey) && sort === sortKey;

                            return (
                                <TableHead
                                    key={label}
                                    className={cn(align === "right" && "text-right")}
                                >
                                    {sortKey ? (
                                        <button
                                            type="button"
                                            onClick={() => onSortChange(sortKey)}
                                            className={cn(
                                                "hover:text-foreground inline-flex items-center gap-1",
                                                isActive && "text-foreground font-medium"
                                            )}
                                        >
                                            {label}
                                            {isActive &&
                                                (order === "asc" ? (
                                                    <ArrowUp className="size-3.5" />
                                                ) : (
                                                    <ArrowDown className="size-3.5" />
                                                ))}
                                        </button>
                                    ) : (
                                        label
                                    )}
                                </TableHead>
                            );
                        })}
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {isLoading
                        ? Array.from({ length: SKELETON_ROWS }, (_, index) => (
                              <TableRow key={index}>
                                  {TABLE_COLUMNS.map(({ label }) => (
                                      <TableCell key={label}>
                                          <div className="bg-muted h-4 w-full animate-pulse rounded" />
                                      </TableCell>
                                  ))}
                              </TableRow>
                          ))
                        : rows.map((row) => (
                              <TableRow
                                  key={row.host}
                                  role="button"
                                  tabIndex={0}
                                  data-state={row.host === selectedHost ? "selected" : undefined}
                                  className="cursor-pointer"
                                  onClick={() => onSelectHost(row.host)}
                                  onKeyDown={(event) => {
                                      if (event.key === "Enter" || event.key === " ") {
                                          event.preventDefault();
                                          onSelectHost(row.host);
                                      }
                                  }}
                              >
                                  <TableCell className="font-medium break-all">
                                      {row.host}
                                  </TableCell>

                                  <TableCell>
                                      <div className="flex flex-wrap gap-1">
                                          {row.npTypes.map((npType) => (
                                              <Badge key={npType} variant="outline">
                                                  {npType}
                                              </Badge>
                                          ))}
                                      </div>
                                  </TableCell>

                                  <TableCell className="text-right tabular-nums">
                                      {formatNumber(row.sessions)}
                                  </TableCell>

                                  <TableCell className="whitespace-nowrap">
                                      {formatDateTime(row.firstSessionAt)}
                                  </TableCell>

                                  <TableCell className="whitespace-nowrap">
                                      {/* null means they created a session but never sent us a
                        payload — a real state, never rendered as a zero date. */}
                                      {row.firstPayloadAt ? (
                                          formatDateTime(row.firstPayloadAt)
                                      ) : (
                                          <Badge variant="secondary">Never</Badge>
                                      )}
                                  </TableCell>

                                  <TableCell className="text-right tabular-nums">
                                      {formatNumber(row.flowsAttempted)}
                                  </TableCell>

                                  <TableCell className="text-right tabular-nums">
                                      {formatNumber(row.flowsJudged)}
                                  </TableCell>

                                  {/* Judged but never passed, so these two always sum back to
                      the column on their left. */}
                                  <TableCell className="text-right tabular-nums">
                                      {formatNumber(row.flowsPassed)}
                                  </TableCell>

                                  <TableCell className="text-right tabular-nums">
                                      {formatNumber(row.flowsFailed)}
                                  </TableCell>

                                  <TableCell className="text-right">
                                      {/* A participant with nothing judged is unmeasured, not
                        failing, so it never wears the fail tone. */}
                                      <Badge variant={passRateTone(row.passRate)}>
                                          {formatPercent(row.passRate)}
                                      </Badge>
                                  </TableCell>
                              </TableRow>
                          ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default ParticipantsTable;
