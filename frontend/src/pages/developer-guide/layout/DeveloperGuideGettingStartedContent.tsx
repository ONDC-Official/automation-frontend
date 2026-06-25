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
        <div className="p-4">
            <div className="shrink-0 flex gap-2 px-2 py-1 bg-alert-50 items-center mb-2">
                <span className="text-alert-500 text-[12px] font-semibold">Tip: </span>
                <span className="text-[12px] font-regular text-n-300">
                    Use Filter navigation in the sidebar to quickly find a domain, use case, or
                    documentation page.
                </span>
            </div>
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
