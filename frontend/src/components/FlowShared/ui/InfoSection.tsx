import { InfoPill } from "@/components/FlowShared/ui/InfoPill";
import type { InfoSectionProps } from "@/components/FlowShared/ui/types";

const COPYABLE_KEYS = new Set(["sessionId", "subscriberUrl"]);

const INFO_LABELS: Record<string, string> = {
    sessionId: "Session ID",
    subscriberType: "Subscriber Type",
    domain: "Domain",
    version: "Version",
    use_case: "Use Case",
    env: "Environment",
    activeFlow: "ActiveFlow",
};

export const InfoSection = ({ data, headerActions, pollingIndicator }: InfoSectionProps) => (
    <div className="w-full rounded-xl border border-n-30 bg-surface-elevated shadow-xs dark:border-border-default">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-h5 font-bold text-text-primary">Info</span>
            {pollingIndicator || headerActions ? (
                <div className="flex shrink-0 items-center gap-2">
                    {pollingIndicator}
                    {headerActions}
                </div>
            ) : null}
        </div>
        <div className="px-4 pb-4 pt-3">
            <div className="flex flex-wrap gap-2">
                {Object.keys(INFO_LABELS).map((key) => {
                    const value = data[key];

                    return (
                        <InfoPill
                            key={key}
                            label={INFO_LABELS[key]}
                            value={value}
                            copyable={COPYABLE_KEYS.has(key)}
                        />
                    );
                })}
            </div>
        </div>
    </div>
);
