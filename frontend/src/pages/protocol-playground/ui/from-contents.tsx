import { useContext, useState } from "react";
import { PlaygroundActionStep } from "@ondc/automation-mock-runner";

import { Button } from "@/components/Shadcn/Button/button";
import {
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/Shadcn/Dialog";
import { Textarea } from "@/components/Shadcn/ComboBox/textarea";
import { Label } from "@/components/Shadcn/Label/label";
import { TextField } from "@/components/Shadcn/TextField";
import { cn } from "@/lib/utils";
import { ONDC_ACTION_LIST, ONDC_FORM_LIST } from "@pages/protocol-playground/types";
import { PlaygroundContext } from "@pages/protocol-playground/context/playground-context";

const selectClass = cn(
    "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
    "focus-visible:border-ring focus-visible:ring focus-visible:ring-ring/50 dark:bg-input/30"
);

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
    const { stepGroup } = useContext(PlaygroundContext);
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
                        <select
                            id="step-type"
                            className={selectClass}
                            value={stepType}
                            onChange={(e) => setStepType(e.target.value as "action" | "form")}
                        >
                            <option value="action">API</option>
                            <option value="form">FORM</option>
                        </select>
                    </div>
                ) : null}

                {stepType === "action" ? (
                    <div className="space-y-1.5">
                        <Label htmlFor="api-name">API</Label>
                        <select
                            id="api-name"
                            className={selectClass}
                            value={api}
                            onChange={(e) => setApi(e.target.value)}
                        >
                            {ONDC_ACTION_LIST.map((action) => (
                                <option key={action} value={action}>
                                    {action}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        <Label htmlFor="form-name">Form</Label>
                        <select
                            id="form-name"
                            className={selectClass}
                            value={form}
                            onChange={(e) => setForm(e.target.value)}
                        >
                            {ONDC_FORM_LIST.map((formName) => (
                                <option key={formName} value={formName}>
                                    {formName}
                                </option>
                            ))}
                        </select>
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
                    <select
                        id="edit-api"
                        className={selectClass}
                        value={api}
                        onChange={(e) => setApi(e.target.value)}
                    >
                        {ONDC_ACTION_LIST.map((action) => (
                            <option key={action} value={action}>
                                {action}
                            </option>
                        ))}
                    </select>
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
                    <select
                        id="edit-owner"
                        className={selectClass}
                        value={owner}
                        onChange={(e) => setOwner(e.target.value)}
                    >
                        <option value="BAP">BAP</option>
                        <option value="BPP">BPP</option>
                    </select>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="edit-unsolicited">Unsolicited</Label>
                    <select
                        id="edit-unsolicited"
                        className={selectClass}
                        value={unsolicited}
                        onChange={(e) => setUnsolicited(e.target.value)}
                    >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                    </select>
                </div>

                <div className="col-span-full space-y-1.5">
                    <Label htmlFor="edit-response-for">Response For</Label>
                    <select
                        id="edit-response-for"
                        className={selectClass}
                        value={responseFor}
                        onChange={(e) => setResponseFor(e.target.value)}
                    >
                        <option value="">None</option>
                        {previousSteps.map((step) => (
                            <option key={step.action_id} value={step.action_id}>
                                {step.action_id} ({step.api})
                            </option>
                        ))}
                    </select>
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
