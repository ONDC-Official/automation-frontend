import { Spinner } from "@/components/Shadcn/Spinner/spinner";
import { cn } from "@/lib/utils";
import type { ScreenLoaderProps } from "@/components/Shadcn/ScreenLoader/types";

export const ScreenLoader = ({ className, spinnerClassName }: ScreenLoaderProps) => (
    <div
        className={cn(
            "fixed inset-0 z-60 flex h-svh w-svw items-center justify-center bg-neutral-900/40 backdrop-blur-xs",
            className
        )}
    >
        <Spinner className={cn("size-8 text-brand-normal", spinnerClassName)} />
    </div>
);

export default ScreenLoader;
