import { type FC } from "react";

interface LegendProps {
    focused: string | null;
    onClearFocus: () => void;
}

const Legend: FC<LegendProps> = ({ focused, onClearFocus }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 dark:bg-surface-muted/80 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-xs bg-sky-400 shrink-0" />
            <span>
                <strong className="text-slate-700">Valid Next</strong> — can immediately follow this
                action
            </span>
        </div>
        <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-xs bg-slate-400 shrink-0" />
            <span>
                <strong className="text-slate-700">Required History</strong> — must already exist in
                the transaction
            </span>
        </div>
        <p className="sm:ml-1 text-slate-400 italic hidden sm:block">
            Click any card or chip to focus
        </p>
        {focused && (
            <button
                onClick={onClearFocus}
                className="sm:ml-auto flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 transition"
            >
                <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear focus
            </button>
        )}
    </div>
);

export default Legend;
