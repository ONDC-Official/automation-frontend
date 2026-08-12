import { Pagination } from "@components/Shadcn/Pagination";
import Spinner from "@components/Shadcn/Spinner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/Shadcn/Select/select";
import { cn, formatNumber } from "@/lib/utils";
import { DEFAULT_LIMIT_OPTIONS } from "./constants";
import type { IProps } from "./types";

/**
 * Row summary + rows-per-page + page navigation for a paginated table.
 *
 * The navigation itself is the app's own Pagination; this adds the two things
 * it does not carry — the "1–50 of 1,284" summary and the page-size control —
 * which a data table needs and a page-link strip does not.
 *
 * Note that Pagination renders nothing when there is a single page, so on a
 * short result set only the summary and the page-size control remain.
 */
const TablePagination = ({
    page,
    totalPages,
    total,
    limit,
    onPageChange,
    onLimitChange,
    limitOptions = DEFAULT_LIMIT_OPTIONS,
    disabled,
    className,
}: IProps) => {
    const firstRow = total === 0 ? 0 : (page - 1) * limit + 1;
    const lastRow = Math.min(page * limit, total);

    return (
        <div
            data-slot="table-pagination"
            className={cn("flex flex-wrap items-center justify-between gap-3 text-sm", className)}
        >
            <p className="text-muted-foreground flex items-center gap-2">
                {formatNumber(firstRow)}–{formatNumber(lastRow)} of {formatNumber(total)}
                {/* The pending cue sits on the summary because that is where the
                    counts the user is waiting on will change. */}
                {disabled && <Spinner className="size-3.5" />}
            </p>

            <div className="flex items-center gap-3">
                {onLimitChange && (
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Rows</span>
                        <Select
                            value={String(limit)}
                            onValueChange={(value) => onLimitChange(Number(value))}
                            disabled={disabled}
                        >
                            <SelectTrigger className="h-8 w-20" aria-label="Rows per page">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {limitOptions.map((option) => (
                                    <SelectItem key={option} value={String(option)}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <Pagination
                    currentPage={page}
                    totalPages={Math.max(totalPages, 1)}
                    onPageChange={onPageChange}
                    disabled={disabled}
                    className="px-0 py-0"
                />
            </div>
        </div>
    );
};

export default TablePagination;
