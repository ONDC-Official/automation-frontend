import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";

import { ComboBoxControl } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import TextField from "@/components/Shadcn/TextField";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import { cn } from "@/lib/utils";
import type {
    IExtractedItem,
    IFormValues,
    ICatalogFulfillment,
    IOnSearchPayload,
    ITRV11SelectFormProps,
} from "../types/trv11-select-form-types";

export default function TRV11SelectForm({ submitEvent }: ITRV11SelectFormProps) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [itemOptions, setItemOptions] = useState<IExtractedItem[]>([]);
    const [fulfillmentOptions, setFulfillmentOptions] = useState<ICatalogFulfillment[]>([]);

    const { control, handleSubmit, register, setValue } = useForm<IFormValues>({
        defaultValues: {
            provider: "",
            items: [{ itemId: "", count: 1, addOns: [] }],
            fulfillment: "",
        },
    });

    const { fields, append, remove } = useFieldArray<IFormValues, "items">({
        control,
        name: "items",
    });

    const onSubmit = async (data: IFormValues) => {
        await submitEvent({ jsonPath: {}, formData: data as unknown as Record<string, string> });
    };

    const handlePaste = (payload: unknown) => {
        setErrorWhilePaste("");
        try {
            const parsed = payload as IOnSearchPayload;
            if (!parsed?.message?.catalog?.providers) {
                throw new Error("Invalid payload");
            }

            const providers = parsed.message.catalog.providers;
            const results: IExtractedItem[] = [];
            const allFulfillments: ICatalogFulfillment[] = [];

            providers.forEach((provider) => {
                if (provider.fulfillments) {
                    allFulfillments.push(...provider.fulfillments);
                }
                provider.items?.forEach((item) => {
                    results.push({ itemid: item.id, providerid: provider.id });
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

    const itemComboOptions = itemOptions.map((option) => ({
        value: option.itemid,
        label: option.itemid,
    }));

    const fulfillmentComboOptions = fulfillmentOptions.map((option) => ({
        value: option.id,
        label: option.type ? `${option.id} (${option.type})` : option.id,
    }));

    return (
        <>
            {isPayloadEditorActive && <PayloadEditor onAdd={handlePaste} />}

            <FormDialogShell
                onSubmit={handleSubmit(onSubmit)}
                footer={<Button type="submit">Submit</Button>}
            >
                <PastePayloadButton onClick={() => setIsPayloadEditorActive(true)} />
                {errorWhilePaste && <p className="text-sm text-destructive">{errorWhilePaste}</p>}

                {fields.map((field, index) => (
                    <div
                        key={field.id}
                        className="space-y-3 rounded-lg border border-border-default p-4"
                    >
                        {itemOptions.length === 0 ? (
                            <TextField
                                control={control}
                                name={`items.${index}.itemId`}
                                label={`Select Item ${index + 1}`}
                                placeholder="Item ID"
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
                                            const selected = itemOptions.find(
                                                (opt) => opt.itemid === value
                                            );
                                            if (selected) {
                                                setValue("provider", selected.providerid);
                                            }
                                        }}
                                        options={itemComboOptions}
                                        placeholder="Select item"
                                    />
                                )}
                            />
                        )}

                        <TextField
                            control={control}
                            name={`items.${index}.count`}
                            label="Quantity"
                            type="number"
                            required
                        />
                    </div>
                ))}

                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ itemId: "", count: 1, location: "" })}
                    >
                        <PlusIcon className="size-4" />
                        Add Item
                    </Button>
                    {fields.length > 1 && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => remove(fields.length - 1)}
                        >
                            <MinusIcon className="size-4" />
                            Remove Item
                        </Button>
                    )}
                </div>

                <div className={cn("space-y-3 rounded-lg border border-border-default p-4")}>
                    {fulfillmentOptions.length === 0 ? (
                        <TextField
                            register={register}
                            name="fulfillment"
                            label="Select Fulfillment"
                            placeholder="Fulfillment ID"
                        />
                    ) : (
                        <Controller
                            name="fulfillment"
                            control={control}
                            render={({ field }) => (
                                <ComboBoxControl
                                    label="Select Fulfillment"
                                    value={field.value ?? ""}
                                    onValueChange={field.onChange}
                                    options={fulfillmentComboOptions}
                                    placeholder="Select fulfillment"
                                />
                            )}
                        />
                    )}
                </div>
            </FormDialogShell>
        </>
    );
}
