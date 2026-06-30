import { useCallback, useState } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

import { ComboBoxControl } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import { Checkbox } from "@/components/Shadcn/Checkbox";
import { Input } from "@/components/Shadcn/TextField/input";
import { Field, FieldLabel } from "@/components/Shadcn/TextField/field";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import { cn } from "@/lib/utils";

const toComboOptions = (values: string[]) => values.map((value) => ({ value, label: value }));

const FormField = ({
    label,
    required = false,
    children,
    className,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
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

import type {
    DynamicOfferRule,
    IReteB2BItem,
    IRetailerCustomerInput,
    ITag,
    ICatalogItemFull,
    ICatalogLocation,
    ICatalogCategory,
    ITargetListItem,
    ICatalogOffer,
    IOnSearchPayload,
    IReteB2BSelectFormProps,
} from "../types/reteb2b-select-form-types";

export default function ReteB2BSelectForm({ submitEvent }: IReteB2BSelectFormProps) {
    const [catalogPayload, setCatalogPayload] = useState<IOnSearchPayload | null>(null);
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [isDataPasted, setIsDataPasted] = useState(false);
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

    // --- Dynamic Validation Helper ---
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

                // FMCG Aliasing to support specific brand matching via category definitions
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

            // 1. Item & Category Compatibility
            const hasItemRules = rule.itemIds && rule.itemIds.length > 0;
            const hasCategoryRules = rule.categoryIds && rule.categoryIds.length > 0;
            const hasLocationRules = rule.locationIds && rule.locationIds.length > 0;

            if (hasItemRules || hasCategoryRules || hasLocationRules) {
                const hasCompatibleItem = form.items.some((item) => {
                    if (!item.itemId || item.quantity <= 0) return false;

                    // Location Check
                    const itemLocation = item.location || itemLocations[item.itemId]?.[0] || "";
                    const locMatch =
                        hasLocationRules && itemLocation && rule.locationIds.includes(itemLocation);

                    // Item Check
                    const itemMatch = hasItemRules && rule.itemIds.includes(item.itemId);

                    // Category Check
                    const catId = itemCategories[item.itemId];
                    const itemName = itemNames[item.itemId] || "";
                    let catMatch = true;
                    if (hasCategoryRules) {
                        catMatch = isDynamicCategoryMatch(catId, itemName, rule.categoryIds);
                    }

                    // Valid if ANY of the criteria match (Location OR Item OR Category)
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

            // 2. Additivity
            const selected = form.available_offers || [];
            const otherSelected = selected.filter((id) => id !== offerId);
            if (otherSelected.length > 0) {
                if (!rule.isAdditive) return "Cannot combine with other offers.";
                const hasNonAdditiveSelected = otherSelected.some(
                    (id) => dynamicOfferRules[id] && !dynamicOfferRules[id].isAdditive
                );
                if (hasNonAdditiveSelected) return "A non-combinable offer is already active.";
            }

            // 3. Dynamic Qualifiers Calculation
            // First determine the valid items that qualify for the offer's rules
            const qualifyingItems = form.items.filter((item) => {
                const hasItemRules = rule.itemIds && rule.itemIds.length > 0;
                const hasCategoryRules = rule.categoryIds && rule.categoryIds.length > 0;
                const hasLocationRules = rule.locationIds && rule.locationIds.length > 0;

                if (hasItemRules || hasCategoryRules || hasLocationRules) {
                    // Location Check
                    const itemLocation = item.location || itemLocations[item.itemId]?.[0] || "";
                    const locMatch =
                        hasLocationRules && itemLocation && rule.locationIds.includes(itemLocation);

                    // Item Check
                    const itemMatch = hasItemRules && rule.itemIds.includes(item.itemId);

                    // Category Check
                    const catId = itemCategories[item.itemId];
                    const itemName = itemNames[item.itemId] || "";
                    let catMatch = true;
                    if (hasCategoryRules) {
                        catMatch = isDynamicCategoryMatch(catId, itemName, rule.categoryIds);
                    }

                    // Valid if ANY of the criteria match (Location OR Item OR Category)
                    return locMatch && itemMatch && catMatch;
                }
                return true;
            });

            // 3a. Min Order Value
            if (rule.minOrderValue && rule.minOrderValue > 0) {
                const totalValue = qualifyingItems.reduce(
                    (sum, item) => sum + (itemPrices[item.itemId] || 0) * item.quantity,
                    0
                );
                if (totalValue < rule.minOrderValue)
                    return `Min value ₹${rule.minOrderValue} required on valid items (Current: ₹${totalValue})`;
            }

            // 3b. Item Count
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

    const handlePaste = (data: unknown) => {
        try {
            const parsed = data as IOnSearchPayload;

            // STORE FULL CATALOG HERE (MAIN FIX)
            setCatalogPayload(parsed);

            const providers = parsed.message.catalog["bpp/providers"];

            if (providers && providers.length > 0) {
                let allItemOptions: string[] = [];
                let allProvLocs: string[] = [];
                let allOfferLocs: string[] = [];
                let allFulfillmentOptions: string[] = [];

                const parsedPrices: Record<string, number> = {};
                const parsedCategories: Record<string, string> = {};
                const parsedItemNames: Record<string, string> = {};
                const parsedItemLocations: Record<string, string[]> = {};
                const parsedCategoryNames: Record<string, string> = {};

                let collectedOffers: ICatalogOffer[] = [];

                providers.forEach((provider) => {
                    allItemOptions = [
                        ...allItemOptions,
                        ...(provider.items?.map((i) => i.id) || []),
                    ];

                    allProvLocs = [
                        ...allProvLocs,
                        ...(provider.locations?.map((l: ICatalogLocation) => l.id) || []),
                    ];
                    const offerLocs = (provider.offers || [])
                        .flatMap((o: ICatalogOffer) =>
                            (Array.isArray(o.location_ids) ? o.location_ids : []).flatMap(
                                (v: string | string[]) =>
                                    typeof v === "string"
                                        ? v.split(",").map((s: string) => s.trim())
                                        : v
                            )
                        )
                        .filter(Boolean);
                    allOfferLocs = [...allOfferLocs, ...offerLocs];

                    if (provider.fulfillments) {
                        allFulfillmentOptions = [
                            ...allFulfillmentOptions,
                            ...provider.fulfillments.map((f) => f.id),
                        ];
                    }

                    // Extract Item Prices, Names, and Categories Dynamically
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
                        if (Array.isArray(item.location_ids))
                            locs = [...locs, ...item.location_ids];
                        parsedItemLocations[item.id] = Array.from(new Set(locs.filter(Boolean)));
                    });

                    provider.categories?.forEach((cat: ICatalogCategory) => {
                        parsedCategoryNames[cat.id] = cat.descriptor?.name || "";
                    });

                    collectedOffers = [...collectedOffers, ...(provider.offers || [])];
                });

                setItemOptions(allItemOptions);
                setLocationOptions(Array.from(new Set([...allProvLocs, ...allOfferLocs])));
                setFulfillmentOptions(allFulfillmentOptions);

                setItemPrices(parsedPrices);
                setItemCategories(parsedCategories);
                setItemNames(parsedItemNames);
                setItemLocations(parsedItemLocations);
                setCategoryNames(parsedCategoryNames);

                // Extract Offers and Build Rules Dynamically
                const rules: Record<string, DynamicOfferRule> = {};

                // Standardizing rules from payload tags (highly dynamic to adapt to different on_search structures)
                collectedOffers.forEach((off: ICatalogOffer) => {
                    let minVal = 0;
                    let isAdditive = true;
                    // Provide defaults so even empty structures adapt gracefully
                    const rawItemIds = Array.isArray(off.item_ids)
                        ? off.item_ids
                        : Array.isArray(off.items)
                          ? off.items
                          : [];
                    let itemIds: string[] = rawItemIds
                        .flatMap((v: string | string[]) =>
                            typeof v === "string" ? v.split(",").map((s: string) => s.trim()) : v
                        )
                        .filter(Boolean);

                    const categoryIds: string[] = (
                        Array.isArray(off.category_ids) ? off.category_ids : []
                    )
                        .flatMap((v: string | string[]) =>
                            typeof v === "string" ? v.split(",").map((s: string) => s.trim()) : v
                        )
                        .filter(Boolean);

                    const locationIds: string[] = (
                        Array.isArray(off.location_ids) ? off.location_ids : []
                    )
                        .flatMap((v: string | string[]) =>
                            typeof v === "string" ? v.split(",").map((s: string) => s.trim()) : v
                        )
                        .filter(Boolean);

                    let minItemCount = 0;
                    let maxItemCount = 0;

                    // Dynamically scrape all tags to find offer rules constraints
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
                                        // Make sure "false" or "no" results in false
                                        if (l.value === "false" || l.value === "no")
                                            isAdditive = false;
                                    }
                                    if (lCode === "item_ids") {
                                        // In case itemIds are provided as a comma separated string within rules
                                        if (l.value) {
                                            itemIds = l.value
                                                .split(",")
                                                .map((s: string) => s.trim());
                                        }
                                    }
                                }
                            );
                        }
                        // Fallback: Check if there's an explicit item_ids tag group with a list of values
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
                setOffers(uniqueOffers);
            }
            setIsDataPasted(true);
        } catch (err) {
            console.error("Invalid on_search payload", err);
        }
        setIsPayloadEditorActive(false);
    };

    const handleChange = (key: keyof IRetailerCustomerInput, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleItemChange = (index: number, key: keyof IReteB2BItem, value: string | number) => {
        const updatedItems = [...form.items];
        updatedItems[index] = { ...updatedItems[index], [key]: value };

        // Auto-populate location if itemId changes
        if (key === "itemId" && typeof value === "string" && value) {
            const autoLocations = itemLocations[value];
            if (autoLocations && autoLocations.length > 0) {
                updatedItems[index].location = autoLocations[0];
            }
        }

        // Reset offers if items change (to re-validate)
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
            // --- UPDATED: Add validation check before selecting ---
            const error = getOfferValidationMessage(offerId);
            if (error) {
                alert(error);
                return;
            }
            setForm({ ...form, available_offers: [...selected, offerId] });
        }
    };

    const submit = async () => {
        if (!form.city_code) {
            alert("City code is required");
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
                alert("All fields required for new retailer");
                return;
            }
        }
        if (!catalogPayload) {
            alert("Please paste on_search payload first");
            return;
        }
        await submitEvent({
            jsonPath: {},
            formData: {
                ...form,
                live_catalog: catalogPayload,
            } as unknown as Record<string, string>,
            catalog: catalogPayload,
        });
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
                    void submit();
                }}
                footer={isDataPasted ? <Button type="submit">Submit</Button> : undefined}
            >
                <PastePayloadButton
                    onClick={() => setIsPayloadEditorActive(true)}
                    label="Paste on_search"
                />

                {!isDataPasted ? (
                    <p className="text-sm text-text-secondary">
                        Paste the <strong>on_search</strong> payload to continue.
                    </p>
                ) : (
                    <div className="space-y-4">
                        <FormField label="Retailer Type">
                            <ComboBoxControl
                                value={form.type}
                                onValueChange={(value) =>
                                    handleChange("type", value as "new" | "existing")
                                }
                                options={[
                                    { value: "new", label: "New Retailer" },
                                    { value: "existing", label: "Existing Retailer" },
                                ]}
                            />
                        </FormField>

                        <FormField label="Customer ID" required={form.type !== "new"}>
                            <Input
                                value={form.customer_id ?? ""}
                                onChange={(event) =>
                                    handleChange("customer_id", event.target.value)
                                }
                            />
                        </FormField>

                        <FormField label="City Code" required>
                            <Input
                                value={form.city_code}
                                onChange={(event) => handleChange("city_code", event.target.value)}
                            />
                        </FormField>

                        <FormField label="Phone Number" required={form.type === "new"}>
                            <Input
                                value={form.phone_number ?? ""}
                                onChange={(event) =>
                                    handleChange("phone_number", event.target.value)
                                }
                            />
                        </FormField>

                        <FormField label="Email" required={form.type === "new"}>
                            <Input
                                value={form.email ?? ""}
                                onChange={(event) => handleChange("email", event.target.value)}
                            />
                        </FormField>

                        <FormField label="GST Number" required={form.type === "new"}>
                            <Input
                                value={form.tax_number ?? ""}
                                onChange={(event) => handleChange("tax_number", event.target.value)}
                            />
                        </FormField>

                        <FormField label="PAN Number" required={form.type === "new"}>
                            <Input
                                value={form.provider_tax_number ?? ""}
                                onChange={(event) =>
                                    handleChange("provider_tax_number", event.target.value)
                                }
                            />
                        </FormField>

                        <FormField label="Shop Name" required>
                            <Input
                                value={form.shop_name ?? ""}
                                onChange={(event) => handleChange("shop_name", event.target.value)}
                            />
                        </FormField>

                        <FormField label="Address" required>
                            <Input
                                value={form.address ?? ""}
                                onChange={(event) => handleChange("address", event.target.value)}
                            />
                        </FormField>

                        <FormField label="State Code" required>
                            <Input
                                value={form.state_code ?? ""}
                                onChange={(event) => handleChange("state_code", event.target.value)}
                            />
                        </FormField>

                        <div className="space-y-3 rounded-lg border border-border-default p-3">
                            <h3 className="text-sm font-semibold text-text-primary">Items</h3>
                            {form.items.map((item, index) => (
                                <div
                                    key={index}
                                    className="grid gap-2 rounded-md border border-border-default bg-surface-muted/40 p-3 md:grid-cols-2"
                                >
                                    <ComboBoxControl
                                        label="Item"
                                        value={item.itemId}
                                        onValueChange={(value) =>
                                            handleItemChange(index, "itemId", value)
                                        }
                                        options={toComboOptions(itemOptions)}
                                        placeholder="Select item..."
                                    />
                                    <FormField label="Quantity">
                                        <Input
                                            type="number"
                                            min={1}
                                            value={item.quantity}
                                            onChange={(event) =>
                                                handleItemChange(
                                                    index,
                                                    "quantity",
                                                    Number(event.target.value)
                                                )
                                            }
                                        />
                                    </FormField>
                                    <ComboBoxControl
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
                                        placeholder="Select location..."
                                    />
                                    <ComboBoxControl
                                        label="Fulfillment"
                                        value={item.fulfillment_id}
                                        onValueChange={(value) =>
                                            handleItemChange(index, "fulfillment_id", value)
                                        }
                                        options={toComboOptions(fulfillmentOptions)}
                                        placeholder="Select fulfillment..."
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive md:col-span-2"
                                        onClick={() => removeItem(index)}
                                    >
                                        <TrashIcon className="size-4" />
                                        Remove
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                <PlusIcon className="size-4" />
                                Add Item
                            </Button>
                        </div>

                        <Field className="space-y-2 rounded-lg border border-border-default p-3">
                            <FieldLabel className="font-semibold">Available Offers</FieldLabel>
                            {offers.map((offer) => {
                                const validationError = getOfferValidationMessage(offer.id);
                                return (
                                    <label
                                        key={offer.id}
                                        className={`flex items-start gap-2 rounded p-1 ${
                                            validationError
                                                ? "cursor-not-allowed opacity-50"
                                                : "cursor-pointer hover:bg-surface-muted/50"
                                        }`}
                                    >
                                        <Checkbox
                                            checked={
                                                form.available_offers?.includes(offer.id) || false
                                            }
                                            disabled={!!validationError}
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
                    </div>
                )}
            </FormDialogShell>
        </>
    );
}
