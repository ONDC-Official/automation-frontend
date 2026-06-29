import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { ComboBoxControl } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import TextField from "@/components/Shadcn/TextField";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import {
    IHotelCatalogItem,
    IHotelFormData,
    IHotelSelectProps,
    DEFAULT_HOTEL_FORM_DATA,
} from "./hotel.types";
import { cn } from "@/lib/utils";

export default function TRV13HotelSelectForm({ submitEvent }: IHotelSelectProps) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [availableItems, setAvailableItems] = useState<IHotelCatalogItem[]>([]);

    const { control, handleSubmit, watch, reset, register } = useForm<IHotelFormData>({
        defaultValues: DEFAULT_HOTEL_FORM_DATA,
    });

    const selectedItemId = watch("itemId");
    const selectedItem = availableItems.find((item) => item.id === selectedItemId);
    const availableAddons = selectedItem?.addOns || [];

    const handlePaste = (payload: Record<string, unknown>) => {
        try {
            const message = payload?.message as Record<string, unknown> | undefined;
            const catalog = message?.catalog as Record<string, unknown> | undefined;
            const providers = catalog?.providers as Record<string, unknown>[] | undefined;

            if (!providers) {
                throw new Error(
                    "Invalid Schema - Expected on_search payload with catalog.providers"
                );
            }

            const provider = providers[0] as Record<string, unknown>;
            const items = (provider.items || []) as Record<string, unknown>[];

            const catalogItems: IHotelCatalogItem[] = items.map((item) => {
                const descriptor = item.descriptor as Record<string, unknown> | undefined;
                const addOns = (item.add_ons || []) as Record<string, unknown>[];

                return {
                    id: (item.id as string) || "",
                    name: (descriptor?.name as string) || (item.id as string) || "",
                    locationIds: (item.location_ids as string[]) || [],
                    addOns: addOns.map((addon) => {
                        const addonDescriptor = addon.descriptor as
                            | Record<string, unknown>
                            | undefined;
                        return {
                            id: (addon.id as string) || "",
                            name:
                                (addonDescriptor?.name as string) ||
                                (addonDescriptor?.short_desc as string) ||
                                (addon.id as string) ||
                                "",
                        };
                    }),
                };
            });

            setAvailableItems(catalogItems);

            const firstItem = catalogItems[0];
            if (!firstItem) {
                throw new Error("No items found in catalog");
            }

            reset({
                providerId: (provider.id as string) || "",
                locationId: firstItem.locationIds[0] || "",
                itemId: firstItem.id,
                quantity: 1,
                addOnId: firstItem.addOns?.[0]?.id || "",
                adultsCount: 1,
                childrenCount: 0,
            });

            setErrorWhilePaste("");
            toast.success(`Found ${catalogItems.length} items in catalog`);
        } catch (err) {
            const error = err as Error;
            setErrorWhilePaste(error.message || "Invalid payload structure");
            toast.error(error.message || "Invalid payload structure");
            console.error(err);
        }

        setIsPayloadEditorActive(false);
    };

    const onSubmit = async (data: IHotelFormData) => {
        const selectPayload = {
            provider: {
                id: data.providerId,
            },
            items: [
                {
                    id: data.itemId,
                    location_ids: data.locationId ? [data.locationId] : [],
                    quantity: {
                        selected: {
                            count: data.quantity,
                        },
                    },
                    ...(data.addOnId && {
                        add_ons: [{ id: data.addOnId }],
                    }),
                },
            ],
            fulfillments: [
                {
                    tags: [
                        {
                            descriptor: { code: "GUESTS" },
                            list: [
                                { descriptor: { code: "ADULTS" }, value: String(data.adultsCount) },
                                {
                                    descriptor: { code: "CHILDREN" },
                                    value: String(data.childrenCount),
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        await submitEvent({
            jsonPath: {},
            formData: {
                data: JSON.stringify(selectPayload),
            },
        });
    };

    const itemOptions = availableItems.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.id})`,
    }));

    const addonOptions = availableAddons.map((addon) => ({
        value: addon.id,
        label: `${addon.name} (${addon.id})`,
    }));

    return (
        <>
            {isPayloadEditorActive && (
                <PayloadEditor onAdd={handlePaste as (payload: unknown) => void} />
            )}

            <FormDialogShell
                onSubmit={handleSubmit(onSubmit)}
                footer={<Button type="submit">Submit Select Request</Button>}
            >
                <PastePayloadButton
                    onClick={() => setIsPayloadEditorActive(true)}
                    label="Paste on_search payload"
                />

                {errorWhilePaste && <p className="text-sm text-destructive">{errorWhilePaste}</p>}

                <div
                    className={cn(
                        "space-y-4 rounded-lg border border-border-default bg-surface-muted/20 p-4"
                    )}
                >
                    <h3 className="font-semibold text-text-primary">Room Selection</h3>

                    {availableItems.length > 0 ? (
                        <Controller
                            name="itemId"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <ComboBoxControl
                                    label="Item ID"
                                    required
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    options={itemOptions}
                                    placeholder="Select a room/item"
                                />
                            )}
                        />
                    ) : (
                        <TextField
                            control={control}
                            name="itemId"
                            label="Item ID"
                            required
                            placeholder="Paste on_search payload to populate items"
                        />
                    )}

                    <TextField
                        control={control}
                        name="quantity"
                        label="Quantity (Number of rooms)"
                        type="number"
                        required
                    />

                    {availableAddons.length > 0 ? (
                        <Controller
                            name="addOnId"
                            control={control}
                            render={({ field }) => (
                                <ComboBoxControl
                                    label="Add-On (optional)"
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    options={addonOptions}
                                    placeholder="No add-on"
                                />
                            )}
                        />
                    ) : (
                        <TextField
                            control={control}
                            name="addOnId"
                            label="Add-On (optional)"
                            placeholder="No add-ons available"
                        />
                    )}
                </div>

                <div
                    className={cn(
                        "space-y-4 rounded-lg border border-border-default bg-surface-muted/20 p-4"
                    )}
                >
                    <h3 className="font-semibold text-text-primary">Guest Details</h3>

                    <TextField
                        control={control}
                        name="adultsCount"
                        label="Number of Adults"
                        type="number"
                        required
                    />

                    <TextField
                        control={control}
                        name="childrenCount"
                        label="Number of Children"
                        type="number"
                    />
                </div>

                <input type="hidden" {...register("providerId")} />
                <input type="hidden" {...register("locationId")} />
            </FormDialogShell>
        </>
    );
}
