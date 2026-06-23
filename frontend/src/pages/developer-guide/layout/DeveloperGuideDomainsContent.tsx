import { FC, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CodeBracketIcon,
    Square3Stack3DIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { getDeveloperGuideUseCasePath } from "@constants/routes";
import type { BuildEntry } from "../types";
import { groupBuildsByFamily } from "../domainGrouping";
import { isDomainEnabled, isUseCaseEnabled } from "../utils";
import { useDeveloperGuideShell } from "./DeveloperGuideShellContext";
import DomainCardsSection from "../landing/DomainCardsSection";

const DeveloperGuideDomainsContent: FC = () => {
    const navigate = useNavigate();
    const { builds, loadError, collapseNavSidebar } = useDeveloperGuideShell();
    const [domainSearch, setDomainSearch] = useState("");

    const handleUseCaseClick = (dom: BuildEntry, versionKey: string, usecaseLabel: string) => {
        if (!isUseCaseEnabled(dom, usecaseLabel)) return;
        collapseNavSidebar();
        navigate(getDeveloperGuideUseCasePath(dom.key, versionKey, usecaseLabel));
    };

    const domainFamilies = useMemo(() => groupBuildsByFamily(builds), [builds]);

    const filteredFamilies = useMemo(() => {
        const q = domainSearch.trim().toLowerCase();
        if (!q) return domainFamilies;

        return domainFamilies
            .map((family) => ({
                ...family,
                domains: family.domains.filter(
                    (dom) =>
                        family.label.toLowerCase().includes(q) ||
                        family.familyKey.toLowerCase().includes(q) ||
                        dom.key.toLowerCase().includes(q)
                ),
            }))
            .filter((family) => family.domains.length > 0);
    }, [domainFamilies, domainSearch]);

    return (
        <div className="min-h-full">
            <header className="border-b border-sky-100 dark:border-sky-500/30 bg-linear-to-br from-sky-50 via-white to-slate-50 dark:from-sky-500/10 dark:via-surface-elevated dark:to-surface-elevated">
                <div className="px-10 md:px-12 py-10 md:py-12 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 rounded-full text-xs font-semibold uppercase tracking-widest mb-5 border border-sky-200 dark:border-sky-500/30">
                        <CodeBracketIcon className="w-2.75 h-2.75" aria-hidden />
                        API reference
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
                        Explore by <span className="text-sky-500 dark:text-sky-400">domain</span>
                    </h1>
                    <p className="text-base text-slate-600 leading-relaxed max-w-2xl p-0 mb-0">
                        Browse protocol specifications and use-case flows grouped by domain family.
                        Expand a domain and select a use case to open its flow documentation.
                    </p>
                </div>
            </header>

            <div className="px-10 md:px-12 py-10 md:py-12">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 flex items-center justify-center shrink-0">
                            <Square3Stack3DIcon
                                className="w-3.75 h-3.75 text-sky-600 dark:text-sky-400"
                                aria-hidden
                            />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-slate-900 leading-none mb-2">
                                All domains
                            </p>
                            <p className="text-xs text-slate-500 mb-0">
                                Related domains are grouped (e.g. FIS12, FIS13 under FIS)
                            </p>
                        </div>
                    </div>
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            type="search"
                            placeholder="Search domains..."
                            value={domainSearch}
                            onChange={(e) => setDomainSearch(e.target.value)}
                            className="w-full sm:w-64 pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-surface-elevated border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-500/20 focus:border-sky-300 placeholder-slate-400 text-slate-800 shadow-xs"
                        />
                    </div>
                </div>

                <DomainCardsSection
                    domainFamilies={filteredFamilies}
                    error={loadError}
                    isDomainEnabled={isDomainEnabled}
                    isUseCaseEnabled={isUseCaseEnabled}
                    onUseCaseClick={handleUseCaseClick}
                />
            </div>
        </div>
    );
};

export default DeveloperGuideDomainsContent;
