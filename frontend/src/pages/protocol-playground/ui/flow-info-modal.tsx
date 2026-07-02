import { useState, useEffect } from "react";
import { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";
import { Button } from "@/components/Shadcn/Button/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/Shadcn/Dialog";
import { TextField } from "@/components/Shadcn/TextField";
import { Textarea } from "@/components/Shadcn/ComboBox/textarea";
import { Label } from "@/components/Shadcn/Label/label";
import { PencilSquareIcon } from "@heroicons/react/24/outline";

type Meta = MockPlaygroundConfigType["meta"];

interface IFlowInfoModalProps {
    isOpen: boolean;
    meta: Meta;
    onSave: (patch: Partial<Meta>) => void;
    onClose: () => void;
}

const ReadonlyField = ({ label, value }: { label: string; value: string }) => (
    <div className="min-w-0">
        <span className="mb-1 block text-xs font-medium text-text-secondary">{label}</span>
        <span className="inline-block max-w-md truncate rounded-lg bg-surface-muted px-3 py-1.5 font-mono text-sm text-text-primary">
            {value}
        </span>
    </div>
);

export const FlowInfoModal = ({ isOpen, meta, onSave, onClose }: IFlowInfoModalProps) => {
    const [description, setDescription] = useState(meta.description ?? "");
    const [useCaseId, setUseCaseId] = useState(meta.use_case_id ?? "");
    const [flowName, setFlowName] = useState(meta.flowName ?? "");

    useEffect(() => {
        setDescription(meta.description ?? "");
        setUseCaseId(meta.use_case_id ?? "");
        setFlowName(meta.flowName ?? "");
    }, [meta]);

    const handleSave = () => {
        const patch: Partial<Meta> = {};
        if (description.trim() !== (meta.description ?? "")) {
            patch.description = description.trim() || undefined;
        }
        if (useCaseId.trim() !== (meta.use_case_id ?? "")) {
            patch.use_case_id = useCaseId.trim() || undefined;
        }
        if (flowName.trim() !== (meta.flowName ?? "")) {
            patch.flowName = flowName.trim() || undefined;
        }
        onSave(patch);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="flex max-w-lg flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="flex flex-row items-center gap-2.5 border-b border-border-default px-6 py-4">
                    <PencilSquareIcon className="size-5 text-brand-normal" />
                    <div className="min-w-0">
                        <DialogTitle>Flow Info</DialogTitle>
                        <DialogDescription className="mt-0.5">
                            Edit optional metadata for this flow
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="space-y-5 px-6 py-5">
                    <div>
                        <p className="mb-3 text-xs font-semibold tracking-widest text-text-secondary uppercase">
                            Identity (read-only)
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <ReadonlyField label="Domain" value={meta.domain} />
                            <ReadonlyField label="Version" value={meta.version} />
                            <ReadonlyField label="Flow ID" value={meta.flowId} />
                        </div>
                    </div>

                    <div className="border-t border-border-default" />

                    <div>
                        <p className="mb-3 text-xs font-semibold tracking-widest text-text-secondary uppercase">
                            Optional Details
                        </p>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="flow-description">Description</Label>
                                <Textarea
                                    id="flow-description"
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What does this flow test?"
                                />
                            </div>

                            <TextField
                                id="flow-use-case-id"
                                label="Use Case ID"
                                type="text"
                                value={useCaseId}
                                onChange={(e) => setUseCaseId(e.target.value)}
                                placeholder="e.g. UCS-001"
                            />

                            <TextField
                                id="flow-name"
                                label="Flow Name"
                                type="text"
                                value={flowName}
                                onChange={(e) => setFlowName(e.target.value)}
                                placeholder="Human-readable name for this flow"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="border-t border-border-default bg-surface-muted px-6 py-4">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
