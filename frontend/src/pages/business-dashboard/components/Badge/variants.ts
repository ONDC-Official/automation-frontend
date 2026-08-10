import { cva } from "class-variance-authority";

/**
 * Status variants follow the house scale: emerald = pass/ok, amber =
 * pending/degraded, red = fail/error. They never carry meaning alone — every
 * call site renders a label (and usually an icon) inside the badge.
 */
export const badgeVariants = cva(
    "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3",
    {
        variants: {
            variant: {
                default: "border-transparent bg-primary text-primary-foreground",
                secondary: "border-transparent bg-secondary text-secondary-foreground",
                outline: "border-border text-foreground",
                muted: "border-transparent bg-muted text-muted-foreground",
                pass: "border-transparent bg-status-pass-subtle text-status-pass-ink",
                pending: "border-transparent bg-status-pending-subtle text-status-pending-ink",
                fail: "border-transparent bg-status-fail-subtle text-status-fail-ink",
            },
            size: {
                default: "h-5",
                lg: "h-6 px-2.5 text-sm",
            },
        },
        defaultVariants: { variant: "default", size: "default" },
    }
);
