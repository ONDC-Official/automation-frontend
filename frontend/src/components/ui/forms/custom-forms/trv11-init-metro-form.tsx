import { useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { PlusIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { ComboBoxControl } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import TextField from "@/components/Shadcn/TextField";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import { SubmitEventParams } from "@/types/flow-types";

interface ICatalogItem {
    id: string;
    descriptor: { code: string; name: string };
    price: { currency: string; value: string };
    quantity: {
        minimum: { count: number };
        maximum: { count: number };
    };
}

type FormItem = {
    itemId: string;
    count: number;
};

type FormValues = {
    billingName: string;
    billingEmail: string;
    billingPhone: string;
    items: FormItem[];
};

type OnSearchPayload = {
    message?: {
        catalog?: {
            providers?: Array<{
                id: string;
                items?: ICatalogItem[];
            }>;
        };
    };
};

const getItemConstraints = (catalogItems: ICatalogItem[], itemId: string) => {
    const item = catalogItems.find((entry) => entry.id === itemId);
    return {
        min: item?.quantity?.minimum?.count ?? 1,
        max: item?.quantity?.maximum?.count ?? 99,
    };
};

export default function TRV11InitMetroForm({
    submitEvent,
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [catalogItems, setCatalogItems] = useState<ICatalogItem[]>([]);

    const { control, handleSubmit } = useForm<FormValues>({
        defaultValues: {
            billingName: "",
            billingEmail: "",
            billingPhone: "",
            items: [{ itemId: "", count: 1 }],
        },
    });

    const { fields, append, remove } = useFieldArray<FormValues, "items">({
        control,
        name: "items",
    });

    const watchedItems = useWatch({ control, name: "items" });

    const catalogOptions = catalogItems.map((item) => ({
        value: item.id,
        label: `${item.descriptor.name} (${item.id}) — ₹${item.price.value}`,
    }));

    const onSubmit = async (data: FormValues) => {
        const validItems = data.items.filter((item) => item.itemId !== "");
        if (validItems.length === 0) {
            toast.error("Please select at least one item.");
            return;
        }

        const output = {
            billing: {
                name: data.billingName,
                email: data.billingEmail,
                phone: data.billingPhone,
            },
            items: validItems.map((item) => ({
                id: item.itemId,
                quantity: {
                    selected: {
                        count: item.count,
                    },
                },
            })),
        };

        await submitEvent({
            jsonPath: {},
            formData: output as unknown as Record<string, string>,
        });
    };

    const handlePaste = (payload: unknown) => {
        try {
            const parsed = payload as OnSearchPayload;
            if (!parsed?.message?.catalog?.providers) {
                setErrorWhilePaste("Invalid payload: no providers found.");
                toast.error("Invalid payload: no providers found.");
                return;
            }

            const allItems: ICatalogItem[] = [];
            parsed.message.catalog.providers.forEach((provider) => {
                provider.items?.forEach((item) => allItems.push(item));
            });

            if (allItems.length === 0) {
                setErrorWhilePaste("No items found in the payload.");
                toast.error("No items found in the payload.");
                return;
            }

            setCatalogItems(allItems);
            setErrorWhilePaste("");
            toast.success(`Found ${allItems.length} item(s) from payload.`);
        } catch (err) {
            setErrorWhilePaste("Invalid payload structure.");
            toast.error("Invalid payload structure. Please check the pasted data.");
            console.error(err);
        }
        setIsPayloadEditorActive(false);
    };

    return (
        <>
            {isPayloadEditorActive && <PayloadEditor onAdd={handlePaste} />}

            <FormDialogShell
                onSubmit={handleSubmit(onSubmit)}
                footer={<Button type="submit">Submit</Button>}
            >
                <PastePayloadButton
                    onClick={() => setIsPayloadEditorActive(true)}
                    label="Paste on_search"
                />
                <p className="text-sm text-text-secondary">
                    Paste the <strong>on_search</strong> payload to auto-populate the item list
                    below.
                </p>
                {errorWhilePaste && <p className="text-sm text-destructive">{errorWhilePaste}</p>}

                <div className="space-y-3 rounded-lg border border-border-default p-4">
                    <h3 className="text-sm font-semibold text-text-primary">Billing Details</h3>
                    <TextField
                        control={control}
                        name="billingName"
                        label="Name"
                        placeholder="Enter billing name"
                        required
                    />
                    <TextField
                        control={control}
                        name="billingEmail"
                        label="Email"
                        type="email"
                        placeholder="Enter billing email"
                        required
                    />
                    <TextField
                        control={control}
                        name="billingPhone"
                        label="Phone"
                        type="tel"
                        placeholder="Enter billing phone"
                        required
                    />
                </div>

                <div className="space-y-3 rounded-lg border border-border-default p-4">
                    <h3 className="text-sm font-semibold text-text-primary">Select Items</h3>

                    {fields.map((field, index) => {
                        const itemId = watchedItems?.[index]?.itemId ?? "";
                        const constraints = getItemConstraints(catalogItems, itemId);

                        return (
                            <div
                                key={field.id}
                                className="space-y-3 rounded-md border border-border-default bg-surface-muted/40 p-3"
                            >
                                {catalogItems.length === 0 ? (
                                    <TextField
                                        control={control}
                                        name={`items.${index}.itemId`}
                                        label={`Item ${index + 1}`}
                                        placeholder="Paste payload first or enter item ID"
                                    />
                                ) : (
                                    <Controller
                                        name={`items.${index}.itemId`}
                                        control={control}
                                        render={({ field: itemField }) => (
                                            <ComboBoxControl
                                                label={`Item ${index + 1}`}
                                                value={itemField.value}
                                                onValueChange={itemField.onChange}
                                                options={catalogOptions}
                                                placeholder="Select an item..."
                                            />
                                        )}
                                    />
                                )}

                                <TextField
                                    control={control}
                                    name={`items.${index}.count`}
                                    label="Quantity"
                                    type="number"
                                    min={constraints.min}
                                    max={constraints.max}
                                    required
                                />

                                {fields.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive"
                                        onClick={() => remove(index)}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </div>
                        );
                    })}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ itemId: "", count: 1 })}
                    >
                        <PlusIcon className="size-4" />
                        Add Item
                    </Button>
                </div>
            </FormDialogShell>
        </>
    );
}
