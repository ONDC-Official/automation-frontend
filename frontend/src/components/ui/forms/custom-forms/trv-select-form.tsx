import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { PlusIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { ComboBoxControl } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import TextField from "@/components/Shadcn/TextField";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import type {
    IExtractedItem,
    IFormValues,
    IOnSearchPayload,
    ICatalogFulfillment,
    ITRVSelectFormProps,
} from "../types/trv-select-form-types";

const FLOWS_WITH_ADD_ITEM_BUTTON: string[] = [
    "purchase_journey_with_form_Multiple_Tickets",
    "purchase_journey_without_form_Multiple_Tickets",
    "user_cancellation_partial",
];

export default function TRVSelectForm({ submitEvent, flowId }: ITRVSelectFormProps) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [itemOptions, setItemOptions] = useState<IExtractedItem[]>([]);
    const [fulfillmentOptions, setFulfillmentOptions] = useState<ICatalogFulfillment[]>([]);
    const [addOnPickerKeys, setAddOnPickerKeys] = useState<Record<number, number>>({});

    const { control, handleSubmit, watch, setValue, getValues } = useForm<IFormValues>({
        defaultValues: {
            provider: "",
            items: [{ itemId: "", count: 1, addOns: [], addOnsQuantity: 1 }],
            fulfillmentId: "",
        },
    });

    const { fields, append, remove } = useFieldArray<IFormValues, "items">({
        control,
        name: "items",
    });

    const selectedItems = watch("items");
    const selectedItemIds = selectedItems.map((item) => item.itemId).filter((id) => id !== "");

    const filteredFulfillmentOptions =
        selectedItemIds.length === 0
            ? []
            : fulfillmentOptions.filter((fulfillment) =>
                  selectedItemIds.every((itemId) => {
                      const itemOpt = itemOptions.find((opt) => opt.itemid === itemId);
                      return itemOpt?.fulfillmentIds.includes(fulfillment.id);
                  })
              );

    const fulfillmentComboOptions = filteredFulfillmentOptions.map((fulfillment) => ({
        value: fulfillment.id,
        label: fulfillment.type ? `${fulfillment.id} (${fulfillment.type})` : fulfillment.id,
    }));

    const itemComboOptions = itemOptions.map((option) => ({
        value: option.itemid,
        label: option.itemid,
    }));

    const onSubmit = async (data: IFormValues) => {
        const selectedFulfillment = fulfillmentOptions.find((f) => f.id === data.fulfillmentId);
        const output = {
            provider: data.provider,
            items: data.items,
            fulfillments: selectedFulfillment
                ? [
                      {
                          id: selectedFulfillment.id,
                          stops: (selectedFulfillment.stops || []).map((stop) => ({
                              type: stop.type,
                              time: stop.time,
                          })),
                      },
                  ]
                : [],
        };
        await submitEvent({ jsonPath: {}, formData: output as unknown as Record<string, string> });
    };

    const handlePaste = (payload: unknown) => {
        setErrorWhilePaste("");
        try {
            const parsed = payload as IOnSearchPayload;
            if (!parsed?.message?.catalog?.providers) return;

            const providers = parsed.message.catalog.providers;
            const results: IExtractedItem[] = [];
            const allFulfillments: ICatalogFulfillment[] = [];

            providers.forEach((provider) => {
                if (provider.fulfillments) {
                    allFulfillments.push(...provider.fulfillments);
                }
                if (!provider.items) return;

                provider.items.forEach((item) => {
                    if (item.parent_item_id) {
                        results.push({
                            itemid: item.id,
                            parentItemId: item.parent_item_id,
                            providerid: provider.id,
                            addOns: (item.add_ons || []).map((addon) => addon.id),
                            fulfillmentIds: item.fulfillment_ids || [],
                        });
                    }
                });
            });

            setItemOptions(results);
            setFulfillmentOptions(allFulfillments);
        } catch (err) {
            setErrorWhilePaste("Invalid payload structure.");
            toast.error("Invalid payload structure. Please check the pasted data.");
            console.error(err);
        }
        setIsPayloadEditorActive(false);
    };

    const handleItemChange = (index: number, selectedId: string) => {
        const selectedOption = itemOptions.find((opt) => opt.itemid === selectedId);
        setValue(`items.${index}.itemId`, selectedId);

        if (selectedOption) {
            setValue(`items.${index}.parentItemId`, selectedOption.parentItemId);
            setValue("provider", selectedOption.providerid);
            setValue(`items.${index}.addOns`, []);

            const currentFulfillmentId = getValues("fulfillmentId");
            if (
                currentFulfillmentId &&
                !selectedOption.fulfillmentIds.includes(currentFulfillmentId)
            ) {
                setValue("fulfillmentId", "");
            }
        } else {
            setValue("fulfillmentId", "");
        }
    };

    const handleAddOnPick = (index: number, addOnId: string) => {
        if (!addOnId) return;

        const prev = getValues(`items.${index}.addOns`) ?? [];
        if (!prev.includes(addOnId)) {
            setValue(`items.${index}.addOns`, [...prev, addOnId]);
        }

        setAddOnPickerKeys((current) => ({
            ...current,
            [index]: (current[index] ?? 0) + 1,
        }));
    };

    return (
        <>
            {isPayloadEditorActive && <PayloadEditor onAdd={handlePaste} />}

            <FormDialogShell
                onSubmit={handleSubmit(onSubmit)}
                footer={<Button type="submit">Submit</Button>}
            >
                <PastePayloadButton onClick={() => setIsPayloadEditorActive(true)} />
                {errorWhilePaste && <p className="text-sm text-destructive">{errorWhilePaste}</p>}
                {itemOptions.length === 0 && (
                    <p className="text-sm text-destructive">
                        Please paste the on_search payload containing item details. Once available,
                        the item ID field will appear in the form for selection.
                    </p>
                )}

                {fields.map((field, index) => {
                    const currentItemId = selectedItems[index]?.itemId;
                    const selectedExtracted = itemOptions.find(
                        (opt) => opt.itemid === currentItemId
                    );
                    const availableAddOns = selectedExtracted?.addOns ?? [];
                    const addOnComboOptions = availableAddOns.map((addonId) => ({
                        value: addonId,
                        label: addonId,
                    }));

                    return (
                        <div
                            key={field.id}
                            className="space-y-3 rounded-lg border border-border-default p-3"
                        >
                            {itemOptions.length === 0 ? (
                                <TextField
                                    control={control}
                                    name={`items.${index}.itemId`}
                                    label={`Select Item ${index + 1}`}
                                    placeholder="Paste on_search payload first"
                                />
                            ) : (
                                <Controller
                                    name={`items.${index}.itemId`}
                                    control={control}
                                    render={({ field: itemField }) => (
                                        <ComboBoxControl
                                            label={`Select Item ${index + 1}`}
                                            value={itemField.value}
                                            onValueChange={(value) => {
                                                itemField.onChange(value);
                                                handleItemChange(index, value);
                                            }}
                                            options={itemComboOptions}
                                            placeholder="Select..."
                                        />
                                    )}
                                />
                            )}

                            <TextField
                                control={control}
                                name={`items.${index}.count`}
                                label="Quantity"
                                type="number"
                                min={1}
                                required
                            />

                            {availableAddOns.length > 0 && (
                                <div className="space-y-2">
                                    <ComboBoxControl
                                        key={`addon-picker-${index}-${addOnPickerKeys[index] ?? 0}`}
                                        label="Add Ons"
                                        value=""
                                        onValueChange={(value) => handleAddOnPick(index, value)}
                                        options={addOnComboOptions}
                                        placeholder="Select add-on..."
                                    />

                                    {selectedItems[index]?.addOns?.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedItems[index].addOns.map((addonId) => (
                                                <span
                                                    key={addonId}
                                                    className="rounded-md bg-surface-muted px-2 py-1 text-sm text-text-primary"
                                                >
                                                    {addonId}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {selectedItems[index]?.addOns?.length > 0 && (
                                        <TextField
                                            control={control}
                                            name={`items.${index}.addOnsQuantity`}
                                            label="Add Ons Quantity"
                                            type="number"
                                            min={1}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                <div className="flex flex-wrap gap-2">
                    {flowId && FLOWS_WITH_ADD_ITEM_BUTTON.includes(flowId) && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                append({ itemId: "", count: 1, addOns: [], addOnsQuantity: 1 })
                            }
                        >
                            <PlusIcon className="size-4" />
                            Add Item
                        </Button>
                    )}
                    {fields.length > 1 && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            onClick={() => remove(fields.length - 1)}
                        >
                            Remove Item
                        </Button>
                    )}
                </div>

                <div className="space-y-3 rounded-lg border border-border-default p-3">
                    {fulfillmentOptions.length === 0 ? (
                        <TextField
                            control={control}
                            name="fulfillmentId"
                            label="Select Fulfillment"
                            placeholder="Fulfillment ID"
                        />
                    ) : (
                        <Controller
                            name="fulfillmentId"
                            control={control}
                            render={({ field }) => (
                                <ComboBoxControl
                                    label="Select Fulfillment"
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    options={fulfillmentComboOptions}
                                    placeholder="Select fulfillment..."
                                />
                            )}
                        />
                    )}
                    {selectedItemIds.length > 0 && filteredFulfillmentOptions.length === 0 && (
                        <p className="text-xs text-destructive">
                            No fulfillments available for the selected items.
                        </p>
                    )}
                </div>
            </FormDialogShell>
        </>
    );
}
