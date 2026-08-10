import { ArrowDown, ArrowUp, SearchX, TriangleAlert } from "lucide-react";
import EmptyState from "@pages/business-dashboard/components/EmptyState";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@components/Shadcn/Table/table";
import { cn } from "@pages/business-dashboard/lib/utils";
import type { SessionRow as SessionRowType } from "@pages/business-dashboard/services/types";
import SessionRow from "./SessionRow";
import { TABLE_COLUMNS } from "./constants";

interface IProps {
    rows: SessionRowType[];
    sort?: string;
    order?: "asc" | "desc";
    isLoading: boolean;
    isError: boolean;
    errorMessage?: string;
    selectedSessionId: string | null;
    onSelectSession: (sessionId: string) => void;
    onSortChange: (sortKey: string) => void;
}

const SKELETON_ROWS = 8;

const SessionsTable = ({
    rows,
    sort,
    order,
    isLoading,
    isError,
    errorMessage,
    selectedSessionId,
    onSelectSession,
    onSortChange,
}: IProps) => {
    if (isError) {
        return (
            <EmptyState
                icon={TriangleAlert}
                title="Could not load sessions"
                description={errorMessage ?? "The dashboard API did not respond."}
                className="border-border bg-card rounded-lg border"
            />
        );
    }

    if (!isLoading && rows.length === 0) {
        return (
            <EmptyState
                icon={SearchX}
                title="No sessions match these filters"
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
                        {TABLE_COLUMNS.map(({ label, sortKey }) => {
                            const isActive = Boolean(sortKey) && sort === sortKey;

                            return (
                                <TableHead key={label}>
                                    {sortKey ? (
                                        <button
                                            type="button"
                                            onClick={() => onSortChange(sortKey)}
                                            className={cn(
                                                "hover:text-foreground inline-flex items-center gap-1 transition-colors",
                                                isActive && "text-foreground"
                                            )}
                                        >
                                            {label}
                                            {isActive &&
                                                (order === "asc" ? (
                                                    <ArrowUp className="size-3" />
                                                ) : (
                                                    <ArrowDown className="size-3" />
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
                                      <td key={label} className="px-3 py-2.5">
                                          <div className="bg-muted h-4 w-full animate-pulse rounded" />
                                      </td>
                                  ))}
                              </TableRow>
                          ))
                        : rows.map((row) => (
                              <SessionRow
                                  key={row.sessionId}
                                  row={row}
                                  isSelected={row.sessionId === selectedSessionId}
                                  onSelect={onSelectSession}
                              />
                          ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default SessionsTable;
