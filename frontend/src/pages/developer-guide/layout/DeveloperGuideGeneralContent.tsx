import { FC, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DocumentTextIcon, KeyIcon, Square3Stack3DIcon } from "@heroicons/react/24/outline";
import { ROUTES, getDeveloperGuideDocPath } from "@constants/routes";
import { useDeveloperGuideShell } from "./DeveloperGuideShellContext";
import DeveloperGuideGuideCard from "./DeveloperGuideGuideCard";
import { sortDocsByPreferredSequence } from "../utils";

const DeveloperGuideGeneralContent: FC = () => {
    const navigate = useNavigate();
    const { docs } = useDeveloperGuideShell();
    const sortedDocs = sortDocsByPreferredSequence(docs);

    const guideCards = useMemo(() => {
        const docCards = sortedDocs.map((doc) => ({
            id: doc.slug,
            title: doc.label,
            subtitle: "Documentation",
            description:
                doc.shortDescription ||
                "Read the guide for concepts, conventions, and integration details.",
            icon: <DocumentTextIcon className="h-5 w-5 text-brand-normal" aria-hidden />,
            onClick: () => navigate(getDeveloperGuideDocPath(doc.slug)),
        }));

        const authToolsCard = {
            id: "auth-tools",
            title: "Auth Tools",
            subtitle: "Authorization",
            description:
                "Generate and validate authorization headers using Blake2b and Ed25519 signing.",
            icon: <KeyIcon className="h-5 w-5 text-brand-normal" aria-hidden />,
            onClick: () => navigate(ROUTES.DEVELOPER_GUIDE_AUTH_TOOLS),
        };

        return [...docCards.slice(0, 2), authToolsCard, ...docCards.slice(2)];
    }, [navigate, sortedDocs]);

    return (
        <div className="min-h-full bg-white dark:bg-surface-page">
            <header className="border-b border-n-40 bg-white dark:border-n-60 dark:bg-surface-elevated">
                <div className="px-10 py-10 md:px-12 md:py-12">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-n-40 bg-brand-light px-3 py-1.5 text-caption-2-size font-semibold uppercase tracking-widest text-brand-normal dark:border-n-60 dark:bg-brand-normal/10">
                        <Square3Stack3DIcon className="h-2.75 w-2.75" aria-hidden />
                        General documentation
                    </div>
                    <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-n-900 dark:text-n-0 md:text-4xl">
                        Guides &amp; <span className="text-brand-normal">reference</span>
                    </h1>
                    <p className="max-w-2xl text-body-1 leading-relaxed text-n-300 dark:text-n-60">
                        Core concepts and tools for ONDC integration — authentication helpers,
                        network fundamentals, and shared documentation.
                    </p>
                </div>
            </header>

            <div className="px-10 py-10 md:px-12 md:py-12">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
                    {guideCards.map((card) => (
                        <DeveloperGuideGuideCard
                            key={card.id}
                            title={card.title}
                            subtitle={card.subtitle}
                            description={card.description}
                            icon={card.icon}
                            onClick={card.onClick}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DeveloperGuideGeneralContent;
