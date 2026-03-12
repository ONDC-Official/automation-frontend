import { ReactNode } from "react";
import { FiArrowRight } from "react-icons/fi";

export interface FeatureCardProps {
    title: string;
    subtitle: string;
    description: string;
    icon: ReactNode;
    onClick: () => void;
}

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
            className="group relative bg-white border border-gray-200 rounded-2xl hover:border-sky-300 hover:shadow-lg hover:shadow-sky-100/60 transition-all duration-200 cursor-pointer p-6 flex flex-col gap-5 overflow-hidden"
            onClick={onClick}
            onKeyDown={handleKeyDown}
        >
            {/* Top accent bar */}
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-sky-400 to-sky-300 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            <div className="flex items-start justify-between">
                <div className="w-11 h-11 bg-sky-50 group-hover:bg-sky-100 rounded-xl flex items-center justify-center transition-colors duration-200 border border-sky-100 flex-shrink-0">
                    {icon}
                </div>
                <FiArrowRight
                    className="text-gray-300 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all duration-200 mt-1 flex-shrink-0"
                    size={16}
                />
            </div>

            <div>
                <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-sky-900 transition-colors duration-200">
                    {title}
                </h3>
                <p className="text-sky-600 text-xs font-semibold mb-2 uppercase tracking-wide">
                    {subtitle}
                </p>
                <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
            </div>
        </div>
    );
}
