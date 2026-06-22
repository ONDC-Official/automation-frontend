import { type FC, type ComponentType } from "react";
import { IconEmpty } from "../../icons";

interface EmptyStateProps {
    message: string;
    /** "icon" renders a large centered icon + message (used for empty panels/tables). "text" renders a compact inline message. */
    variant?: "icon" | "text";
    icon?: ComponentType<{ className?: string }>;
    hint?: string;
}

const EmptyState: FC<EmptyStateProps> = ({
    message,
    variant = "icon",
    icon: Icon = IconEmpty,
    hint,
}) => {
    if (variant === "text") {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-slate-400">{message}</p>
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
