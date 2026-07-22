import { type FC, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import FlowDetailsAndSummary from "../FlowDetailsAndSummary";
import FlowContextStrip from "./FlowContextStrip";
import { FlowActionDetails } from "../flowActionDetails";
import Spinner from "@components/Shadcn/Spinner";
import ValidationsTable from "../ValidationsTable";
import { RequestTab, ResponseTab } from "../RequestResponseTabs";
import DetailTabsHeader from "./DetailTabsHeader";
import ExampleSelector from "./ExampleSelector";
import { useFlowDetailSection } from "./useFlowDetailSection";
import { useValidationTable } from "./useValidationTable";
import { useSelectedFlowStep } from "./useSelectedFlowStep";
import FlowsSidebar from "./FlowsSidebar";
import type { FlowInformationProps } from "./types";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { Button } from "@components/Shadcn/Button";
import { cn } from "@/lib/utils";

const FlowInformation: FC<FlowInformationProps> = ({
    data,
    flows,
    selectedFlow,
    setSelectedFlow,
    selectedFlowAction,
    setSelectedFlowAction,
    domain,
    version,
}) => {
    const validationTable = useValidationTable(domain, version);

    const [selectedExampleIndex, setSelectedExampleIndex] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    // Portaled to body (or the browser fullscreen element) so ancestor transforms — e.g.
    // PageReveal's `page-reveal-child` — cannot turn `position: fixed` into a content-area-
    // relative overlay. Same pattern as AppJsonViewer / LoadingOverlay.
    const [portalTarget, setPortalTarget] = useState<Element>(
        () => document.fullscreenElement ?? document.body
    );

    const isEmpty = !selectedFlow;
    const {
        selectedFlowData,
        selectedStep,
        examples,
        examplePayload,
        hasExampleObject,
        selectedValidations,
        hasXValidations,
        hasTabs,
    } = useSelectedFlowStep(
        flows,
        selectedFlow,
        selectedFlowAction,
        selectedExampleIndex,
        validationTable
    );

    const resetExampleIndex = useCallback(() => setSelectedExampleIndex(0), []);

    const { activeSection, showPreviewDetails, handleSectionChange } = useFlowDetailSection({
        selectedFlowAction,
        hasExampleObject,
        hasStep: !!selectedStep,
        hasXValidations,
        onSectionReset: resetExampleIndex,
    });

    const toggleFullscreen = useCallback(() => setIsFullscreen((v) => !v), []);

    useEffect(() => {
        if (!isFullscreen) return;
        const update = () => setPortalTarget(document.fullscreenElement ?? document.body);
        update();
        document.addEventListener("fullscreenchange", update);
        return () => document.removeEventListener("fullscreenchange", update);
    }, [isFullscreen]);

    useEffect(() => {
        if (!isFullscreen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsFullscreen(false);
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [isFullscreen]);

    // Leave fullscreen when the selected action changes so the overlay doesn't outlive its content.
    useEffect(() => {
        setIsFullscreen(false);
    }, [selectedFlowAction]);

    if (isEmpty) {
        return (
            <div className="flex flex-col items-center justify-center min-h-120 text-center px-8 py-16">
                <div className="rounded-2xl bg-slate-100 p-10 mb-6 ring-1 ring-slate-200/50">
                    <svg
                        className="mx-auto h-14 w-14 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.25}
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">No flow selected</h2>
                <p className="text-slate-600 text-sm max-w-md leading-relaxed">
                    Select a flow from the sidebar, then choose an action to view its documentation,
                    example payload, and schema validations.
                </p>
            </div>
        );
    }

    const hasSelectedAction = !!(selectedFlowAction && selectedStep);

    const detailPane = selectedFlowAction && selectedStep && (
        <div
            className={cn(
                "flex flex-col min-h-0",
                isFullscreen ? "h-full w-full" : "flex-1 min-w-0 pl-4"
            )}
        >
            {selectedFlowData && (
                <FlowContextStrip
                    flow={selectedFlowData}
                    action={selectedFlowAction}
                    actionLabel={selectedStep?.action_label ?? selectedStep?.api}
                    sidebarOpen={sidebarOpen}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={toggleFullscreen}
                />
            )}

            <DetailTabsHeader
                activeSection={activeSection}
                onChange={handleSectionChange}
                hasExampleObject={hasExampleObject}
                hasStep={!!selectedStep}
                hasXValidations={hasXValidations}
            />

            <div className="flex-1 min-h-0 flex flex-col mt-4">
                {activeSection === "preview" && hasExampleObject && (
                    <div className="flex-1 min-h-0 flex flex-col gap-3">
                        {examples.length > 1 && (
                            <ExampleSelector
                                examples={examples}
                                selectedIndex={selectedExampleIndex}
                                onChange={setSelectedExampleIndex}
                            />
                        )}
                        <div className="flex-1 min-h-0">
                            {showPreviewDetails ? (
                                <FlowActionDetails
                                    exampleValue={examplePayload as object}
                                    actionApi={selectedFlowAction}
                                    stepApi={selectedStep.api}
                                    spec={data}
                                    useCaseId={selectedFlowData?.usecase}
                                    flowId={selectedFlowData?.flowId ?? selectedFlow}
                                    domain={domain}
                                    version={version}
                                    validationTableData={validationTable}
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <Spinner className="size-8 text-brand-normal" />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeSection === "request" && selectedStep && (
                    <RequestTab spec={data} api={selectedStep.api ?? selectedFlowAction} />
                )}

                {activeSection === "response" && selectedStep && (
                    <ResponseTab spec={data} api={selectedStep.api ?? selectedFlowAction} />
                )}

                {activeSection === "x-validations" && hasXValidations && selectedValidations && (
                    <ValidationsTable validations={selectedValidations} />
                )}
            </div>
        </div>
    );

    return (
        <div className="mt-4 space-y-0 w-full">
            {selectedFlowData && !hasSelectedAction && (
                <div className="mb-6">
                    <FlowDetailsAndSummary flow={selectedFlowData} />
                </div>
            )}

            {selectedFlowAction && selectedStep && (
                <>
                    {/* <div className="mb-10">
                        <ActionOverview step={selectedStep} actionId={selectedFlowAction} />
                    </div> */}

                    {hasTabs && (
                        <div className="border-t border-slate-200 dark:border-border-default">
                            <div className="relative flex items-start gap-0 mt-4 mb-4">
                                {/* Left pane: flows accordion/sidebar — fixed across tab changes */}
                                {!isFullscreen && (
                                    <>
                                        <FlowsSidebar
                                            flows={flows}
                                            selectedFlow={selectedFlow}
                                            setSelectedFlow={setSelectedFlow}
                                            selectedFlowAction={selectedFlowAction}
                                            setSelectedFlowAction={setSelectedFlowAction}
                                            sidebarOpen={sidebarOpen}
                                        />

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setSidebarOpen((prev) => !prev)}
                                            title={
                                                sidebarOpen ? "Collapse sidebar" : "Expand sidebar"
                                            }
                                            className={`absolute top-4 z-20 -translate-x-1/2 flex items-center justify-center w-5 h-9 rounded-full bg-white dark:bg-surface-elevated border border-slate-200 dark:border-border-default shadow-sm hover:bg-slate-50 dark:hover:bg-surface-muted transition-[left] duration-300 ease-in-out motion-reduce:transition-none ${
                                                sidebarOpen ? "left-96" : "left-0"
                                            }`}
                                        >
                                            <ChevronLeftIcon
                                                className={`w-3 h-3 text-slate-400 transition-transform duration-300 ease-in-out motion-reduce:transition-none ${
                                                    sidebarOpen ? "" : "rotate-180"
                                                }`}
                                            />
                                        </Button>
                                    </>
                                )}

                                {/* Right pane: title/badge + section tabs + content */}
                                {isFullscreen
                                    ? createPortal(
                                          <div
                                              data-reveal-skip
                                              className="fixed inset-0 z-50 bg-white dark:bg-surface-page flex flex-col p-4 md:p-6 overflow-hidden"
                                          >
                                              {detailPane}
                                          </div>,
                                          portalTarget
                                      )
                                    : detailPane}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default FlowInformation;
