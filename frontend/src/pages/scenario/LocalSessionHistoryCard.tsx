import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/solid";
import { truncateId } from "@/utils/formatUtils";
import { ILocalSessionHistoryCardProps } from "@/pages/scenario/types";
import { Button } from "@/components/Shadcn/Button/button";

export function LocalSessionHistoryCard({
    sessionId,
    subscriberUrl,
    role,
    onOpen,
}: ILocalSessionHistoryCardProps) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-n-30 bg-brand-light p-4 dark:border-border-default dark:bg-surface-muted">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="truncate font-mono text-xs text-brand-normal font-bold bg-brand-light-hover p-1 max-w-fit rounded-md dark:text-brand-light dark:bg-surface-elevated">
                    {truncateId(sessionId)}
                </span>
                <p
                    className="truncate text-xs text-n-300 font-mono dark:text-n-60"
                    title={subscriberUrl}
                >
                    {subscriberUrl}
                </p>
                <span className="text-xs font-bold font-mono bg-brand-light-hover p-1 max-w-fit rounded-md text-brand-normal dark:text-brand-light dark:bg-surface-elevated">
                    {role}
                </span>
            </div>
            <Button
                type="button"
                onClick={onOpen}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-normal px-4 py-2 text-sm font-medium text-n-0 transition-colors hover:bg-brand-normal-hover"
            >
                Open
                <ArrowTopRightOnSquareIcon className="size-4 text-n-0" aria-hidden />
            </Button>
        </div>
    );
}
