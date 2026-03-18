import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCode, FiLayers, FiSearch } from "react-icons/fi";
import { fetchFormFieldData } from "@utils/request-utils";
import { ROUTES, getDeveloperGuideUseCasePath } from "@constants/routes";
import type { DomainItem, DomainResponse } from "@pages/home/types";
import { labelToSlug, isDomainEnabled } from "../utils";
import Loader from "@components/ui/mini-components/loader";
import RecommendedSection from "./RecommendedSection";
import DomainCardsSection from "./DomainCardsSection";

const DeveloperGuideLanding: FC = () => {
    const navigate = useNavigate();
    const [activeDomain, setActiveDomain] = useState<DomainResponse>({ domain: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [domainSearch, setDomainSearch] = useState("");

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetchFormFieldData();
                if (response && typeof response === "object" && "domain" in response) {
                    setActiveDomain(response as DomainResponse);
                } else {
                    setActiveDomain({ domain: [] });
                }
            } catch {
                setError("Unable to load domains. Please try again later.");
                setActiveDomain({ domain: [] });
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const isUseCaseEnabled = (dom: DomainItem, usecaseLabel: string) => {
        if (!isDomainEnabled(dom)) return false;
        return labelToSlug(usecaseLabel) === "unified_credit";
    };

    const handleUseCaseClick = (dom: DomainItem, versionKey: string, usecaseLabel: string) => {
        if (!isUseCaseEnabled(dom, usecaseLabel)) return;
        const slug = labelToSlug(usecaseLabel);
        const path = getDeveloperGuideUseCasePath(dom.key, versionKey, slug);
        navigate(path);
    };

    const handleGettingStartedClick = () => {
        navigate(ROUTES.DEVELOPER_GUIDE_GETTING_STARTED);
    };

    const handleAuthToolsClick = () => {
        navigate(ROUTES.AUTH_HEADER);
    };

    const filteredDomains = activeDomain.domain.filter((d) =>
        d.key.toLowerCase().includes(domainSearch.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* ── Hero ── */}
            <div className="bg-gradient-to-br from-sky-50 via-white to-slate-50 border-b border-sky-100">
                <div className="container mx-auto px-6 py-16">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-100 text-sky-700 rounded-full text-xs font-semibold uppercase tracking-widest mb-6 border border-sky-200">
                            <FiCode size={11} />
                            ONDC Developer Documentation
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
                            Build on <span className="text-sky-500">ONDC</span>
                        </h1>
                        <p className="text-base text-gray-600 leading-relaxed">
                            Everything you need to integrate with the Open Network for Digital
                            Commerce. Explore guides, authentication tools, and API references
                            organised by domain and use case.
                        </p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-12 space-y-14">
                {/* ── ONDC Guides ── */}
                <section>
                    <div className="flex items-center gap-3 mb-7">
                        <div className="w-8 h-8 rounded-lg bg-sky-100 border border-sky-200 flex items-center justify-center flex-shrink-0">
                            <FiCode size={15} className="text-sky-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 leading-none">
                                ONDC Guides
                            </h2>
                            <p className="text-xs text-gray-600 mt-0.5">
                                Start here to get up and running quickly
                            </p>
                        </div>
                    </div>
                    <RecommendedSection
                        onGettingStartedClick={handleGettingStartedClick}
                        onAuthToolsClick={handleAuthToolsClick}
                    />
                </section>

                {/* ── Divider ── */}
                <div className="border-t border-gray-100" />

                {/* ── Explore by Domain ── */}
                <section>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-sky-100 border border-sky-200 flex items-center justify-center flex-shrink-0">
                                <FiLayers size={15} className="text-sky-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 leading-none">
                                    Explore by Domain
                                </h2>
                                <p className="text-xs text-gray-600 mt-0.5">
                                    Select a use case to dive into flows and specs
                                </p>
                            </div>
                        </div>
                        {/* Search */}
                        <div className="relative">
                            <FiSearch
                                size={14}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-500 pointer-events-none transition-colors"
                            />
                            <input
                                type="text"
                                placeholder="Search domains…"
                                value={domainSearch}
                                onChange={(e) => setDomainSearch(e.target.value)}
                                className="w-full sm:w-64 pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 placeholder-slate-400 text-slate-800 font-medium shadow-sm transition-all duration-150"
                            />
                        </div>
                    </div>
                    <DomainCardsSection
                        domains={filteredDomains}
                        error={error}
                        isDomainEnabled={(dom) => isDomainEnabled(dom)}
                        isUseCaseEnabled={isUseCaseEnabled}
                        onUseCaseClick={handleUseCaseClick}
                    />
                </section>
            </div>
        </div>
    );
};

export default DeveloperGuideLanding;
