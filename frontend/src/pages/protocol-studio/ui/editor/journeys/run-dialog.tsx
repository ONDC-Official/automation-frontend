import { Dialog as DialogPrimitive } from "radix-ui";
import { PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { RJSFSchema } from "@rjsf/utils";

import JsonSchemaForm, { PLAYGROUND_RJSF_FORM_ID } from "@components/JsonSchemaForm";
import MockDynamicForm from "@pages/protocol-playground/ui/components/mock-dynamic-form";
import type { RunPending, StudioRunActions } from "@pages/protocol-studio/hooks/use-studio-run";

export interface IRunDialogProps {
    pending: RunPending | null;
    actions: StudioRunActions;
    /** The editor root: the popup portals into it, so it keeps the Studio theme and fullscreen. */
    container: HTMLElement | null;
}

/**
 * What a running step asks the tester for: the step's inputs (its
 * `inputs.jsonSchema`, rendered by the same RJSF form v1 uses) or a form
 * step's HTML (v1's `MockDynamicForm`). Submitting runs the step. Forks are
 * answered in the Flow preview instead.
 */
export const RunDialog = ({ pending, actions, container }: IRunDialogProps) => {
    const open = pending?.kind === "inputs" || pending?.kind === "form";
    if (!open || !pending) return null;
    const node = pending.node;
    return (
        <DialogPrimitive.Root open onOpenChange={(next) => !next && actions.cancelPending()}>
            <DialogPrimitive.Portal container={container}>
                <DialogPrimitive.Overlay className="studio-dialog-overlay" />
                <DialogPrimitive.Content className="studio-glass studio-form-dialog nokey">
                    <header className="flex items-center gap-3 px-4 pt-3 pb-2">
                        <PencilSquareIcon className="studio-code-dialog-icon" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                            <DialogPrimitive.Title className="studio-code-dialog-title">
                                {pending.kind === "form" ? "Fill the form" : "Enter input data"} ·{" "}
                                <span className="studio-mono">{node.id}</span>
                            </DialogPrimitive.Title>
                            <DialogPrimitive.Description className="studio-text-dim truncate text-[12px]">
                                {pending.kind === "form"
                                    ? "The submission becomes this step's payload."
                                    : "Becomes sessionData.user_inputs for this step's generate."}
                            </DialogPrimitive.Description>
                        </div>
                        <DialogPrimitive.Close
                            className="studio-key studio-key-icon"
                            aria-label="Close"
                            title="Cancel"
                        >
                            <XMarkIcon />
                        </DialogPrimitive.Close>
                    </header>
                    <div className="studio-form-dialog-body playground-schema-form">
                        {pending.kind === "form" ? (
                            pending.html ? (
                                <MockDynamicForm
                                    htmlForm={pending.html}
                                    onSubmit={(data) => void actions.submitForm(data)}
                                />
                            ) : (
                                <p className="studio-text-faint text-[12px]">
                                    This form node has no HTML. Add it in the node's Generation
                                    section, or submit an empty form.{" "}
                                    <button
                                        type="button"
                                        className="studio-key studio-key-xs"
                                        onClick={() => void actions.submitForm({})}
                                    >
                                        Submit empty
                                    </button>
                                </p>
                            )
                        ) : (
                            <JsonSchemaForm
                                schema={pending.schema as RJSFSchema}
                                formData={
                                    (node.inputs?.sampleData as
                                        | Record<string, unknown>
                                        | undefined) ?? undefined
                                }
                                onSubmit={async (data) => {
                                    await actions.submitInputs(data);
                                }}
                            />
                        )}
                    </div>
                    {pending.kind === "inputs" ? (
                        <footer className="studio-hairline-t flex justify-end gap-2 px-4 py-3">
                            <button
                                type="button"
                                className="studio-key studio-key-sm"
                                onClick={actions.cancelPending}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form={PLAYGROUND_RJSF_FORM_ID}
                                className="studio-key studio-key-sm"
                                data-active
                            >
                                Run step
                            </button>
                        </footer>
                    ) : null}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};

export default RunDialog;
