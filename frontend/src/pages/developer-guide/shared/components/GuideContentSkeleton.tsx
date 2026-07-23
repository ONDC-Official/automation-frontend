import { FC } from "react";
import { Skeleton } from "@components/Shadcn/Skeleton";

/** Main-content skeleton bars (sidebar stays visible), Stripe-docs style. */
const GuideContentSkeleton: FC = () => (
    <div
        role="status"
        aria-live="polite"
        aria-label="Loading"
        className="w-full max-w-3xl space-y-4 px-6 py-10 sm:px-8"
    >
        <Skeleton className="h-7 w-52 max-w-[55%]" />
        <Skeleton className="h-3.5 w-80 max-w-full" />
        <div className="space-y-3 pt-4">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-[94%]" />
            <Skeleton className="h-3.5 w-[88%]" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-[72%]" />
        </div>
        <div className="space-y-3 pt-6">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-[90%]" />
            <Skeleton className="h-3.5 w-[80%]" />
        </div>
    </div>
);

export default GuideContentSkeleton;
