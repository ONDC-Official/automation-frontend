import { FC, useMemo, useState, useEffect } from "react";
import { OpenAPISpecification } from "./types";
import type { FlowStep } from "./types";
import { getActionId } from "./utils";
import FlowDetailsAndSummary from "./FlowDetailsAndSummary";
import { FlowActionDetails } from "./flowActionDetails";
import HelperSection, { decodeHelperLib } from "./HelperSection";
import GenerateSection, { decodeMockGenerate } from "./GenerateSection";
import ValidateSection, { decodeMockValidate } from "./ValidateSection";
import RequirementsSection, { decodeMockRequirements } from "./RequirementsSection";

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
    const [activeSection, setActiveSection] = useState<
        "overview" | "preview" | "helper" | "generate" | "validate" | "requirements"
    >("overview");

    useEffect(() => {
        setActiveSection("overview");
    }, [selectedFlowAction]);

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

    const decodedHelperCode = useMemo(
        () => decodeHelperLib(selectedFlowData?.helperLib),
        [selectedFlowData?.helperLib]
    );
    const hasHelper = !!decodedHelperCode;

    const decodedGenerateCode = useMemo(
        () => decodeMockGenerate(selectedStep?.mock?.generate),
        [selectedStep?.mock?.generate]
    );
    const hasGenerate = !!decodedGenerateCode;

    const decodedValidateCode = useMemo(
        () => decodeMockValidate(selectedStep?.mock?.validate),
        [selectedStep?.mock?.validate]
    );
    const hasValidate = !!decodedValidateCode;

    const decodedRequirementsCode = useMemo(
        () => decodeMockRequirements(selectedStep?.mock?.requirements),
        [selectedStep?.mock?.requirements]
    );
    const hasRequirements = !!decodedRequirementsCode;

    useEffect(() => {
        setSelectedExampleIndex(0);
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

    return (
        <div className="p-6 space-y-10">
            {selectedFlowAction && selectedStep && (
                <>
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm mb-6">
                        <button
                            onClick={() => setActiveSection("overview")}
                            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                                activeSection === "overview"
                                    ? "bg-sky-600 text-white hover:bg-sky-700"
                                    : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                            }`}
                        >
                            Overview
                        </button>
                        {hasExampleObject && (
                            <button
                                onClick={() => setActiveSection("preview")}
                                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                                    activeSection === "preview"
                                        ? "bg-sky-600 text-white hover:bg-sky-700"
                                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                                }`}
                            >
                                Guide
                            </button>
                        )}
                        {hasHelper && (
                            <button
                                onClick={() => setActiveSection("helper")}
                                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                                    activeSection === "helper"
                                        ? "bg-sky-600 text-white hover:bg-sky-700"
                                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                                }`}
                            >
                                Helper
                            </button>
                        )}
                        {hasGenerate && (
                            <button
                                onClick={() => setActiveSection("generate")}
                                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                                    activeSection === "generate"
                                        ? "bg-sky-600 text-white hover:bg-sky-700"
                                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                                }`}
                            >
                                Generate
                            </button>
                        )}
                        {hasValidate && (
                            <button
                                onClick={() => setActiveSection("validate")}
                                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                                    activeSection === "validate"
                                        ? "bg-sky-600 text-white hover:bg-sky-700"
                                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                                }`}
                            >
                                Validate
                            </button>
                        )}
                        {hasRequirements && (
                            <button
                                onClick={() => setActiveSection("requirements")}
                                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                                    activeSection === "requirements"
                                        ? "bg-sky-600 text-white hover:bg-sky-700"
                                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                                }`}
                            >
                                Requirements
                            </button>
                        )}
                    </nav>

                    <section className="flex gap-8 items-start">
                        {/* Overview section */}
                        {activeSection === "overview" && (
                            <div className="flex-1 space-y-6">
                                {selectedFlowData && (
                                    <FlowDetailsAndSummary flow={selectedFlowData} />
                                )}
                                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                            Action
                                        </span>
                                    </div>
                                    <div className="px-6 py-5">
                                        <p className="text-base font-semibold text-slate-900 font-mono">
                                            {selectedStep.api}
                                        </p>
                                        {(selectedStep.description ?? selectedStep.summary) && (
                                            <p className="text-sm text-slate-600 mt-2 leading-relaxed mb-0">
                                                {selectedStep.description ?? selectedStep.summary}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Preview section */}
                        {activeSection === "preview" && hasExampleObject && (
                            <div className=" w-full flex flex-col gap-4">
                                {examples.length > 0 && (
                                    <div className="flex flex-col gap-2">
                                        <label
                                            htmlFor="example-select"
                                            className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
                                        >
                                            Examples
                                        </label>
                                        <div className="relative w-full max-w-sm">
                                            <select
                                                id="example-select"
                                                value={selectedExampleIndex}
                                                onChange={(e) =>
                                                    setSelectedExampleIndex(Number(e.target.value))
                                                }
                                                className="w-full px-4 py-2.5  rounded-lg text-sm border border-slate-200 bg-white text-slate-800 focus:outline-none appearance-none"
                                            >
                                                {examples.map((ex, i) => (
                                                    <option key={i} value={i}>
                                                        {ex.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                                <svg
                                                    className="w-4 h-4 text-slate-700"
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
                                <div className="flex flex-col">
                                    <div className="w-full h-[540px] min-h-0 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                                        <FlowActionDetails
                                            exampleValue={examplePayload as object}
                                            actionApi={selectedFlowAction}
                                            stepApi={selectedStep.api}
                                            spec={data}
                                            useCaseId={
                                                selectedFlowData?.useCaseId ??
                                                selectedFlowData?.meta?.use_case_id
                                            }
                                            flowId={selectedFlowData?.meta?.flowId ?? selectedFlow}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Helper section */}
                        {activeSection === "helper" && hasHelper && decodedHelperCode && (
                            <HelperSection decodedCode={decodedHelperCode} />
                        )}

                        {/* Generate section */}
                        {activeSection === "generate" && hasGenerate && decodedGenerateCode && (
                            <GenerateSection decodedCode={decodedGenerateCode} />
                        )}

                        {/* Validate section */}
                        {activeSection === "validate" && hasValidate && decodedValidateCode && (
                            <ValidateSection decodedCode={decodedValidateCode} />
                        )}

                        {/* Requirements section */}
                        {activeSection === "requirements" &&
                            hasRequirements &&
                            decodedRequirementsCode && (
                                <RequirementsSection decodedCode={decodedRequirementsCode} />
                            )}
                    </section>
                </>
            )}
        </div>
    );
};

export default FlowInformation;
