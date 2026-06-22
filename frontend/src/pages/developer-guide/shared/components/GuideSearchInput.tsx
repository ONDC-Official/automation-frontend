import { type FC } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { IconSearch, IconClear } from "../icons";

const inputVariants = cva(
    "w-full rounded-xl border border-slate-200 bg-white dark:bg-surface-elevated pl-10 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-xs transition focus:outline-hidden focus:border-current",
    {
        variants: {
            accent: {
                sky: "focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400",
                rose: "focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400",
            },
        },
        defaultVariants: { accent: "sky" },
    }
);

export interface GuideSearchInputProps extends VariantProps<typeof inputVariants> {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

/** Shared search box with leading icon + clear button, used by tables and action views. */
const GuideSearchInput: FC<GuideSearchInputProps> = ({
    value,
    onChange,
    placeholder = "Search…",
    accent,
    className,
}) => (
    <div className={cn("relative w-1/5", className)}>
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={inputVariants({ accent })}
        />
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        {value.trim().length > 0 && (
            <button
                type="button"
                onClick={() => onChange("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
            >
                <IconClear className="h-4 w-4" />
            </button>
        )}
    </div>
);

export default GuideSearchInput;
