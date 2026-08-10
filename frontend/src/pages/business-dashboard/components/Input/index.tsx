import type { ComponentProps } from "react";
import { cn } from "@dashboard/lib/utils";

const Input = ({ className, type, ...props }: ComponentProps<"input">) => (
    <input
        data-slot="input"
        type={type}
        className={cn(
            "border-input bg-background flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none",
            "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
            "file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
            className
        )}
        {...props}
    />
);

export default Input;
