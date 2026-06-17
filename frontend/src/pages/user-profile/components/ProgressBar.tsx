import type { IProgressBarProps } from "@pages/user-profile/types";

export const ProgressBar = ({ label, pct }: IProgressBarProps) => (
    <div className="flex flex-col gap-1 min-w-[108px]">
        <div className="h-1.5 bg-alert-50 rounded-full overflow-hidden">
            <div
                className="h-full bg-alert-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
            />
        </div>
        <div className="flex items-center justify-between gap-2">
            <span className="text-caption-1 text-text-primary font-medium">{label}</span>
            <span className="text-caption-1 text-alert-500 font-semibold">{pct}%</span>
        </div>
    </div>
);
