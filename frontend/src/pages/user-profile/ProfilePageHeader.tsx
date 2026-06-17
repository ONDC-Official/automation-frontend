import type { IProfilePageHeaderProps } from "@pages/user-profile/types";

export const ProfilePageHeader = ({ title, subtitle, badgeCount }: IProfilePageHeaderProps) => (
    <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
            <h1 className="text-h4 font-bold text-text-primary">{title}</h1>
            {badgeCount != null && badgeCount > 0 ? (
                <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-brand-light text-brand-normal text-caption-1 font-semibold dark:bg-surface-muted">
                    {badgeCount}
                </span>
            ) : null}
        </div>
        <p className="text-body-2 text-text-secondary">{subtitle}</p>
    </div>
);
