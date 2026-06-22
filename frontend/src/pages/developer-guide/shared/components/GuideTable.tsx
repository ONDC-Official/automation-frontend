import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import GuideTablePagination from "./GuideTablePagination";

export interface GuideTableColumn<T> {
    key: string;
    header: ReactNode;
    headerClassName?: string;
    cellClassName?: string | ((row: T, index: number) => string);
    render: (row: T, index: number) => ReactNode;
}

export interface GuideTableProps<T> {
    columns: GuideTableColumn<T>[];
    rows: T[];
    rowKey: (row: T, index: number) => string;
    rowClassName?: (row: T, index: number) => string;
    maxHeight?: string;
    density?: "compact" | "spacious";
    emptyState?: ReactNode;
    rounded?: "xl" | "2xl";
    shadow?: "xs" | "md";
    /** Rendered above the table, inside the same card (e.g. a search bar). */
    toolbar?: ReactNode;
    /** Rendered below the scroll area, inside the same card (e.g. a result-count footer). */
    footer?: ReactNode;
    /**
     * Enables client-side pagination over `rows` (already-loaded/filtered data —
     * no extra fetches). Page resets to 1 whenever the `rows` reference changes,
     * which happens whenever the caller's search/filter recomputes it.
     */
    pagination?: { pageSize: number };
}

const DENSITY_CLASSES = {
    compact: {
        table: "text-xs",
        th: "px-3 py-2 font-semibold text-[11px] text-slate-500 uppercase tracking-wider",
        td: "px-3 py-2 align-top",
    },
    spacious: {
        table: "text-left",
        th: "px-5 py-3.5 font-semibold text-xs text-slate-500 uppercase tracking-widest",
        td: "px-5 py-4 align-top",
    },
};

/** Generic search-result table shell shared by ErrorCodesTable and ValidationsTable. */
function GuideTable<T>({
    columns,
    rows,
    rowKey,
    rowClassName,
    maxHeight = "720px",
    density = "spacious",
    emptyState,
    rounded = "2xl",
    shadow = "md",
    toolbar,
    footer,
    pagination,
}: GuideTableProps<T>) {
    const densityClasses = DENSITY_CLASSES[density];
    const isScrollable = !pagination;

    const [page, setPage] = useState(1);

    // Reset to page 1 whenever the (already filtered) row set changes.
    useEffect(() => {
        setPage(1);
    }, [rows]);

    const pageSize = pagination?.pageSize ?? rows.length;
    const totalPages = pagination ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;
    const safePage = Math.min(page, totalPages);
    const displayedRows = pagination
        ? rows.slice((safePage - 1) * pageSize, safePage * pageSize)
        : rows;

    return (
        <div
            className={cn(
                "border border-slate-200 bg-white dark:bg-surface-elevated overflow-hidden",
                rounded === "2xl" ? "rounded-2xl" : "rounded-xl",
                shadow === "md" ? "shadow-md" : "shadow-xs"
            )}
        >
            {toolbar && (
                <div className="bg-sky-50/60 dark:bg-sky-500/10 border-b border-slate-200 px-4 py-3">
                    {toolbar}
                </div>
            )}
            <div
                className={cn("overflow-x-auto", isScrollable && "overflow-y-auto")}
                style={isScrollable ? { maxHeight } : undefined}
            >
                <table className={cn("min-w-full table-fixed", densityClasses.table)}>
                    <thead
                        className={cn(
                            "bg-slate-50 dark:bg-surface-muted border-b-2 border-slate-200",
                            isScrollable && "sticky top-0 z-10"
                        )}
                    >
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={cn(densityClasses.th, col.headerClassName)}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {displayedRows.map((row, index) => (
                            <tr key={rowKey(row, index)} className={rowClassName?.(row, index)}>
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        className={cn(
                                            densityClasses.td,
                                            typeof col.cellClassName === "function"
                                                ? col.cellClassName(row, index)
                                                : col.cellClassName
                                        )}
                                    >
                                        {col.render(row, index)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {displayedRows.length === 0 && emptyState && (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-16 text-center">
                                    {emptyState}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {footer}
            {pagination && (
                <GuideTablePagination page={safePage} totalPages={totalPages} onChange={setPage} />
            )}
        </div>
    );
}

export default GuideTable;
