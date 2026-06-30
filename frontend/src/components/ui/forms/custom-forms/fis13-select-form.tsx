import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { TrashIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/Shadcn/Button/button";
import { Checkbox } from "@/components/Shadcn/Checkbox";
import { Input } from "@/components/Shadcn/TextField/input";
import { Field, FieldLabel } from "@/components/Shadcn/TextField/field";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    IExtractedAddon,
    IExtractedItem,
    ISelectedAddon,
    IFormValues,
    IRawAddon,
    IOrderItem,
    IPayload,
    IFIS13SelectFormProps,
    DEFAULT_FORM_VALUES,
} from "../types/fis13-select-form-types";

export default function FIS13ItemSelection({ submitEvent, referenceData }: IFIS13SelectFormProps) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [itemOptions, setItemOptions] = useState<IExtractedItem[]>([]);
    const [selectedAddons, setSelectedAddons] = useState<ISelectedAddon[]>([]);
    const [manualItemId, setManualItemId] = useState("");
    const [manualParentItemId, setManualParentItemId] = useState("");

    const { handleSubmit, watch, setValue } = useForm<IFormValues>({
        defaultValues: DEFAULT_FORM_VALUES,
    });

    const selectedItems = watch("selectedItems") ?? [];

    const availableAddons: IExtractedAddon[] = [];
    const seenAddonIds = new Set<string>();
    selectedItems.forEach((item) => {
        item.add_ons?.forEach((addon) => {
            if (!seenAddonIds.has(addon.id)) {
                seenAddonIds.add(addon.id);
                availableAddons.push(addon);
            }
        });
    });

    useEffect(() => {
        setSelectedAddons((prev) => prev.filter((entry) => seenAddonIds.has(entry.id)));
    }, [selectedItems]);

    const onSubmit = async (data: IFormValues) => {
        const formData: Record<string, string> = {};
        formData.selected_item_ids = data.selectedItems.map((item) => item.id).join(",");
        formData.selected_parent_item_ids = data.selectedItems
            .map((item) => item.parent_item_id || "")
            .join(",");

        if (selectedAddons.length > 0) {
            formData.addon_ids = selectedAddons.map((entry) => entry.id).join(",");
            formData.addon_quantities = selectedAddons.map((entry) => entry.quantity).join(",");
            const addonDetails = selectedAddons
                .map((entry) => availableAddons.find((addon) => addon.id === entry.id))
                .filter((addon): addon is IExtractedAddon => Boolean(addon))
                .map((addon) => ({
                    id: addon.id,
                    descriptor: addon.descriptor,
                    price: addon.price,
                    quantity: addon.quantity,
                }));
            formData.selected_add_on_details = JSON.stringify(addonDetails);
        }

        await submitEvent({ jsonPath: {}, formData });
    };

    const handlePaste = (payload: unknown) => {
        setErrorWhilePaste("");
        try {
            let results: IExtractedItem[] = [];
            const parsed = payload as IPayload;
            const fallbackAddons = (referenceData?.selected_add_ons ?? []) as IRawAddon[];

            const mapItem = (item: IOrderItem): IExtractedItem => {
                const nested =
                    item.add_ons && item.add_ons.length > 0 ? item.add_ons : fallbackAddons;
                return {
                    id: item.id,
                    parent_item_id: item.parent_item_id || "",
                    descriptor: item.descriptor,
                    add_ons: (nested || []).map((addon) => ({
                        id: addon.id,
                        parent_item_id: item.id,
                        descriptor: addon.descriptor,
                        price: addon.price,
                        quantity: addon.quantity,
                    })),
                };
            };

            // Number of raw items seen in an on_search catalog (before filtering).
            let catalogItemCount = 0;

            if (parsed?.message?.order?.items) {
                results = parsed.message.order.items.map(mapItem);
                // Handle on_search / catalog payload structure.
                // Only surface items that carry a parent_item_id (i.e. selectable child
                // items); skip parent/variant-group items that have no parent_item_id.
            } else if (parsed?.message?.catalog?.providers) {
                parsed.message.catalog.providers.forEach((provider) => {
                    provider.items?.forEach((item) => {
                        catalogItemCount++;
                        if (item.parent_item_id) {
                            results.push(mapItem(item));
                        }
                    });
                });
            }

            if (results.length === 0 && catalogItemCount > 0) {
                const msg = "No selectable items with a parent_item_id found.";
                setErrorWhilePaste(msg);
                toast.error(msg);
                setIsPayloadEditorActive(false);
                return;
            }

            if (results.length === 0) {
                throw new Error("No items found in payload");
            }

            setItemOptions(results);
            setValue("selectedItems", []);
            setSelectedAddons([]);
            const addonCount = results.reduce((sum, item) => sum + item.add_ons.length, 0);
            toast.success(
                `${results.length} item(s) and ${addonCount} add-on(s) extracted from payload.`
            );
        } catch (err) {
            setErrorWhilePaste("Invalid payload structure or no items found.");
            toast.error("Invalid payload structure. Please check the pasted data.");
            console.error(err);
        }
        setIsPayloadEditorActive(false);
    };

    const toggleItemSelection = (item: IExtractedItem) => {
        const current = [...selectedItems];
        const index = current.findIndex((entry) => entry.id === item.id);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(item);
        }
        setValue("selectedItems", current);
    };

    const toggleAddon = (addon: IExtractedAddon) => {
        setSelectedAddons((prev) => {
            const exists = prev.find((entry) => entry.id === addon.id);
            if (exists) {
                return prev.filter((entry) => entry.id !== addon.id);
            }
            return [...prev, { id: addon.id, quantity: 1 }];
        });
    };

    const updateAddonQuantity = (id: string, quantity: number) => {
        setSelectedAddons((prev) =>
            prev.map((entry) => (entry.id === id ? { ...entry, quantity } : entry))
        );
    };

    const addManualItem = () => {
        if (!manualItemId) return;

        const newItem: IExtractedItem = {
            id: manualItemId,
            parent_item_id: manualParentItemId,
            add_ons: [],
        };

        if (!itemOptions.some((option) => option.id === newItem.id)) {
            setItemOptions([...itemOptions, newItem]);
        }
        if (!selectedItems.some((item) => item.id === newItem.id)) {
            toggleItemSelection(newItem);
        }
        setManualItemId("");
        setManualParentItemId("");
    };

    return (
        <>
            {isPayloadEditorActive && <PayloadEditor onAdd={handlePaste} />}

            <FormDialogShell
                onSubmit={handleSubmit(onSubmit)}
                footer={
                    <Button type="submit" disabled={selectedItems.length === 0}>
                        {selectedAddons.length > 0
                            ? `Submit with ${selectedAddons.length} Add-on${
                                  selectedAddons.length > 1 ? "s" : ""
                              }`
                            : "Submit"}
                    </Button>
                }
            >
                <PastePayloadButton
                    onClick={() => setIsPayloadEditorActive(true)}
                    label="Paste catalog"
                />
                {itemOptions.length === 0 && (
                    <p className="text-sm text-text-secondary">
                        Paste the catalog payload (on_search) to load items and add-ons.
                    </p>
                )}
                {errorWhilePaste && <p className="text-sm text-destructive">{errorWhilePaste}</p>}

                <Field>
                    <FieldLabel className="font-semibold">Select Items from Payload</FieldLabel>
                </Field>

                {itemOptions.length > 0 ? (
                    <div className="max-h-60 divide-y divide-border-default overflow-y-auto rounded-lg border border-border-default">
                        {itemOptions.map((option) => {
                            const isSelected = selectedItems.some((item) => item.id === option.id);
                            return (
                                <label
                                    key={option.id}
                                    className={cn(
                                        "flex w-full cursor-pointer items-center gap-3 p-3 text-left transition-colors",
                                        isSelected
                                            ? "bg-surface-muted/60"
                                            : "hover:bg-surface-muted/40"
                                    )}
                                >
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => toggleItemSelection(option)}
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-text-primary">
                                            {option.descriptor?.name || option.id}
                                        </p>
                                        <p className="text-xs text-text-secondary">
                                            ID: {option.id}
                                            {option.parent_item_id &&
                                                ` | Parent: ${option.parent_item_id}`}
                                            {option.add_ons.length > 0 &&
                                                ` | ${option.add_ons.length} add-on(s)`}
                                        </p>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                ) : (
                    <p className="rounded-lg border border-dashed border-border-default py-8 text-center text-sm text-text-secondary">
                        No items loaded. Please paste a payload first.
                    </p>
                )}

                {selectedItems.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {selectedItems.map((item) => (
                            <span
                                key={item.id}
                                className="inline-flex items-center gap-2 rounded-full bg-surface-muted px-3 py-1.5 text-sm font-medium text-text-primary"
                            >
                                {item.descriptor?.name || item.id}
                                <button
                                    type="button"
                                    onClick={() => toggleItemSelection(item)}
                                    className="text-text-secondary hover:text-destructive"
                                    aria-label={`Remove ${item.id}`}
                                >
                                    <TrashIcon className="size-4" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {selectedItems.length > 0 && (
                    <div className="space-y-3 border-t border-border-default pt-4">
                        <FieldLabel className="font-semibold">Select Add-ons (Optional)</FieldLabel>

                        {availableAddons.length > 0 ? (
                            <div className="max-h-72 divide-y divide-border-default overflow-y-auto rounded-lg border border-border-default">
                                {availableAddons.map((addon) => {
                                    const isSelected = selectedAddons.some(
                                        (entry) => entry.id === addon.id
                                    );
                                    const selectedEntry = selectedAddons.find(
                                        (entry) => entry.id === addon.id
                                    );
                                    const maxCount =
                                        addon.quantity?.maximum?.count ??
                                        addon.quantity?.available?.count ??
                                        10;

                                    return (
                                        <div
                                            key={addon.id}
                                            className={cn(
                                                "p-3 transition-colors",
                                                isSelected
                                                    ? "bg-surface-muted/60"
                                                    : "hover:bg-surface-muted/40"
                                            )}
                                        >
                                            <label className="flex w-full cursor-pointer items-center justify-between text-left">
                                                <div className="flex items-center gap-3">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => toggleAddon(addon)}
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium text-text-primary">
                                                            {addon.descriptor?.name || addon.id}
                                                        </p>
                                                        <p className="text-xs text-text-secondary">
                                                            ID: {addon.id}
                                                            {addon.descriptor?.code &&
                                                                ` | ${addon.descriptor.code}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                {addon.price?.value && (
                                                    <span className="rounded bg-surface-muted px-2 py-1 text-sm font-medium">
                                                        {addon.price.currency || "INR"}{" "}
                                                        {addon.price.value}
                                                    </span>
                                                )}
                                            </label>

                                            {isSelected && (
                                                <div className="mt-2 ml-7 flex items-center gap-2">
                                                    <span className="text-xs text-text-secondary">
                                                        Qty:
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={maxCount}
                                                        value={selectedEntry?.quantity ?? 1}
                                                        onChange={(event) =>
                                                            updateAddonQuantity(
                                                                addon.id,
                                                                Math.max(
                                                                    1,
                                                                    Math.min(
                                                                        maxCount,
                                                                        parseInt(
                                                                            event.target.value,
                                                                            10
                                                                        ) || 1
                                                                    )
                                                                )
                                                            )
                                                        }
                                                        onClick={(event) => event.stopPropagation()}
                                                        className="h-8 w-16"
                                                    />
                                                    <span className="text-xs text-text-secondary">
                                                        (max: {maxCount})
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="rounded-lg border border-dashed border-border-default py-6 text-center text-sm text-text-secondary">
                                No add-ons available for the selected item(s).
                            </p>
                        )}
                    </div>
                )}

                <details className="border-t border-border-default pt-4 text-sm">
                    <summary className="cursor-pointer font-medium text-text-secondary hover:text-text-primary">
                        Advanced: Add Item Manually
                    </summary>
                    <div className="mt-4 space-y-4 rounded-lg border border-border-default bg-surface-muted/40 p-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field>
                                <FieldLabel className="font-semibold">Item ID</FieldLabel>
                                <Input
                                    value={manualItemId}
                                    onChange={(event) => setManualItemId(event.target.value)}
                                    placeholder="e.g. CHILD_ITEM_ID_I1"
                                />
                            </Field>
                            <Field>
                                <FieldLabel className="font-semibold">Parent Item ID</FieldLabel>
                                <Input
                                    value={manualParentItemId}
                                    onChange={(event) => setManualParentItemId(event.target.value)}
                                    placeholder="e.g. I1"
                                />
                            </Field>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={addManualItem}>
                            Add to List
                        </Button>
                    </div>
                </details>
            </FormDialogShell>
        </>
    );
}
