import { type FC } from "react";

interface EntryPointsBannerProps {
    entryPoints: string[];
    focused: string | null;
    onToggleFocus: (api: string) => void;
}

const EntryPointsBanner: FC<EntryPointsBannerProps> = ({ entryPoints, focused, onToggleFocus }) => (
    <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10 px-5 py-4">
        <div className="flex items-center gap-2 mb-1">
            <svg
                className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
                />
            </svg>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                Transaction Entry Points
            </p>
        </div>
        <p className="text-xs text-emerald-700/60 dark:text-emerald-400/70 mb-3 ml-5">
            A transaction can only be started with one of these:
        </p>
        <div className="flex flex-wrap gap-2 ml-5">
            {entryPoints.map((ep) => (
                <button
                    key={ep}
                    onClick={() => onToggleFocus(ep)}
                    className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all shadow-xs ${
                        focused === ep
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white dark:bg-surface-elevated text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                    }`}
                >
                    {ep}
                </button>
            ))}
        </div>
    </div>
);

export default EntryPointsBanner;
