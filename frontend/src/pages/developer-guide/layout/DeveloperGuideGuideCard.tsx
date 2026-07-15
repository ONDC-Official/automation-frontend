import { FC } from "react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/Shadcn/Button";
import { cn } from "@/lib/utils";
import type { DeveloperGuideGuideCardProps } from "./navTypes";

const DeveloperGuideGuideCard: FC<DeveloperGuideGuideCardProps> = ({
    title,
    subtitle,
    description,
    icon,
    onClick,
    className: classNameProp,
}) => {
    const isInteractive = Boolean(onClick);

    const content = (
        <>
            <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl bg-linear-to-r from-brand-normal to-brand-normal/70 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

            <div className="flex items-start justify-between gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-n-40 bg-brand-light transition-colors duration-200 group-hover:bg-brand-light-active dark:border-n-60 dark:bg-brand-normal/10 dark:group-hover:bg-brand-normal/20">
                    {icon}
                </div>
                {isInteractive && (
                    <ArrowRightIcon
                        className="mt-1 size-4 shrink-0 text-n-60 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand-normal"
                        aria-hidden
                    />
                )}
            </div>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <h2 className="mb-1 text-base font-bold whitespace-normal text-n-900 transition-colors duration-200 group-hover:text-brand-normal dark:text-n-0 dark:group-hover:text-brand-normal">
                    {title}
                </h2>
                <p className="mb-2 text-caption-2-size font-semibold uppercase tracking-wide whitespace-normal text-brand-normal">
                    {subtitle}
                </p>
                <p className="line-clamp-4 flex-1 text-body-2 leading-relaxed whitespace-normal text-n-300 dark:text-n-60">
                    {description}
                </p>
            </div>
        </>
    );

    // Neutralize Button defaults (whitespace-nowrap, items-center, justify-center)
    // so the card can lay out as a full-height flex column with wrapping text.
    const className = cn(
        "group relative flex h-full min-w-0 w-full flex-col items-stretch justify-start gap-5 overflow-hidden whitespace-normal rounded-2xl border border-n-40 bg-white p-6 text-left font-normal transition-all duration-200 dark:border-n-60 dark:bg-surface-elevated",
        isInteractive
            ? "cursor-pointer hover:border-brand-normal/40 hover:shadow-lg hover:shadow-brand-normal/10 dark:hover:border-brand-normal/30 dark:hover:shadow-brand-normal/5"
            : "shadow-xs",
        classNameProp
    );

    if (isInteractive) {
        return (
            <Button variant="ghost" onClick={onClick} className={cn("h-auto", className)}>
                {content}
            </Button>
        );
    }

    return <article className={className}>{content}</article>;
};

export default DeveloperGuideGuideCard;
