import { type FC, useCallback, useState } from "react";
import FlowDetailsAndSummary from "../FlowDetailsAndSummary";
import FlowContextStrip from "./FlowContextStrip";
import ActionOverview from "../ActionOverview";
import { FlowActionDetails } from "../flowActionDetails";
import Spinner from "@/components/Shadcn/Spinner";
import ValidationsTable from "../ValidationsTable";
import { RequestTab, ResponseTab } from "../RequestResponseTabs";
import DetailTabsHeader from "./DetailTabsHeader";
import ExampleSelector from "./ExampleSelector";
import { useFlowDetailSection } from "./useFlowDetailSection";
import { useValidationTable } from "./useValidationTable";
import { useSelectedFlowStep } from "./useSelectedFlowStep";
import FlowsSidebar from "./FlowsSidebar";
import type { FlowInformationProps } from "./types";

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

    if (isEmpty) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[480px] text-center px-8 py-16">
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

    return (
        <div className="px-8 py-8 space-y-0 w-full">
            {selectedFlowData && !hasSelectedAction && (
                <div className="mb-6">
                    <FlowDetailsAndSummary flow={selectedFlowData} />
                </div>
            )}

            {hasSelectedAction && selectedFlowData && <FlowContextStrip flow={selectedFlowData} />}

            {selectedFlowAction && selectedStep && (
                <>
                    <div className="mb-10">
                        <ActionOverview step={selectedStep} actionId={selectedFlowAction} />
                    </div>

                    {hasTabs && (
                        <div className="border-t border-slate-200 pt-8">
                            <DetailTabsHeader
                                activeSection={activeSection}
                                onChange={handleSectionChange}
                                hasExampleObject={hasExampleObject}
                                hasStep={!!selectedStep}
                                hasXValidations={hasXValidations}
                            />

                            <div className="flex items-stretch gap-0 mt-6 bg-slate-100 ">
                                {activeSection === "preview" && (
                                    <FlowsSidebar
                                        flows={flows}
                                        selectedFlow={selectedFlow}
                                        setSelectedFlow={setSelectedFlow}
                                        selectedFlowAction={selectedFlowAction}
                                        setSelectedFlowAction={setSelectedFlowAction}
                                        sidebarOpen={sidebarOpen}
                                        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
                                    />
                                )}

                                <div className="flex-1 min-w-0 px-4 relative">
                                    {activeSection === "preview" && hasExampleObject && (
                                        <div className="flex flex-col gap-4">
                                            {examples.length > 1 && (
                                                <ExampleSelector
                                                    examples={examples}
                                                    selectedIndex={selectedExampleIndex}
                                                    onChange={setSelectedExampleIndex}
                                                />
                                            )}
                                            <div className="w-full min-h-0 overflow-hidden shadow-xs bg-white dark:bg-surface-elevated">
                                                {showPreviewDetails ? (
                                                    <FlowActionDetails
                                                        exampleValue={examplePayload as object}
                                                        actionApi={selectedFlowAction}
                                                        stepApi={selectedStep.api}
                                                        spec={data}
                                                        useCaseId={selectedFlowData?.usecase}
                                                        flowId={
                                                            selectedFlowData?.flowId ?? selectedFlow
                                                        }
                                                        validationTableData={validationTable}
                                                    />
                                                ) : (
                                                    <div className="absolute top-0 bottom-0 left-0 right-0  flex items-center justify-center">
                                                        <Spinner className="size-8 text-brand-normal" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeSection === "request" && selectedStep && (
                                        <RequestTab
                                            spec={data}
                                            api={selectedStep.api ?? selectedFlowAction}
                                        />
                                    )}

                                    {activeSection === "response" && selectedStep && (
                                        <ResponseTab
                                            spec={data}
                                            api={selectedStep.api ?? selectedFlowAction}
                                        />
                                    )}

                                    {activeSection === "x-validations" &&
                                        hasXValidations &&
                                        selectedValidations && (
                                            <ValidationsTable validations={selectedValidations} />
                                        )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default FlowInformation;
