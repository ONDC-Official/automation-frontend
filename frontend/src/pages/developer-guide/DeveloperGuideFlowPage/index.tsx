import { FC } from "react";
import { useNavigate } from "react-router-dom";
import Spinner from "@/components/Shadcn/Spinner";
import { ROUTES } from "@constants/routes";
import FlowInformation from "../FlowInformation";
import DocsViewer from "../DocsViewer";
import ErrorCodesTable from "../ErrorCodesTable";
import SupportedActionsView from "../SupportedActionsView";
import ChangelogView from "../ChangelogView";
import { useDeveloperGuideShell } from "../layout/DeveloperGuideShellContext";
import FlowPageHeader from "./FlowPageHeader";
import { useDeveloperGuideFlowPageData } from "./useDeveloperGuideFlowPageData";

const DeveloperGuideFlowPage: FC = () => {
    const navigate = useNavigate();
    const { inShell } = useDeveloperGuideShell();

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
        supportedActions,
        hasErrorCodes,
        hasSupportedActions,
        lazyChangelog,
        changelogLoading,
    } = useDeveloperGuideFlowPageData();

    const handleBack = () => navigate(ROUTES.DEVELOPER_GUIDE);

    if (isLoading) {
        return (
            <div
                className={`flex items-center justify-center bg-white dark:bg-surface-page ${inShell ? "min-h-[40vh]" : "min-h-screen"}`}
            >
                <Spinner className="size-8 text-brand-normal" />
            </div>
        );
    }

    if (notFound || !domainKey || !versionKey || !slug) {
        return (
            <div
                className={`flex flex-col items-center justify-center bg-white dark:bg-surface-page px-6 ${
                    inShell ? "min-h-[40vh]" : "min-h-screen"
                }`}
            >
                <p className="text-gray-600 mb-4">Use case not found for this domain/version.</p>
                <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 text-sm font-medium"
                >
                    Back to Developer Guide
                </button>
            </div>
        );
    }

    const docs = specData?.["x-docs"];
    const isDocsEmpty = !docs || Object.keys(docs).length === 0;

    return (
        <div
            className={`relative bg-white dark:bg-surface-page flex flex-col ${inShell ? "min-h-0" : "min-h-screen top-4"}`}
        >
            <FlowPageHeader
                activeView={activeView}
                hasErrorCodes={hasErrorCodes}
                hasSupportedActions={hasSupportedActions}
                errorCodesCount={errorCodes?.code.length}
                onViewChange={handleViewChange}
            />

            <div className="grow flex items-start gap-0 relative">
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
                        {activeView === "supported-actions" &&
                            (hasSupportedActions && supportedActions ? (
                                <SupportedActionsView supportedActions={supportedActions} />
                            ) : (
                                <p className="text-slate-500 text-center py-12">
                                    No actions available.
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
                                <DocsViewer docs={docs} />
                            ))}
                        {activeView === "changelog" &&
                            (changelogLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Spinner className="size-8 text-brand-normal" />
                                </div>
                            ) : (
                                <ChangelogView changelogs={lazyChangelog || []} />
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeveloperGuideFlowPage;
