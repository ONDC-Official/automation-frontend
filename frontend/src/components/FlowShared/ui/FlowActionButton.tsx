import { Button } from "@/components/Shadcn/Button/button";
import type { FlowActionButtonProps } from "@/components/FlowShared/ui/types";
import { cn } from "@/lib/utils";
import {
    variantOutlineIcons,
    variantSolidIcons,
    variantStyles,
} from "@/components/FlowShared/ui/constants";
import { useAppliedTheme } from "@/context/theme/useAppliedTheme";

export const FlowActionButton = ({ label, onClick, variant, disabled }: FlowActionButtonProps) => {
    const appliedTheme = useAppliedTheme();
    const icons = appliedTheme === "dark" ? variantOutlineIcons : variantSolidIcons;
    const Icon = icons[variant];

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "rounded-full border-0 shadow-none transition-opacity",
                variantStyles[variant]
            )}
        >
            <Icon className="size-5" />
        </Button>
    );
};
