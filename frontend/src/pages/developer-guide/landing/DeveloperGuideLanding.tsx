import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchFormFieldData } from "@utils/request-utils";
import { ROUTES, getDeveloperGuideUseCasePath } from "@constants/routes";
import type { DomainItem, DomainResponse } from "@pages/home/types";
import { labelToSlug, isDomainEnabled } from "../utils";
import Loader from "@components/ui/mini-components/loader";
import DeveloperGuideHeader from "./DeveloperGuideHeader";
import RecommendedSection from "./RecommendedSection";
import DomainCardsSection from "./DomainCardsSection";
import AccordionSection from "./AccordionSection";

const DeveloperGuideLanding: FC = () => {
    const navigate = useNavigate();
    const [activeDomain, setActiveDomain] = useState<DomainResponse>({ domain: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50/30">
            <DeveloperGuideHeader />
            <div className="container mx-auto">
                <div className="py-6">
                    <AccordionSection title="Recommended" defaultOpen>
                        <RecommendedSection
                            onGettingStartedClick={handleGettingStartedClick}
                            onAuthToolsClick={handleAuthToolsClick}
                        />
                    </AccordionSection>

                    <AccordionSection title="Domains" defaultOpen>
                        <DomainCardsSection
                            domains={activeDomain.domain}
                            error={error}
                            isDomainEnabled={(dom) => isDomainEnabled(dom)}
                            isUseCaseEnabled={isUseCaseEnabled}
                            onUseCaseClick={handleUseCaseClick}
                        />
                    </AccordionSection>
                </div>
            </div>
        </div>
    );
};

export default DeveloperGuideLanding;
