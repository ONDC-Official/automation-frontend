import { cn } from "@/lib/utils";
import {
    Pagination as PaginationRoot,
    PaginationContent,
    PaginationItem,
    PaginationLink,
} from "@/components/Shadcn/Pagination/pagination";
import type { PaginationProps } from "@/components/Shadcn/Pagination/types";
import { getPageNumbers } from "@/components/Shadcn/Pagination/helpers";
import { navButtonClass } from "@/components/Shadcn/Pagination/constants";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    className,
}: PaginationProps) =>
    totalPages <= 1 ? null : (
        <PaginationRoot
            aria-label="Pagination"
            className={cn("flex items-center justify-between px-4 py-4", className)}
        >
            <PaginationLink
                aria-label="Previous page"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className={navButtonClass}
            >
                <ChevronLeftIcon className="size-4" aria-hidden />
            </PaginationLink>

            <PaginationContent>
                {getPageNumbers(currentPage, totalPages).map((page, index) => (
                    <PaginationItem key={page === "ellipsis" ? `ellipsis-${index}` : page}>
                        {page === "ellipsis" ? (
                            <span className="px-1 text-sm text-n-100 dark:text-n-80" aria-hidden>
                                …
                            </span>
                        ) : (
                            <PaginationLink
                                isActive={currentPage === page}
                                onClick={() => onPageChange(page)}
                                className={cn(
                                    "size-9 rounded-lg text-sm font-medium shadow-none",
                                    currentPage === page
                                        ? "border-0 bg-brand-light text-brand-normal hover:bg-brand-light dark:bg-brand-dark/30 dark:text-brand-light"
                                        : "text-n-800 bg-transparent hover:bg-brand-light dark:text-n-60 dark:hover:bg-surface-muted"
                                )}
                            >
                                {page}
                            </PaginationLink>
                        )}
                    </PaginationItem>
                ))}
            </PaginationContent>

            <PaginationLink
                aria-label="Next page"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className={navButtonClass}
            >
                <ChevronRightIcon className="size-4" aria-hidden />
            </PaginationLink>
        </PaginationRoot>
    );

export default Pagination;
