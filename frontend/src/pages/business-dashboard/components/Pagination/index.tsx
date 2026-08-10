import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@pages/business-dashboard/components/Button";
import Select, {
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@pages/business-dashboard/components/Select";
import { cn, formatNumber } from "@pages/business-dashboard/lib/utils";
import { DEFAULT_LIMIT_OPTIONS } from "./constants";
import type { IProps } from "./types";

const Pagination = ({
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
            data-slot="pagination"
            className={cn("flex flex-wrap items-center justify-between gap-3 text-sm", className)}
        >
            <p className="text-muted-foreground">
                {formatNumber(firstRow)}–{formatNumber(lastRow)} of {formatNumber(total)}
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

                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        aria-label="Previous page"
                        disabled={disabled || page <= 1}
                        onClick={() => onPageChange(page - 1)}
                    >
                        <ChevronLeft />
                    </Button>
                    <span className="text-muted-foreground min-w-24 text-center">
                        Page {formatNumber(page)} of {formatNumber(Math.max(totalPages, 1))}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        aria-label="Next page"
                        disabled={disabled || page >= totalPages}
                        onClick={() => onPageChange(page + 1)}
                    >
                        <ChevronRight />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Pagination;
