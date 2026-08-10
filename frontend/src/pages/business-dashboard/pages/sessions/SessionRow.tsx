import { Check, Minus } from "lucide-react";
import Badge from "@pages/business-dashboard/components/Badge";
import { TableCell, TableRow } from "@pages/business-dashboard/components/Table";
import { formatDateTime, formatPercent } from "@pages/business-dashboard/lib/utils";
import type { SessionRow as SessionRowType } from "@pages/business-dashboard/services/types";
import { badgeVariantForResult, resultLabel } from "./utils";

interface IProps {
    row: SessionRowType;
    isSelected: boolean;
    onSelect: (sessionId: string) => void;
}

const SessionRow = ({ row, isSelected, onSelect }: IProps) => {
    return (
        <TableRow
            data-state={isSelected ? "selected" : undefined}
            tabIndex={0}
            role="button"
            aria-label={`Open session ${row.sessionId}`}
            onClick={() => onSelect(row.sessionId)}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(row.sessionId);
                }
            }}
            className="focus-visible:bg-muted cursor-pointer focus-visible:outline-none"
        >
            <TableCell className="max-w-56 truncate font-mono text-xs">{row.sessionId}</TableCell>
            <TableCell>{row.domain ?? "—"}</TableCell>
            <TableCell>{row.version ?? "—"}</TableCell>
            <TableCell>{row.npType || "—"}</TableCell>
            <TableCell>
                <Badge variant="outline">{row.sessionType}</Badge>
            </TableCell>
            <TableCell>
                <span className="text-muted-foreground">
                    {row.flowsCompleted}/{row.flowsTotal}
                </span>
            </TableCell>
            <TableCell>
                <Badge variant={badgeVariantForResult(row.result)}>{resultLabel(row.result)}</Badge>
            </TableCell>
            <TableCell className="tabular-nums">{formatPercent(row.passRate)}</TableCell>
            <TableCell>
                {row.reportExists ? (
                    <span className="text-status-pass-ink inline-flex items-center gap-1">
                        <Check className="size-3.5" />
                        Yes
                    </span>
                ) : (
                    <span className="text-muted-foreground inline-flex items-center gap-1">
                        <Minus className="size-3.5" />
                        No
                    </span>
                )}
            </TableCell>
            <TableCell className="text-muted-foreground">{formatDateTime(row.createdAt)}</TableCell>
        </TableRow>
    );
};

export default SessionRow;
