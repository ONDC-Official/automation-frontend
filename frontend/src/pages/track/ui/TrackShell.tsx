import { type ReactNode } from "react";

/**
 * Frame for the public tracking page.
 *
 * Deliberately plain: the audience is a rider following a link on a phone, not
 * someone operating the workbench, so there is no nav, no session controls and
 * nothing to click away to.
 */
export function TrackShell({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="mx-auto flex max-w-2xl flex-col gap-3 px-3 py-4">
                <header className="flex items-baseline justify-between px-1">
                    <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        Your ride
                    </h1>
                    <span className="text-xs text-slate-400">Live tracking</span>
                </header>
                {children}
            </div>
        </div>
    );
}

/** Centred title + optional detail, for the states that have no map to show. */
export function TrackMessage({ title, detail }: { title: string; detail?: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</p>
            {detail ? (
                <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400">{detail}</p>
            ) : null}
        </div>
    );
}
