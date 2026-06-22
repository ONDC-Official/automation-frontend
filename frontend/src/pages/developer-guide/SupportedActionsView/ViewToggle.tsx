import { type FC } from "react";
import type { SupportedActionsViewMode } from "./types";

interface ViewToggleProps {
    view: SupportedActionsViewMode;
    onChange: (view: SupportedActionsViewMode) => void;
}

const ViewToggle: FC<ViewToggleProps> = ({ view, onChange }) => (
    <div className="flex rounded-xl border border-slate-200 overflow-hidden shadow-xs shrink-0 bg-white dark:bg-surface-elevated">
        <button
            type="button"
            onClick={() => onChange("cards")}
            aria-pressed={view === "cards"}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors ${
                view === "cards"
                    ? "bg-sky-500 text-white"
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-surface-muted"
            }`}
        >
            <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
            </svg>
            Cards
        </button>
        <button
            type="button"
            onClick={() => onChange("graph")}
            aria-pressed={view === "graph"}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors border-l border-slate-200 ${
                view === "graph"
                    ? "bg-sky-500 text-white"
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-surface-muted"
            }`}
        >
            <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
            >
                <circle cx="5" cy="12" r="2" fill="currentColor" stroke="none" />
                <circle cx="19" cy="5" r="2" fill="currentColor" stroke="none" />
                <circle cx="19" cy="19" r="2" fill="currentColor" stroke="none" />
                <path strokeLinecap="round" d="M7 12h5M12 12l5-5M12 12l5 5" />
            </svg>
            Graph
        </button>
    </div>
);

export default ViewToggle;
