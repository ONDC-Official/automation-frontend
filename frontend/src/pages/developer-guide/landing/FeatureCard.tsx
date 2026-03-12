import { ReactNode } from "react";

export interface FeatureCardProps {
    title: string;
    subtitle: string;
    description: string;
    icon: ReactNode;
    onClick: () => void;
}

/** Reusable feature card matching home page style (hover effects, gradient accents). */
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
            className="group bg-white border border-sky-100 rounded-2xl hover:border-sky-300 hover:shadow-xl hover:shadow-sky-100/50 transition-all duration-300 cursor-pointer p-8 relative overflow-hidden"
            onClick={onClick}
            onKeyDown={handleKeyDown}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-sky-50/0 via-sky-100/20 to-indigo-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-sky-200/20 to-indigo-200/20 rounded-lg rotate-12 group-hover:rotate-45 transition-transform duration-500" />
            <div className="absolute bottom-6 left-6 w-3 h-3 bg-sky-300/25 rounded-full group-hover:scale-150 transition-transform duration-300" />
            <div className="relative flex items-start space-x-5">
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-sky-100/80 via-sky-200/60 to-indigo-100/80 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-sky-200/30">
                    {icon}
                </div>
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-sky-900 transition-colors duration-300">
                        {title}
                    </h3>
                    <p className="text-sky-600 font-semibold mb-3 group-hover:text-sky-700 transition-colors duration-300">
                        {subtitle}
                    </p>
                    <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                        {description}
                    </p>
                </div>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-400/0 via-sky-400/0 to-sky-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
    );
}
