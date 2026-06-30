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
import {
    IOfferKey,
    ICatalogProvider,
    IFormValues,
    IFormData,
    IFormDataRET11,
    IOnSearchPayload,
    IRet10GrocerySelectFormProps,
    DEFAULT_FORM_VALUES,
} from "../types/ret10-grocery-select-form-types";

const toComboOptions = (values: string[]) => values.map((value) => ({ value, label: value }));

export default function Ret10GrocerySelectForm({ submitEvent }: IRet10GrocerySelectFormProps) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [isDataPasted, setIsDataPasted] = useState(false);

    const { control, handleSubmit, watch } = useForm<IFormValues>({
        defaultValues: DEFAULT_FORM_VALUES,
    });

    const { fields, append, remove } = useFieldArray<IFormValues, "items">({
        control,
        name: "items",
    });

    const [providerOptions, setProviderOptions] = useState<string[]>([]);
    const [itemOptions, setItemOptions] = useState<string[]>([]);
    const [locationOptions, setLocationOptions] = useState<string[]>([]);
    const [offerOptions, setOfferOptions] = useState<string[]>([]);
    const [providers, setProviders] = useState<ICatalogProvider[]>([]);

    const selectedProvider = watch("provider");
    const providerLocations =
        providers.find((provider) => provider.id === selectedProvider)?.locations ?? [];

    const onSubmit = async (data: IFormValues) => {
        const { valid, errors } = validateFormData(data);
        if (!valid) {
            toast.error(`Form validation failed: ${errors[0]}`);
            return;
        }
        await submitEvent({ jsonPath: {}, formData: data as unknown as Record<string, string> });
    };

    const handlePaste = (data: unknown) => {
        try {
            const catalogProviders = (data as IOnSearchPayload).message.catalog["bpp/providers"];
            setProviders(catalogProviders);

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
            toast.error("Invalid payload structure. Please check the pasted data.");
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
                        Paste the <strong>on_search</strong> payload to select provider, items, and
                        offers.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {providerOptions.length === 0 ? (
                            <TextField
                                control={control}
                                name="provider"
                                label="Select Provider Id"
                                required
                            />
                        ) : (
                            <Controller
                                name="provider"
                                control={control}
                                render={({ field }) => (
                                    <ComboBoxControl
                                        label="Select Provider Id"
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        options={toComboOptions(providerOptions)}
                                        placeholder="Select provider..."
                                    />
                                )}
                            />
                        )}

                        <TextField
                            control={control}
                            name="city_code"
                            label="Enter City Code"
                            placeholder="Enter city code"
                            required
                        />

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

                        <TextField
                            control={control}
                            name="location_gps"
                            label="Delivery Location GPS"
                            required
                        />
                        <TextField
                            control={control}
                            name="location_pin_code"
                            label="Delivery Pin Code"
                            required
                        />

                        {offerOptions.length > 0 && (
                            <Field className="space-y-2 rounded-lg border border-border-default p-3">
                                <FieldLabel className="font-semibold">Available Offers</FieldLabel>
                                {offerOptions.map((offerId) => (
                                    <Controller
                                        key={offerId}
                                        name={`offers_${offerId}` as IOfferKey}
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
                                        label={`Select Item ID ${index + 1}`}
                                        required
                                    />
                                ) : (
                                    <Controller
                                        name={`items.${index}.itemId`}
                                        control={control}
                                        render={({ field: itemField }) => (
                                            <ComboBoxControl
                                                label={`Select Item ID ${index + 1}`}
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

                                {locationOptions.length === 0 ? (
                                    <TextField
                                        control={control}
                                        name={`items.${index}.location`}
                                        label="Item Location Id"
                                        required
                                    />
                                ) : (
                                    <Controller
                                        name={`items.${index}.location`}
                                        control={control}
                                        render={({ field: locationField }) => (
                                            <ComboBoxControl
                                                label="Item Location Id"
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
                                onClick={() => append({ itemId: "", quantity: 1, location: "" })}
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
                                    Remove Item
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </FormDialogShell>
        </>
    );
}

import { SelectedItem } from "./ret11-nested-select-form";

function validateFormData(data: IFormData): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    const fieldsToValidate = [
        "provider",
        "location_gps",
        "location_pin_code",
        "city_code",
    ] as const;
    for (const key of fieldsToValidate) {
        if (data[key] === undefined || data[key] === null || data[key] === "") {
            errors.push(`Field ${key} cannot be empty.`);
        }
    }

    if (!data.provider_location || data.provider_location.length === 0) {
        errors.push("At least one provider location must be selected.");
    }

    if (!data.items || data.items.length < 2) {
        errors.push("At least 2 items must be selected.");
    }

    if (data.items) {
        data.items.forEach((item, index) => {
            if (!item.itemId || item.itemId === "") {
                errors.push(`Item ${index + 1}: Item ID cannot be empty.`);
            }
            if (!item.location || item.location === "") {
                errors.push(`Item ${index + 1}: Location cannot be empty.`);
            }
            if (!item.quantity || item.quantity <= 0) {
                errors.push(`Item ${index + 1}: Quantity must be greater than 0.`);
            }
        });
    }

    const itemIds = data.items.map((item) => item.itemId).filter((id) => id !== "");
    const uniqueItemIds = new Set(itemIds);
    if (itemIds.length > 0 && itemIds.length !== uniqueItemIds.size) {
        errors.push("All selected items must be unique.");
    }

    const offerKeys = Object.keys(data).filter((key): key is IOfferKey =>
        key.startsWith("offers_")
    );
    const selectedOffers = offerKeys.filter((key) => Boolean(data[key]));
    if (selectedOffers.length > 1) {
        errors.push("Only one offer can be selected.");
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

export function validateFormDataRET11(
    data: IFormDataRET11,
    items: SelectedItem[]
): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    const fieldsToValidate = ["provider", "location_gps", "location_pin_code"] as const;
    for (const key of fieldsToValidate) {
        if (data[key] === undefined || data[key] === null || data[key] === "") {
            errors.push(`Field ${key} cannot be empty.`);
        }
    }

    if (!data.provider_location || data.provider_location.length === 0) {
        errors.push("At least one provider location must be selected.");
    }

    if (!items || items.length < 2) {
        errors.push("At least 2 items must be selected.");
    }

    const validItems = items.filter((item) => item.id);
    if (validItems.length < 2) {
        errors.push("At least 2 valid items (with IDs) must be selected.");
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
