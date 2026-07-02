import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { ComboBoxControl } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import { cn } from "@/lib/utils";
import {
    IProvider,
    IFormValues,
    ICatalogPayload,
    IFIS12SelectFormProps,
    DEFAULT_FORM_VALUES,
} from "../types/fis12-select-form-types";

export default function FIS12SelectForm({ submitEvent }: IFIS12SelectFormProps) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [extractedProviders, setExtractedProviders] = useState<IProvider[]>([]);

    const { control, handleSubmit, setValue, watch } = useForm<IFormValues>({
        defaultValues: DEFAULT_FORM_VALUES,
    });

    const providerId = watch("providerId");
    const itemId = watch("itemId");

    const selectedProvider = extractedProviders.find((provider) => provider.id === providerId);
    const filteredItems = (selectedProvider?.items ?? []).filter((item) => item.parent_item_id);
    const selectedItem = filteredItems.find((item) => item.id === itemId);

    const providerOptions = extractedProviders.map((provider) => ({
        value: provider.id,
        label: provider.descriptor?.name || provider.id,
    }));

    const itemOptions = filteredItems.map((item) => ({
        value: item.id,
        label: item.descriptor?.name ? `${item.descriptor.name} (${item.id})` : item.id,
    }));

    const handlePaste = (payload: unknown) => {
        try {
            const data = payload as ICatalogPayload;
            const providers = data?.message?.catalog?.providers || [];
            if (providers.length === 0) {
                toast.error("No providers found in the payload.");
                return;
            }
            setExtractedProviders(providers);
            setValue("providerId", providers[0].id);
            setValue("itemId", "");
            toast.success("Payload parsed successfully!");
            setIsPayloadEditorActive(false);
        } catch (error) {
            toast.error("Failed to parse payload.");
            console.error(error);
        }
    };

    const onSubmit = async (data: IFormValues) => {
        const provider = extractedProviders.find((entry) => entry.id === data.providerId);
        const item = provider?.items?.find((entry) => entry.id === data.itemId);

        if (!provider) {
            toast.error("Please select a provider.");
            return;
        }
        if (!item) {
            toast.error("Please select an item.");
            return;
        }

        const formattedData = {
            order: {
                items: [
                    {
                        id: item.id,
                        parent_item_id: item.parent_item_id,
                    },
                ],
                provider: {
                    id: provider.id,
                },
            },
        };

        await submitEvent({
            jsonPath: {},
            formData: formattedData as unknown as Record<string, string>,
        });
    };

    return (
        <>
            {isPayloadEditorActive && (
                <PayloadEditor
                    onAdd={handlePaste}
                    onClose={() => setIsPayloadEditorActive(false)}
                />
            )}

            <FormDialogShell
                onSubmit={handleSubmit(onSubmit)}
                footer={
                    extractedProviders.length > 0 ? (
                        <Button type="submit">Confirm Selection and Proceed</Button>
                    ) : null
                }
            >
                <p className="text-sm text-text-secondary">
                    Select items from the provided on_search payload
                </p>

                <PastePayloadButton
                    onClick={() => setIsPayloadEditorActive(true)}
                    label={extractedProviders.length > 0 ? "Edit Payload" : "Paste Payload"}
                />

                {extractedProviders.length > 0 && (
                    <div className="space-y-4">
                        <Controller
                            name="providerId"
                            control={control}
                            render={({ field }) => (
                                <ComboBoxControl
                                    label="Provider"
                                    value={field.value}
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        setValue("itemId", "");
                                    }}
                                    options={providerOptions}
                                    placeholder="Select a provider"
                                />
                            )}
                        />

                        {selectedProvider && (
                            <Controller
                                name="itemId"
                                control={control}
                                render={({ field }) => (
                                    <ComboBoxControl
                                        label="Select Item"
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        options={itemOptions}
                                        placeholder="Select an item"
                                    />
                                )}
                            />
                        )}

                        {selectedItem && (
                            <div
                                className={cn(
                                    "rounded-lg border border-border-default bg-surface-muted/40 p-4"
                                )}
                            >
                                <h3 className="font-semibold text-text-primary">
                                    {selectedItem.descriptor?.name || selectedItem.id}
                                </h3>
                                <p className="font-mono text-xs text-text-secondary">
                                    ID: {selectedItem.id}
                                </p>
                                {selectedItem.parent_item_id && (
                                    <p className="mt-1 text-xs text-text-secondary">
                                        Parent:{" "}
                                        <span className="font-medium">
                                            {selectedItem.parent_item_id}
                                        </span>
                                    </p>
                                )}
                                {selectedItem.price && (
                                    <p className="mt-2 text-sm font-semibold text-text-primary">
                                        {selectedItem.price.currency} {selectedItem.price.value}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {extractedProviders.length === 0 && !isPayloadEditorActive && (
                    <div className="rounded-xl border border-dashed border-border-default bg-surface-muted/30 py-12 text-center">
                        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
                            <ClipboardDocumentIcon className="size-5" />
                        </div>
                        <h3 className="font-medium text-text-primary">No payload loaded</h3>
                        <p className="mt-1 text-sm text-text-secondary">
                            Paste an on_search payload to get started
                        </p>
                    </div>
                )}
            </FormDialogShell>
        </>
    );
}
