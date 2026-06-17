import { cn } from "@/lib/utils";
import type { EndpointsSectionProps } from "@/components/FlowShared/ui/types";

const endpointBoxClassName = cn(
    "min-w-0 flex-1 truncate rounded-lg border border-brand-light-active bg-brand-light",
    "px-3 py-2 text-body-2 font-mono text-text-primary",
    "dark:border-border-default dark:bg-surface-muted"
);

const EndpointRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex min-w-0 items-center gap-3">
        <span className="shrink-0 whitespace-nowrap text-body-2 font-regular text-text-secondary">
            {label}
        </span>
        <div className={endpointBoxClassName} title={value}>
            {value}
        </div>
    </div>
);

export const EndpointsSection = ({ sendUrl, receiveUrl }: EndpointsSectionProps) => (
    <div className="grid grid-cols-1 gap-x-5 gap-y-3 md:grid-cols-2">
        <EndpointRow label="Send your calls to:" value={sendUrl} />
        <EndpointRow label="You will receive calls at:" value={receiveUrl} />
    </div>
);
