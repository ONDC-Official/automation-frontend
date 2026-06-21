import { useMemo } from "react";
import type { FlowEntry, ValidationTableAction } from "../types";
import { getActionId } from "../utils";
import { getExamplesFromStep } from "./utils";

/**
 * Resolves the currently-selected flow/step and the values derived from it
 * (examples, x-validations, whether the Details tabs should render at all).
 */
export function useSelectedFlowStep(
    flows: FlowEntry[],
    selectedFlow: string,
    selectedFlowAction: string,
    selectedExampleIndex: number,
    validationTable: Record<string, ValidationTableAction> | null
) {
    const selectedFlowData = flows.find((f) => f.flowId === selectedFlow);
    const steps = selectedFlowData?.config?.steps ?? [];
    const selectedStep = steps.find((s) => getActionId(s) === selectedFlowAction);
    const examples = useMemo(() => getExamplesFromStep(selectedStep), [selectedStep]);

    const selectedExample = examples[selectedExampleIndex] ?? examples[0];
    const examplePayload = selectedExample?.payload;
    const hasExampleObject =
        examplePayload != null &&
        typeof examplePayload === "object" &&
        !Array.isArray(examplePayload);

    const apiForValidations = selectedStep?.api ?? selectedFlowAction;
    const selectedValidations = validationTable ? validationTable[apiForValidations] : undefined;
    const hasXValidations = !!selectedValidations;
    const hasTabs = hasExampleObject || hasXValidations || !!selectedStep;

    return {
        selectedFlowData,
        steps,
        selectedStep,
        examples,
        selectedExample,
        examplePayload,
        hasExampleObject,
        selectedValidations,
        hasXValidations,
        hasTabs,
    };
}
