import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/components/Shadcn/Badge";
import { Button } from "@/components/Shadcn/Button/button";
import { Checkbox } from "@/components/Shadcn/Checkbox";
import { Input } from "@/components/Shadcn/TextField/input";
import { Field, FieldLabel } from "@/components/Shadcn/TextField/field";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import { cn } from "@/lib/utils";
import type {
    ICatalogProvider,
    IParsedCatalog,
    ISelectedAddOn,
    IFormValues,
    ICatalogAddOn,
    IInsuranceSelectFormProps,
} from "../types/insurance-select-form-types";
import { DEFAULT_FORM_VALUES } from "../types/insurance-select-form-types";

export default function InsuranceSelectForm({ submitEvent }: IInsuranceSelectFormProps) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [catalog, setCatalog] = useState<IParsedCatalog | null>(null);
    const [selectedAddOns, setSelectedAddOns] = useState<ISelectedAddOn[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { handleSubmit, watch, setValue } = useForm<IFormValues>({
        defaultValues: DEFAULT_FORM_VALUES,
    });

    const selectedItemIndex = watch("selectedItemIndex");
    const selectedItem = catalog?.items?.[selectedItemIndex];
    const availableAddOns = selectedItem?.add_ons || [];

    const handlePaste = (payload: unknown) => {
        setErrorWhilePaste("");
        try {
            const parsed = payload as {
                message?: { catalog?: { providers?: ICatalogProvider[] } };
            };

            const providers = parsed?.message?.catalog?.providers;
            if (!providers || providers.length === 0) {
                throw new Error("No providers found in catalog");
            }

            const provider = providers[0];
            const items = provider.items || [];

            if (items.length === 0) {
                throw new Error("No items found in provider catalog");
            }

            const fulfillmentId = provider.fulfillments?.[0]?.id || "";

            setCatalog({ provider, items, fulfillmentId });
            setValue("selectedItemIndex", 0);
            setSelectedAddOns([]);
            setIsPayloadEditorActive(false);
            toast.success(
                `Parsed catalog: ${items.length} item(s), ${provider.descriptor?.name || provider.id}`
            );
        } catch (err: unknown) {
            setErrorWhilePaste(err instanceof Error ? err.message : "Invalid payload structure");
            toast.error("Failed to parse on_search payload");
            console.error(err);
        }
    };

    const toggleAddon = (addon: ICatalogAddOn) => {
        setSelectedAddOns((prev) => {
            const exists = prev.find((entry) => entry.id === addon.id);
            if (exists) return prev.filter((entry) => entry.id !== addon.id);
            return [...prev, { id: addon.id, quantity: 1 }];
        });
    };

    const updateAddonQuantity = (id: string, quantity: number) => {
        setSelectedAddOns((prev) =>
            prev.map((entry) => (entry.id === id ? { ...entry, quantity } : entry))
        );
    };

    const onSubmit = async () => {
        if (!catalog || !selectedItem) {
            toast.error("Please paste an on_search payload and select an item");
            return;
        }

        setIsSubmitting(true);
        try {
            const addOnData: Record<string, string> =
                selectedAddOns.length > 0
                    ? {
                          addon_ids: selectedAddOns.map((entry) => entry.id).join(","),
                          addon_quantities: selectedAddOns.map((entry) => entry.quantity).join(","),
                      }
                    : {};

            const selectedAddOnDetails = selectedAddOns.map((entry) => {
                const addon = availableAddOns.find((item) => item.id === entry.id);
                return {
                    id: entry.id,
                    descriptor: addon?.descriptor,
                    price: addon?.price,
                    quantity: entry.quantity,
                };
            });

            await submitEvent({
                jsonPath: {},
                formData: {
                    provider_id: catalog.provider.id,
                    provider_descriptor: JSON.stringify(catalog.provider.descriptor || {}),
                    item_id: selectedItem.id,
                    parent_item_id: selectedItem.parent_item_id || selectedItem.id,
                    item_descriptor: JSON.stringify(selectedItem.descriptor || {}),
                    category_ids: JSON.stringify(selectedItem.category_ids || []),
                    fulfillment_id: catalog.fulfillmentId,
                    selected_item: JSON.stringify(selectedItem),
                    selected_add_on_details: JSON.stringify(selectedAddOnDetails),
                    ...addOnData,
                },
            });
        } catch (err) {
            toast.error("Error submitting selection");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
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
                onSubmit={(event) => {
                    event.preventDefault();
                    void handleSubmit(onSubmit)();
                }}
                footer={
                    catalog ? (
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting
                                ? "Submitting..."
                                : `Submit Selection${
                                      selectedAddOns.length > 0
                                          ? ` with ${selectedAddOns.length} Add-on(s)`
                                          : ""
                                  }`}
                        </Button>
                    ) : null
                }
            >
                <PastePayloadButton
                    onClick={() => setIsPayloadEditorActive(true)}
                    label="Paste on_search Payload"
                />

                {!catalog && (
                    <p className="text-xs text-text-secondary italic">
                        Paste on_search payload to load catalog
                    </p>
                )}

                {errorWhilePaste && (
                    <p className="text-sm text-destructive">
                        <span className="font-semibold">Error:</span> {errorWhilePaste}
                    </p>
                )}

                {catalog && (
                    <>
                        <div className="rounded-lg border border-border-default bg-surface-muted/40 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                Provider
                            </p>
                            <p className="text-sm font-medium text-text-primary">
                                {catalog.provider.descriptor?.name || catalog.provider.id}
                            </p>
                            <p className="mt-0.5 text-xs text-text-secondary">
                                ID: {catalog.provider.id}
                            </p>
                        </div>

                        <Field>
                            <FieldLabel className="font-semibold">
                                Select Insurance Product
                            </FieldLabel>
                        </Field>

                        <div className="divide-y divide-border-default overflow-hidden rounded-lg border border-border-default">
                            {catalog.items.map((item, index) => {
                                const isSelected = selectedItemIndex === index;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            setValue("selectedItemIndex", index);
                                            setSelectedAddOns([]);
                                        }}
                                        className={cn(
                                            "flex w-full items-center gap-3 p-3 text-left transition-colors",
                                            isSelected
                                                ? "border-l-4 border-l-brand-normal bg-surface-muted/60"
                                                : "hover:bg-surface-muted/40"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "size-4 shrink-0 rounded-full border-2",
                                                isSelected
                                                    ? "border-brand-normal bg-brand-normal"
                                                    : "border-border-default"
                                            )}
                                            aria-hidden
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-text-primary">
                                                {item.descriptor?.name || item.id}
                                            </p>
                                            {item.descriptor?.short_desc && (
                                                <p className="text-xs text-text-secondary">
                                                    {item.descriptor.short_desc}
                                                </p>
                                            )}
                                            <p className="mt-0.5 text-xs text-text-secondary">
                                                ID: {item.id}
                                                {item.category_ids?.length
                                                    ? ` | Categories: ${item.category_ids.join(", ")}`
                                                    : ""}
                                            </p>
                                        </div>
                                        {item.add_ons && item.add_ons.length > 0 && (
                                            <Badge variant="secondary">
                                                {item.add_ons.length} add-on(s)
                                            </Badge>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {availableAddOns.length > 0 && (
                            <>
                                <Field>
                                    <FieldLabel className="font-semibold">
                                        Select Add-ons (Optional)
                                    </FieldLabel>
                                </Field>

                                <div className="max-h-64 divide-y divide-border-default overflow-y-auto rounded-lg border border-border-default">
                                    {availableAddOns.map((addon) => {
                                        const isSelected = selectedAddOns.some(
                                            (entry) => entry.id === addon.id
                                        );
                                        const selectedAddon = selectedAddOns.find(
                                            (entry) => entry.id === addon.id
                                        );
                                        const maxCount = addon.quantity?.maximum?.count ?? 10;

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
                                                            onCheckedChange={() =>
                                                                toggleAddon(addon)
                                                            }
                                                        />
                                                        <div>
                                                            <p className="text-sm font-medium text-text-primary">
                                                                {addon.descriptor?.name || addon.id}
                                                            </p>
                                                            <p className="text-xs text-text-secondary">
                                                                {addon.descriptor?.code || addon.id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {addon.price?.value && (
                                                        <span className="rounded bg-surface-muted px-2 py-1 text-sm font-medium text-text-primary">
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
                                                            value={selectedAddon?.quantity ?? 1}
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
                                                            onClick={(event) =>
                                                                event.stopPropagation()
                                                            }
                                                            className="w-16"
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

                                {selectedAddOns.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedAddOns.map((entry) => {
                                            const addon = availableAddOns.find(
                                                (item) => item.id === entry.id
                                            );
                                            return (
                                                <Badge key={entry.id} variant="success">
                                                    {addon?.descriptor?.name || entry.id} x
                                                    {entry.quantity}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}

                        {catalog.fulfillmentId && (
                            <p className="rounded-lg border border-border-default bg-surface-muted/30 p-3 text-xs text-text-secondary">
                                Fulfillment ID:{" "}
                                <span className="font-mono text-text-primary">
                                    {catalog.fulfillmentId}
                                </span>
                            </p>
                        )}
                    </>
                )}
            </FormDialogShell>
        </>
    );
}
