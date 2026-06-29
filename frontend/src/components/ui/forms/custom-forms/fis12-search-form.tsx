import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ClipboardDocumentIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { ComboBoxControl } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import { SubmitEventParams } from "@/types/flow-types";
import { cn } from "@/lib/utils";

const uuidv4 = (): string =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
        const random = (Math.random() * 16) | 0;
        const value = char === "x" ? random : (random & 0x3) | 0x8;
        return value.toString(16);
    });

interface IDescriptor {
    name?: string;
    code?: string;
    short_desc?: string;
    long_desc?: string;
}

interface IXInputForm {
    id: string;
    mime_type?: string;
    url?: string;
    multiple_sumbissions?: boolean;
    resubmit?: boolean;
}

interface IXInputHead {
    descriptor?: { name?: string };
    headings?: string[];
    index?: { cur: number; max: number; min: number };
}

interface IXInput {
    form: IXInputForm;
    head?: IXInputHead;
    required?: boolean;
}

interface IItem {
    id: string;
    descriptor?: IDescriptor;
    category_ids?: string[];
    xinput?: IXInput;
    [key: string]: unknown;
}

interface IProvider {
    id: string;
    descriptor?: IDescriptor & { images?: { url: string; size_type?: string }[] };
    items?: IItem[];
    categories?: { id: string; descriptor?: IDescriptor; parent_category_id?: string }[];
    [key: string]: unknown;
}

interface IFormValues {
    providerId: string;
    itemId: string;
}

interface ICatalogPayload {
    message?: {
        catalog?: {
            providers?: IProvider[];
        };
    };
}

export default function FIS12SearchForm({
    submitEvent,
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [extractedProviders, setExtractedProviders] = useState<IProvider[]>([]);

    const { control, handleSubmit, setValue, watch } = useForm<IFormValues>({
        defaultValues: {
            providerId: "",
            itemId: "",
        },
    });

    const providerId = watch("providerId");
    const itemId = watch("itemId");

    const selectedProvider = extractedProviders.find((provider) => provider.id === providerId);
    const providerItems = selectedProvider?.items ?? [];
    const selectedItem = providerItems.find((item) => item.id === itemId);

    const providerOptions = extractedProviders.map((provider) => ({
        value: provider.id,
        label: provider.descriptor?.name || provider.id,
    }));

    const itemOptions = providerItems.map((item) => ({
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

    const handleReset = () => {
        setExtractedProviders([]);
        setValue("providerId", "");
        setValue("itemId", "");
        setIsPayloadEditorActive(true);
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
            provider: {
                id: provider.id,
                items: [
                    {
                        id: item.id,
                        xinput: {
                            form: {
                                id: item.xinput?.form?.id || "",
                            },
                            form_response: {
                                status: "SUCCESS",
                                submission_id: uuidv4(),
                            },
                        },
                    },
                ],
            },
        };

        await submitEvent({
            jsonPath: {},
            formData: formattedData as unknown as Record<string, string>,
        });
    };

    return (
        <>
            {isPayloadEditorActive && <PayloadEditor onAdd={handlePaste} />}

            <FormDialogShell
                onSubmit={handleSubmit(onSubmit)}
                footer={
                    extractedProviders.length > 0 ? (
                        <Button type="submit">Confirm Selection and Proceed</Button>
                    ) : null
                }
            >
                <p className="text-sm text-text-secondary">
                    Select provider and item from the on_search payload
                </p>

                <div className="flex flex-wrap gap-2">
                    {extractedProviders.length > 0 && (
                        <Button type="button" variant="outline" onClick={handleReset}>
                            <PencilSquareIcon className="size-4" />
                            Edit Payload
                        </Button>
                    )}
                    <PastePayloadButton
                        onClick={() => setIsPayloadEditorActive((prev) => !prev)}
                        label={isPayloadEditorActive ? "Close Editor" : "Paste Payload"}
                    />
                </div>

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
                                {selectedItem.category_ids &&
                                    selectedItem.category_ids.length > 0 && (
                                        <p className="mt-1 text-xs text-text-secondary">
                                            Categories:{" "}
                                            <span className="font-medium">
                                                {selectedItem.category_ids.join(", ")}
                                            </span>
                                        </p>
                                    )}
                                {selectedItem.xinput?.form?.id && (
                                    <p className="mt-1 text-xs text-text-secondary">
                                        Form ID:{" "}
                                        <span className="font-medium">
                                            {selectedItem.xinput.form.id}
                                        </span>
                                    </p>
                                )}
                                {selectedItem.xinput?.head?.descriptor?.name && (
                                    <p className="mt-1 text-xs text-text-secondary">
                                        Form:{" "}
                                        <span className="font-medium">
                                            {selectedItem.xinput.head.descriptor.name}
                                        </span>
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
