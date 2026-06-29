import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ComboBox } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import TextField from "@/components/Shadcn/TextField";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import { SubmitEventParams } from "@/types/flow-types";

interface IFormData {
    providerId: string;
    itemId: string;
    fulfillmentId: string;
}

interface IProvider {
    id: string;
    items: { id: string; name: string; fulfillment_ids: string[] }[];
    fulfillments: { id: string }[];
}

interface IOnSearchPayload {
    message?: {
        catalog?: {
            providers?: Array<{
                id: string;
                items?: Array<{
                    id: string;
                    descriptor?: { name?: string };
                    fulfillment_ids?: string[];
                }>;
                fulfillments?: Array<{ id: string }>;
            }>;
        };
    };
}

interface IRideHailingSelectProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}

export default function TRV10RideHailingSelectForm({ submitEvent }: IRideHailingSelectProps) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [providers, setProviders] = useState<IProvider[]>([]);

    const { control, handleSubmit, setValue, watch } = useForm<IFormData>({
        defaultValues: {
            providerId: "",
            itemId: "",
            fulfillmentId: "",
        },
    });

    const selectedProviderId = watch("providerId");
    const selectedItemId = watch("itemId");
    const selectedFulfillmentId = watch("fulfillmentId");

    const isFormValid = selectedProviderId && selectedItemId && selectedFulfillmentId;

    const selectedProvider = providers.find((p) => p.id === selectedProviderId);
    const availableItems = selectedProvider?.items || [];
    const selectedItem = availableItems.find((item) => item.id === selectedItemId);
    const availableFulfillments = selectedItem
        ? (selectedProvider?.fulfillments || []).filter((f) =>
              selectedItem.fulfillment_ids.includes(f.id)
          )
        : [];

    const handlePaste = (payload: unknown) => {
        try {
            const parsed = payload as IOnSearchPayload;
            if (!parsed?.message?.catalog?.providers) {
                throw new Error("Invalid Schema");
            }

            const catalogProviders = parsed.message.catalog.providers;

            const parsedProviders: IProvider[] = catalogProviders.map((provider) => ({
                id: provider.id,
                items: (provider.items || []).map((item) => ({
                    id: item.id,
                    name: item.descriptor?.name || item.id,
                    fulfillment_ids: item.fulfillment_ids || [],
                })),
                fulfillments: (provider.fulfillments || []).map((f) => ({
                    id: f.id,
                })),
            }));

            setProviders(parsedProviders);
            setErrorWhilePaste("");

            if (parsedProviders.length > 0) {
                setValue("providerId", parsedProviders[0].id);

                if (parsedProviders[0].items.length > 0) {
                    setValue("itemId", parsedProviders[0].items[0].id);

                    if (parsedProviders[0].items[0].fulfillment_ids.length > 0) {
                        setValue("fulfillmentId", parsedProviders[0].items[0].fulfillment_ids[0]);
                    }
                }

                toast.success(
                    `Found ${parsedProviders.length} provider(s) with ${parsedProviders[0].items.length} item(s)`
                );
            }
        } catch (err) {
            setErrorWhilePaste("Invalid payload structure.");
            toast.error("Invalid payload structure");
            console.error(err);
        }

        setIsPayloadEditorActive(false);
    };

    const onSubmit = async (data: IFormData) => {
        const finalPayload = {
            provider: data.providerId,
            item: data.itemId,
            fulfillment: data.fulfillmentId,
        };

        await submitEvent({
            jsonPath: {},
            formData: {
                data: JSON.stringify(finalPayload),
            },
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
                    <Button type="submit" disabled={!isFormValid}>
                        Submit
                    </Button>
                }
            >
                {errorWhilePaste && <p className="text-sm text-destructive">{errorWhilePaste}</p>}

                <div className="flex items-center gap-2">
                    <PastePayloadButton
                        label="Paste on_search"
                        onClick={() => setIsPayloadEditorActive(true)}
                        className="mb-0"
                    />
                    <span className="text-sm font-semibold text-destructive">
                        Paste the on_search payload to select Item, Provider, and Fulfillment
                    </span>
                </div>

                <div className="space-y-2 rounded-lg border border-border p-4">
                    {providers.length > 0 ? (
                        <ComboBox
                            control={control}
                            name="providerId"
                            label="Select Provider ID"
                            required
                            options={providers.map((provider) => provider.id)}
                            onValueChange={() => {
                                setValue("itemId", "");
                                setValue("fulfillmentId", "");
                            }}
                        />
                    ) : (
                        <TextField
                            control={control}
                            name="providerId"
                            label="Select Provider ID"
                            placeholder="Provider Id"
                        />
                    )}

                    {availableItems.length > 0 ? (
                        <ComboBox
                            control={control}
                            name="itemId"
                            label="Select Item ID"
                            required
                            options={availableItems.map((item) => ({
                                label: item.id,
                                value: item.id,
                            }))}
                            onValueChange={() => {
                                setValue("fulfillmentId", "");
                            }}
                        />
                    ) : (
                        <TextField
                            control={control}
                            name="itemId"
                            label="Select Item ID"
                            placeholder="Item Id"
                        />
                    )}

                    {availableFulfillments.length > 0 ? (
                        <ComboBox
                            control={control}
                            name="fulfillmentId"
                            label="Select Fulfillment ID"
                            required
                            options={availableFulfillments.map((f) => f.id)}
                        />
                    ) : (
                        <TextField
                            control={control}
                            name="fulfillmentId"
                            label="Select Fulfillment ID"
                            placeholder="Fulfillment Id"
                        />
                    )}
                </div>
            </FormDialogShell>
        </>
    );
}
