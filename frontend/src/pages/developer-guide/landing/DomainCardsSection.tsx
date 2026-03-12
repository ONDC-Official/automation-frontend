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

    return (
        <section>
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            {domains.length === 0 && !error && (
                <p className="text-gray-500">No domains available.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-min items-start">
                {sortedDomains.map((dom, domIndex) => {
                    const enabled = isDomainEnabled(dom);
                    const domId = String(dom.id ?? `${dom.key}-${domIndex}`);
                    const totalUseCases = (dom.version ?? []).reduce(
                        (t, v) => t + (v.usecase?.length ?? 0),
                        0
                    );
                    return (
                        <div
                            key={domId}
                            className="bg-white rounded-2xl shadow-lg shadow-sky-100/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-sky-200/50 border border-sky-100"
                        >
                            <div className="w-full text-left flex items-center justify-between p-6 bg-gradient-to-r from-sky-50 to-sky-100/50 border-b border-sky-100">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{dom.key}</h3>
                                    <span className="text-sm text-sky-700 font-semibold">
                                        {totalUseCases} use case
                                        {totalUseCases !== 1 ? "s" : ""}
                                    </span>
                                </div>
                                {!enabled && (
                                    <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-1 rounded-full bg-sky-100 text-sky-700 border border-sky-200">
                                        Coming soon
                                    </span>
                                )}
                            </div>
                            <div className="p-6">
                                <div className="flex flex-nowrap gap-2 overflow-x-auto overflow-y-hidden pb-1">
                                    {dom.version &&
                                        dom.version
                                            .flatMap((ver) =>
                                                (ver.usecase ?? []).map((uc) => ({
                                                    verKey: ver.key,
                                                    label: uc,
                                                }))
                                            )
                                            .sort((a, b) => {
                                                const aEnabled = isUseCaseEnabled(dom, a.label);
                                                const bEnabled = isUseCaseEnabled(dom, b.label);
                                                if (aEnabled !== bEnabled) return aEnabled ? -1 : 1;
                                                return a.label.localeCompare(b.label);
                                            })
                                            .map(({ verKey, label }) => {
                                                const clickable = isUseCaseEnabled(dom, label);
                                                return (
                                                    <button
                                                        key={`${domId}-${verKey}-${label}`}
                                                        type="button"
                                                        disabled={!clickable}
                                                        onClick={() =>
                                                            clickable &&
                                                            onUseCaseClick(dom, verKey, label)
                                                        }
                                                        className={`flex-shrink-0 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border transition-colors duration-150 whitespace-nowrap ${
                                                            clickable
                                                                ? "bg-gradient-to-r from-sky-50 to-sky-100 text-sky-800 border-sky-300 hover:from-sky-200 hover:to-sky-300 cursor-pointer"
                                                                : "bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed"
                                                        }`}
                                                    >
                                                        {label}
                                                        <span className="ml-2 text-xs text-sky-800">
                                                            ({verKey})
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default DomainCardsSection;
