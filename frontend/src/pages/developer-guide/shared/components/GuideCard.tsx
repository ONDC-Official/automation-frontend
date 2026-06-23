import { type FC, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const guideCardVariants = cva("overflow-hidden bg-white dark:bg-surface-elevated shadow-xs", {
    variants: {
        border: {
            none: "",
            slate: "border border-slate-200",
            sky: "border border-sky-100 dark:border-sky-500/30",
        },
        rounded: {
            none: "rounded-none",
            lg: "rounded-lg",
            xl: "rounded-xl",
            "2xl": "rounded-2xl",
        },
        layout: {
            block: "",
            column: "flex flex-col h-full",
        },
    },
    defaultVariants: {
        border: "slate",
        rounded: "xl",
        layout: "block",
    },
});

export interface GuideCardProps extends VariantProps<typeof guideCardVariants> {
    className?: string;
    children: ReactNode;
}

/** Shared card shell — the `rounded-xl border bg-white shadow-xs` pattern repeated across Notes/Comments/Attributes/Flow panels. */
const GuideCard: FC<GuideCardProps> = ({ border, rounded, layout, className, children }) => (
    <div className={cn(guideCardVariants({ border, rounded, layout }), className)}>{children}</div>
);

export default GuideCard;
