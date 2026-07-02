import { type FC } from "react";
import AppJsonViewer from "@/components/AppJsonViewer";

function tryParseJson(str: string | undefined): object | null {
    if (!str) return null;
    try {
        const parsed = JSON.parse(str);
        return typeof parsed === "object" && parsed !== null ? parsed : null;
    } catch {
        return null;
    }
}

export const DIFF_CHIP_CLASSES = {
    Before: "text-[#DC2626] bg-[#FCE7EA]",
    After: "text-[#3F7F3F] bg-[#DDEBDD]",
};

const DiffRow: FC<{ label: "Before" | "After"; raw?: string }> = ({ label, raw }) => {
    if (raw === undefined || raw === "") return null;
    const json = tryParseJson(raw);
    const isBefore = label === "Before";

    // Plain scalar values (e.g. a UUID) render as a single inline label + value row.
    if (!json) {
        return (
            <div className="flex items-start gap-2">
                <span
                    className={`shrink-0 mt-0.5 text-[11px] font-semibold leading-none px-3 py-1 rounded-full ${DIFF_CHIP_CLASSES[label]}`}
                >
                    {label}
                </span>
                <span className="text-xs font-mono text-slate-600 break-all leading-relaxed">
                    {raw}
                </span>
            </div>
        );
    }

    return (
        <div className="rounded-xl overflow-hidden border border-slate-200 bg-white dark:bg-surface-elevated">
            <div
                className={`px-3 py-1.5 text-[11px] font-semibold border-b ${
                    isBefore
                        ? "text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/30"
                        : "text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/30"
                }`}
            >
                {label}
            </div>
            <div className="p-4 bg-white dark:bg-surface-elevated max-h-72 overflow-auto">
                <AppJsonViewer
                    value={json}
                    displayObjectSize={false}
                    enableClipboard
                    collapsed={2}
                />
            </div>
        </div>
    );
};

/** Renders Before / After as two stacked rows (no tab switching). */
export const DiffViewer: FC<{ before?: string; after?: string }> = ({ before, after }) => {
    const hasBefore = before !== undefined && before !== "";
    const hasAfter = after !== undefined && after !== "";
    if (!hasBefore && !hasAfter) return null;

    return (
        <div className="mt-3 flex flex-col gap-2">
            <DiffRow label="Before" raw={before} />
            <DiffRow label="After" raw={after} />
        </div>
    );
};
