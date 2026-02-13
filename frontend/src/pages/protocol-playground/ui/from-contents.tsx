// ===== FORM COMPONENTS =====
// Extracted form components for better code organization and reusability

import { PlaygroundActionStep } from "@ondc/automation-mock-runner";
import { inputClass } from "../../../components/ui/forms/inputClass";

import { ONDC_ACTION_LIST, ONDC_FORM_LIST } from "../types";

import { useState } from "react";

export const AddActionForm = ({
    title,
    onSubmit,
    onCancel,
}: {
    title: string;
    onSubmit: () => void;
    onCancel: () => void;
}) => {
    const [stepType, setStepType] = useState<"action" | "form">("action");

    return (
        <div>
            <h2>{title}</h2>
            <div className="flex flex-col gap-2 mt-2">
                {/* Step type selector */}
                <select
                    id="stepTypeInput"
                    className={inputClass}
                    value={stepType}
                    onChange={(e) => setStepType(e.target.value as "action" | "form")}
                >
                    <option value="action">API</option>
                    <option value="form">FORM</option>
                </select>

                {/* API select */}
                {stepType === "action" && (
                    <select id="apiAddNameInput" className={inputClass}>
                        {ONDC_ACTION_LIST.map((action) => (
                            <option key={action} value={action}>
                                {action}
                            </option>
                        ))}
                    </select>
                )}

                {/* Form select */}
                {stepType === "form" && (
                    <select id="formAddNameInput" className={inputClass}>
                        {ONDC_FORM_LIST.map((form) => (
                            <option key={form} value={form}>
                                {form}
                            </option>
                        ))}
                    </select>
                )}

                <input
                    type="text"
                    placeholder="step id"
                    id="actionAddIdInput"
                    className={inputClass}
                />

                <div className="flex gap-2 mt-2">
                    <button
                        className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 bg-sky-700 text-white rounded hover:bg-sky-800"
                        onClick={onSubmit}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

export const DeleteConfirmationForm = ({
    title,
    description,
    onConfirm,
    onCancel,
}: {
    title: string;
    description: string;
    onConfirm: () => void;
    onCancel: () => void;
}) => (
    <div>
        <h2>{title}</h2>
        <p>{description || "Are you sure you want to delete ? This action cannot be undone."}</p>
        <div className="mt-4 flex justify-end gap-2">
            <button
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                onClick={onCancel}
            >
                Cancel
            </button>
            <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={onConfirm}
            >
                Delete
            </button>
        </div>
    </div>
);

export const EditActionForm = ({
    currentAction,
    activeActionId,
    previousSteps,
    onUpdate,
    onCancel,
}: {
    currentAction: PlaygroundActionStep;
    activeActionId: string;
    previousSteps: PlaygroundActionStep[];
    onUpdate: () => void;
    onCancel: () => void;
}) => (
    <div className="w-96">
        <h2 className="text-lg font-bold mb-4">Edit Action Configuration</h2>
        <div className="grid grid-cols-2 gap-3">
            {/* API Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Name:</label>
                <select
                    id="editApiNameInput"
                    className={inputClass}
                    defaultValue={currentAction.api}
                >
                    {ONDC_ACTION_LIST.map((action) => (
                        <option key={action} value={action}>
                            {action}
                        </option>
                    ))}
                </select>
            </div>

            {/* Action ID */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action ID:</label>
                <input
                    type="text"
                    placeholder="Action ID"
                    id="editActionIdInput"
                    className={inputClass}
                    defaultValue={activeActionId}
                />
            </div>

            {/* Owner */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner:</label>
                <select
                    id="editOwnerInput"
                    className={inputClass}
                    defaultValue={currentAction.owner}
                >
                    <option value="BAP">BAP</option>
                    <option value="BPP">BPP</option>
                </select>
            </div>

            {/* Unsolicited */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unsolicited:</label>
                <select
                    id="editUnsolicitedInput"
                    className={inputClass}
                    defaultValue={currentAction.unsolicited ? "yes" : "no"}
                >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                </select>
            </div>

            {/* Response For */}
            <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Response For:
                </label>
                <select
                    id="editResponseForInput"
                    className={inputClass}
                    defaultValue={currentAction.responseFor || ""}
                >
                    <option value="">None</option>
                    {previousSteps.map((step) => (
                        <option key={step.action_id} value={step.action_id}>
                            {step.action_id} ({step.api})
                        </option>
                    ))}
                </select>
            </div>

            {/* Description */}
            <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description:</label>
                <textarea
                    placeholder="Add a description..."
                    id="editDescriptionInput"
                    className={`${inputClass} h-20 resize-none`}
                    defaultValue={currentAction.description || ""}
                />
            </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-4 justify-end">
            <button
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                onClick={onCancel}
            >
                Cancel
            </button>
            <button
                className="px-4 py-2 bg-sky-700 text-white rounded hover:bg-sky-800"
                onClick={onUpdate}
            >
                Update Action
            </button>
        </div>
    </div>
);
