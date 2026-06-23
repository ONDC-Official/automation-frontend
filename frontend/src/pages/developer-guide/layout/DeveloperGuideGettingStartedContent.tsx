import { FC, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import gettingStartedContent from "../landing/getting-started.md?raw";
import MdFileRender from "@components/MdFileRender";
import { scrollToSectionWithOffset } from "@components/TableOfContents/scrollToSection";

// Matches the sticky header offset used by the sibling doc content view (DeveloperGuideDocContent).
const TOC_TOP = 100;

const DeveloperGuideGettingStartedContent: FC = () => {
    const { hash } = useLocation();

    const mdData = useMemo(() => gettingStartedContent.replace(/^#\s+.+\n+/, ""), []);

    useEffect(() => {
        if (!hash) return;
        const id = hash.slice(1);
        const frame = requestAnimationFrame(() => {
            scrollToSectionWithOffset(id, TOC_TOP);
        });
        return () => cancelAnimationFrame(frame);
    }, [hash]);

    return (
        <div className="px-4 py-6 md:px-8 md:py-8">
            <MdFileRender
                variant="guide"
                title="Getting Started"
                description="This section helps you quickly understand how to explore ONDC protocol flows, starting with the Unified Credit use case."
                mdData={mdData}
                showTableOfContents={false}
            />
        </div>
    );
};

export default DeveloperGuideGettingStartedContent;
