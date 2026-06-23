import { type FC, type ReactNode } from "react";
import GuidePageHeader from "../shared/components/GuidePageHeader";
import GuideTabs, { type GuideTabItem } from "../shared/components/GuideTabs";
import type { TopLevelView } from "./types";

interface FlowPageHeaderProps {
    activeView: TopLevelView;
    hasErrorCodes: boolean;
    hasSupportedActions: boolean;
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
                title: "Documents",
                description: "Reference documentation for this use case.",
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
        case "supported-actions":
            return {
                title: "Actions",
                description: "Supported actions and their relationships for this use case.",
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
    hasSupportedActions,
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
                    { id: "docs", label: "Documents", visible: true },
                    { id: "flows", label: "Flows", visible: true },
                    { id: "error-codes", label: "Error Codes", visible: hasErrorCodes },
                    { id: "supported-actions", label: "Actions", visible: hasSupportedActions },
                    { id: "changelog", label: "Changelog", visible: true },
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
