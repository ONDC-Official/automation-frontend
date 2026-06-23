import { ArrowRightIcon } from "@heroicons/react/24/outline";
import type { FeatureCardProps } from "./types";

export default function FeatureCard({
    title,
    subtitle,
    description,
    icon,
    onClick,
}: FeatureCardProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
        }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            className="group relative bg-white dark:bg-surface-elevated border border-gray-200 rounded-2xl hover:border-sky-300 dark:hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-100/60 dark:hover:shadow-sky-500/10 transition-all duration-200 cursor-pointer p-6 flex flex-col gap-5 overflow-hidden"
            onClick={onClick}
            onKeyDown={handleKeyDown}
        >
            {/* Top accent bar */}
            <div className="absolute inset-x-0 top-0 h-[3px] bg-linear-to-r from-sky-400 to-sky-300 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            <div className="flex items-start justify-between">
                <div className="w-11 h-11 bg-sky-50 dark:bg-sky-500/10 group-hover:bg-sky-100 dark:group-hover:bg-sky-500/20 rounded-xl flex items-center justify-center transition-colors duration-200 border border-sky-100 dark:border-sky-500/30 shrink-0">
                    {icon}
                </div>
                <ArrowRightIcon className="w-4 h-4 text-gray-300 group-hover:text-sky-500 dark:group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all duration-200 mt-1 shrink-0" />
            </div>

            <div>
                <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-sky-900 dark:group-hover:text-sky-300 transition-colors duration-200">
                    {title}
                </h3>
                <p className="text-sky-600 dark:text-sky-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                    {subtitle}
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
            </div>
        </div>
    );
}
