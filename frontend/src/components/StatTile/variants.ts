import { cva } from "class-variance-authority";

/** The value's ink. `tone` is the reserved status scale, never a series colour. */
export const statValueVariants = cva("text-2xl leading-none font-semibold", {
    variants: {
        tone: {
            default: "text-foreground",
            pass: "text-status-pass-ink",
            pending: "text-status-pending-ink",
            fail: "text-status-fail-ink",
        },
    },
    defaultVariants: { tone: "default" },
});

/** Delta ink: direction × whether up is good, resolved by the caller. */
export const statDeltaVariants = cva("inline-flex items-center gap-1 text-xs font-medium", {
    variants: {
        direction: {
            up: "text-status-pass-ink",
            down: "text-status-fail-ink",
            flat: "text-muted-foreground",
        },
    },
    defaultVariants: { direction: "flat" },
});
