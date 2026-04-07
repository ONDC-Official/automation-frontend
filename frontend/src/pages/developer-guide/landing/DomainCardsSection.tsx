import { FC } from "react";
import type { BuildEntry } from "../types";

export interface DomainCardsSectionProps {
    domains: BuildEntry[];
    error: string | null;
    isDomainEnabled: (dom: BuildEntry) => boolean;
    isUseCaseEnabled: (dom: BuildEntry, usecaseLabel: string) => boolean;
    onUseCaseClick: (dom: BuildEntry, versionKey: string, usecaseLabel: string) => void;
}

const DomainCardsSection: FC<DomainCardsSectionProps> = ({
    domains,
    error,
    isDomainEnabled,
    isUseCaseEnabled,
    onUseCaseClick,
}) => {
    const sortedDomains = [...domains].sort((a, b) => {
        const aEnabled = isDomainEnabled(a);
        const bEnabled = isDomainEnabled(b);
        if (aEnabled !== bEnabled) return aEnabled ? -1 : 1;
        return a.key.localeCompare(b.key);
    });

    if (error) {
        return (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <svg
                    width="15"
                    height="15"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    className="flex-shrink-0"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                {error}
            </div>
        );
    }

    if (domains.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 bg-sky-50 border border-sky-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                    <svg
                        width="22"
                        height="22"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        className="text-sky-400"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
                <p className="text-slate-600 font-semibold text-sm">No domains found</p>
                <p className="text-slate-400 text-xs mt-1">Try adjusting your search term</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {sortedDomains.map((dom, domIndex) => {
                const enabled = isDomainEnabled(dom);
                const domId = `${dom.key}-${domIndex}`;
                const useCases = (dom.version ?? [])
                    .flatMap((ver) =>
                        (ver.usecase ?? []).map((uc) => ({ verKey: ver.key, label: uc }))
                    )
                    .sort((a, b) => {
                        const aEn = isUseCaseEnabled(dom, a.label);
                        const bEn = isUseCaseEnabled(dom, b.label);
                        if (aEn !== bEn) return aEn ? -1 : 1;
                        return a.label.localeCompare(b.label);
                    });

                return (
                    <div
                        key={domId}
                        className={`group relative bg-white rounded-2xl overflow-hidden flex flex-col transition-all duration-300 ${
                            enabled
                                ? "border border-sky-200 shadow-sm hover:shadow-lg hover:shadow-sky-100/70 hover:-translate-y-0.5 hover:border-sky-300"
                                : "border border-slate-200 opacity-55"
                        }`}
                        style={{
                            animationName: "fadeSlideUp",
                            animationDuration: "0.35s",
                            animationTimingFunction: "ease-out",
                            animationFillMode: "both",
                            animationDelay: `${domIndex * 40}ms`,
                        }}
                    >
                        {/* Subtle top gradient stripe */}
                        {enabled && (
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300 to-transparent" />
                        )}

                        {/* Card header */}
                        <div
                            className={`relative px-5 pt-4 pb-3 flex items-start justify-between gap-3 ${
                                enabled
                                    ? "bg-gradient-to-br from-sky-50/80 via-white to-slate-50/40"
                                    : "bg-slate-50/60"
                            }`}
                        >
                            {/* Domain icon dot */}
                            <div className="flex items-start gap-3 min-w-0">
                                <div
                                    className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                        enabled
                                            ? "bg-sky-100 text-sky-600 border border-sky-200"
                                            : "bg-slate-100 text-slate-400 border border-slate-200"
                                    }`}
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={1.75}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                                        />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <h3
                                        className={`font-bold text-sm leading-snug truncate ${
                                            enabled ? "text-slate-900" : "text-slate-500"
                                        }`}
                                    >
                                        {dom.key}
                                    </h3>
                                    <p
                                        className={`text-xs mt-0.5 font-medium ${
                                            enabled ? "text-sky-600" : "text-slate-400"
                                        }`}
                                    >
                                        {useCases.length} use case
                                        {useCases.length !== 1 ? "s" : ""}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div
                            className={`h-px mx-5 ${
                                enabled
                                    ? "bg-gradient-to-r from-sky-100 via-sky-200/60 to-transparent"
                                    : "bg-slate-100"
                            }`}
                        />

                        {/* Use-case chips */}
                        <div className="px-5 py-4 flex flex-wrap gap-2 flex-1">
                            {useCases.map(({ verKey, label }) => {
                                const clickable = isUseCaseEnabled(dom, label);
                                return (
                                    <button
                                        key={`${domId}-${verKey}-${label}`}
                                        type="button"
                                        disabled={!clickable}
                                        onClick={() =>
                                            clickable && onUseCaseClick(dom, verKey, label)
                                        }
                                        className={`group/chip relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors duration-150 ${
                                            clickable
                                                ? "bg-white text-sky-700 border-sky-200 hover:bg-sky-50 hover:border-sky-300 hover:shadow-sm cursor-pointer shadow-sm pr-7"
                                                : "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed"
                                        }`}
                                    >
                                        {label}
                                        <span
                                            className={`font-mono text-[11px] ${
                                                clickable ? "text-sky-400" : "text-slate-300"
                                            }`}
                                        >
                                            v{verKey}
                                        </span>
                                        {clickable && (
                                            <svg
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-sky-400 opacity-0 -translate-x-1 group-hover/chip:opacity-100 group-hover/chip:translate-x-0 transition-all duration-150"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2.5}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Hover glow overlay — purely decorative */}
                        {enabled && (
                            <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-sky-50/30 via-transparent to-transparent" />
                        )}
                    </div>
                );
            })}

            {/* Keyframe injection */}
            <style>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default DomainCardsSection;
