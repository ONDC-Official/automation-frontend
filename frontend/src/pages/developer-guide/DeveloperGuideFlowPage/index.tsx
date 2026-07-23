import { FC, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Shadcn/Button";
import { ROUTES } from "@constants/routes";
import FlowInformation from "../FlowInformation";
import DocsViewer from "../DocsViewer";
import ErrorCodesTable from "../ErrorCodesTable";
// import ChangelogView from "../ChangelogView";
import { useDeveloperGuideNav } from "../layout/DeveloperGuideNav";
import GuideContentSkeleton from "../shared/components/GuideContentSkeleton";
import GuideTabFade from "../shared/components/GuideTabFade";
import FlowPageHeader from "./FlowPageHeader";
import { useDeveloperGuideFlowPageData } from "./useDeveloperGuideFlowPageData";
import type { TopLevelView } from "./types";

const DeveloperGuideFlowPage: FC = () => {
    const navigate = useNavigate();
    const { inShell } = useDeveloperGuideNav();

    const {
        domainKey,
        versionKey,
        slug,
        activeView,
        handleViewChange,
        selectedFlow,
        setSelectedFlow,
        selectedFlowAction,
        setSelectedFlowAction,
        specData,
        isLoading,
        notFound,
        flows,
        errorCodes,
        hasErrorCodes,
        // lazyChangelog,
        // changelogLoading,
        apiUsecase,
    } = useDeveloperGuideFlowPageData();

    const handleBack = () => navigate(ROUTES.DEVELOPER_GUIDE);

    const tabOrder = useMemo(() => {
        const order: TopLevelView[] = ["docs", "flows"];
        if (hasErrorCodes) order.push("error-codes");
        return order;
    }, [hasErrorCodes]);

    if (isLoading) {
        return <GuideContentSkeleton />;
    }

    if (notFound || !domainKey || !versionKey || !slug) {
        return (
            <div
                className={`flex flex-col items-center justify-center bg-white dark:bg-surface-page px-6 ${
                    inShell ? "min-h-[40vh]" : "min-h-screen"
                }`}
            >
                <p className="text-gray-600 mb-4">
                    This use case couldn&apos;t be loaded for this domain/version.
                </p>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBack}
                    className="px-4 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 text-sm font-medium"
                >
                    Back to Developer Guide
                </Button>
            </div>
        );
    }

    const docs = specData?.["x-docs"];
    const isDocsEmpty = !docs || Object.keys(docs).length === 0;

    return (
        <div
            className={`relative bg-white dark:bg-surface-page flex flex-col ${inShell ? "min-h-0" : "min-h-screen"}`}
        >
            <FlowPageHeader
                activeView={activeView}
                hasErrorCodes={hasErrorCodes}
                errorCodesCount={errorCodes?.code.length}
                onViewChange={handleViewChange}
            />

            <div className="grow flex items-start gap-0 relative">
                <GuideTabFade
                    activeKey={activeView}
                    tabOrder={tabOrder}
                    className="flex min-w-0 flex-1 items-start"
                >
                    {activeView === "flows" ? (
                        <div className="flex-1 min-w-0 px-4">
                            {specData && flows.length > 0 ? (
                                <FlowInformation
                                    data={specData}
                                    flows={flows}
                                    selectedFlow={selectedFlow}
                                    setSelectedFlow={setSelectedFlow}
                                    selectedFlowAction={selectedFlowAction}
                                    setSelectedFlowAction={setSelectedFlowAction}
                                    domain={domainKey}
                                    version={versionKey}
                                />
                            ) : (
                                <div className="w-full flex items-center justify-center min-h-[50vh]">
                                    <p className="text-slate-500 font-medium">
                                        No flows available for this use case.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 min-w-0 p-4 w-full">
                            {activeView === "error-codes" &&
                                (hasErrorCodes && errorCodes ? (
                                    <ErrorCodesTable errorCodes={errorCodes} />
                                ) : (
                                    <p className="text-slate-500 text-center py-12">
                                        No error codes available.
                                    </p>
                                ))}
                            {activeView === "docs" &&
                                (isDocsEmpty ? (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 dark:bg-surface-muted py-12 text-center">
                                        <p className="text-sm text-slate-400">
                                            No documentation available.
                                        </p>
                                    </div>
                                ) : (
                                    <DocsViewer
                                        docs={docs}
                                        useCaseId={apiUsecase ?? slug}
                                        domain={domainKey}
                                        version={versionKey}
                                    />
                                ))}
                            {/* {activeView === "changelog" &&
                            (changelogLoading ? null : (
                                <ChangelogView changelogs={lazyChangelog || []} />
                            ))} */}
                        </div>
                    )}
                </GuideTabFade>
            </div>
        </div>
    );
};

export default DeveloperGuideFlowPage;
