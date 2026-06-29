import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { PlusIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { ComboBoxControl } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import { Checkbox } from "@/components/Shadcn/Checkbox";
import { CheckboxGroup } from "@/components/Shadcn/Checkbox";
import TextField from "@/components/Shadcn/TextField";
import { Field, FieldLabel } from "@/components/Shadcn/TextField/field";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import { SubmitEventParams } from "@/types/flow-types";

type OfferKey = `offers_${string}`;

type CatalogItem = { id: string };
export type CatalogLocation = { id: string };
type CatalogOffer = { id: string };
export type CatalogProvider = {
    id: string;
    items: CatalogItem[];
    locations: CatalogLocation[];
    offers?: CatalogOffer[];
};

type OnSearchPayload = {
    message: {
        catalog: {
            "bpp/providers": CatalogProvider[];
        };
    };
};

type FormValues = {
    city_code: string;
    provider: string;
    provider_location: string[];
    location_gps: string;
    location_pin_code: string;
    order_type: "ILBN" | "ILFP" | "ILBP";
    items: {
        itemId: string;
        quantity: number;
        location: string;
        estimated_price: number;
    }[];
} & Partial<Record<OfferKey, boolean>>;

const ORDER_TYPE_OPTIONS = [
    { value: "ILBN", label: "ILBN" },
    { value: "ILFP", label: "ILFP" },
];

const toComboOptions = (values: string[]) => values.map((value) => ({ value, label: value }));

export default function RetINVLInitForm({
    submitEvent,
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [isDataPasted, setIsDataPasted] = useState(false);

    const { control, handleSubmit, watch } = useForm<FormValues>({
        defaultValues: {
            city_code: "",
            provider: "",
            provider_location: [],
            location_gps: "",
            location_pin_code: "",
            order_type: "ILBN",
            items: [
                { itemId: "", quantity: 1, location: "", estimated_price: 0 },
                { itemId: "", quantity: 1, location: "", estimated_price: 0 },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });

    const [catalogPayload, setCatalogPayload] = useState<OnSearchPayload | null>(null);
    const [providerOptions, setProviderOptions] = useState<string[]>([]);
    const [itemOptions, setItemOptions] = useState<string[]>([]);
    const [locationOptions, setLocationOptions] = useState<string[]>([]);
    const [offerOptions, setOfferOptions] = useState<string[]>([]);
    const [providers, setProviders] = useState<CatalogProvider[]>([]);

    const selectedProvider = watch("provider");
    const providerLocations =
        providers.find((provider) => provider.id === selectedProvider)?.locations ?? [];

    const onSubmit = async (data: FormValues) => {
        const { valid, errors } = validateFormData(data);
        if (!valid) {
            toast.error(`Form validation failed: ${errors[0]}`);
            return;
        }
        if (!catalogPayload) {
            toast.error("Please paste on_search payload first");
            return;
        }

        await submitEvent({
            jsonPath: {},
            formData: {
                ...data,
                live_catalog: catalogPayload,
            } as unknown as Record<string, string>,
        });
    };

    const handlePaste = (data: unknown) => {
        try {
            const catalogProviders = (data as OnSearchPayload).message.catalog["bpp/providers"];
            const parsed = data as OnSearchPayload;
            setProviders(catalogProviders);
            setCatalogPayload(parsed);
            setProviderOptions(catalogProviders.map((provider) => provider.id));

            const provider = catalogProviders[0];
            if (provider) {
                setItemOptions(provider.items.map((item) => item.id));
                setLocationOptions(provider.locations.map((location) => location.id));
            }

            const offers = catalogProviders
                .flatMap((provider) => provider.offers || [])
                .map((offer) => offer.id);
            setOfferOptions(offers);
            setIsDataPasted(true);
            setErrorWhilePaste("");
        } catch (err) {
            setErrorWhilePaste("Invalid payload structure.");
            toast.error("Invalid payload structure.");
            console.error(err);
        }
        setIsPayloadEditorActive(false);
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
                footer={isDataPasted ? <Button type="submit">Submit</Button> : undefined}
            >
                <PastePayloadButton
                    onClick={() => setIsPayloadEditorActive(true)}
                    label="Paste on_search"
                />
                {errorWhilePaste && <p className="text-sm text-destructive">{errorWhilePaste}</p>}

                {!isDataPasted ? (
                    <p className="text-sm text-text-secondary">
                        Paste the <strong>on_search</strong> payload to continue.
                    </p>
                ) : (
                    <div className="space-y-4">
                        <Controller
                            name="order_type"
                            control={control}
                            render={({ field }) => (
                                <ComboBoxControl
                                    label="Order Type"
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    options={ORDER_TYPE_OPTIONS}
                                />
                            )}
                        />

                        {providerOptions.length === 0 ? (
                            <TextField
                                control={control}
                                name="provider"
                                label="Provider"
                                required
                            />
                        ) : (
                            <Controller
                                name="provider"
                                control={control}
                                render={({ field }) => (
                                    <ComboBoxControl
                                        label="Provider"
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        options={toComboOptions(providerOptions)}
                                        placeholder="Select provider..."
                                    />
                                )}
                            />
                        )}

                        {providerLocations.length === 0 ? (
                            <TextField
                                control={control}
                                name="provider_location"
                                label="Provider Location Id"
                                required
                            />
                        ) : (
                            <CheckboxGroup
                                control={control}
                                name="provider_location"
                                label="Provider Locations"
                                options={providerLocations.map((location) => ({
                                    name: location.id,
                                    code: location.id,
                                }))}
                                required
                            />
                        )}

                        <TextField control={control} name="city_code" label="City Code" required />
                        <TextField control={control} name="location_gps" label="GPS" required />
                        <TextField
                            control={control}
                            name="location_pin_code"
                            label="Pin Code"
                            required
                        />

                        {offerOptions.length > 0 && (
                            <Field className="space-y-2 rounded-lg border border-border-default p-3">
                                <FieldLabel className="font-semibold">Available Offers</FieldLabel>
                                {offerOptions.map((offerId) => (
                                    <Controller
                                        key={offerId}
                                        name={`offers_${offerId}` as OfferKey}
                                        control={control}
                                        render={({ field }) => (
                                            <label className="flex cursor-pointer items-center gap-2">
                                                <Checkbox
                                                    checked={!!field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                                <span className="text-sm text-foreground">
                                                    {offerId}
                                                </span>
                                            </label>
                                        )}
                                    />
                                ))}
                            </Field>
                        )}

                        {fields.map((field, index) => (
                            <div
                                key={field.id}
                                className="space-y-3 rounded-lg border border-border-default p-3"
                            >
                                {itemOptions.length === 0 ? (
                                    <TextField
                                        control={control}
                                        name={`items.${index}.itemId`}
                                        label="Item ID"
                                        required
                                    />
                                ) : (
                                    <Controller
                                        name={`items.${index}.itemId`}
                                        control={control}
                                        render={({ field: itemField }) => (
                                            <ComboBoxControl
                                                label="Item ID"
                                                value={itemField.value}
                                                onValueChange={itemField.onChange}
                                                options={toComboOptions(itemOptions)}
                                                placeholder="Select item..."
                                            />
                                        )}
                                    />
                                )}

                                <TextField
                                    control={control}
                                    name={`items.${index}.quantity`}
                                    label="Quantity"
                                    type="number"
                                    min={1}
                                    required
                                />
                                <TextField
                                    control={control}
                                    name={`items.${index}.estimated_price`}
                                    label="Estimated Price"
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    required
                                />

                                {locationOptions.length === 0 ? (
                                    <TextField
                                        control={control}
                                        name={`items.${index}.location`}
                                        label="Item Location"
                                        required
                                    />
                                ) : (
                                    <Controller
                                        name={`items.${index}.location`}
                                        control={control}
                                        render={({ field: locationField }) => (
                                            <ComboBoxControl
                                                label="Item Location"
                                                value={locationField.value}
                                                onValueChange={locationField.onChange}
                                                options={toComboOptions(locationOptions)}
                                                placeholder="Select location..."
                                            />
                                        )}
                                    />
                                )}
                            </div>
                        ))}

                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    append({
                                        itemId: "",
                                        quantity: 1,
                                        location: "",
                                        estimated_price: 0,
                                    })
                                }
                            >
                                <PlusIcon className="size-4" />
                                Add Item
                            </Button>
                            {fields.length > 2 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive"
                                    onClick={() => remove(fields.length - 1)}
                                >
                                    Remove
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </FormDialogShell>
        </>
    );
}

function validateFormData(data: FormValues) {
    const errors: string[] = [];

    if (!data.order_type) errors.push("Order type required.");
    if (!data.provider) errors.push("Provider required.");
    if (!data.city_code) errors.push("City code required.");
    if (!data.location_gps) errors.push("GPS required.");
    if (!data.location_pin_code) errors.push("Pin code required.");
    if (!data.provider_location?.length) errors.push("Select provider location.");
    if (!data.items || data.items.length < 2) errors.push("At least 2 items required.");

    data.items.forEach((item, index) => {
        if (!item.itemId) errors.push(`Item ${index + 1}: ID required`);
        if (!item.location) errors.push(`Item ${index + 1}: Location required`);
        if (!item.quantity || item.quantity <= 0)
            errors.push(`Item ${index + 1}: Quantity invalid`);
        if (!item.estimated_price || item.estimated_price <= 0)
            errors.push(`Item ${index + 1}: Estimated price invalid and must be greater than 1`);
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}
