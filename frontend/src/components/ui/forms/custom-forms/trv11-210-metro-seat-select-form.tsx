import { useState } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { ComboBoxControl } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import { Input } from "@/components/Shadcn/TextField/input";
import { Field, FieldLabel } from "@/components/Shadcn/TextField/field";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import { cn } from "@/lib/utils";
import type {
    IItem,
    ISelectedItem,
    ITrv11210MetroSelectFormProps,
} from "../types/trv11-210-metro-seat-select-form-types";
import { DEFAULT_SELECTED_ITEMS } from "../types/trv11-210-metro-seat-select-form-types";

export default function Trv11210MetroSelectForm({ submitEvent }: ITrv11210MetroSelectFormProps) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [items, setItems] = useState<IItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<ISelectedItem[]>(DEFAULT_SELECTED_ITEMS);

    const selectedItemIds = selectedItems.map((item) => item.itemId).filter(Boolean);

    const isFormValid =
        selectedItems.length > 0 && selectedItems.every((item) => item.itemId && item.itemQuantity);

    const getAvailableItems = (currentIndex: number) => {
        const currentItemId = selectedItems[currentIndex]?.itemId;
        return items.filter(
            (item) => !selectedItemIds.includes(item.id) || item.id === currentItemId
        );
    };

    const getQuantityOptions = (itemId: string) => {
        const item = items.find((entry) => entry.id === itemId);
        if (!item) return [];
        return Array.from(
            { length: item.maxQuantity - item.minQuantity + 1 },
            (_, index) => item.minQuantity + index
        );
    };

    const handleItemChange = (index: number, itemId: string) => {
        const nextSelectedItems = [...selectedItems];
        nextSelectedItems[index].itemId = itemId;

        const item = items.find((entry) => entry.id === itemId);
        nextSelectedItems[index].itemQuantity = item ? String(item.minQuantity) : "";

        setSelectedItems(nextSelectedItems);
    };

    const handleQuantityChange = (index: number, quantity: string) => {
        const nextSelectedItems = [...selectedItems];
        nextSelectedItems[index].itemQuantity = quantity;
        setSelectedItems(nextSelectedItems);
    };

    const addItem = () => {
        const usedIds = selectedItems.map((item) => item.itemId).filter(Boolean);
        const availableCount = items.filter((item) => !usedIds.includes(item.id)).length;

        if (availableCount === 0) {
            toast.warning("No more items available to add");
            return;
        }

        setSelectedItems([...selectedItems, { itemId: "", itemQuantity: "" }]);
    };

    const removeItem = (index: number) => {
        if (selectedItems.length === 1) {
            toast.warning("At least one item is required");
            return;
        }
        setSelectedItems(selectedItems.filter((_, itemIndex) => itemIndex !== index));
    };

    const handlePaste = (payload: unknown) => {
        try {
            const parsed = payload as {
                message?: { catalog?: { providers?: Array<{ items?: unknown[] }> } };
            };

            if (!parsed?.message?.catalog?.providers) {
                throw new Error("Invalid Schema");
            }

            const catalogProviders = parsed.message.catalog.providers;
            const parsedItems: IItem[] = [];

            catalogProviders.forEach((provider) => {
                (provider.items || []).forEach((rawItem) => {
                    const item = rawItem as {
                        id: string;
                        descriptor?: { name?: string };
                        quantity?: { maximum?: { count?: number }; minimum?: { count?: number } };
                    };
                    parsedItems.push({
                        id: item.id,
                        name: item.descriptor?.name || item.id,
                        maxQuantity: item.quantity?.maximum?.count || 1,
                        minQuantity: item.quantity?.minimum?.count || 1,
                    });
                });
            });

            setItems(parsedItems);
            setErrorWhilePaste("");

            if (parsedItems.length > 0) {
                setSelectedItems([
                    {
                        itemId: parsedItems[0].id,
                        itemQuantity: String(parsedItems[0].minQuantity),
                    },
                ]);
                toast.success(`Found ${parsedItems.length} item(s)`);
            }
        } catch (error) {
            setErrorWhilePaste("Invalid payload structure.");
            toast.error("Invalid payload structure");
            console.error(error);
        }

        setIsPayloadEditorActive(false);
    };

    const handleFormSubmit = async () => {
        const invalidItems = selectedItems.filter((item) => !item.itemId || !item.itemQuantity);

        if (invalidItems.length > 0) {
            toast.error("Please fill in all fields for each item");
            return;
        }

        const finalPayload = {
            items: selectedItems.map((item) => ({
                itemId: item.itemId,
                itemQuantity: parseInt(item.itemQuantity, 10),
            })),
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
            {isPayloadEditorActive && <PayloadEditor onAdd={handlePaste} />}

            <FormDialogShell
                onSubmit={(event) => {
                    event.preventDefault();
                    void handleFormSubmit();
                }}
                footer={
                    <Button type="submit" disabled={!isFormValid}>
                        Submit
                    </Button>
                }
            >
                <PastePayloadButton onClick={() => setIsPayloadEditorActive(true)} />

                <p className="text-sm font-medium text-destructive">
                    Paste the second on_search payload to select Item and Quantity
                </p>

                {errorWhilePaste && <p className="text-sm text-destructive">{errorWhilePaste}</p>}

                {selectedItems.map((selectedItem, index) => {
                    const availableItems = getAvailableItems(index);
                    const quantityOptions = getQuantityOptions(selectedItem.itemId);

                    return (
                        <div
                            key={`item-row-${index}`}
                            className={cn(
                                "relative space-y-3 rounded-lg border border-border-default p-4"
                            )}
                        >
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm font-semibold text-text-primary">
                                    Item {index + 1}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => removeItem(index)}
                                    title="Remove item"
                                    aria-label="Remove item"
                                >
                                    <TrashIcon className="size-4 text-destructive" />
                                </Button>
                            </div>

                            {items.length > 0 ? (
                                <ComboBoxControl
                                    label="Select Item ID"
                                    required
                                    value={selectedItem.itemId}
                                    onValueChange={(value) => handleItemChange(index, value)}
                                    options={availableItems.map((item) => ({
                                        value: item.id,
                                        label: item.id,
                                    }))}
                                    placeholder="Select an item"
                                />
                            ) : (
                                <Field>
                                    <FieldLabel className="font-semibold">
                                        Select Item ID <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <Input
                                        placeholder="Item Id"
                                        value={selectedItem.itemId}
                                        onChange={(event) =>
                                            handleItemChange(index, event.target.value)
                                        }
                                        required
                                    />
                                </Field>
                            )}

                            {quantityOptions.length > 0 ? (
                                <ComboBoxControl
                                    label="Select Item Quantity"
                                    required
                                    value={selectedItem.itemQuantity}
                                    onValueChange={(value) => handleQuantityChange(index, value)}
                                    options={quantityOptions.map((qty) => ({
                                        value: String(qty),
                                        label: String(qty),
                                    }))}
                                    placeholder="Select quantity"
                                />
                            ) : (
                                <Field>
                                    <FieldLabel className="font-semibold">
                                        Select Item Quantity{" "}
                                        <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <Input
                                        type="number"
                                        placeholder="Quantity"
                                        value={selectedItem.itemQuantity}
                                        onChange={(event) =>
                                            handleQuantityChange(index, event.target.value)
                                        }
                                        min={1}
                                        required
                                    />
                                </Field>
                            )}
                        </div>
                    );
                })}

                <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={addItem}
                >
                    <PlusIcon className="size-4" />
                    Add More Item
                </Button>
            </FormDialogShell>
        </>
    );
}
