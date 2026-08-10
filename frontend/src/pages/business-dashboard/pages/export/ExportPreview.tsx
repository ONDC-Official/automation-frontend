import { FilterX, TriangleAlert } from "lucide-react";
import { Badge } from "@components/Shadcn/Badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@components/Shadcn/Card/card";
import EmptyState from "@components/EmptyState";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@components/Shadcn/Table/table";
import { formatDateTime, formatNumber, formatPercent } from "@pages/business-dashboard/lib/utils";
import type { SessionFilters, SessionRow } from "@pages/business-dashboard/services/types";
import { EXPORT_COLUMNS, PREVIEW_LIMIT } from "./constants";

interface IProps {
    filters: SessionFilters;
    columns: string[];
    rows: SessionRow[];
    matchingRows: number;
    isLoading: boolean;
    isError: boolean;
    errorMessage?: string;
}

const LABELS = new Map(EXPORT_COLUMNS.map((column) => [column.id as string, column.label]));

/** Formats one cell the way the CSV writer will, so the preview does not lie. */
function renderCell(row: SessionRow, columnId: string) {
    const value = row[columnId as keyof SessionRow];

    // null passRate / result mean "nothing judged yet", which is not a zero and
    // not a failure — both fall through to the em-dash below.
    if (value === undefined || value === null || value === "") return "—";
    if (columnId === "passRate") return formatPercent(Number(value));
    if (columnId === "createdAt" || columnId === "updatedAt") {
        return formatDateTime(String(value));
    }
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "number") return formatNumber(value);
    if (typeof value === "object") return "—";

    return String(value);
}

/** The active filters, spelled out — a CSV with a surprising slice is worse than none. */
const ActiveFilters = ({ filters }: { filters: SessionFilters }) => {
    const entries = Object.entries(filters).filter(
        ([key, value]) =>
            !["page", "limit", "sort", "order"].includes(key) &&
            value !== undefined &&
            value !== null &&
            value !== ""
    );

    if (entries.length === 0) {
        return (
            <Badge variant="secondary">
                <FilterX />
                No filters — the whole collection
            </Badge>
        );
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {entries.map(([key, value]) => (
                <Badge key={key} variant="secondary">
                    {key}: {String(value)}
                </Badge>
            ))}
        </div>
    );
};

const ExportPreview = ({
    filters,
    columns,
    rows,
    matchingRows,
    isLoading,
    isError,
    errorMessage,
}: IProps) => (
    <Card>
        <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
                {isLoading
                    ? "Counting matching sessions…"
                    : `${formatNumber(matchingRows)} sessions match. The first ${PREVIEW_LIMIT} are shown; the download streams all of them.`}
            </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
            <ActiveFilters filters={filters} />

            {isError ? (
                <EmptyState
                    icon={TriangleAlert}
                    title="Could not preview this slice"
                    message={errorMessage ?? "The dashboard API did not respond."}
                />
            ) : isLoading ? (
                <div className="bg-muted h-40 w-full animate-pulse rounded-lg" />
            ) : rows.length === 0 ? (
                <EmptyState
                    icon={FilterX}
                    title="Nothing to export"
                    message="No session matches these filters. Adjust them on the Sessions page and come back."
                />
            ) : (
                <div className="border-border rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columns.map((columnId) => (
                                    <TableHead key={columnId}>
                                        {LABELS.get(columnId) ?? columnId}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((row) => (
                                <TableRow key={row.sessionId}>
                                    {columns.map((columnId) => (
                                        <TableCell key={columnId} className="max-w-56 truncate">
                                            {renderCell(row, columnId)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </CardContent>
    </Card>
);

export default ExportPreview;
