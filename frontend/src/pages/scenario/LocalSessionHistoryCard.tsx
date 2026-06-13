import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/solid";
import { truncateId } from "@/pages/scenario/helpers";
import { ILocalSessionHistoryCardProps } from "@/pages/scenario/types";
import { Button } from "@/components/shadcn/button";

export function LocalSessionHistoryCard({
    sessionId,
    subscriberUrl,
    role,
    onOpen,
}: ILocalSessionHistoryCardProps) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-sky-100/80 bg-[#f0f5f9] p-4">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="inline-flex w-fit items-center rounded px-2 py-0.5 font-mono text-xs text-[#1e429f] bg-[#e1effe]">
                    {truncateId(sessionId)}
                </span>
                <p className="truncate font-mono text-xs text-slate-500" title={subscriberUrl}>
                    {subscriberUrl}
                </p>
                <span className="inline-flex w-fit items-center rounded px-2 py-0.5 font-mono text-xs font-semibold text-[#1e429f] bg-[#e1effe]">
                    {role}
                </span>
            </div>
            <Button
                type="button"
                onClick={onOpen}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700"
            >
                Open
                <ArrowTopRightOnSquareIcon className="size-4" aria-hidden />
            </Button>
        </div>
    );
}
