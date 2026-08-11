import type { LucideIcon } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import type { statValueVariants } from "./variants";

export interface IDelta {
    /** signed percentage change, e.g. -4.2 */
    value: number;
    /** the period it is measured against, e.g. "vs previous 7 days" */
    period: string;
    /** whether a rise is a good thing — flips the delta's colour, not its arrow */
    upIsGood?: boolean;
}

export interface IProps extends VariantProps<typeof statValueVariants> {
    /** sentence case, no trailing colon */
    label: string;
    /** already formatted — the tile does not guess a unit */
    value: string;
    hint?: string;
    icon?: LucideIcon;
    delta?: IDelta;
    /** up to 12 points; rendered as a bare sparkline, no axes */
    trend?: number[];
    isLoading?: boolean;
    className?: string;
}
