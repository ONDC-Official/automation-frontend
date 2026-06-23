import { type FC } from "react";
import { cn } from "@/lib/utils";
import Pagination from "@/components/Shadcn/Pagination";

export interface GuideTablePaginationProps {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
    className?: string;
}

/** Pagination footer for `GuideTable` — delegates to the shared Shadcn pagination (prev/next at ends). */
const GuideTablePagination: FC<GuideTablePaginationProps> = ({
    page,
    totalPages,
    onChange,
    className,
}) => (
    <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={onChange}
        className={cn("mt-4 border-t border-n-30 px-0 py-3 dark:border-border-default", className)}
    />
);

export default GuideTablePagination;
