import { type FC } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { IconSearch, IconClear } from "../icons";
import Input from "@components/Shadcn/Input";
import { Button } from "@components/Shadcn/Button";

const inputVariants = cva(
    "w-full rounded-xl border border-n-30 dark:border-border-default bg-n-0 dark:bg-surface-elevated pl-10 pr-10 py-2.5 text-body-2 text-n-800 dark:text-n-0 placeholder-n-300 dark:placeholder-n-60 shadow-xs transition focus:outline-hidden focus:border-current",
    {
        variants: {
            accent: {
                sky: "focus:ring-2 focus:ring-brand-light-active focus:border-brand-normal",
                rose: "focus:ring-2 focus:ring-error-50 focus:border-error-500",
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
    <div className={cn("relative", className)}>
        <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={inputVariants({ accent })}
        />
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-n-300 dark:text-n-60" />
        {value.trim().length > 0 && (
            <Button
                variant="ghost"
                onClick={() => onChange("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-n-300 hover:text-n-600 dark:text-n-60 dark:hover:text-n-0 transition"
            >
                <IconClear className="h-4 w-4" />
            </Button>
        )}
    </div>
);

export default GuideSearchInput;
