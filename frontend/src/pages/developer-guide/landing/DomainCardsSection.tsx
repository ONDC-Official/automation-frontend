import { FC } from "react";
import type { DomainItem } from "@pages/home/types";

export interface DomainCardsSectionProps {
    domains: DomainItem[];
    error: string | null;
    isDomainEnabled: (dom: DomainItem) => boolean;
    isUseCaseEnabled: (dom: DomainItem, usecaseLabel: string) => boolean;
    onUseCaseClick: (dom: DomainItem, versionKey: string, usecaseLabel: string) => void;
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
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                    <svg
                        width="22"
                        height="22"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        className="text-gray-400"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
                <p className="text-gray-600 font-medium text-sm">No domains found</p>
                <p className="text-gray-400 text-xs mt-1">Try adjusting your search term</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {sortedDomains.map((dom, domIndex) => {
                const enabled = isDomainEnabled(dom);
                const domId = String(dom.id ?? `${dom.key}-${domIndex}`);
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
                        className={`group bg-white rounded-2xl overflow-hidden flex flex-col transition-all duration-200 ${
                            enabled
                                ? "border-2 border-sky-200 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-200/50 shadow-sm"
                                : "border border-gray-200 opacity-60"
                        }`}
                    >
                        {/* Card header */}
                        <div
                            className={`px-5 py-4 border-b flex items-start justify-between gap-3 ${
                                enabled ? "bg-sky-50 border-sky-200" : "bg-gray-50 border-gray-200"
                            }`}
                        >
                            <div className="min-w-0">
                                <h3 className="font-bold text-gray-900 text-md leading-snug truncate">
                                    {dom.key}
                                </h3>
                                <p className="text-sm text-sky-600 font-medium mt-0.5">
                                    {useCases.length} use case{useCases.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                            {!enabled ? (
                                <span className="flex-shrink-0 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                                    Coming Soon
                                </span>
                            ) : (
                                <span className="flex-shrink-0 flex items-center gap-1 text-sm font-bold uppercase tracking-widest text-emerald-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Live
                                </span>
                            )}
                        </div>

                        {/* Use-case tags */}
                        <div className="px-5 py-4 flex flex-wrap gap-2">
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
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all duration-150 ${
                                            clickable
                                                ? "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 hover:border-sky-300 cursor-pointer"
                                                : "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
                                        }`}
                                    >
                                        {label}
                                        <span
                                            className={`font-mono text-sm ${
                                                clickable ? "text-sky-400" : "text-gray-300"
                                            }`}
                                        >
                                            v{verKey}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DomainCardsSection;
