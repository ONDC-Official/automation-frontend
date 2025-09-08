import React, { useState } from "react";
import { Flow, SequenceStep } from "../../../types/flow-types";
import { updateCustomFlow } from "../../../utils/request-utils";
import Editor from "./editor";
import { toast } from "react-toastify";
import { SessionCache } from "../../../types/session-types";

interface StepperProps {
  sessionId: string;
  template: SequenceStep[];
  sessionData: SessionCache;
  onNext: (flow: Flow) => void;
}

const FlowEditor = ({
  sessionId,
  template,
  sessionData,
  onNext,
}: StepperProps) => {
  const [customFlow, setCustomFlow] = useState([]);
  const [isFlowSaved, setIsFlowSaved] = useState(false);

  const saveFlow = async () => {
    try {
      await updateCustomFlow(sessionId, customFlow);
      setIsFlowSaved(true);
      toast.info("Flow saved.");
    } catch (e) {
      toast.error("Error while saving flow.");
      console.error("Error while updating flow: ", e);
    }
  };

  return (
    <div className="w-full p-6">
      <div>
        <Editor
          setCustomFlow={setCustomFlow}
          template={template}
          sessionData={sessionData}
        />

        <div className="flex justify-end mt-6 space-x-2">
          <button
            onClick={saveFlow}
            className="px-4 py-2 bg-gray-200 rounded-lg"
          >
            Save
          </button>
          <button
            disabled={!isFlowSaved}
            onClick={() => onNext(customFlow)}
            className={` px-4 py-2 rounded-lg text-white font-medium transition-colors
            ${
              isFlowSaved
                ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                : "bg-gray-400 cursor-not-allowed"
            }
          `}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlowEditor;
