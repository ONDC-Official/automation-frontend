import { useEffect, useState } from "react";
import { MappedStep } from "../../../types/flow-state-type";
// import { toast } from "react-toastify";
import PairedCard from "./pair-cards";
import { Action } from "./editor";

export interface NewAction {
  key: string;
  pair: string | null;
  description: string;
  unsolicited: boolean;
  actionType: string;
  owner: "BAP" | "BPP";
  selectedIndex: number;
}

export type PairedStep = {
  first: MappedStep;
  second?: MappedStep;
};

interface AddCallModalProps {
  actions: Pick<Action, "key" | "type" | "input">[];
  isOpen: boolean;
  selectedIndex: number;
  type: "ADD" | "EDIT" | undefined;
  step: MappedStep;
  onClose: () => void;
  onSave: (newAction: NewAction) => void;
  onEdit: (newAction: NewAction) => void;
}

export default function DisplayFlow({
  mappedFlow,
  actions,
  handleAdd,
  handleEdit,
  handleDelete
}: {
  mappedFlow: {sequence: MappedStep[]};
  actions: Pick<Action, "key" | "type" | "input">[];
  handleAdd: (data: NewAction) => void;
  handleEdit: (data: NewAction) => void;
  handleDelete: (index: Number) => void;
}) {
  // mappedFlow = dummy;
  const steps = getOrderedSteps(mappedFlow);
  const [isFormActive, setIsFormActive] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [formType, setFormType] = useState<"ADD" | "EDIT" | undefined>(
    undefined
  );

  return (
    <>
      <div>
        {steps.map((pairedStep, index) => (
          <PairedCard
            key={index}
            pairedStep={pairedStep}
            // flowId={flowId}
            onAddClick={(index: number) => {
              setIsFormActive(true);
              setSelectedIndex(index);
              setFormType("ADD");
            }}
            onEditClick={(index: number) => {
              setIsFormActive(true);
              setSelectedIndex(index);
              setFormType("EDIT");
            }}
            onDeleteClick={(index: number) => {
              handleDelete(index)
            }}
          />
        ))}
      </div>
      {isFormActive && (
        <AddCallModal
          actions={actions}
          isOpen={isFormActive}
          selectedIndex={selectedIndex}
          type={formType}
          step={mappedFlow.sequence[selectedIndex]}
          onClose={() => setIsFormActive(false)}
          onSave={handleAdd}
          onEdit={handleEdit}
        />
      )}
      {/* {inputPopUp && activeFormConfig && (
        <Popup isOpen={inputPopUp}>
          <FormConfig
            formConfig={activeFormConfig}
            submitEvent={handleFormSubmit}
          />
        </Popup>
      )} */}
    </>
  );
}

function AddCallModal({
  actions,
  isOpen,
  type,
  selectedIndex,
  step,
  onClose,
  onSave,
  onEdit,
}: AddCallModalProps) {
  const [selectedKey, setSelectedKey] = useState("");
  const [pair, setPair] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");
  const [unsolicited, setUnsolicited] = useState(false);
  const [owner, setOwner] = useState<"BAP" | "BPP">("BAP");
  const [actionType, setActionType] = useState("");

  useEffect(() => {
    if (type === "EDIT") {
      setSelectedKey(step.actionId);
      setPair(step.pairActionId);
      setDescription(step?.description || "");
      setUnsolicited(step.unsolicited);
      setOwner(step.owner);
      setActionType(step.actionType);
    }
  }, [type]);

  const handleSubmit = () => {
    if (!selectedKey) return;

    console.log("form data: ", {
      key: selectedKey,
      pair,
      description,
      unsolicited,
      owner,
      actionType,
      selectedIndex,
    });

    if (type === "ADD") {
      onSave({
        key: selectedKey,
        pair,
        description,
        unsolicited,
        owner,
        actionType,
        selectedIndex: selectedIndex,
      });
    } else {
      onEdit({
        key: selectedKey,
        pair,
        description,
        unsolicited,
        owner,
        actionType,
        selectedIndex,
      });
    }

    // Reset form
    setSelectedKey("");
    setPair(null);
    setDescription("");
    setUnsolicited(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {type === "ADD" ? "Add a call" : "Edit a call"}
        </h2>

        {/* Action Id */}
        <label className="block text-sm font-medium mb-1">Action Id</label>
        <select
          value={selectedKey}
          onChange={(e: any) => {
            setSelectedKey(e.target.value);

            actions.forEach((action) => {
              if (action.key === e.target.value) {
                setActionType(action.type);
                setOwner(action.type.startsWith("on_") ? "BPP" : "BAP");
              }
            });
          }}
          className="w-full border rounded-lg p-2 mb-4 bg-white"
        >
          <option value="">Select action</option>
          {actions.map((a) => (
            <option key={a.key} value={a.key}>
              {a.key}
            </option>
          ))}
        </select>

        {/* Pair */}
        <label className="block text-sm font-medium mb-1">Pair</label>
        <select
          value={pair ?? ""}
          onChange={(e) => setPair(e.target.value || null)}
          className="w-full border rounded-lg p-2 mb-4 bg-white"
          disabled={!selectedKey}
        >
          <option value="">None</option>
          {actions
            .filter((a) => a.key !== selectedKey)
            .map((a) => (
              <option key={a.key} value={a.key}>
                {a.key}
              </option>
            ))}
        </select>

        {/* Description */}
        <label className="block text-sm font-medium mb-1">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded-lg p-2 mb-4 bg-white"
        />

        {/* Unsolicited toggle */}
        <div className="flex items-center mb-6">
          <label className="mr-2 text-sm font-medium">Unsolicited</label>
          <button
            type="button"
            onClick={() => setUnsolicited(!unsolicited)}
            className={`w-12 h-6 rounded-full flex items-center p-1 transition ${
              unsolicited ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full shadow-md transform transition ${
                unsolicited ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function getOrderedSteps(mappedFlow: {sequence: MappedStep[]}): PairedStep[] {
  const sequence = mappedFlow.sequence;
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

  if (steps.length > 1) {
    return steps.sort((a, b) => {
      return a.first.index - b.first.index;
    });
  }

  return steps;
}
