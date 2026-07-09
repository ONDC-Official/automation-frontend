import { InfoPill } from "@components/DomainFlowRunner/InfoPill";
import { COPYABLE_INFO_KEYS, INFO_LABELS } from "@components/DomainFlowRunner/constants";
import type { IInfoSectionProps } from "@components/DomainFlowRunner/types";

export const InfoSection = ({
    data,
    headerActions,
    pollingIndicator,
    labels = INFO_LABELS,
    copyableKeys = COPYABLE_INFO_KEYS,
}: IInfoSectionProps) => (
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
                {Object.keys(labels).map((key) => {
                    const value = data[key];

                    return (
                        <InfoPill
                            key={key}
                            label={labels[key]}
                            value={value}
                            copyable={copyableKeys.has(key)}
                        />
                    );
                })}
            </div>
        </div>
    </div>
);
