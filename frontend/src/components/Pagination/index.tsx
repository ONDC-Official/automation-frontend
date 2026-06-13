import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export type PaginationProps = {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
};

function getPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
    if (totalPages <= 5) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "ellipsis")[] = [1];

    if (currentPage > 3) pages.push("ellipsis");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let p = start; p <= end; p++) {
        pages.push(p);
    }

    if (currentPage < totalPages - 2) pages.push("ellipsis");

    if (totalPages > 1) pages.push(totalPages);

    return pages;
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    className = "",
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const pages = getPageNumbers(currentPage, totalPages);
    const canGoPrev = currentPage > 1;
    const canGoNext = currentPage < totalPages;

    const navButtonClass =
        "flex size-9 shrink-0 items-center justify-center rounded-lg border border-n-40 bg-white text-n-500 transition-colors hover:bg-n-10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white";

    return (
        <nav
            className={`flex items-center justify-between px-4 py-4 ${className}`}
            aria-label="Pagination"
        >
            <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={!canGoPrev}
                className={navButtonClass}
                aria-label="Previous page"
            >
                <ChevronLeftIcon className="size-4" aria-hidden />
            </button>

            <div className="flex items-center gap-1">
                {pages.map((page, index) =>
                    page === "ellipsis" ? (
                        <span
                            key={`ellipsis-${index}`}
                            className="px-1 text-sm text-n-100"
                            aria-hidden
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={page}
                            type="button"
                            onClick={() => onPageChange(page)}
                            aria-current={currentPage === page ? "page" : undefined}
                            className={`flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                currentPage === page
                                    ? "bg-brand-light text-brand-normal"
                                    : "text-n-300 hover:bg-n-10"
                            }`}
                        >
                            {page}
                        </button>
                    )
                )}
            </div>

            <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!canGoNext}
                className={navButtonClass}
                aria-label="Next page"
            >
                <ChevronRightIcon className="size-4" aria-hidden />
            </button>
        </nav>
    );
}

export default Pagination;
