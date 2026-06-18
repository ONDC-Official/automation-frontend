import type { PlaygroundActionVariant } from "@pages/protocol-playground/ui/playground-upper/types";

export const PLAYGROUND_ACTION_VARIANT_STYLES: Record<PlaygroundActionVariant, string> = {
    play: "bg-brand-light text-brand-normal hover:opacity-80 dark:bg-brand-dark/30 dark:text-brand-normal",
    view: "bg-brand-light text-brand-normal hover:opacity-80 dark:bg-brand-dark/30 dark:text-brand-normal",
    steps: "bg-alert-50 text-alert-500 hover:opacity-80 dark:bg-alert-500/15 dark:text-alert-500",
    refresh:
        "bg-success-50 text-success-500 hover:opacity-80 dark:bg-success-800/20 dark:text-success-500",
    delete: "bg-error-50 text-error-500 hover:opacity-80 dark:bg-error-500/15 dark:text-error-500",
    expand: "bg-n-20 text-n-500 hover:opacity-80 dark:bg-n-800/50 dark:text-n-80",
    retrigger:
        "bg-brand-light text-brand-normal hover:opacity-80 dark:bg-brand-dark/30 dark:text-brand-normal",
};
