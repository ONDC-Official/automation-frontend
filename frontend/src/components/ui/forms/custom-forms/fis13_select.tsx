import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FaRegPaste, FaTrash } from "react-icons/fa6";
import PayloadEditor from "../../mini-components/payload-editor";
import { SubmitEventParams } from "../../../../types/flow-types";
import { toast } from "react-toastify";

interface ExtractedAddon {
    id: string;
    parent_item_id: string;
    descriptor?: {
        name?: string;
        code?: string;
    };
    price?: {
        currency?: string;
        value?: string;
    };
    quantity?: {
        available?: { count?: number };
        maximum?: { count?: number };
    };
}

interface ExtractedItem {
    id: string;
    parent_item_id: string;
    descriptor?: {
        name?: string;
    };
    // Categories the item belongs to, as listed in the on_search catalogue.
    category_ids?: string[];
    add_ons: ExtractedAddon[];
}

interface SelectedAddon {
    id: string;
    quantity: number;
}

type FormValues = {
    selectedItems: ExtractedItem[];
};

type RawAddon = {
    id: string;
    descriptor?: { name?: string; code?: string };
    price?: { currency?: string; value?: string };
    quantity?: {
        available?: { count?: number };
        maximum?: { count?: number };
    };
};
type OrderItem = {
    id: string;
    parent_item_id?: string;
    descriptor?: { name?: string };
    category_ids?: string[];
    add_ons?: RawAddon[];
};
type CatalogItem = OrderItem;
type CatalogProvider = { items?: CatalogItem[] };
type Payload = {
    message?: {
        order?: { items?: OrderItem[] };
        catalog?: { providers?: CatalogProvider[] };
    };
};

export default function FIS13ItemSelection({
    submitEvent,
    referenceData,
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    referenceData?: Record<string, unknown>;
}) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [itemOptions, setItemOptions] = useState<ExtractedItem[]>([]);
    const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);

    const { handleSubmit, watch, setValue } = useForm<FormValues>({
        defaultValues: {
            selectedItems: [],
        },
    });

    const selectedItems = watch("selectedItems");

    // Add-ons available for selection are scoped to the items the user has picked.
    // De-duplicate by add-on id in case the same add-on appears on multiple items.
    const availableAddons: ExtractedAddon[] = [];
    const seenAddonIds = new Set<string>();
    selectedItems.forEach((item) => {
        item.add_ons?.forEach((addon) => {
            if (!seenAddonIds.has(addon.id)) {
                seenAddonIds.add(addon.id);
                availableAddons.push(addon);
            }
        });
    });

    // When an item is de-selected, drop any of its add-ons that are no longer available.
    useEffect(() => {
        setSelectedAddons((prev) => prev.filter((s) => seenAddonIds.has(s.id)));
    }, [selectedItems]);

    const onSubmit = async (data: FormValues) => {
        const formData: Record<string, string> = {};

        // Item selection (single item)
        formData.selected_item_ids = data.selectedItems.map((i) => i.id).join(",");
        formData.selected_parent_item_ids = data.selectedItems
            .map((i) => i.parent_item_id || "")
            .join(",");

        // Category IDs of the selected item, taken from the on_search catalogue.
        // Forwarded as a JSON array (consumed by the FIS13 select generator as
        // `category_ids` → order.items[0].category_ids).
        const selectedItem = data.selectedItems[0];
        if (selectedItem?.category_ids?.length) {
            formData.category_ids = JSON.stringify(selectedItem.category_ids);
        }

        // Add-on selection (keys consumed by the FIS13 select generator)
        if (selectedAddons.length > 0) {
            formData.addon_ids = selectedAddons.map((s) => s.id).join(",");
            formData.addon_quantities = selectedAddons.map((s) => s.quantity).join(",");

            // Forward the full add-on details (incl. price) from the pasted catalog so the
            // generator computes the correct price instead of defaulting to 0. This is the
            // generator's preferred source (`selected_add_on_details`).
            const addonDetails = selectedAddons
                .map((s) => availableAddons.find((a) => a.id === s.id))
                .filter((a): a is ExtractedAddon => Boolean(a))
                .map((a) => ({
                    id: a.id,
                    descriptor: a.descriptor,
                    price: a.price,
                    quantity: a.quantity,
                }));
            formData.selected_add_on_details = JSON.stringify(addonDetails);
        }

        await submitEvent({
            jsonPath: {},
            formData,
        });
    };

    const handlePaste = (payload: unknown) => {
        setErrorWhilePaste("");
        try {
            let results: ExtractedItem[] = [];
            const parsed = payload as Payload;

            // Fallback add-on pool from referenceData (e.g. on_search save-data),
            // used when an item carries no nested add_ons of its own.
            const fallbackAddons = (referenceData?.selected_add_ons ?? []) as RawAddon[];

            const mapItem = (item: OrderItem): ExtractedItem => {
                const nested =
                    item.add_ons && item.add_ons.length > 0 ? item.add_ons : fallbackAddons;
                return {
                    id: item.id,
                    parent_item_id: item.parent_item_id || "",
                    descriptor: item.descriptor,
                    category_ids: item.category_ids,
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

            // Handle on_select / on_init payload structure
            if (parsed?.message?.order?.items) {
                results = parsed.message.order.items.map(mapItem);
            }
            // Handle on_search / catalog payload structure.
            // Only surface items that carry a parent_item_id (i.e. selectable child
            // items); skip parent/variant-group items that have no parent_item_id.
            else if (parsed?.message?.catalog?.providers) {
                parsed.message.catalog.providers.forEach((provider: CatalogProvider) => {
                    provider.items?.forEach((item: CatalogItem) => {
                        catalogItemCount++;
                        if (item.parent_item_id) {
                            results.push(mapItem(item));
                        }
                    });
                });
            }

            // The catalog had items, but none carried a parent_item_id.
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
            const addonCount = results.reduce((sum, i) => sum + i.add_ons.length, 0);
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

    const toggleItemSelection = (item: ExtractedItem) => {
        // Single-select: clicking the selected item clears it; clicking another
        // replaces the selection so only one item can ever be selected.
        const isSelected = selectedItems.some((i) => i.id === item.id);
        setValue("selectedItems", isSelected ? [] : [item]);
    };

    const toggleAddon = (addon: ExtractedAddon) => {
        setSelectedAddons((prev) => {
            const exists = prev.find((s) => s.id === addon.id);
            if (exists) {
                return prev.filter((s) => s.id !== addon.id);
            }
            return [...prev, { id: addon.id, quantity: 1 }];
        });
    };

    const updateAddonQuantity = (id: string, quantity: number) => {
        setSelectedAddons((prev) => prev.map((s) => (s.id === id ? { ...s, quantity } : s)));
    };

    const inputStyle =
        "border rounded p-2 w-full focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white";
    const labelStyle = "mb-1 font-semibold block text-gray-700";

    return (
        <div className="max-w-2xl mx-auto">
            {isPayloadEditorActive && <PayloadEditor onAdd={handlePaste} />}

            <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setIsPayloadEditorActive(true)}
                        className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-xs"
                        title="Paste Payload"
                    >
                        <FaRegPaste size={18} />
                        <span className="text-sm font-medium">Paste Payload</span>
                    </button>

                    {itemOptions.length === 0 && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-100 italic">
                            Please paste the catalog payload (on_search) to load items and add-ons.
                        </span>
                    )}
                </div>
            </div>

            {errorWhilePaste && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2">
                    <span className="font-bold">Error:</span> {errorWhilePaste}
                </div>
            )}

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6 bg-white border border-gray-200 rounded-xl p-6 shadow-xs"
            >
                {/* ---------- Items ---------- */}
                <div className="space-y-4">
                    <label className={labelStyle}>Select Items from Payload</label>

                    {itemOptions.length > 0 ? (
                        <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100 max-h-60 overflow-y-auto">
                            {itemOptions.map((option) => {
                                const isSelected = selectedItems.some((i) => i.id === option.id);
                                return (
                                    <div
                                        key={option.id}
                                        onClick={() => toggleItemSelection(option)}
                                        className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                                            isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {}} // Handled by div onClick
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {option.descriptor?.name || option.id}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    ID: {option.id}
                                                    {option.parent_item_id &&
                                                        ` | Parent: ${option.parent_item_id}`}
                                                    {option.add_ons.length > 0 &&
                                                        ` | ${option.add_ons.length} add-on(s)`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                            <p className="text-sm text-gray-500">
                                No items loaded. Please paste a payload first.
                            </p>
                        </div>
                    )}
                </div>

                {selectedItems.length > 0 && (
                    <div className="space-y-2">
                        <label className={labelStyle}>
                            Selected Items ({selectedItems.length})
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {selectedItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium"
                                >
                                    <span>{item.descriptor?.name || item.id}</span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleItemSelection(item);
                                        }}
                                        className="hover:text-blue-900 focus:outline-hidden"
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ---------- Add-ons (scoped to selected items) ---------- */}
                {selectedItems.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <label className={labelStyle}>Select Add-ons (Optional)</label>

                        {availableAddons.length > 0 ? (
                            <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100 max-h-72 overflow-y-auto">
                                {availableAddons.map((addon) => {
                                    const isSelected = selectedAddons.some(
                                        (s) => s.id === addon.id
                                    );
                                    const selectedItem = selectedAddons.find(
                                        (s) => s.id === addon.id
                                    );
                                    const maxCount =
                                        addon.quantity?.maximum?.count ??
                                        addon.quantity?.available?.count ??
                                        10;

                                    return (
                                        <div
                                            key={addon.id}
                                            className={`p-3 transition-colors ${
                                                isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                                            }`}
                                        >
                                            <div
                                                className="flex items-center justify-between cursor-pointer"
                                                onClick={() => toggleAddon(addon)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => {}}
                                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {addon.descriptor?.name || addon.id}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            ID: {addon.id}
                                                            {addon.descriptor?.code &&
                                                                ` | ${addon.descriptor.code}`}
                                                            {addon.parent_item_id &&
                                                                ` | Item: ${addon.parent_item_id}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                {addon.price?.value && (
                                                    <span className="text-sm font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                                                        {addon.price.currency || "INR"}{" "}
                                                        {addon.price.value}
                                                    </span>
                                                )}
                                            </div>

                                            {isSelected && (
                                                <div className="mt-2 ml-7 flex items-center gap-2">
                                                    <label className="text-xs text-gray-600">
                                                        Qty:
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={maxCount}
                                                        value={selectedItem?.quantity ?? 1}
                                                        onChange={(e) =>
                                                            updateAddonQuantity(
                                                                addon.id,
                                                                Math.max(
                                                                    1,
                                                                    Math.min(
                                                                        maxCount,
                                                                        parseInt(e.target.value) ||
                                                                            1
                                                                    )
                                                                )
                                                            )
                                                        }
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-16 border rounded px-2 py-1 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <span className="text-xs text-gray-400">
                                                        (max: {maxCount})
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                                <p className="text-sm text-gray-500">
                                    No add-ons available for the selected item(s). You can proceed
                                    without selecting any.
                                </p>
                            </div>
                        )}

                        {selectedAddons.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedAddons.map((item) => {
                                    const addon = availableAddons.find((a) => a.id === item.id);
                                    return (
                                        <span
                                            key={item.id}
                                            className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium"
                                        >
                                            {addon?.descriptor?.name || item.id} x{item.quantity}
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={selectedItems.length === 0}
                    className={`w-full py-3 rounded-lg font-semibold transition-all shadow-md ${
                        selectedItems.length > 0
                            ? "bg-green-600 text-white hover:bg-green-700 active:transform active:scale-[0.98]"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                >
                    {selectedAddons.length > 0
                        ? `Submit with ${selectedAddons.length} Add-on${
                              selectedAddons.length > 1 ? "s" : ""
                          }`
                        : "Submit"}
                </button>
            </form>

            {/* Manual Input Fallback or Addition */}
            <div className="mt-8 pt-6 border-t border-gray-100">
                <details className="group">
                    <summary className="text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700 transition-colors list-none flex items-center gap-2">
                        <span className="transform group-open:rotate-90 transition-transform">
                            ▶
                        </span>
                        Advanced: Add Item Manually
                    </summary>
                    <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-xs font-semibold text-gray-600 block mb-1">
                                    Item ID
                                </label>
                                <input
                                    id="manual-id"
                                    type="text"
                                    className={inputStyle}
                                    placeholder="e.g. CHILD_ITEM_ID_I1"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-semibold text-gray-600 block mb-1">
                                    Parent Item ID
                                </label>
                                <input
                                    id="manual-parent-id"
                                    type="text"
                                    className={inputStyle}
                                    placeholder="e.g. I1"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                const idInput = document.getElementById(
                                    "manual-id"
                                ) as HTMLInputElement;
                                const parentInput = document.getElementById(
                                    "manual-parent-id"
                                ) as HTMLInputElement;
                                if (idInput.value) {
                                    const newItem: ExtractedItem = {
                                        id: idInput.value,
                                        parent_item_id: parentInput.value,
                                        add_ons: [],
                                    };
                                    const exists = itemOptions.some((opt) => opt.id === newItem.id);
                                    if (!exists) {
                                        setItemOptions([...itemOptions, newItem]);
                                    }
                                    if (!selectedItems.some((i) => i.id === newItem.id)) {
                                        toggleItemSelection(newItem);
                                    }
                                    idInput.value = "";
                                    parentInput.value = "";
                                }
                            }}
                            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-900 transition-all font-medium"
                        >
                            Add to List
                        </button>
                    </div>
                </details>
            </div>
        </div>
    );
}
