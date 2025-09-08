import React, { useEffect, useState } from "react";
import { useContext } from "react";
import { MappedStep } from "../../../types/flow-state-type";
import { FcWorkflow } from "react-icons/fc";
import { FiEdit2 } from "react-icons/fi";
import DisplayFlow, { NewAction } from "./dispaly-flow";
import { getActions } from "./../../../utils/request-utils";
import { SequenceStep } from "../../../types/flow-types";
import { SessionContext } from "../../../context/context";
import { SessionCache } from "../../../types/session-types";

interface InputField {
  name: string;
  label: string;
  type: string;
  default?: string;
  options?: any[];
}

export interface Action {
  key: string;
  type: string;
  input?: InputField[];
  unsolicited?: boolean;
  pair?: string | null;
  owner?: string;
  expect?: boolean;
  description?: string;
}

interface Flow {
  id: string;
  description: string;
  sequence: Action[];
}

interface FlowEditorProps {
  initialFlow: Flow;
  actions: Pick<Action, "key" | "type" | "input">[];
  template: SequenceStep[];
  sessionData: SessionCache;
  onChange: (flow: Flow) => void;
  setCustomFlow: (flow: any) => void;
}

// const actions: Action[] = [
//   {
//     key: "search",
//     type: "search",
//     description: "sadasd",
//     input: [
//       {
//         label: "Options",
//         name: "options",
//         type: "checkbox",
//         options: [
//           { code: "promo", name: "Promotions" },
//           { code: "demandSignal", name: "Demand Signal" },
//           { code: "001", name: "Item availability" },
//           { code: "008", name: "Minimum order value" },
//         ],
//       },
//     ],
//   },
//   {
//     key: "on_search",
//     type: "on_search",
//     description: "sadasd",
//     input: [
//       {
//         name: "offers",
//         label: "Select offers",
//         type: "checkbox",
//         options: [{ code: "discount", name: "Discount" }],
//       },
//     ],
//   },
// ];

export default function Editor({
  template,
  sessionData,
  setCustomFlow,
}: FlowEditorProps) {
  const [flowName, setFlowName] = useState("CUSTOM_FLOW");
  const [flowTitle, setFlowTitle] = useState("Custom flow");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [actions, setActions] = useState<Action[]>([]);

  const [sequenceFlow, setSequenceFlow] = useState<MappedStep[]>([]);

  const handleAdd = (data: NewAction) => {
    setSequenceFlow((prev) => {
      const updatedSeq: MappedStep[] = [];

      prev.forEach((seq) => {
        // keep everything before
        if (seq.index <= data.selectedIndex) {
          updatedSeq.push(seq);
        }

        // insert new item immediately after the selected index
        if (seq.index === data.selectedIndex) {
          updatedSeq.push({
            status: "WAITING",
            actionId: data.key,
            owner: data.owner,
            actionType: data.actionType,
            index: data.selectedIndex + 1,
            description: data.description,
            unsolicited: data.unsolicited,
            pairActionId: data.pair,
            expect: false,
          });
        }

        // shift everything that comes after
        if (seq.index > data.selectedIndex) {
          updatedSeq.push({
            ...seq,
            index: seq.index + 1,
          });
        }
      });

      return updatedSeq;
    });
  };

  const handleEdit = (data: NewAction) => {
    setSequenceFlow((prev) => {
      return prev.map((seq) => {
        if (seq.index === data.selectedIndex) {
          return {
            status: "WAITING",
            actionId: data.key,
            owner: data.owner,
            actionType: data.actionType,
            index: data.selectedIndex,
            description: data.description,
            unsolicited: data.unsolicited,
            pairActionId: data.pair,
            expect: data.selectedIndex === 0 ? true : false,
          };
        }
        return seq;
      });
    });
  };

  const init = async () => {
    console.log("session Data:", sessionData);
    let response = await getActions(sessionData.domain, sessionData.version);

    // do soemthing
    const transformedActions = response.map((item: any) => {
      return {
        key: item.action_id, // use action_id as unique key
        type: item.action,
        description: item.config?.description ?? "",
        input: item.config?.inputs
          ? Object.entries(item.config.inputs).map(([name, field]: any) => ({
              name,
              ...field,
            }))
          : [],
        // extra fields preserved
        action_id: item.action_id,
        actionCode: item.actionCode,
        config: item.config,
      };
    });

    console.log("editor transcformedActios: ", transformedActions);
    setActions(transformedActions);
    setSequenceFlow([
      {
        status: "WAITING",
        actionId: transformedActions[0].key,
        owner: "BAP",
        actionType: transformedActions[0].type,
        index: 0,
        description: "something",
        unsolicited: false,
        pairActionId: null,
        expect: true,
        input: transformedActions[0].input || ([] as any),
      },
    ]);
  };

  useEffect(() => {
    function transformStep(step: MappedStep): Action {
      const base = actions.find((a) => a.key === step.actionId);
      return {
        key: step.actionId,
        type: step.actionType,
        unsolicited: step.unsolicited,
        pair: step.pairActionId ?? null,
        owner: step.owner,
        expect: step.expect,
        description: step.description,
        input: base?.input ?? [],
      };
    }

    function transformSteps(steps: MappedStep[]): Action[] {
      return steps.sort((a, b) => a.index - b.index).map(transformStep);
    }

    if (!sequenceFlow.length) return;

    const steps = transformSteps(sequenceFlow);

    const flow: Flow = {
      id: flowName,
      description: flowTitle,
      sequence: steps,
    };

    setCustomFlow(flow);
  }, [sequenceFlow, flowName, flowTitle, actions]);

  useEffect(() => {
    if (sessionData?.domain && sessionData?.version) {
      init();
    }
  }, [sessionData]);

  useEffect(() => {
    if (template) {
      setSequenceFlow(
        template.map((t, idx) => ({
          status: "WAITING",
          actionId: t.key,
          owner: t.owner,
          actionType: t.type,
          index: idx,
          description: t.description,
          unsolicited: t.unsolicited,
          pairActionId: t.pair,
          expect: t.expect,
          input: t.input || [],
        }))
      );
    }
  }, [template]);

  console.log("editor seqenceFlow", sequenceFlow);

  return (
    <div className="rounded-md mb-4 w-full">
      <div
        className={`bg-white border rounded-md shadow-sm hover:bg-sky-100 cursor-pointer transition-colors px-5 py-3`}
        aria-expanded={true}
        aria-controls={`accordion-content-custom`}
      >
        <div className="flex items-center justify-between">
          <div>
            {/* Flow Name */}
            <div className="flex items-center gap-2 text-base font-bold text-sky-700">
              <FcWorkflow className="text-lg" />
              {isEditingName ? (
                <input
                  type="text"
                  value={flowName}
                  autoFocus
                  onChange={(e) => setFlowName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setIsEditingName(false);
                  }}
                  className="bg-white border rounded px-1 py-0.5 text-sm"
                />
              ) : (
                <>
                  <span>{flowName.split("_").join(" ")}</span>
                  <FiEdit2
                    className="cursor-pointer text-gray-500 hover:text-sky-600"
                    onClick={() => setIsEditingName(true)}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Accordion Content */}
      <div className="overflow-hidden transition-all duration-300 ease-in-out">
        <div className="px-4 py-5 bg-white">
          <div className="flex items-center gap-2 text-black font-medium">
            {isEditingTitle ? (
              <input
                type="text"
                value={flowTitle}
                autoFocus
                onChange={(e) => setFlowTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setIsEditingTitle(false);
                }}
                className="bg-white border rounded px-1 py-0.5 text-sm"
              />
            ) : (
              <>
                <span>{flowTitle}</span>
                <FiEdit2
                  className="cursor-pointer text-gray-500 hover:text-sky-600"
                  onClick={() => setIsEditingTitle(true)}
                />
              </>
            )}
          </div>
          <div className="space-y-4 relative">
            {sequenceFlow.length ? (
              <DisplayFlow
                mappedFlow={{ sequence: sequenceFlow }}
                // flowId={flowName}
                actions={actions}
                handleAdd={handleAdd}
                handleEdit={handleEdit}
              />
            ) : (
              <div>Loading...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
