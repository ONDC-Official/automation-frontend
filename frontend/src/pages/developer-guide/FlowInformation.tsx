import { FC, useMemo, useState, useEffect } from "react";
import { OpenAPISpecification } from "./types";
import type { FlowStep } from "./types";
import { getActionId } from "./utils";
import FlowDetailsAndSummary from "./FlowDetailsAndSummary";
import { FlowActionDetails } from "./flowActionDetails";

interface FlowInformationProps {
    data: OpenAPISpecification;
    selectedFlow: string;
    selectedFlowAction: string;
}

function getExamplesFromStep(
    step: FlowStep | undefined
): Array<{ name: string; payload: unknown }> {
    if (!step) return [];
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
                    Select a flow from the sidebar, then choose an action to view its documentation, example payload, and schema validations.
                </p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 space-y-10">
            {selectedFlowData && (
                <FlowDetailsAndSummary
                    flow={selectedFlowData}
                    selectedFlowAction={selectedFlowAction}
                />
            )}

            {selectedFlowAction && selectedStep && (
                <section className="flex flex-col space-y-6">
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                Step information
                            </span>
                        </div>
                        <div className="px-6 py-5">
                            <p className="text-base font-semibold text-slate-900 font-mono">
                                {selectedStep.api}
                            </p>
                            {(selectedStep.description ?? selectedStep.summary) && (
                                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                                    {selectedStep.description ?? selectedStep.summary}
                                </p>
                            )}
                        </div>
                    </div>

                    {examples.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="example-select"
                                className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
                            >
                                Example payloads
                            </label>
                            <select
                                id="example-select"
                                value={selectedExampleIndex}
                                onChange={(e) => setSelectedExampleIndex(Number(e.target.value))}
                                className="w-full max-w-sm px-4 py-2.5 rounded-lg text-sm border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                            >
                                {examples.map((ex, i) => (
                                    <option key={i} value={i}>
                                        {ex.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {hasExampleObject && (
                        <div className="flex flex-col">
                            <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                Payload & schema
                            </h2>
                            <p className="text-slate-600 text-sm mb-3 leading-relaxed">
                                Click a key in the JSON tree to see its attributes and validations in the right panel.
                            </p>
                            <div className="h-[540px] min-h-0 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                                <FlowActionDetails
                                    exampleValue={examplePayload as object}
                                    actionApi={selectedFlowAction}
                                    spec={data}
                                    useCaseId={
                                        selectedFlowData?.useCaseId ??
                                        selectedFlowData?.meta?.use_case_id
                                    }
                                    stepOwner={selectedStep.owner}
                                />
                            </div>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

export default FlowInformation;
