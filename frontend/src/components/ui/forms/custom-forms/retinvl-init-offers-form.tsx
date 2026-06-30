import { useCallback, useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { PlusIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { ComboBoxControl } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import { Checkbox } from "@/components/Shadcn/Checkbox";
import { CheckboxGroup } from "@/components/Shadcn/Checkbox";
import TextField from "@/components/Shadcn/TextField";
import { Field, FieldLabel } from "@/components/Shadcn/TextField/field";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { useSession } from "@/context/context";
import { getCompletePayload, getTransactionData } from "@/utils/request-utils";

const ORDER_TYPE_OPTIONS = [
    { value: "ILBN", label: "ILBN" },
    { value: "ILFP", label: "ILFP" },
];

const toComboOptions = (values: string[]) => values.map((value) => ({ value, label: value }));

import {
    DynamicOfferRule,
    ICatalogLocation,
    ICatalogItem,
    ITargetListItem,
    ICatalogProvider,
    ICatalogOffer,
    ITag,
    IFormValues,
    IOnSearchPayload,
    IRetINVLInitOffersFormProps,
    DEFAULT_FORM_VALUES,
} from "../types/retinvl-init-offers-form-types";

export default function RetINVLInitOffersForm({ submitEvent }: IRetINVLInitOffersFormProps) {
    const { sessionData, activeFlowId } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [isDataPasted, setIsDataPasted] = useState(false);

    const { control, handleSubmit, watch } = useForm<IFormValues>({
        defaultValues: DEFAULT_FORM_VALUES,
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });
    const [catalogPayload, setCatalogPayload] = useState<IOnSearchPayload | null>(null);
    const [providerOptions, setProviderOptions] = useState<string[]>([]);
    const [itemOptions, setItemOptions] = useState<string[]>([]);
    const [locationOptions, setLocationOptions] = useState<string[]>([]);
    const [offerOptions, setOfferOptions] = useState<string[]>([]);
    const [providers, setProviders] = useState<ICatalogProvider[]>([]);
    const [dynamicOfferRules, setDynamicOfferRules] = useState<Record<string, DynamicOfferRule>>(
        {}
    );
    const [itemPrices, setItemPrices] = useState<Record<string, number>>({});
    const [itemCategories, setItemCategories] = useState<Record<string, string>>({});
    const [itemLocations, setItemLocations] = useState<Record<string, string[]>>({});
    const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});

    const selectedProvider = watch("provider");

    const itemsWatch = watch("items");

    const getOfferValidationMessage = useCallback(
        (offerId: string): string | null => {
            const rule = dynamicOfferRules[offerId];
            if (!rule) return null;

            const hasItemRules = rule.itemIds && rule.itemIds.length > 0;
            const hasCategoryRules = rule.categoryIds && rule.categoryIds.length > 0;
            const hasLocationRules = rule.locationIds && rule.locationIds.length > 0;

            if (hasItemRules || hasCategoryRules || hasLocationRules) {
                const hasCompatibleItem = itemsWatch.some((item) => {
                    if (!item.itemId || item.quantity <= 0) return false;

                    const itemLocation = item.location || itemLocations[item.itemId]?.[0] || "";
                    const locMatch =
                        hasLocationRules && itemLocation && rule.locationIds.includes(itemLocation);
                    const itemMatch = hasItemRules && rule.itemIds.includes(item.itemId);

                    const catId = itemCategories[item.itemId];
                    const catMatch = hasCategoryRules && rule.categoryIds.includes(catId);

                    return locMatch || itemMatch || catMatch;
                });

                if (!hasCompatibleItem) {
                    const msg: string[] = [];
                    if (hasItemRules) msg.push(`items: ${rule.itemIds.join(", ")}`);
                    if (hasCategoryRules) {
                        const catDisplay = rule.categoryIds
                            .map((id) => categoryNames[id] || id)
                            .join(", ");
                        msg.push(`categories: ${catDisplay}`);
                    }
                    if (hasLocationRules) msg.push(`locations: ${rule.locationIds.join(", ")}`);
                    return `Valid for ${msg.join(" OR ")}`;
                }
            }

            const currentValues = watch();
            const selectedOffers = currentValues.available_offers || [];

            const otherSelected = selectedOffers.filter((id) => id !== offerId);
            if (otherSelected.length > 0) {
                if (!rule.isAdditive) return "Cannot combine with other offers.";
                const hasNonAdditiveSelected = otherSelected.some(
                    (id) => dynamicOfferRules[id] && !dynamicOfferRules[id].isAdditive
                );
                if (hasNonAdditiveSelected) return "A non-combinable offer is already active.";
            }

            const qualifyingItems = itemsWatch.filter((item) => {
                const hasItemRules = rule.itemIds && rule.itemIds.length > 0;
                const hasCategoryRules = rule.categoryIds && rule.categoryIds.length > 0;
                const hasLocationRules = rule.locationIds && rule.locationIds.length > 0;

                if (hasItemRules || hasCategoryRules || hasLocationRules) {
                    const itemLocation = item.location || itemLocations[item.itemId]?.[0] || "";
                    const locMatch =
                        hasLocationRules && itemLocation && rule.locationIds.includes(itemLocation);

                    const itemMatch = hasItemRules && rule.itemIds.includes(item.itemId);

                    const catId = itemCategories[item.itemId];
                    const catMatch = hasCategoryRules && rule.categoryIds.includes(catId);

                    return locMatch || itemMatch || catMatch;
                }
                return true;
            });

            if (rule.minOrderValue && rule.minOrderValue > 0) {
                const totalValue = qualifyingItems.reduce(
                    (sum, item) => sum + (itemPrices[item.itemId] || 0) * item.quantity,
                    0
                );
                if (totalValue < rule.minOrderValue)
                    return `Min value ₹${rule.minOrderValue} required on valid items (Current: ₹${totalValue})`;
            }

            if (rule.minItemCount && rule.minItemCount > 0) {
                const totalCount = qualifyingItems.reduce((sum, item) => sum + item.quantity, 0);
                if (totalCount < rule.minItemCount)
                    return `Min quantity ${rule.minItemCount} required on valid items (Current: ${totalCount})`;
                if (rule.maxItemCount && rule.maxItemCount > 0 && totalCount > rule.maxItemCount)
                    return `Max quantity ${rule.maxItemCount} allowed (Current: ${totalCount})`;
            }

            return null;
        },
        [
            dynamicOfferRules,
            itemsWatch,
            itemLocations,
            itemPrices,
            itemCategories,
            categoryNames,
            watch,
        ]
    );

    const onSubmit = async (data: IFormValues) => {
        const { valid, errors } = validateFormData(data);
        if (!valid) {
            toast.error(`Form validation failed: ${errors[0]}`);
            return;
        }
        if (!catalogPayload) {
            alert("Please paste on_search payload first");
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

    const processPayload = useCallback((data: unknown) => {
        try {
            const providers = (data as IOnSearchPayload).message.catalog["bpp/providers"];
            const parsed = data as IOnSearchPayload;
            setProviders(providers);
            setCatalogPayload(parsed);

            setProviderOptions(providers.map((p) => p.id));

            const provider = providers[0];
            if (provider) {
                setItemOptions(provider.items?.map((i) => i.id) || []);

                const provLocs = provider.locations?.map((l: ICatalogLocation) => l.id) || [];
                const offerLocs = (provider.offers || [])
                    .flatMap((o: ICatalogOffer) =>
                        (Array.isArray(o.location_ids) ? o.location_ids : []).flatMap(
                            (v: unknown) =>
                                typeof v === "string"
                                    ? v.split(",").map((s: string) => s.trim())
                                    : v
                        )
                    )
                    .filter(Boolean) as string[];
                setLocationOptions(Array.from(new Set([...provLocs, ...offerLocs])));

                const parsedPrices: Record<string, number> = {};
                const parsedCategories: Record<string, string> = {};
                const parsedItemLocations: Record<string, string[]> = {};
                provider.items?.forEach(
                    (
                        item: ICatalogItem & {
                            price?: { value?: string };
                            category_id?: string;
                            category_ids?: string[];
                            location_id?: string;
                            location_ids?: string[] | string;
                            descriptor?: { name?: string };
                        }
                    ) => {
                        parsedPrices[item.id] = parseFloat(item.price?.value || "0");
                        if (item.category_id) {
                            parsedCategories[item.id] = item.category_id;
                        } else if (item.category_ids && item.category_ids.length > 0) {
                            parsedCategories[item.id] = item.category_ids[0];
                        }

                        let locs: string[] = [];
                        if (item.location_id) locs.push(item.location_id);
                        if (Array.isArray(item.location_ids))
                            locs = [...locs, ...item.location_ids];
                        parsedItemLocations[item.id] = Array.from(new Set(locs.filter(Boolean)));
                    }
                );
                setItemPrices(parsedPrices);
                setItemCategories(parsedCategories);
                setItemLocations(parsedItemLocations);

                const parsedCategoryNames: Record<string, string> = {};
                (
                    provider as ICatalogProvider & {
                        categories?: { id: string; descriptor?: { name?: string } }[];
                    }
                ).categories?.forEach((cat) => {
                    parsedCategoryNames[cat.id] = cat.descriptor?.name || "";
                });
                setCategoryNames(parsedCategoryNames);

                const rules: Record<string, DynamicOfferRule> = {};
                const collectedOffers: (ICatalogOffer & { items?: string[] })[] =
                    provider.offers || [];

                collectedOffers.forEach((off) => {
                    let minVal = 0;
                    let isAdditive = true;
                    const rawItemIds = Array.isArray(off.item_ids)
                        ? off.item_ids
                        : Array.isArray(off.items)
                          ? off.items
                          : [];
                    let itemIds: string[] = rawItemIds
                        .flatMap((v: unknown) =>
                            typeof v === "string" ? v.split(",").map((s: string) => s.trim()) : v
                        )
                        .filter(Boolean) as string[];

                    const categoryIds: string[] = (
                        Array.isArray(off.category_ids) ? off.category_ids : []
                    )
                        .flatMap((v: unknown) =>
                            typeof v === "string" ? v.split(",").map((s: string) => s.trim()) : v
                        )
                        .filter(Boolean) as string[];

                    const locationIds: string[] = (
                        Array.isArray(off.location_ids) ? off.location_ids : []
                    )
                        .flatMap((v: unknown) =>
                            typeof v === "string" ? v.split(",").map((s: string) => s.trim()) : v
                        )
                        .filter(Boolean) as string[];

                    let minItemCount = 0;
                    let maxItemCount = 0;

                    off.tags?.forEach((tag: ITag & { descriptor?: { code?: string } }) => {
                        const tCode = tag.code || tag.descriptor?.code;
                        if (tCode === "rules" || tCode === "qualifier" || tCode === "meta") {
                            tag.list?.forEach(
                                (l: ITargetListItem & { descriptor?: { code?: string } }) => {
                                    const lCode = l.code || l.descriptor?.code;
                                    if (lCode === "min_value") minVal = parseFloat(l.value || "0");
                                    if (lCode === "item_count")
                                        minItemCount = parseFloat(l.value || "0");
                                    if (lCode === "item_count_upper")
                                        maxItemCount = parseFloat(l.value || "0");
                                    if (lCode === "additive") {
                                        isAdditive = l.value === "true" || l.value === "yes";
                                        if (l.value === "false" || l.value === "no")
                                            isAdditive = false;
                                    }
                                    if (lCode === "item_ids") {
                                        if (l.value) {
                                            itemIds = l.value
                                                .split(",")
                                                .map((s: string) => s.trim());
                                        }
                                    }
                                }
                            );
                        }
                        if (tCode === "item_ids" && itemIds.length === 0) {
                            if (tag.list) {
                                itemIds = tag.list.map((l: ITargetListItem) => l.value);
                            }
                        }
                    });

                    rules[off.id] = {
                        id: off.id,
                        itemIds: itemIds,
                        categoryIds: categoryIds,
                        locationIds: locationIds,
                        minOrderValue: minVal,
                        minItemCount,
                        maxItemCount,
                        isAdditive: isAdditive,
                    };
                });
                setDynamicOfferRules(rules);

                const uniqueOffers = Array.from(
                    new Map(collectedOffers.map((o) => [o.id, o])).values()
                );
                setOfferOptions(uniqueOffers.map((o) => o.id));
            }

            setIsDataPasted(true);
        } catch (err) {
            toast.error("Invalid payload structure.");
            console.error(err);
        }
    }, []);

    const fetchPayloadAndPopulate = useCallback(async () => {
        try {
            if (!sessionData || !activeFlowId) return;
            const transactionId = sessionData.flowMap[activeFlowId];
            if (!transactionId) return;

            setIsLoading(true);
            const transactionData = await getTransactionData(
                transactionId,
                sessionData.subscriberUrl
            );
            if (!transactionData) {
                setIsLoading(false);
                return;
            }

            const onSearchActions = transactionData.apiList.filter(
                (api) => api.action === "on_search"
            );
            if (onSearchActions.length === 0) {
                toast.error("No on_search payload found in transaction history.");
                setIsLoading(false);
                return;
            }

            const latestOnSearch = onSearchActions[onSearchActions.length - 1];
            const payloadId = latestOnSearch.payloadId;

            const completePayloads = await getCompletePayload<unknown, IOnSearchPayload>([
                payloadId,
            ]);
            if (!completePayloads || completePayloads.length === 0) {
                setIsLoading(false);
                return;
            }

            const payloadData = completePayloads[0].req;
            processPayload(payloadData);
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching payload:", error);
            toast.error("Failed to fetch payload automatically.");
            setIsLoading(false);
        }
    }, [sessionData, activeFlowId, processPayload]);

    useEffect(() => {
        fetchPayloadAndPopulate();
    }, [fetchPayloadAndPopulate]);

    const providerLocations =
        providers.find((provider) => provider.id === selectedProvider)?.locations ?? [];

    return (
        <FormDialogShell
            onSubmit={handleSubmit(onSubmit)}
            footer={isDataPasted ? <Button type="submit">Submit</Button> : undefined}
        >
            {!isDataPasted ? (
                <p className="text-sm text-text-secondary">
                    {isLoading
                        ? "Fetching and mapping on_search payload..."
                        : "Failed to load on_search payload automatically. Please check transaction history."}
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
                        <TextField control={control} name="provider" label="Provider" required />
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
                        <Controller
                            name="available_offers"
                            control={control}
                            render={({ field }) => (
                                <Field className="space-y-2 rounded-lg border border-border-default p-3">
                                    <FieldLabel className="font-semibold">
                                        Available Offers
                                    </FieldLabel>
                                    {offerOptions.map((offerId) => {
                                        const validationError = getOfferValidationMessage(offerId);
                                        const isChecked = (field.value || []).includes(offerId);

                                        return (
                                            <label
                                                key={offerId}
                                                className={`flex items-start gap-2 rounded p-1 ${
                                                    validationError
                                                        ? "cursor-not-allowed opacity-50"
                                                        : "cursor-pointer hover:bg-surface-muted/50"
                                                }`}
                                            >
                                                <Checkbox
                                                    checked={isChecked}
                                                    disabled={!!validationError}
                                                    onCheckedChange={(checked) => {
                                                        if (validationError) return;
                                                        const current = field.value || [];
                                                        field.onChange(
                                                            checked
                                                                ? [...current, offerId]
                                                                : current.filter(
                                                                      (id) => id !== offerId
                                                                  )
                                                        );
                                                    }}
                                                />
                                                <span className="text-sm text-foreground">
                                                    {offerId}
                                                    {validationError && (
                                                        <span className="ml-2 text-[10px] text-destructive italic uppercase">
                                                            [{validationError}]
                                                        </span>
                                                    )}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </Field>
                            )}
                        />
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
    );
}

// ================= VALIDATION =================

function validateFormData(data: IFormValues) {
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
