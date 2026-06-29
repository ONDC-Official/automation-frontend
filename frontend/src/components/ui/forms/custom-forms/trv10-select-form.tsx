import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { ComboBoxControl } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import TextField from "@/components/Shadcn/TextField";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import { SubmitEventParams } from "@/types/flow-types";
import { cn } from "@/lib/utils";

interface IAddOnInfo {
    id: string;
    maxQuantity: number;
}

interface IExtractedItem {
    itemid: string;
    providerid: string;
    addOns: IAddOnInfo[];
}

type AddOnSelection = { id: string; quantity: number };

type FormItem = {
    itemId: string;
    count: number;
    addOns: AddOnSelection[];
    providerid: string;
};

type FormValues = {
    provider: string;
    items: FormItem[];
};

type CatalogAddOn = { id: string; quantity?: { maximum?: { count?: number } } };
type CatalogItem = { id: string; add_ons?: CatalogAddOn[] };
type CatalogProvider = { id: string; items?: CatalogItem[] };
type OnSearchPayload = { message?: { catalog?: { providers?: CatalogProvider[] } } };

export default function TRV10SelectForm({
    submitEvent,
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [itemOptions, setItemOptions] = useState<IExtractedItem[]>([]);
    const [addOnPickerKeys, setAddOnPickerKeys] = useState<Record<number, number>>({});

    const { control, handleSubmit, watch, setValue, getValues } = useForm<FormValues>({
        defaultValues: {
            provider: "",
            items: [{ itemId: "", count: 1, addOns: [], providerid: "" }],
        },
    });

    const { fields, append, remove } = useFieldArray<FormValues, "items">({
        control,
        name: "items",
    });

    const selectedItems = watch("items");

    const itemComboOptions = itemOptions.map((option) => ({
        value: option.itemid,
        label: option.itemid,
    }));

    const onSubmit = async (data: FormValues) => {
        const formattedData = {
            ...data,
            items: data.items.map((item) => ({
                ...item,
                addOns: item.addOns.map((addon) => ({
                    id: addon.id,
                    quantity: addon.quantity,
                })),
            })),
        };
        await submitEvent({
            jsonPath: {},
            formData: formattedData as unknown as Record<string, string>,
        });
    };

    const handlePaste = (payload: unknown) => {
        try {
            const parsed = payload as OnSearchPayload;
            if (!parsed?.message?.catalog?.providers) return;

            const providers = parsed.message.catalog.providers;
            const results: IExtractedItem[] = [];

            providers.forEach((provider) => {
                if (!provider.items) return;
                provider.items.forEach((item) => {
                    results.push({
                        itemid: item.id,
                        providerid: provider.id,
                        addOns: (item.add_ons || []).map((addon) => ({
                            id: addon.id,
                            maxQuantity: addon.quantity?.maximum?.count || 10,
                        })),
                    });
                });
            });

            setItemOptions(results);
            setErrorWhilePaste("");
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
            setValue(`items.${index}.addOns`, []);
            setValue(`items.${index}.providerid`, selectedOption.providerid);
        }
    };

    const handleAddOnPick = (index: number, addOnId: string) => {
        if (!addOnId) return;

        const prev = getValues(`items.${index}.addOns`) || [];
        if (!prev.some((addon) => addon.id === addOnId)) {
            setValue(`items.${index}.addOns`, [...prev, { id: addOnId, quantity: 1 }]);
        }

        setAddOnPickerKeys((current) => ({
            ...current,
            [index]: (current[index] ?? 0) + 1,
        }));
    };

    const updateAddOnQuantity = (
        index: number,
        addOnId: string,
        newQty: number,
        maxQty: number
    ) => {
        if (newQty > maxQty) {
            toast.error(`Max quantity for ${addOnId} is ${maxQty}`);
            return;
        }

        const currentAddOns = getValues(`items.${index}.addOns`);
        setValue(
            `items.${index}.addOns`,
            currentAddOns.map((addon) =>
                addon.id === addOnId ? { ...addon, quantity: newQty } : addon
            )
        );
    };

    const removeAddOn = (index: number, addOnId: string) => {
        const currentAddOns = getValues(`items.${index}.addOns`);
        setValue(
            `items.${index}.addOns`,
            currentAddOns.filter((addon) => addon.id !== addOnId)
        );
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

                {fields.map((field, index) => {
                    const currentItemId = selectedItems[index]?.itemId;
                    const selectedExtracted = itemOptions.find(
                        (opt) => opt.itemid === currentItemId
                    );
                    const addOnComboOptions =
                        selectedExtracted?.addOns.map((addon) => ({
                            value: addon.id,
                            label: addon.id,
                        })) ?? [];

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

                            {selectedExtracted && selectedExtracted.addOns.length > 0 && (
                                <div className="space-y-2">
                                    <ComboBoxControl
                                        key={`addon-picker-${index}-${addOnPickerKeys[index] ?? 0}`}
                                        label="Add Ons"
                                        value=""
                                        onValueChange={(value) => handleAddOnPick(index, value)}
                                        options={addOnComboOptions}
                                        placeholder="Select add-on..."
                                    />

                                    <div className="flex flex-col gap-2">
                                        {selectedItems[index]?.addOns?.map((selectedAddOn) => {
                                            const addOnInfo = selectedExtracted.addOns.find(
                                                (addon) => addon.id === selectedAddOn.id
                                            );
                                            const maxQty = addOnInfo?.maxQuantity ?? 0;

                                            return (
                                                <div
                                                    key={selectedAddOn.id}
                                                    className="flex flex-wrap items-center gap-2 rounded-md border border-border-default bg-surface-muted/40 p-2"
                                                >
                                                    <span className="flex-1 text-sm font-medium text-text-primary">
                                                        {selectedAddOn.id}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-text-secondary">
                                                            Qty:
                                                        </span>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={maxQty}
                                                            value={selectedAddOn.quantity}
                                                            onChange={(e) =>
                                                                updateAddOnQuantity(
                                                                    index,
                                                                    selectedAddOn.id,
                                                                    Number(e.target.value),
                                                                    maxQty
                                                                )
                                                            }
                                                            className={cn(
                                                                "h-8 w-16 rounded-md border border-border-default bg-surface-default px-2 text-sm",
                                                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            )}
                                                        />
                                                        <span className="text-xs text-text-secondary">
                                                            (Max: {maxQty})
                                                        </span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        className="text-destructive"
                                                        onClick={() =>
                                                            removeAddOn(index, selectedAddOn.id)
                                                        }
                                                        aria-label={`Remove ${selectedAddOn.id}`}
                                                    >
                                                        <XMarkIcon className="size-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ itemId: "", count: 1, addOns: [], providerid: "" })}
                    >
                        <PlusIcon className="size-4" />
                        Add Item
                    </Button>
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
            </FormDialogShell>
        </>
    );
}
