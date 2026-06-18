import { Button } from "@/components/Shadcn/Button/button";
import { cn } from "@/lib/utils";
import type { EndpointsSectionProps } from "@/components/FlowShared/ui/types";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useClipboard } from "@hooks/useClipboard";

const endpointBoxClassName = cn(
    "flex min-w-0 flex-1 items-start gap-1 rounded-lg border border-brand-light-active bg-brand-light",
    "px-3 py-2 dark:border-border-default dark:bg-surface-muted"
);

const EndpointRow = ({ label, value }: { label: string; value: string }) => {
    const { copyToClipboard } = useClipboard();

    return (
        <div className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 whitespace-nowrap text-body-2 font-regular text-text-secondary">
                {label}
            </span>
            <div className={endpointBoxClassName}>
                <span className="min-w-0 flex-1 break-all text-body-2 font-mono leading-snug text-text-primary">
                    {value}
                </span>
                <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => void copyToClipboard(value)}
                    className="mt-0.5 shrink-0"
                    aria-label={`Copy ${label}`}
                >
                    <ClipboardDocumentIcon className="size-4 text-brand-normal hover:text-brand-light" />
                </Button>
            </div>
        </div>
    );
};

export const EndpointsSection = ({ sendUrl, receiveUrl }: EndpointsSectionProps) => (
    <div className="grid grid-cols-1 gap-x-5 gap-y-3 md:grid-cols-2">
        <EndpointRow label="Send your calls to:" value={sendUrl} />
        <EndpointRow label="You will receive calls at:" value={receiveUrl} />
    </div>
);
