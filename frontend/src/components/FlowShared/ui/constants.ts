import { FlowActionButtonProps } from "@/components/FlowShared/ui/types";
import {
    PlayCircleIcon as PlayCircleOutlineIcon,
    StopCircleIcon as StopCircleOutlineIcon,
    ArchiveBoxIcon as ArchiveBoxOutlineIcon,
    ArrowDownCircleIcon as ArrowDownCircleOutlineIcon,
} from "@heroicons/react/24/outline";
import {
    PlayCircleIcon as PlayCircleSolidIcon,
    StopCircleIcon as StopCircleSolidIcon,
    ArchiveBoxIcon as ArchiveBoxSolidIcon,
    ArrowDownCircleIcon as ArrowDownCircleSolidIcon,
} from "@heroicons/react/24/solid";

export const variantStyles: Record<FlowActionButtonProps["variant"], string> = {
    play: "bg-brand-light text-brand-normal hover:!bg-brand-light hover:!text-brand-normal hover:opacity-80 dark:bg-brand-dark/30 dark:hover:!bg-brand-dark/30 dark:hover:!text-brand-normal",
    stop: "bg-error-50 text-error-500 hover:!bg-error-50 hover:!text-error-500 hover:opacity-80 dark:bg-error-500/15 dark:hover:!bg-error-500/15 dark:hover:!text-error-500",
    delete:
        "bg-error-50 text-error-500 hover:!bg-error-50 hover:!text-error-500 hover:opacity-80 dark:bg-error-500/15 dark:hover:!bg-error-500/15 dark:hover:!text-error-500",
    download:
        "bg-success-50 text-success-500 hover:!bg-success-50 hover:!text-success-500 hover:opacity-80 dark:bg-success-800/20 dark:hover:!bg-success-800/20 dark:hover:!text-success-500",
};

type VariantIcon = typeof PlayCircleSolidIcon;

export const variantSolidIcons: Record<FlowActionButtonProps["variant"], VariantIcon> = {
    play: PlayCircleSolidIcon,
    stop: StopCircleSolidIcon,
    delete: ArchiveBoxSolidIcon,
    download: ArrowDownCircleSolidIcon,
};

export const variantOutlineIcons: Record<FlowActionButtonProps["variant"], VariantIcon> = {
    play: PlayCircleOutlineIcon,
    stop: StopCircleOutlineIcon,
    delete: ArchiveBoxOutlineIcon,
    download: ArrowDownCircleOutlineIcon,
};
