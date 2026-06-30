import { useState } from "react";

import { Button } from "@/components/Shadcn/Button/button";
import { Checkbox } from "@/components/Shadcn/Checkbox";
import { Input } from "@/components/Shadcn/TextField/input";
import { Field, FieldLabel } from "@/components/Shadcn/TextField/field";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    IAddOn,
    ISelectedAddOn,
    IFIS13AddonSelectFormProps,
} from "../types/fis13-addon-select-form-types";

export default function FIS13AddonSelectForm({
    submitEvent,
    referenceData,
}: IFIS13AddonSelectFormProps) {
    const addOns = (referenceData?.selected_add_ons ?? []) as IAddOn[];
    const [selected, setSelected] = useState<ISelectedAddOn[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleAddon = (addon: IAddOn) => {
        setSelected((prev) => {
            const exists = prev.find((entry) => entry.id === addon.id);
            if (exists) {
                return prev.filter((entry) => entry.id !== addon.id);
            }
            return [...prev, { id: addon.id, quantity: 1 }];
        });
    };

    const updateQuantity = (id: string, quantity: number) => {
        setSelected((prev) =>
            prev.map((entry) => (entry.id === id ? { ...entry, quantity } : entry))
        );
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const formData: Record<string, string> = {};
            if (selected.length > 0) {
                formData.addon_ids = selected.map((entry) => entry.id).join(",");
                formData.addon_quantities = selected.map((entry) => entry.quantity).join(",");
            }
            await submitEvent({ jsonPath: {}, formData });
        } catch (err) {
            toast.error("Error submitting addon selection");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormDialogShell
            onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
            }}
            footer={
                <Button type="submit" disabled={isSubmitting}>
                    {selected.length > 0
                        ? `Submit with ${selected.length} Add-on${selected.length > 1 ? "s" : ""}`
                        : "Continue without Add-ons"}
                </Button>
            }
        >
            <Field>
                <FieldLabel className="font-semibold">Select Add-ons (Optional)</FieldLabel>
            </Field>

            {addOns.length > 0 ? (
                <div className="max-h-72 divide-y divide-border-default overflow-y-auto rounded-lg border border-border-default">
                    {addOns.map((addon) => {
                        const isSelected = selected.some((entry) => entry.id === addon.id);
                        const selectedItem = selected.find((entry) => entry.id === addon.id);
                        const maxCount = addon.quantity?.maximum?.count ?? 10;

                        return (
                            <div
                                key={addon.id}
                                className={cn(
                                    "p-3 transition-colors",
                                    isSelected ? "bg-surface-muted/60" : "hover:bg-surface-muted/40"
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
                                        <span className="rounded bg-surface-muted px-2 py-1 text-sm font-medium text-text-primary">
                                            {addon.price.currency || "INR"} {addon.price.value}
                                        </span>
                                    )}
                                </label>

                                {isSelected && (
                                    <div className="mt-2 ml-7 flex items-center gap-2">
                                        <span className="text-xs text-text-secondary">Qty:</span>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={maxCount}
                                            value={selectedItem?.quantity ?? 1}
                                            onChange={(event) =>
                                                updateQuantity(
                                                    addon.id,
                                                    Math.max(
                                                        1,
                                                        Math.min(
                                                            maxCount,
                                                            parseInt(event.target.value, 10) || 1
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
                <p className="rounded-lg border border-dashed border-border-default bg-surface-muted/40 py-6 text-center text-sm text-text-secondary">
                    No add-ons available. You can proceed without selecting any.
                </p>
            )}

            {selected.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selected.map((item) => {
                        const addon = addOns.find((entry) => entry.id === item.id);
                        return (
                            <span
                                key={item.id}
                                className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-text-primary"
                            >
                                {addon?.descriptor?.name || item.id} x{item.quantity}
                            </span>
                        );
                    })}
                </div>
            )}
        </FormDialogShell>
    );
}
