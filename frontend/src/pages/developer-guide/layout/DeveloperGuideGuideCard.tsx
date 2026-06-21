import { FC } from "react";
import { Button } from "@/components/Shadcn/Button";
import { FiArrowRight } from "react-icons/fi";
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
            <div className="absolute inset-x-0 top-0 h-[3px] bg-linear-to-r from-sky-400 to-sky-300 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 bg-sky-50 dark:bg-sky-500/10 group-hover:bg-sky-100 dark:group-hover:bg-sky-500/20 rounded-xl flex items-center justify-center transition-colors duration-200 border border-sky-100 dark:border-sky-500/30 shrink-0">
                    {icon}
                </div>
                {isInteractive && (
                    <FiArrowRight
                        className="text-slate-300 group-hover:text-sky-500 dark:group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all duration-200 mt-1 shrink-0"
                        size={16}
                        aria-hidden
                    />
                )}
            </div>

            <div className="flex flex-1 flex-col min-h-0">
                <h2 className="text-base font-bold text-slate-900 mb-1 group-hover:text-sky-900 dark:group-hover:text-sky-300 transition-colors duration-200">
                    {title}
                </h2>
                <p className="text-sky-600 dark:text-sky-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                    {subtitle}
                </p>
                <p className="flex-1 text-slate-600 text-sm leading-relaxed line-clamp-4">
                    {description}
                </p>
            </div>
        </>
    );

    const className = [
        "group relative h-full bg-white dark:bg-surface-elevated border border-slate-200 rounded-2xl p-6 flex flex-col gap-5 overflow-hidden transition-all duration-200",
        isInteractive
            ? "hover:border-sky-300 dark:hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-100/60 dark:hover:shadow-sky-500/10 cursor-pointer"
            : "shadow-xs",
        classNameProp,
    ]
        .filter(Boolean)
        .join(" ");

    if (isInteractive) {
        return (
            <Button onClick={onClick} className={`${className} text-left w-full`}>
                {content}
            </Button>
        );
    }

    return <article className={className}>{content}</article>;
};

export default DeveloperGuideGuideCard;
