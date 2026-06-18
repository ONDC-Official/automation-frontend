import { Button } from "@/components/Shadcn/Button/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/Shadcn/Tooltip";
import { cn } from "@/lib/utils";
import type { IPlaygroundActionButtonProps } from "@pages/protocol-playground/ui/playground-upper/types";
import { PLAYGROUND_ACTION_VARIANT_STYLES } from "@pages/protocol-playground/ui/playground-upper/constants";
import {
    ArrowPathIcon,
    ChartBarIcon,
    EyeIcon,
    PlayCircleIcon,
    ArchiveBoxIcon,
} from "@heroicons/react/24/solid";
import FullScreenIcon from "@/assets/svgs/FullScreenIcon";

const VARIANT_ICONS = {
    play: PlayCircleIcon,
    view: EyeIcon,
    steps: ChartBarIcon,
    refresh: ArrowPathIcon,
    delete: ArchiveBoxIcon,
    expand: FullScreenIcon,
    retrigger: ArrowPathIcon,
} as const;

export const PlaygroundActionButton = ({
    label,
    variant,
    onClick,
    disabled,
    active,
}: IPlaygroundActionButtonProps) => {
    const Icon = VARIANT_ICONS[variant];

    const button = (
        <Button
            variant="ghost"
            size="icon-lg"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "rounded-full border-0 shadow-none transition-opacity",
                PLAYGROUND_ACTION_VARIANT_STYLES[variant],
                active && "ring-2 ring-brand-normal ring-offset-1 dark:ring-offset-surface-page"
            )}
        >
            <Icon className="size-5" />
        </Button>
    );

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                {disabled ? <span className="inline-flex">{button}</span> : button}
            </TooltipTrigger>
            <TooltipContent side="bottom">{label}</TooltipContent>
        </Tooltip>
    );
};
