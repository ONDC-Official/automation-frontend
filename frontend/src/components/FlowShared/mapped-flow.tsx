import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";

import { FlowMap, MappedStep } from "@/types/flow-state-type";
import FormConfig from "@components/ConfigForm";
import { IFormConfigProps } from "@components/ConfigForm/types";
import Popup from "@/components/PopUp";
import { SubmitEventParams } from "@/types/flow-types";
import { proceedFlow } from "@utils/request-utils";
import { useSession } from "@context/sessionContext";

import PairedCard from "@components/FlowShared/pair-card";

export default function DisplayFlow({
  mappedFlow,
  flowId,
}: {
  mappedFlow: FlowMap;
  flowId: string;
}) {
  // mappedFlow = dummy;
  const steps = getOrderedSteps(mappedFlow);
  const [inputPopUp, setInputPopUp] = useState(false);
  const [activeFormConfig, setActiveFormConfig] = useState<IFormConfigProps | undefined>(undefined);

  const { sessionId, sessionData } = useSession();

  const handleFormSubmit = useCallback(
    async (formData: SubmitEventParams) => {
      try {
        const txId = sessionData?.flowMap[flowId];
        if (!txId) {
          console.error("Transaction ID not found");
          return;
        }
        // Convert jsonPath to Record<string, unknown> and pass activeFormConfig as inputs
        await proceedFlow(
          sessionId,
          txId,
          formData.jsonPath as Record<string, unknown>,
          activeFormConfig
        );
        setInputPopUp(false);
        setActiveFormConfig(undefined);
      } catch (error) {
        toast.error("Error submitting form ");
        console.error("Error submitting form data:", error);
        setInputPopUp(false);
      }
    },
    [sessionId, sessionData?.flowMap, flowId, activeFormConfig]
  );

  useEffect(() => {
    const conf = mappedFlow?.sequence?.filter(
      (s, index) => s.status === "INPUT-REQUIRED" && index !== 0
    )?.[0]?.input;
    if (conf?.length === 0) {
      if (sessionData?.activeFlow !== flowId) return;
      handleFormSubmit({ jsonPath: {}, formData: {} });
      return;
    }
    setActiveFormConfig(conf);
    if (conf) {
      setInputPopUp(true);
    }
  }, [mappedFlow, flowId, handleFormSubmit, sessionData?.activeFlow]);

  useEffect(() => {
    const latestSending = mappedFlow?.sequence.find((f) => f.status === "RESPONDING");
    const transactionId = sessionData?.flowMap[flowId];
    if (latestSending && latestSending.force_proceed && transactionId) {
      proceedFlow(sessionId, transactionId);
    }
  }, [mappedFlow, flowId, sessionData?.flowMap, sessionId]);
  return (
    <>
      <div>
        {steps.map((pairedStep, index) => (
          <PairedCard key={index} pairedStep={pairedStep} flowId={flowId} />
        ))}
      </div>
      <div></div>
      {inputPopUp && activeFormConfig && (
        <Popup isOpen={inputPopUp} disableClose>
          <FormConfig
            formConfig={activeFormConfig}
            submitEvent={handleFormSubmit}
            referenceData={mappedFlow.reference_data}
            flowId={flowId}
          />
        </Popup>
      )}
    </>
  );
}

export type PairedStep = {
  first: MappedStep;
  second?: MappedStep;
};

function getOrderedSteps(mappedFlow: FlowMap): PairedStep[] {
  const sequence = [...mappedFlow.sequence, ...mappedFlow.missedSteps];
  const visited = new Set<string>();
  const steps: PairedStep[] = [];

  for (const step of sequence) {
    if (visited.has(`${step.actionId}_${step.index}`)) continue;

    visited.add(`${step.actionId}_${step.index}`);

    let pairStep: MappedStep | undefined;
    if (step.pairActionId) {
      pairStep = sequence.find((s) => s.actionId === step.pairActionId);
      if (pairStep && !visited.has(pairStep.actionId)) {
        visited.add(`${pairStep.actionId}_${pairStep.index}`);
      }
    }

    steps.push({
      first: step,
      second: pairStep,
    });
  }

  return steps.sort((a, b) => {
    return a.first.index - b.first.index;
  });
}
