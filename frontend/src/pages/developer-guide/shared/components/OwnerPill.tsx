import { type FC } from "react";
import { cn } from "@/lib/utils";

export type OwnerAlias = "BAP" | "BPP";

/** Maps free-form step/attribute owner strings onto the BAP/BPP display aliases. */
export function resolveOwnerAlias(owner: string | undefined | null): OwnerAlias | null {
    if (!owner) return null;
    const o = owner.trim().toUpperCase();
    if (!o || o === "—" || o === "-") return null;
    if (o.includes("BPP") || o.includes("SELLER") || o.includes("PROVIDER")) return "BPP";
    if (o.includes("BAP") || o.includes("BUYER")) return "BAP";
    return null;
}

const OWNER_STYLES: Record<OwnerAlias, string> = {
    BAP: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
    BPP: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
};

interface OwnerPillProps {
    owner?: string | null;
    className?: string;
}

/** Colored BAP / BPP badge. Falls back to plain text when the owner is unrecognized. */
const OwnerPill: FC<OwnerPillProps> = ({ owner, className }) => {
    const alias = resolveOwnerAlias(owner);
    if (!alias) {
        if (!owner) return null;
        return (
            <span
                className={cn(
                    "inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-caption-2-size font-semibold tracking-wide text-slate-600 dark:border-border-default dark:bg-surface-muted dark:text-slate-300",
                    className
                )}
            >
                {owner}
            </span>
        );
    }

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-md border px-1.5 py-0.5 text-caption-2-size font-bold tracking-wide",
                OWNER_STYLES[alias],
                className
            )}
        >
            {alias}
        </span>
    );
};

export default OwnerPill;
