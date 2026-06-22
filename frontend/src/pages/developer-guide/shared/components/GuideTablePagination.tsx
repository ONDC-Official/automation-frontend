import { type FC } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

export interface GuideTablePaginationProps {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
    className?: string;
}

/** Page numbers to render, collapsing long runs into a single "…" entry. */
function buildPageList(page: number, totalPages: number): (number | "ellipsis")[] {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
    const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

    const result: (number | "ellipsis")[] = [];
    sorted.forEach((p, i) => {
        if (i > 0 && p - sorted[i - 1] > 1) result.push("ellipsis");
        result.push(p);
    });
    return result;
}

/** Page-number pagination footer shared by `GuideTable` consumers (Error Codes, Validations). */
const GuideTablePagination: FC<GuideTablePaginationProps> = ({
    page,
    totalPages,
    onChange,
    className,
}) => {
    if (totalPages <= 1) return null;

    const pageList = buildPageList(page, totalPages);

    return (
        <nav
            className={cn(
                "flex items-center justify-center gap-1.5 border-t border-slate-100 bg-slate-50/60 px-5 py-3",
                className
            )}
            aria-label="Pagination"
        >
            <button
                type="button"
                onClick={() => onChange(page - 1)}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white dark:bg-surface-elevated text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-surface-elevated disabled:hover:text-slate-500 transition-colors"
                aria-label="Previous page"
            >
                <ChevronLeftIcon className="size-4" />
            </button>

            {pageList.map((p, i) =>
                p === "ellipsis" ? (
                    <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-slate-400">
                        …
                    </span>
                ) : (
                    <button
                        key={p}
                        type="button"
                        onClick={() => onChange(p)}
                        aria-current={p === page ? "page" : undefined}
                        className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                            p === page
                                ? "bg-sky-500 text-white shadow-xs"
                                : "text-slate-600 hover:bg-white dark:hover:bg-surface-elevated hover:text-slate-800 border border-transparent hover:border-slate-200"
                        )}
                    >
                        {p}
                    </button>
                )
            )}

            <button
                type="button"
                onClick={() => onChange(page + 1)}
                disabled={page >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white dark:bg-surface-elevated text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-surface-elevated disabled:hover:text-slate-500 transition-colors"
                aria-label="Next page"
            >
                <ChevronRightIcon className="size-4" />
            </button>
        </nav>
    );
};

export default GuideTablePagination;
