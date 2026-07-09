import { type FC, type ComponentType } from "react";
import { InboxIcon } from "@heroicons/react/24/outline";

interface EmptyStateProps {
    message: string;
    /**
     * "icon" — large centered icon + message (empty panels/tables).
     * "text" — compact inline message.
     * "card" — full-width dashed card with optional title (dashboard/section empty state).
     */
    variant?: "icon" | "text" | "card";
    title?: string;
    icon?: ComponentType<{ className?: string }>;
    hint?: string;
}

const EmptyState: FC<EmptyStateProps> = ({
    message,
    variant = "icon",
    title,
    icon: Icon = InboxIcon,
    hint,
}) => {
    if (variant === "text") {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-slate-400">{message}</p>
            </div>
        );
    }

    if (variant === "card") {
        return (
            <div className="col-span-full mt-8">
                <div className="bg-white border-2 border-dashed border-sky-200 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-linear-to-br from-sky-100 to-sky-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg
                            className="w-8 h-8 text-sky-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                        </svg>
                    </div>
                    {title && <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>}
                    <p className="text-gray-600">{message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <Icon className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">{message}</p>
            {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
        </div>
    );
};

export default EmptyState;
