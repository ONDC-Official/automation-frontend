import { Editor, Monaco } from "@monaco-editor/react";
import { Button } from "@/components/Shadcn/Button/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/Shadcn/Dialog/dialog";
import { DarkSkyBlueTheme } from "@pages/protocol-playground/ui/editor-themes";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

interface IRawConfigEditorModalProps {
    isOpen: boolean;
    value: string;
    error: string | null;
    onChange: (value: string) => void;
    onSave: () => void;
    onClose: () => void;
}

export const RawConfigEditorModal = ({
    isOpen,
    value,
    error,
    onChange,
    onSave,
    onClose,
}: IRawConfigEditorModalProps) => {
    const handleEditorWillMount = (monaco: Monaco) => {
        monaco.editor.defineTheme("dark-skyblue", DarkSkyBlueTheme);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                showCloseButton={false}
                className="top-0 left-0 flex h-screen w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0"
            >
                <DialogTitle className="sr-only">Edit Raw Configuration JSON</DialogTitle>

                <div className="flex shrink-0 items-center justify-between border-b border-border-default bg-surface-elevated px-5 py-3">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-brand-light dark:bg-surface-muted">
                            <DocumentTextIcon className="size-3.5 text-brand-normal" />
                        </div>
                        <h2 className="text-sm font-semibold text-text-primary">
                            Edit Raw Configuration JSON
                        </h2>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onClose}>
                            Close
                        </Button>
                        <Button size="sm" onClick={onSave}>
                            Save
                        </Button>
                    </div>
                </div>

                {error ? (
                    <div className="mx-4 mt-3 rounded-lg border border-error-500/40 bg-error-50 px-3 py-2 text-sm text-error-500">
                        {error}
                    </div>
                ) : null}

                <div className="flex-1 overflow-hidden p-4 pt-3">
                    <Editor
                        theme="dark-skyblue"
                        beforeMount={handleEditorWillMount}
                        height="100%"
                        language="json"
                        value={value}
                        onChange={(nextValue) => onChange(nextValue || "")}
                        options={{
                            fontSize: 14,
                            lineNumbers: "on",
                            automaticLayout: true,
                            formatOnPaste: true,
                            formatOnType: true,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                        }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};
