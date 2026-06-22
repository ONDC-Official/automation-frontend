export const DESC_CHAR_LIMIT = 120;
export const INDENT_PX = 18;

export const TYPE_COLORS: Record<string, string> = {
    string: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-500/30",
    integer:
        "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-200 dark:ring-sky-500/30",
    number: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-200 dark:ring-sky-500/30",
    boolean:
        "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-200 dark:ring-amber-500/30",
    object: "bg-slate-50 text-slate-600 ring-slate-200",
    array: "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-violet-200 dark:ring-violet-500/30",
    allOf: "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 ring-cyan-200 dark:ring-cyan-500/30",
    any: "bg-slate-50 text-slate-500 ring-slate-200",
};
