import { cva } from "class-variance-authority";

/** Leaf ink by JSON type. Type is also spelled out by the value itself. */
export const jsonValueVariants = cva("break-all", {
    variants: {
        kind: {
            string: "text-status-pass-ink",
            number: "text-foreground",
            boolean: "text-status-pending-ink",
            null: "text-muted-foreground italic",
            object: "text-muted-foreground",
            array: "text-muted-foreground",
        },
    },
    defaultVariants: { kind: "string" },
});
