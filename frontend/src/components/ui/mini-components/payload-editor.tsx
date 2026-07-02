import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowsPointingOutIcon, XMarkIcon } from "@heroicons/react/24/outline";

import { CodeEditor } from "@/components/PayloadEditor/CodeEditor";
import { Button } from "@/components/Shadcn/Button/button";

interface PayloadEditorProps {
    onAdd: (parsedPayload: unknown) => void;
    onClose?: () => void;
}

const PayloadEditor = ({ onAdd, onClose }: PayloadEditorProps) => {
    const [payload, setPayload] = useState("");
    const [errorText, setErrorText] = useState("");
    const [isMinimized, setIsMinimized] = useState(false);
    const [portalTarget, setPortalTarget] = useState<Element>(
        () => document.fullscreenElement ?? document.body
    );

    useEffect(() => {
        const update = () => {
            setPortalTarget(document.fullscreenElement ?? document.body);
        };
        update();
        document.addEventListener("fullscreenchange", update);
        return () => document.removeEventListener("fullscreenchange", update);
    }, []);

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

    if (isMinimized) {
        return createPortal(
            <div data-slot="nested-flow-modal" className="fixed bottom-4 right-4 z-110">
                <div className="flex items-center gap-3 rounded-xl border border-border-default bg-surface-elevated px-4 py-3 shadow-lg">
                    <span className="text-sm font-semibold text-text-primary">Paste payload</span>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Restore paste payload editor"
                        onClick={() => setIsMinimized(false)}
                    >
                        <ArrowsPointingOutIcon className="size-4" />
                    </Button>
                    {onClose && (
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Close paste payload editor"
                            onClick={onClose}
                        >
                            <XMarkIcon className="size-4" />
                        </Button>
                    )}
                </div>
            </div>,
            portalTarget
        );
    }

    return createPortal(
        <div
            data-slot="nested-flow-modal"
            className="fixed inset-0 z-110 flex items-center justify-center bg-black/50 p-4"
            onPointerDown={(event) => event.stopPropagation()}
        >
            <div className="w-full max-w-3xl rounded-2xl border border-border-default bg-surface-elevated p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-lg font-semibold text-text-primary">Paste payload</p>
                    <div className="flex items-center gap-3">
                        {errorText && (
                            <p className="text-sm italic text-destructive">{errorText}</p>
                        )}
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Minimize paste payload editor"
                            onClick={() => setIsMinimized(true)}
                        >
                            <span className="text-base leading-none">−</span>
                        </Button>
                        <Button type="button" onClick={handleAddClick}>
                            Add
                        </Button>
                    </div>
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
        </div>,
        portalTarget
    );
};

export default PayloadEditor;
