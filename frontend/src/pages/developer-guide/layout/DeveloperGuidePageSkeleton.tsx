import { FC } from "react";
import { Skeleton } from "@components/Shadcn/Skeleton";

const SIDEBAR_ROW_WIDTHS = ["w-3/4", "w-2/3", "w-4/5", "w-1/2", "w-3/5", "w-2/3", "w-3/4", "w-1/2"];

/** Full-shell loading placeholder (sidebar + content), Stripe-docs style. */
const DeveloperGuidePageSkeleton: FC = () => (
    <div
        role="status"
        aria-live="polite"
        aria-label="Loading developer guide"
        className="flex min-h-[calc(100svh-4rem)] flex-col bg-white dark:bg-surface-page"
    >
        <div className="flex flex-1 flex-col lg:flex-row lg:items-start">
            <aside className="flex w-full shrink-0 flex-col border-b border-n-40 bg-slate-100 dark:border-border-default dark:bg-surface-muted lg:sticky lg:top-16 lg:h-[calc(100svh-4rem)] lg:w-72 lg:border-b-0 lg:border-r">
                <div className="shrink-0 space-y-3 px-4 pt-3 pb-2">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-3 w-44" />
                    <Skeleton className="mt-1 h-9 w-full rounded-lg" />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-14 rounded-full" />
                        <Skeleton className="h-5 w-28 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                </div>
                <div className="min-h-0 flex-1 space-y-3 overflow-hidden px-4 pt-3 pb-10">
                    {SIDEBAR_ROW_WIDTHS.map((width, i) => (
                        <Skeleton key={i} className={`h-3.5 ${width}`} />
                    ))}
                </div>
            </aside>

            <div className="relative flex min-w-0 flex-1 flex-col">
                <div className="flex h-11 shrink-0 items-center border-b border-slate-200 bg-slate-100 px-4 dark:border-border-default dark:bg-surface-muted">
                    <Skeleton className="h-3.5 w-64 max-w-[70%]" />
                </div>
                <div className="flex-1 space-y-4 px-6 py-8 sm:px-8">
                    <Skeleton className="h-8 w-48 max-w-[50%]" />
                    <Skeleton className="h-3.5 w-72 max-w-full" />
                    <div className="space-y-3 pt-4">
                        <Skeleton className="h-3.5 w-full" />
                        <Skeleton className="h-3.5 w-[92%]" />
                        <Skeleton className="h-3.5 w-[85%]" />
                        <Skeleton className="h-3.5 w-full" />
                        <Skeleton className="h-3.5 w-[70%]" />
                    </div>
                    <div className="space-y-3 pt-6">
                        <Skeleton className="h-3.5 w-full" />
                        <Skeleton className="h-3.5 w-[88%]" />
                        <Skeleton className="h-3.5 w-[78%]" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default DeveloperGuidePageSkeleton;
