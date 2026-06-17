import { cn } from "@/lib/utils";
import type { ITagBadgeProps } from "@pages/user-profile/types";

const VARIANT_CLASSES: Record<ITagBadgeProps["variant"], string> = {
    domain: "bg-brand-light text-brand-normal",
    version: "bg-success-200/20 text-success-500",
    npType: "bg-brand-light text-brand-normal",
    usecase: "bg-alert-50 text-error-800",
    env: "bg-alert-200/40 text-alert-500",
};

export const TagBadge = ({ label, variant }: ITagBadgeProps) => (
    <span
        className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-caption-2 font-semibold",
            VARIANT_CLASSES[variant]
        )}
    >
        {label}
    </span>
);
