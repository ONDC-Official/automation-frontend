import { FC, useMemo, useState, useEffect } from "react";
import { FiCode, FiShield, FiUpload, FiDownload } from "react-icons/fi";
import { SegmentedTabs, type TabItem } from "@components/ui/SegmentedTabs";
import { OpenAPISpecification } from "./types";
import type { FlowStep } from "./types";
import { getActionId } from "./utils";
import FlowDetailsAndSummary from "./FlowDetailsAndSummary";
import ActionOverview from "./ActionOverview";
import { FlowActionDetails } from "./flowActionDetails";
import Loader from "@components/ui/mini-components/loader";
import ValidationsTable, { type ValidationTable } from "./ValidationsTable";
import rawValidations from "./raw_table.json";
import { RequestTab, ResponseTab } from "./RequestResponseTabs";

interface FlowInformationProps {
    data: OpenAPISpecification;
    selectedFlow: string;
    selectedFlowAction: string;
}

function getExamplesFromStep(
    step: FlowStep | undefined
): Array<{ name: string; payload: unknown }> {
    if (!step) return [];
    const fromStep = step.examples?.map((ex) => ({
        name: ex.name ?? ex.description ?? "Example",
        payload: ex.payload,
    }));
    if (fromStep && fromStep.length > 0) return fromStep;
    const fromMock = step.mock?.examples?.map((ex) => ({
        name: ex.name ?? ex.description ?? "Example",
        payload: ex.payload,
    }));
    if (fromMock && fromMock.length > 0) return fromMock;
    if (step.example?.value != null)
        return [
            {
                name: (step.example as { summary?: string }).summary ?? "Example",
                payload: step.example.value,
            },
        ];
    return [];
}

const FlowInformation: FC<FlowInformationProps> = ({ data, selectedFlow, selectedFlowAction }) => {
    const [selectedExampleIndex, setSelectedExampleIndex] = useState(0);
    type Section = "preview" | "x-validations" | "request" | "response";
    const [activeSection, setActiveSection] = useState<Section>("preview");
    const [showPreviewDetails, setShowPreviewDetails] = useState(false);

    const isEmpty = !selectedFlow;

    const flows = data["x-flows"] || [];

    const selectedFlowData = flows.find(
        (flow) => flow.meta?.flowId === selectedFlow || flow.summary === selectedFlow
    );
    const selectedStep = selectedFlowData?.steps.find((s) => getActionId(s) === selectedFlowAction);
    const examples = useMemo(() => getExamplesFromStep(selectedStep), [selectedStep]);
    const selectedExample = examples[selectedExampleIndex] ?? examples[0];
    const examplePayload = selectedExample?.payload;
    const hasExampleObject =
        examplePayload != null &&
        typeof examplePayload === "object" &&
        !Array.isArray(examplePayload);

    const apiForValidations = selectedStep?.api ?? selectedFlowAction;
    const selectedValidations: ValidationTable | undefined = useMemo(
        () => (rawValidations as Record<string, ValidationTable>)[apiForValidations],
        [apiForValidations]
    );
    const hasXValidations = !!selectedValidations;
    const hasTabs = hasExampleObject || hasXValidations || !!selectedStep;

    useEffect(() => {
        // Reset tab state when action changes
        const defaultSection: Section = hasExampleObject
            ? "preview"
            : selectedStep
              ? "request"
              : "x-validations";
        setActiveSection(defaultSection);
        setSelectedExampleIndex(0);
        if (defaultSection === "preview") {
            setShowPreviewDetails(false);
            setTimeout(() => setShowPreviewDetails(true), 0);
        } else {
            setShowPreviewDetails(false);
        }
    }, [selectedFlowAction]);

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

    const handleSectionChange = (section: Section) => {
        setActiveSection(section);
        if (section === "preview") {
            setShowPreviewDetails(false);
            setTimeout(() => setShowPreviewDetails(true), 0);
        }
        if (section !== "preview") {
            setShowPreviewDetails(false);
        }
    };

    return (
        <div className="px-8 py-8 space-y-0 w-full">
            {/* ── Always-visible Overview ── */}
            {selectedFlowData && (
                <div className="mb-8">
                    <FlowDetailsAndSummary flow={selectedFlowData} />
                </div>
            )}

            {selectedFlowAction && selectedStep && (
                <>
                    {/* Action card — always visible */}
                    <div className="mb-10">
                        <ActionOverview step={selectedStep} actionId={selectedFlowAction} />
                    </div>

                    {/* ── Detail tabs section ── */}
                    {hasTabs && (
                        <div className="border-t border-slate-200 pt-8">
                            {/* Section heading */}
                            <div className="flex items-end justify-between mb-5">
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
                                        Details
                                    </p>
                                    <h3 className="text-lg font-semibold text-slate-800">
                                        {activeSection === "preview"
                                            ? "Examples & Schema"
                                            : activeSection === "request"
                                              ? "Request"
                                              : activeSection === "response"
                                                ? "Response"
                                                : "Validations"}
                                    </h3>
                                </div>
                                <SegmentedTabs<Section>
                                    active={activeSection}
                                    onChange={handleSectionChange}
                                    tabs={
                                        [
                                            {
                                                id: "preview",
                                                label: "Attribute Explorer",
                                                icon: FiCode,
                                                visible: hasExampleObject,
                                            },
                                            {
                                                id: "request",
                                                label: "Request Model",
                                                icon: FiUpload,
                                                visible: !!selectedStep,
                                            },
                                            {
                                                id: "response",
                                                label: "Response Model",
                                                icon: FiDownload,
                                                visible: !!selectedStep,
                                            },
                                            {
                                                id: "x-validations",
                                                label: "Validations",
                                                icon: FiShield,
                                                visible: hasXValidations,
                                            },
                                        ] satisfies TabItem<Section>[]
                                    }
                                />
                            </div>

                            {/* Preview tab content */}
                            {activeSection === "preview" && hasExampleObject && (
                                <div className="flex flex-col gap-4">
                                    {examples.length > 1 && (
                                        <div className="flex items-center gap-3">
                                            <label
                                                htmlFor="example-select"
                                                className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0"
                                            >
                                                Example
                                            </label>
                                            <div className="relative w-full max-w-xs">
                                                <select
                                                    id="example-select"
                                                    value={selectedExampleIndex}
                                                    onChange={(e) =>
                                                        setSelectedExampleIndex(
                                                            Number(e.target.value)
                                                        )
                                                    }
                                                    className="w-full pl-4 pr-9 py-2 rounded-lg text-sm border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300 appearance-none shadow-sm"
                                                >
                                                    {examples.map((ex, i) => (
                                                        <option key={i} value={i}>
                                                            {ex.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                                    <svg
                                                        className="w-4 h-4 text-slate-400"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M19 9l-7 7-7-7"
                                                        />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="w-full h-[700px] min-h-0 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                                        {showPreviewDetails ? (
                                            <FlowActionDetails
                                                exampleValue={examplePayload as object}
                                                actionApi={selectedFlowAction}
                                                stepApi={selectedStep.api}
                                                spec={data}
                                                useCaseId={
                                                    selectedFlowData?.useCaseId ??
                                                    selectedFlowData?.meta?.use_case_id
                                                }
                                                flowId={
                                                    selectedFlowData?.meta?.flowId ?? selectedFlow
                                                }
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center">
                                                <Loader />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Request tab content */}
                            {activeSection === "request" && selectedStep && (
                                <RequestTab
                                    spec={data}
                                    api={selectedStep.api ?? selectedFlowAction}
                                />
                            )}

                            {/* Response tab content */}
                            {activeSection === "response" && selectedStep && (
                                <ResponseTab
                                    spec={data}
                                    api={selectedStep.api ?? selectedFlowAction}
                                />
                            )}

                            {/* Validations tab content */}
                            {activeSection === "x-validations" &&
                                hasXValidations &&
                                selectedValidations && (
                                    <ValidationsTable validations={selectedValidations} />
                                )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default FlowInformation;
