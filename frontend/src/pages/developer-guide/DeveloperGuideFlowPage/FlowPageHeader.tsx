import { type FC, type ReactNode } from "react";
import GuidePageHeader from "../shared/components/GuidePageHeader";
import GuideTabs, { type GuideTabItem } from "../shared/components/GuideTabs";
import { VIEW_LABEL, type TopLevelView } from "./types";

interface FlowPageHeaderProps {
    activeView: TopLevelView;
    hasErrorCodes: boolean;
    errorCodesCount?: number;
    onViewChange: (view: TopLevelView) => void;
}

/** Title/description shown above the tab strip for every top-level view. */
function getPageTitle(
    activeView: TopLevelView,
    errorCodesCount?: number
): { title: string; description: ReactNode } | null {
    switch (activeView) {
        case "docs":
            return {
                title: VIEW_LABEL.docs,
                description: "Understand the product and use case before exploring flows.",
            };
        case "flows":
            return {
                title: "Flows",
                description: "Browse and test the flows for this use case.",
            };
        case "error-codes":
            return {
                title: "Error Codes",
                description:
                    errorCodesCount != null
                        ? `${errorCodesCount} error code${errorCodesCount === 1 ? "" : "s"}`
                        : "Error codes for this use case.",
            };
        case "changelog":
            return {
                title: "Changelog",
                description: "What changed across spec versions for this use case.",
            };
        default:
            return null;
    }
}

const FlowPageHeader: FC<FlowPageHeaderProps> = ({
    activeView,
    hasErrorCodes,
    errorCodesCount,
    onViewChange,
}) => {
    const pageTitle = getPageTitle(activeView, errorCodesCount);

    const tabs = (
        <GuideTabs<TopLevelView>
            active={activeView}
            onChange={onViewChange}
            tabs={
                [
                    { id: "docs", label: VIEW_LABEL.docs, visible: true },
                    { id: "flows", label: "Flows", visible: true },
                    { id: "error-codes", label: "Error Codes", visible: hasErrorCodes },
                    // { id: "changelog", label: "Changelog", visible: true },
                ] satisfies GuideTabItem<TopLevelView>[]
            }
        />
    );

    return (
        <GuidePageHeader
            title={pageTitle?.title}
            description={pageTitle?.description}
            tabs={tabs}
        />
    );
};

export default FlowPageHeader;
