import { Button } from "@/components/Shadcn/Button/button";
import { cn } from "@/lib/utils";
import type { InfoPillProps } from "@/components/FlowShared/ui/types";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useClipboard } from "@hooks/useClipboard";

export const InfoPill = ({ label, value, copyable }: InfoPillProps) => {
    const { copyToClipboard } = useClipboard();

    const handleCopy = () => {
        void copyToClipboard(value);
    };

    return (
        <div
            className={cn(
                "inline-flex min-w-0 items-center gap-2 rounded-lg border border-transparent bg-brand-light px-3 py-2",
                "dark:border-border-default dark:bg-surface-muted"
            )}
        >
            <span className="shrink-0 text-xs font-bold text-brand-normal">
                {label}
                <span className="text-xs font-medium text-text-primary">:</span>
            </span>
            <span className="truncate text-xs font-bold text-text-primary">{value}</span>
            {copyable ? (
                <Button
                    variant="ghost"
                    size="xs"
                    onClick={handleCopy}
                    className="shrink-0"
                    aria-label={`Copy ${label}`}
                >
                    <ClipboardDocumentIcon className="size-4 text-brand-normal hover:text-brand-light" />
                </Button>
            ) : null}
        </div>
    );
};
