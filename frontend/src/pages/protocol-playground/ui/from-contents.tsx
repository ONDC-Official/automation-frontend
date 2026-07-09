import { useState } from "react";
import { PlaygroundActionStep } from "@ondc/automation-mock-runner";

import { Button } from "@components/Shadcn/Button/button";
import {
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@components/Shadcn/Dialog";
import { Textarea } from "@components/Shadcn/ComboBox/textarea";
import { ComboBoxControl } from "@components/Shadcn/ComboBox";
import { Label } from "@components/Shadcn/Label/label";
import { TextField } from "@components/Shadcn/TextField";
import { ONDC_ACTION_LIST, ONDC_FORM_LIST } from "@pages/protocol-playground/types";
import { usePlayground } from "@pages/protocol-playground/hooks/playground-runtime";

// ComboBoxControl treats an empty-string `value` as "no selection" (shows the
// placeholder), so a distinct sentinel is needed to keep the "None" option
// visually selectable while `responseFor` itself still stores "" for "none".
const RESPONSE_FOR_NONE_VALUE = "__none__";

export interface IAddActionFormData {
    stepType: "action" | "form";
    api: string;
    form: string;
    actionId: string;
}

interface IAddActionFormProps {
    title: string;
    onSubmit: (data: IAddActionFormData) => void;
    onCancel: () => void;
}

export const AddActionForm = ({ title, onSubmit, onCancel }: IAddActionFormProps) => {
    const { stepGroup } = usePlayground();
    const allowForm = stepGroup !== "extra";
    const [stepType, setStepType] = useState<"action" | "form">("action");
    const [api, setApi] = useState<string>(ONDC_ACTION_LIST[0]);
    const [form, setForm] = useState<string>(ONDC_FORM_LIST[0]);
    const [actionId, setActionId] = useState("");

    return (
        <>
            <DialogHeader className="border-b border-border-default px-6 py-4">
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>Add a new API step or form step to the flow.</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 px-6 py-5">
                {allowForm ? (
                    <div className="space-y-1.5">
                        <Label htmlFor="step-type">Step Type</Label>
                        <ComboBoxControl
                            id="step-type"
                            value={stepType}
                            onValueChange={(value) => setStepType(value as "action" | "form")}
                            options={[
                                { value: "action", label: "API" },
                                { value: "form", label: "FORM" },
                            ]}
                        />
                    </div>
                ) : null}

                {stepType === "action" ? (
                    <div className="space-y-1.5">
                        <Label htmlFor="api-name">API</Label>
                        <ComboBoxControl
                            id="api-name"
                            value={api}
                            onValueChange={setApi}
                            options={ONDC_ACTION_LIST.map((action) => ({
                                value: action,
                                label: action,
                            }))}
                        />
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        <Label htmlFor="form-name">Form</Label>
                        <ComboBoxControl
                            id="form-name"
                            value={form}
                            onValueChange={setForm}
                            options={ONDC_FORM_LIST.map((formName) => ({
                                value: formName,
                                label: formName,
                            }))}
                        />
                    </div>
                )}

                <TextField
                    id="step-id"
                    label="Step ID"
                    type="text"
                    placeholder="step id"
                    value={actionId}
                    onChange={(e) => setActionId(e.target.value)}
                />
            </div>

            <DialogFooter className="border-t border-border-default bg-surface-muted px-6 py-4">
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button onClick={() => onSubmit({ stepType, api, form, actionId })}>Submit</Button>
            </DialogFooter>
        </>
    );
};

interface IDeleteConfirmationFormProps {
    title: string;
    description: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const DeleteConfirmationForm = ({
    title,
    description,
    onConfirm,
    onCancel,
}: IDeleteConfirmationFormProps) => (
    <>
        <DialogHeader className="border-b border-border-default px-6 py-6">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="max-w-md py-2">
                {description || "Are you sure you want to delete? This action cannot be undone."}
            </DialogDescription>
        </DialogHeader>

        <DialogFooter className="border-t border-border-default bg-surface-muted px-6 py-4">
            <Button variant="outline" onClick={onCancel}>
                Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm}>
                Delete
            </Button>
        </DialogFooter>
    </>
);

export interface IEditActionFormData {
    api: string;
    actionId: string;
    owner: string;
    unsolicited: string;
    responseFor: string;
    description: string;
}

interface IEditActionFormProps {
    currentAction: PlaygroundActionStep;
    activeActionId: string;
    previousSteps: PlaygroundActionStep[];
    onUpdate: (data: IEditActionFormData) => void;
    onCancel: () => void;
}

export const EditActionForm = ({
    currentAction,
    activeActionId,
    previousSteps,
    onUpdate,
    onCancel,
}: IEditActionFormProps) => {
    const [api, setApi] = useState<string>(currentAction.api);
    const [actionId, setActionId] = useState(activeActionId);
    const [owner, setOwner] = useState<string>(currentAction.owner ?? "BAP");
    const [unsolicited, setUnsolicited] = useState(currentAction.unsolicited ? "yes" : "no");
    const [responseFor, setResponseFor] = useState(currentAction.responseFor ?? "");
    const [description, setDescription] = useState(currentAction.description ?? "");

    return (
        <>
            <DialogHeader className="border-b border-border-default px-6 py-4">
                <DialogTitle>Edit Action Configuration</DialogTitle>
                <DialogDescription>Update the selected step&apos;s metadata.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="edit-api">API Name</Label>
                    <ComboBoxControl
                        id="edit-api"
                        value={api}
                        onValueChange={setApi}
                        options={ONDC_ACTION_LIST.map((action) => ({
                            value: action,
                            label: action,
                        }))}
                    />
                </div>

                <TextField
                    id="edit-action-id"
                    label="Action ID"
                    type="text"
                    placeholder="Action ID"
                    value={actionId}
                    onChange={(e) => setActionId(e.target.value)}
                />

                <div className="space-y-1.5">
                    <Label htmlFor="edit-owner">Owner</Label>
                    <ComboBoxControl
                        id="edit-owner"
                        value={owner}
                        onValueChange={setOwner}
                        options={[
                            { value: "BAP", label: "BAP" },
                            { value: "BPP", label: "BPP" },
                        ]}
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="edit-unsolicited">Unsolicited</Label>
                    <ComboBoxControl
                        id="edit-unsolicited"
                        value={unsolicited}
                        onValueChange={setUnsolicited}
                        options={[
                            { value: "yes", label: "Yes" },
                            { value: "no", label: "No" },
                        ]}
                    />
                </div>

                <div className="col-span-full space-y-1.5">
                    <Label htmlFor="edit-response-for">Response For</Label>
                    <ComboBoxControl
                        id="edit-response-for"
                        value={responseFor || RESPONSE_FOR_NONE_VALUE}
                        onValueChange={(value) =>
                            setResponseFor(value === RESPONSE_FOR_NONE_VALUE ? "" : value)
                        }
                        options={[
                            { value: RESPONSE_FOR_NONE_VALUE, label: "None" },
                            ...previousSteps.map((step) => ({
                                value: step.action_id,
                                label: `${step.action_id} (${step.api})`,
                            })),
                        ]}
                    />
                </div>

                <div className="col-span-full space-y-1.5">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                        id="edit-description"
                        placeholder="Add a description..."
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
            </div>

            <DialogFooter className="border-t border-border-default bg-surface-muted px-6 py-4">
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    onClick={() =>
                        onUpdate({ api, actionId, owner, unsolicited, responseFor, description })
                    }
                >
                    Update Action
                </Button>
            </DialogFooter>
        </>
    );
};
