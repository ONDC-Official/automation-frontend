import { useCallback, useEffect, useState, type ReactNode } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { ComboBoxControl } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import { Checkbox } from "@/components/Shadcn/Checkbox";
import { Input } from "@/components/Shadcn/TextField/input";
import { Field, FieldLabel } from "@/components/Shadcn/TextField/field";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { useSession } from "@/context/context";
import { getCompletePayload, getTransactionData } from "@/utils/request-utils";
import { cn } from "@/lib/utils";

import {
    DynamicOfferRule,
    ICatalogCategory,
    ICatalogItemFull,
    ICatalogLocation,
    ICatalogOffer,
    ICatalogProvider,
    IReteB2BInitOffersFormProps,
    IReteB2BItem,
    IRetailerCustomerInput,
    ITag,
    ITargetListItem,
    IOnSearchPayload,
} from "@/components/ui/forms/types/reteb2b-init-offers-form-types";

const toComboOptions = (values: string[]) => values.map((value) => ({ value, label: value }));

const RETAILER_TYPE_OPTIONS = [
    { value: "new", label: "New Retailer" },
    { value: "existing", label: "Existing Retailer" },
];

const FormField = ({
    label,
    required,
    children,
    className,
}: {
    label: string;
    required?: boolean;
    children: ReactNode;
    className?: string;
}) => (
    <Field className={cn("w-full", className)}>
        <FieldLabel className="font-semibold">
            {label}
            {required && <span className="text-destructive">*</span>}
        </FieldLabel>
        {children}
    </Field>
);

export default function ReteB2BInitOffersForm({ submitEvent }: IReteB2BInitOffersFormProps) {
    const { sessionData, activeFlowId } = useSession();
    const transactionId = activeFlowId ? (sessionData?.flowMap[activeFlowId] ?? null) : null;
    const subscriberUrl = sessionData?.subscriberUrl ?? null;
    const [isLoading, setIsLoading] = useState(false);

    const [catalogPayload, setCatalogPayload] = useState<IOnSearchPayload | null>(null);
    const [isDataPasted, setIsDataPasted] = useState(false);
    const [providerOptions, setProviderOptions] = useState<ICatalogProvider[]>([]);
    const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
    const [itemOptions, setItemOptions] = useState<string[]>([]);
    const [, setLocationOptions] = useState<string[]>([]);
    const [fulfillmentOptions, setFulfillmentOptions] = useState<string[]>([]);
    const [offers, setOffers] = useState<ICatalogOffer[]>([]);
    const [dynamicOfferRules, setDynamicOfferRules] = useState<Record<string, DynamicOfferRule>>(
        {}
    );
    const [itemPrices, setItemPrices] = useState<Record<string, number>>({});
    const [itemCategories, setItemCategories] = useState<Record<string, string>>({});
    const [itemNames, setItemNames] = useState<Record<string, string>>({});
    const [itemLocations, setItemLocations] = useState<Record<string, string[]>>({});
    const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});

    const [form, setForm] = useState<IRetailerCustomerInput>({
        type: "new",
        city_code: "std:080",
        provider_tax_number: "ABCDE1234E",
        shop_name: "Default Shop",
        address: "Default Address",
        state_code: "KA",
        available_offers: [],
        items: [
            {
                itemId: "",
                quantity: 1,
                location: "",
                fulfillment_id: "",
            },
        ],
    });

    const isDynamicCategoryMatch = useCallback(
        (itemCatId: string, itemNameStr: string, ruleCategoryIds: string[]) => {
            if (ruleCategoryIds?.length === 0) return true;
            const catName = (
                itemCatId && categoryNames[itemCatId] ? categoryNames[itemCatId] : itemCatId || ""
            ).toLowerCase();
            const itemName = (itemNameStr || "").toLowerCase();

            return ruleCategoryIds.some((ruleCatId) => {
                if (itemCatId === ruleCatId) return true;
                const rCatName = (categoryNames[ruleCatId] || ruleCatId).toLowerCase();

                if (
                    rCatName &&
                    catName &&
                    (catName === rCatName ||
                        catName.includes(rCatName) ||
                        rCatName.includes(catName))
                )
                    return true;
                if (
                    rCatName &&
                    itemName &&
                    (itemName.includes(rCatName) || rCatName.includes(itemName))
                )
                    return true;

                const ignoreWords = ["and", "the", "for", "with", "all"];
                const words1 = catName
                    .split(/[\s,&]+/)
                    .filter((w) => w.length > 2 && !ignoreWords.includes(w));
                let words2 = rCatName
                    .split(/[\s,&]+/)
                    .filter((w) => w.length > 2 && !ignoreWords.includes(w));
                const itemWords = itemName
                    .split(/[\s,&]+/)
                    .filter((w) => w.length > 2 && !ignoreWords.includes(w));

                if (
                    words2.some((w) =>
                        ["soft", "drink", "drinks", "beverage", "juice", "juices"].includes(w)
                    )
                ) {
                    words2 = [
                        ...words2,
                        "coca",
                        "cola",
                        "pepsi",
                        "sprite",
                        "fanta",
                        "coke",
                        "limca",
                        "thums",
                        "up",
                        "mazaa",
                        "mirinda",
                        "7up",
                        "mountain",
                        "dew",
                    ];
                }
                if (words2.some((w) => ["atta", "flour", "flours", "sooji"].includes(w))) {
                    words2 = [...words2, "wheat", "chakki", "maida", "besan"];
                }

                if (
                    words1.some((w1) =>
                        words2.some((w2) => w1 === w2 || w1.includes(w2) || w2.includes(w1))
                    )
                )
                    return true;
                if (
                    itemWords.some((w1) =>
                        words2.some((w2) => w1 === w2 || w1.includes(w2) || w2.includes(w1))
                    )
                )
                    return true;

                return false;
            });
        },
        [categoryNames]
    );

    const getOfferValidationMessage = useCallback(
        (offerId: string): string | null => {
            const rule = dynamicOfferRules[offerId];
            if (!rule) return null;

            const hasItemRules = rule.itemIds && rule.itemIds.length > 0;
            const hasCategoryRules = rule.categoryIds && rule.categoryIds.length > 0;
            const hasLocationRules = rule.locationIds && rule.locationIds.length > 0;

            if (hasItemRules || hasCategoryRules || hasLocationRules) {
                const hasCompatibleItem = form.items.some((item) => {
                    if (!item.itemId || item.quantity <= 0) return false;

                    const itemLocation = item.location || itemLocations[item.itemId]?.[0] || "";
                    const locMatch =
                        hasLocationRules && itemLocation && rule.locationIds.includes(itemLocation);

                    const itemMatch = hasItemRules && rule.itemIds.includes(item.itemId);

                    const catId = itemCategories[item.itemId];
                    const itemName = itemNames[item.itemId] || "";
                    let catMatch = true;
                    if (hasCategoryRules) {
                        catMatch = isDynamicCategoryMatch(catId, itemName, rule.categoryIds);
                    }

                    return locMatch && itemMatch && catMatch;
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

            const selected = form.available_offers || [];
            const otherSelected = selected.filter((id) => id !== offerId);
            if (otherSelected.length > 0) {
                if (!rule.isAdditive) return "Cannot combine with other offers.";
                const hasNonAdditiveSelected = otherSelected.some(
                    (id) => dynamicOfferRules[id] && !dynamicOfferRules[id].isAdditive
                );
                if (hasNonAdditiveSelected) return "A non-combinable offer is already active.";
            }

            const qualifyingItems = form.items.filter((item) => {
                const hasItemRules = rule.itemIds && rule.itemIds.length > 0;
                const hasCategoryRules = rule.categoryIds && rule.categoryIds.length > 0;
                const hasLocationRules = rule.locationIds && rule.locationIds.length > 0;

                if (hasItemRules || hasCategoryRules || hasLocationRules) {
                    const itemLocation = item.location || itemLocations[item.itemId]?.[0] || "";
                    const locMatch =
                        hasLocationRules && itemLocation && rule.locationIds.includes(itemLocation);

                    const itemMatch = hasItemRules && rule.itemIds.includes(item.itemId);

                    const catId = itemCategories[item.itemId];
                    const itemName = itemNames[item.itemId] || "";
                    let catMatch = true;
                    if (hasCategoryRules) {
                        catMatch = isDynamicCategoryMatch(catId, itemName, rule.categoryIds);
                    }

                    return locMatch && itemMatch && catMatch;
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
            form.items,
            itemLocations,
            itemPrices,
            itemCategories,
            itemNames,
            categoryNames,
            isDynamicCategoryMatch,
        ]
    );

    const processPayload = useCallback((data: unknown) => {
        try {
            const parsed = data as IOnSearchPayload;
            setCatalogPayload(parsed);

            const providers = parsed.message.catalog["bpp/providers"] || [];
            setProviderOptions(providers);
            setSelectedProviderId(null);

            setItemOptions([]);
            setLocationOptions([]);
            setFulfillmentOptions([]);
            setOffers([]);
            setDynamicOfferRules({});
            setItemPrices({});
            setItemCategories({});
            setItemNames({});
            setItemLocations({});
            setCategoryNames({});

            setIsDataPasted(true);
        } catch (err) {
            toast.error("Invalid payload structure.");
            console.error("Invalid on_search payload", err);
        }
    }, []);

    const handleProviderSelect = useCallback(
        (providerId: string) => {
            const provider = providerOptions.find((p) => p.id === providerId);
            if (!provider) return;

            setSelectedProviderId(providerId);

            const allItemOptions = provider.items?.map((i) => i.id) || [];

            const allProvLocs = provider.locations?.map((l: ICatalogLocation) => l.id) || [];
            const offerLocs = (provider.offers || [])
                .flatMap((o: ICatalogOffer) =>
                    (Array.isArray(o.location_ids) ? o.location_ids : []).flatMap((v: unknown) =>
                        typeof v === "string"
                            ? v.split(",").map((s: string) => s.trim())
                            : (v as string)
                    )
                )
                .filter(Boolean);

            const allFulfillmentOptions = provider.fulfillments?.map((f) => f.id) || [];

            const parsedPrices: Record<string, number> = {};
            const parsedCategories: Record<string, string> = {};
            const parsedItemNames: Record<string, string> = {};
            const parsedItemLocations: Record<string, string[]> = {};
            const parsedCategoryNames: Record<string, string> = {};

            provider.items?.forEach((item: ICatalogItemFull) => {
                parsedPrices[item.id] = parseFloat(item.price?.value || "0");
                parsedItemNames[item.id] = item.descriptor?.name || "";
                if (item.category_id) {
                    parsedCategories[item.id] = item.category_id;
                } else if (item.category_ids && item.category_ids.length > 0) {
                    parsedCategories[item.id] = item.category_ids[0];
                }

                let locs: string[] = [];
                if (item.location_id) locs.push(item.location_id);
                if (Array.isArray(item.location_ids)) locs = [...locs, ...item.location_ids];
                parsedItemLocations[item.id] = Array.from(new Set(locs.filter(Boolean)));
            });

            provider.categories?.forEach((cat: ICatalogCategory) => {
                parsedCategoryNames[cat.id] = cat.descriptor?.name || "";
            });

            const collectedOffers: ICatalogOffer[] = provider.offers || [];

            setItemOptions(allItemOptions);
            setLocationOptions(Array.from(new Set([...allProvLocs, ...offerLocs])));
            setFulfillmentOptions(allFulfillmentOptions);
            setItemPrices(parsedPrices);
            setItemCategories(parsedCategories);
            setItemNames(parsedItemNames);
            setItemLocations(parsedItemLocations);
            setCategoryNames(parsedCategoryNames);

            const rules: Record<string, DynamicOfferRule> = {};
            collectedOffers.forEach((off: ICatalogOffer) => {
                let minVal = 0;
                let isAdditive = true;
                const rawItemIds = Array.isArray(off.item_ids)
                    ? off.item_ids
                    : Array.isArray(off.items)
                      ? off.items
                      : [];
                let itemIds: string[] = rawItemIds
                    .flatMap((v: unknown) =>
                        typeof v === "string"
                            ? v.split(",").map((s: string) => s.trim())
                            : (v as string)
                    )
                    .filter(Boolean);

                const categoryIds: string[] = (
                    Array.isArray(off.category_ids) ? off.category_ids : []
                )
                    .flatMap((v: unknown) =>
                        typeof v === "string"
                            ? v.split(",").map((s: string) => s.trim())
                            : (v as string)
                    )
                    .filter(Boolean);

                const locationIds: string[] = (
                    Array.isArray(off.location_ids) ? off.location_ids : []
                )
                    .flatMap((v: unknown) =>
                        typeof v === "string"
                            ? v.split(",").map((s: string) => s.trim())
                            : (v as string)
                    )
                    .filter(Boolean);

                let minItemCount = 0;
                let maxItemCount = 0;

                off.tags?.forEach((tag: ITag) => {
                    const tCode = tag.code || tag.descriptor?.code;
                    if (tCode === "rules" || tCode === "qualifier" || tCode === "meta") {
                        tag.list?.forEach((l: ITargetListItem) => {
                            const lCode = l.code || l.descriptor?.code;
                            if (lCode === "min_value") minVal = parseFloat(l.value || "0");
                            if (lCode === "item_count") minItemCount = parseFloat(l.value || "0");
                            if (lCode === "item_count_upper")
                                maxItemCount = parseFloat(l.value || "0");
                            if (lCode === "additive") {
                                isAdditive = l.value === "true" || l.value === "yes";
                                if (l.value === "false" || l.value === "no") isAdditive = false;
                            }
                            if (lCode === "item_ids" && l.value) {
                                itemIds = l.value.split(",").map((s: string) => s.trim());
                            }
                        });
                    }
                    if (tCode === "item_ids" && itemIds.length === 0 && tag.list) {
                        itemIds = tag.list.map((l: ITargetListItem) => l.value);
                    }
                });

                rules[off.id] = {
                    id: off.id,
                    itemIds,
                    categoryIds,
                    locationIds,
                    minOrderValue: minVal,
                    minItemCount,
                    maxItemCount,
                    isAdditive,
                };
            });

            setDynamicOfferRules(rules);
            const uniqueOffers = Array.from(
                new Map(collectedOffers.map((o) => [o.id, o])).values()
            );
            setOffers(uniqueOffers);

            setForm((prev) => ({
                ...prev,
                items: [{ itemId: "", quantity: 1, location: "", fulfillment_id: "" }],
                available_offers: [],
            }));
        },
        [providerOptions]
    );

    const fetchPayloadAndPopulate = useCallback(async () => {
        try {
            if (!transactionId || !subscriberUrl) return;

            setIsLoading(true);
            const transactionData = await getTransactionData(transactionId, subscriberUrl);
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
    }, [transactionId, subscriberUrl, processPayload]);

    useEffect(() => {
        fetchPayloadAndPopulate();
    }, [fetchPayloadAndPopulate]);

    const handleChange = (key: keyof IRetailerCustomerInput, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleItemChange = (index: number, key: keyof IReteB2BItem, value: string | number) => {
        const updatedItems = [...form.items];
        updatedItems[index] = { ...updatedItems[index], [key]: value };

        if (key === "itemId" && typeof value === "string" && value) {
            const autoLocations = itemLocations[value];
            if (autoLocations && autoLocations.length > 0) {
                updatedItems[index].location = autoLocations[0];
            }
        }

        setForm({ ...form, items: updatedItems, available_offers: [] });
    };

    const addItem = () => {
        if (form.items.length >= 5) return;
        setForm({
            ...form,
            items: [...form.items, { itemId: "", quantity: 1, location: "", fulfillment_id: "" }],
        });
    };

    const removeItem = (index: number) => {
        if (form.items.length === 1) return;
        const updatedItems = form.items.filter((_, i) => i !== index);
        setForm({ ...form, items: updatedItems, available_offers: [] });
    };

    const toggleOffer = (offerId: string) => {
        const selected = form.available_offers || [];
        if (selected.includes(offerId)) {
            setForm({ ...form, available_offers: selected.filter((id) => id !== offerId) });
        } else {
            const error = getOfferValidationMessage(offerId);
            if (error) {
                toast.error(error);
                return;
            }
            setForm({ ...form, available_offers: [...selected, offerId] });
        }
    };

    const submit = async () => {
        if (!selectedProviderId) {
            toast.error("Please select a provider");
            return;
        }
        if (!form.city_code) {
            toast.error("City code is required");
            return;
        }
        if (form.type === "new") {
            if (
                !form.customer_id ||
                !form.phone_number ||
                !form.email ||
                !form.tax_number ||
                !form.provider_tax_number ||
                !form.shop_name ||
                !form.address
            ) {
                toast.error("All fields required for new retailer");
                return;
            }
        }
        if (!catalogPayload) {
            toast.error("Please paste on_search payload first");
            return;
        }

        const selectedProvider = providerOptions.find((p) => p.id === selectedProviderId);
        await submitEvent({
            jsonPath: {},
            formData: {
                ...form,
                live_catalog: catalogPayload,
                provider_id: selectedProviderId,
                provider_name: selectedProvider?.descriptor?.name ?? "",
                provider_code: selectedProvider?.descriptor?.code ?? "",
                provider_short_desc: selectedProvider?.descriptor?.short_desc ?? "",
            } as unknown as Record<string, string>,
            catalog: catalogPayload,
        });
    };

    const providerComboOptions = providerOptions.map((p) => ({
        value: p.id,
        label: p.descriptor?.name ? `${p.id} – ${p.descriptor.name}` : p.id,
    }));

    return (
        <FormDialogShell
            onSubmit={(event) => {
                event.preventDefault();
                void submit();
            }}
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
                    <ComboBoxControl
                        label="Retailer Type"
                        value={form.type}
                        onValueChange={(value) => handleChange("type", value)}
                        options={RETAILER_TYPE_OPTIONS}
                    />

                    {form.type !== "new" && (
                        <FormField label="Customer ID" required>
                            <Input
                                value={form.customer_id ?? ""}
                                onChange={(e) => handleChange("customer_id", e.target.value)}
                            />
                        </FormField>
                    )}

                    <FormField label="City Code" required>
                        <Input
                            value={form.city_code}
                            onChange={(e) => handleChange("city_code", e.target.value)}
                        />
                    </FormField>

                    {form.type === "new" && (
                        <>
                            <FormField label="Phone Number" required>
                                <Input
                                    value={form.phone_number ?? ""}
                                    onChange={(e) => handleChange("phone_number", e.target.value)}
                                />
                            </FormField>
                            <FormField label="Email" required>
                                <Input
                                    value={form.email ?? ""}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                />
                            </FormField>
                            <FormField label="GST Number" required>
                                <Input
                                    value={form.tax_number ?? ""}
                                    onChange={(e) => handleChange("tax_number", e.target.value)}
                                />
                            </FormField>
                            <FormField label="PAN Number" required>
                                <Input
                                    value={form.provider_tax_number ?? ""}
                                    onChange={(e) =>
                                        handleChange("provider_tax_number", e.target.value)
                                    }
                                />
                            </FormField>
                        </>
                    )}

                    <FormField label="Shop Name" required>
                        <Input
                            value={form.shop_name ?? ""}
                            onChange={(e) => handleChange("shop_name", e.target.value)}
                        />
                    </FormField>

                    <FormField label="Address" required>
                        <Input
                            value={form.address ?? ""}
                            onChange={(e) => handleChange("address", e.target.value)}
                        />
                    </FormField>

                    <FormField label="State Code" required>
                        <Input
                            value={form.state_code ?? ""}
                            onChange={(e) => handleChange("state_code", e.target.value)}
                        />
                    </FormField>

                    <ComboBoxControl
                        label="Select Provider"
                        required
                        value={selectedProviderId ?? ""}
                        onValueChange={handleProviderSelect}
                        options={[
                            { value: "", label: "-- Select a provider --" },
                            ...providerComboOptions,
                        ]}
                        placeholder="Select a provider"
                    />

                    {selectedProviderId && (
                        <>
                            <div className="space-y-3">
                                <h3 className="font-semibold text-foreground">Items</h3>
                                {form.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex flex-wrap items-end gap-2 rounded-lg border border-border-default p-3"
                                    >
                                        <ComboBoxControl
                                            className="min-w-[140px] flex-1"
                                            label="Item"
                                            value={item.itemId}
                                            onValueChange={(value) =>
                                                handleItemChange(index, "itemId", value)
                                            }
                                            options={toComboOptions(itemOptions)}
                                            placeholder="Item"
                                        />
                                        <FormField label="Qty" className="w-20">
                                            <Input
                                                type="number"
                                                min={1}
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    handleItemChange(
                                                        index,
                                                        "quantity",
                                                        Number(e.target.value)
                                                    )
                                                }
                                            />
                                        </FormField>
                                        <ComboBoxControl
                                            className="min-w-[120px] flex-1"
                                            label="Location"
                                            value={item.location}
                                            onValueChange={(value) =>
                                                handleItemChange(index, "location", value)
                                            }
                                            options={toComboOptions(
                                                item.itemId && itemLocations[item.itemId]
                                                    ? itemLocations[item.itemId]
                                                    : []
                                            )}
                                            placeholder="Location"
                                        />
                                        <ComboBoxControl
                                            className="min-w-[120px] flex-1"
                                            label="Fulfillment"
                                            value={item.fulfillment_id}
                                            onValueChange={(value) =>
                                                handleItemChange(index, "fulfillment_id", value)
                                            }
                                            options={toComboOptions(fulfillmentOptions)}
                                            placeholder="Fulfillment"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => removeItem(index)}
                                            disabled={form.items.length === 1}
                                        >
                                            <TrashIcon className="size-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addItem}
                                    disabled={form.items.length >= 5}
                                >
                                    <PlusIcon className="size-4" />
                                    Add Item
                                </Button>
                            </div>

                            {offers.length > 0 && (
                                <Field className="space-y-2 rounded-lg border border-border-default p-3">
                                    <FieldLabel className="font-semibold">
                                        Available Offers
                                    </FieldLabel>
                                    {offers.map((offer) => {
                                        const validationError = getOfferValidationMessage(offer.id);
                                        const isChecked =
                                            form.available_offers?.includes(offer.id) ?? false;

                                        return (
                                            <label
                                                key={offer.id}
                                                className={cn(
                                                    "flex items-start gap-2 rounded p-1",
                                                    validationError && !isChecked
                                                        ? "cursor-not-allowed opacity-50"
                                                        : "cursor-pointer hover:bg-surface-muted/50"
                                                )}
                                            >
                                                <Checkbox
                                                    checked={isChecked}
                                                    disabled={!!validationError && !isChecked}
                                                    onCheckedChange={() => toggleOffer(offer.id)}
                                                />
                                                <span className="text-sm text-foreground">
                                                    {offer.id} ({offer.descriptor.code})
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
                        </>
                    )}
                </div>
            )}
        </FormDialogShell>
    );
}
