import { useState } from "react";
import { useForm, useFieldArray, Controller, FieldPath } from "react-hook-form";
import { SubmitEventParams } from "../../../../types/flow-types";
import { toast } from "react-toastify";
import { useSession } from "../../../../context/context";
import { getTransactionData, getCompletePayload } from "../../../../utils/request-utils";
import { useEffect, useCallback } from "react";

type CatalogItem = { id: string };
type TargetListItem = {
    code: string;
    value: string;
};
type Tag = {
    code: string;
    list?: TargetListItem[];
};

export interface DynamicOfferRule {
    id: string;
    itemIds: string[];
    categoryIds: string[];
    locationIds: string[];
    minOrderValue?: number;
    minItemCount?: number;
    maxItemCount?: number;
    isAdditive: boolean;
}
export type CatalogLocation = { id: string };
type CatalogOffer = {
    id: string;
    descriptor: {
        code: string;
    };
    item_ids?: string[];
    location_ids?: string[];
    category_ids?: string[];
    tags?: Tag[];
};
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
    available_offers: string[];
};

export default function RetINVLInitOffers({
    submitEvent,
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
    const { sessionData, activeFlowId } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [isDataPasted, setIsDataPasted] = useState(false);

    const { control, handleSubmit, watch, register } = useForm<FormValues>({
        defaultValues: {
            city_code: "",
            provider: "",
            provider_location: [],
            location_gps: "",
            location_pin_code: "",
            order_type: "ILBN",
            items: [
                {
                    itemId: "",
                    quantity: 1,
                    location: "",
                    estimated_price: 0,
                },
                {
                    itemId: "",
                    quantity: 1,
                    location: "",
                    estimated_price: 0,
                },
            ],
            available_offers: [],
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

    const onSubmit = async (data: FormValues) => {
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
            const providers = (data as OnSearchPayload).message.catalog["bpp/providers"];
            const parsed = data as OnSearchPayload;
            setProviders(providers);
            setCatalogPayload(parsed);

            setProviderOptions(providers.map((p) => p.id));

            const provider = providers[0];
            if (provider) {
                setItemOptions(provider.items?.map((i) => i.id) || []);

                const provLocs = provider.locations?.map((l: CatalogLocation) => l.id) || [];
                const offerLocs = (provider.offers || [])
                    .flatMap((o: CatalogOffer) =>
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
                        item: CatalogItem & {
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
                    provider as CatalogProvider & {
                        categories?: { id: string; descriptor?: { name?: string } }[];
                    }
                ).categories?.forEach((cat) => {
                    parsedCategoryNames[cat.id] = cat.descriptor?.name || "";
                });
                setCategoryNames(parsedCategoryNames);

                const rules: Record<string, DynamicOfferRule> = {};
                const collectedOffers: (CatalogOffer & { items?: string[] })[] =
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

                    off.tags?.forEach((tag: Tag & { descriptor?: { code?: string } }) => {
                        const tCode = tag.code || tag.descriptor?.code;
                        if (tCode === "rules" || tCode === "qualifier" || tCode === "meta") {
                            tag.list?.forEach(
                                (l: TargetListItem & { descriptor?: { code?: string } }) => {
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
                                itemIds = tag.list.map((l: TargetListItem) => l.value);
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

            const completePayloads = await getCompletePayload<unknown, OnSearchPayload>([
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

    const inputStyle =
        "border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
    const labelStyle = "mb-1 font-semibold";
    const fieldWrapperStyle = "flex flex-col mb-2";

    const renderSelectOrInput = (name: string, options: string[], placeholder = "") => {
        if (options.length === 0) {
            return (
                <input
                    type="text"
                    {...register(name as unknown as FieldPath<FormValues>)}
                    placeholder={placeholder}
                    className={inputStyle}
                />
            );
        }
        return (
            <select {...register(name as unknown as FieldPath<FormValues>)} className={inputStyle}>
                <option value="">Select...</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        );
    };

    return (
        <div>
            {!isDataPasted ? (
                <div className="p-3 bg-blue-50 border-l-4 border-blue-500">
                    {isLoading
                        ? "Fetching and mapping on_search payload..."
                        : "Failed to load on_search payload automatically. Please check transaction history."}
                </div>
            ) : (
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-4 p-4 h-[500px] overflow-y-scroll"
                >
                    {/* ORDER TYPE */}
                    <div className={fieldWrapperStyle}>
                        <label className={labelStyle}>Order Type</label>
                        <select {...register("order_type")} className={inputStyle}>
                            <option value="ILBN">ILBN</option>
                            <option value="ILFP">ILFP</option>
                        </select>
                    </div>

                    {/* PROVIDER */}
                    <div className={fieldWrapperStyle}>
                        <label className={labelStyle}>Provider</label>
                        {renderSelectOrInput("provider", providerOptions)}
                    </div>

                    <Controller
                        name="provider_location"
                        control={control}
                        defaultValue={[]}
                        render={({ field }) => {
                            const provider = providers.find((p) => p.id === selectedProvider);
                            const locations = provider?.locations || [];

                            const handleCheckboxChange = (value: string) => {
                                const current = Array.isArray(field.value) ? field.value : [];
                                field.onChange(
                                    current.includes(value)
                                        ? current.filter((v) => v !== value)
                                        : [...current, value]
                                );
                            };

                            if (locations.length === 0) {
                                return (
                                    <>
                                        <label className={labelStyle}>Provider Location Id:</label>
                                        <input
                                            type="text"
                                            {...register("provider_location")}
                                            className={inputStyle}
                                        />
                                    </>
                                );
                            }

                            return (
                                <div className="flex flex-col gap-2">
                                    {locations.map((loc: CatalogLocation) => (
                                        <label
                                            key={loc.id}
                                            className="inline-flex gap-2 items-center"
                                        >
                                            <input
                                                type="checkbox"
                                                value={loc.id}
                                                checked={field.value.includes(loc.id)}
                                                onChange={() => handleCheckboxChange(loc.id)}
                                                className="accent-blue-600"
                                            />
                                            <span>{loc.id}</span>
                                        </label>
                                    ))}
                                </div>
                            );
                        }}
                    />

                    {/* CITY */}
                    <div className={fieldWrapperStyle}>
                        <label className={labelStyle}>City Code</label>
                        <input {...register("city_code")} className={inputStyle} />
                    </div>

                    {/* GPS */}
                    <div className={fieldWrapperStyle}>
                        <label className={labelStyle}>GPS</label>
                        <input {...register("location_gps")} className={inputStyle} />
                    </div>

                    {/* PIN */}
                    <div className={fieldWrapperStyle}>
                        <label className={labelStyle}>Pin Code</label>
                        <input {...register("location_pin_code")} className={inputStyle} />
                    </div>
                    {offerOptions.length > 0 && (
                        <div className={fieldWrapperStyle}>
                            <label className={labelStyle}>Available Offers</label>
                            <div className="flex flex-col gap-1">
                                {offerOptions.map((offerId) => {
                                    const validationError = getOfferValidationMessage(offerId);
                                    return (
                                        <label
                                            key={offerId}
                                            className={`flex items-center gap-2 p-1 rounded ${validationError ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
                                        >
                                            <input
                                                type="checkbox"
                                                value={offerId}
                                                {...register("available_offers")}
                                                disabled={!!validationError}
                                                className="accent-blue-600"
                                            />
                                            <span className="text-sm">
                                                {offerId}
                                                {validationError && (
                                                    <span className="ml-2 text-[10px] text-red-500 italic uppercase">
                                                        [{validationError}]
                                                    </span>
                                                )}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ITEMS */}
                    {fields.map((field, index) => (
                        <div key={field.id} className="border p-3 rounded">
                            <div className={fieldWrapperStyle}>
                                <label>Item ID</label>
                                {renderSelectOrInput(`items.${index}.itemId`, itemOptions)}
                            </div>

                            <div className={fieldWrapperStyle}>
                                <label>Quantity</label>
                                <input
                                    type="number"
                                    {...register(`items.${index}.quantity`, {
                                        valueAsNumber: true,
                                    })}
                                    className={inputStyle}
                                />
                            </div>

                            <div className={fieldWrapperStyle}>
                                <label>Estimated Price</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register(`items.${index}.estimated_price`, {
                                        valueAsNumber: true,
                                    })}
                                    className={inputStyle}
                                />
                            </div>

                            <div className={fieldWrapperStyle}>
                                <label>Item Location</label>
                                {renderSelectOrInput(`items.${index}.location`, locationOptions)}
                            </div>
                        </div>
                    ))}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                append({
                                    itemId: "",
                                    quantity: 1,
                                    location: "",
                                    estimated_price: 0,
                                })
                            }
                            className="px-4 py-2 bg-blue-600 text-white rounded"
                        >
                            Add Item
                        </button>

                        {fields.length > 2 && (
                            <button
                                type="button"
                                onClick={() => remove(fields.length - 1)}
                                className="px-4 py-2 bg-red-500 text-white rounded"
                            >
                                Remove
                            </button>
                        )}
                    </div>

                    <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">
                        Submit
                    </button>
                </form>
            )}
        </div>
    );
}

// ================= VALIDATION =================

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
