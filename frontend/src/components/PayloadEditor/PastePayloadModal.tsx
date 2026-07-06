import { useState } from "react";

import { Button } from "@/components/Shadcn/Button/button";
import FormFlowDialog from "@/components/Shadcn/Dialog/form-flow-dialog";

import { CodeEditor } from "./CodeEditor";

interface PastePayloadModalProps {
    onAdd: (parsedPayload: unknown) => void;
    onClose?: () => void;
}

const PastePayloadModal = ({ onAdd, onClose }: PastePayloadModalProps) => {
    const [payload, setPayload] = useState("");
    const [errorText, setErrorText] = useState("");

    const handleAddClick = () => {
        let parsedText: unknown = null;
        try {
            parsedText = JSON.parse(payload);
        } catch (error: unknown) {
            console.error("Error parsing JSON:", error);
            setErrorText("Invalid json format");
            return;
        }

        onAdd(parsedText as unknown);
    };

    return (
        <FormFlowDialog
            open
            title="Paste payload"
            width="2xl"
            disableClose={!onClose}
            onOpenChange={(open) => {
                if (!open) {
                    onClose?.();
                }
            }}
        >
            <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
                <div className="flex items-center justify-end gap-3">
                    {errorText && <p className="text-sm italic text-destructive">{errorText}</p>}
                    <Button type="button" onClick={handleAddClick}>
                        Add
                    </Button>
                </div>
                <div className="h-96 overflow-hidden rounded-md border border-border-default">
                    <CodeEditor
                        value={payload}
                        onChange={(value: string | undefined) => {
                            setPayload(value ?? "");
                        }}
                        className="h-full w-full"
                    />
                </div>
            </div>
        </FormFlowDialog>
    );
};

export default PastePayloadModal;
