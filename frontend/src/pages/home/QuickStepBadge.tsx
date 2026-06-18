import { cn } from "@/lib/utils";

interface QuickStepBadgeProps {
    number: string;
}

/**
 * Figma step index badge — light: brand-light + brand-normal; dark: brand-dark tint + brand-light.
 * Kept outside <a>/<Link> so Tailwind preflight (`a { color: inherit }`) cannot override the text color.
 */
export const QuickStepBadge = ({ number }: QuickStepBadgeProps) => (
    <span
        className={cn(
            "shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md",
            "bg-brand-light text-brand-normal! text-caption-1 font-semibold",
            "dark:bg-surface-elevated dark:text-brand-normal!"
        )}
    >
        {number}
    </span>
);
