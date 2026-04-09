import { useState } from "react";
import { useForm } from "react-hook-form";
import { FaRegPaste } from "react-icons/fa6";
import { toast } from "react-toastify";
import PayloadEditor from "../../mini-components/payload-editor";
import { SubmitEventParams } from "../../../../types/flow-types";

interface CatalogAddOn {
    id: string;
    descriptor?: { name?: string; code?: string };
    price?: { value?: string; currency?: string };
    quantity?: { available?: { count?: number }; maximum?: { count?: number } };
}

interface CatalogItem {
    id: string;
    descriptor?: { name?: string; short_desc?: string };
    category_ids?: string[];
    add_ons?: CatalogAddOn[];
    parent_item_id?: string;
}

interface CatalogFulfillment {
    id: string;
    type?: string;
}

interface CatalogProvider {
    id: string;
    descriptor?: { name?: string };
    items?: CatalogItem[];
    fulfillments?: CatalogFulfillment[];
}

interface ParsedCatalog {
    provider: CatalogProvider;
    items: CatalogItem[];
    fulfillmentId: string;
}

interface SelectedAddOn {
    id: string;
    quantity: number;
}

type FormValues = {
    selectedItemIndex: number;
};

export default function InsuranceSelect({
    submitEvent,
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [catalog, setCatalog] = useState<ParsedCatalog | null>(null);
    const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOn[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { handleSubmit, watch, setValue } = useForm<FormValues>({
        defaultValues: { selectedItemIndex: 0 },
    });

    const selectedItemIndex = watch("selectedItemIndex");
    const selectedItem = catalog?.items?.[selectedItemIndex];
    const availableAddOns = selectedItem?.add_ons || [];

    const handlePaste = (payload: unknown) => {
        setErrorWhilePaste("");
        try {
            const parsed = payload as {
                message?: { catalog?: { providers?: CatalogProvider[] } };
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

    const toggleAddon = (addon: CatalogAddOn) => {
        setSelectedAddOns((prev) => {
            const exists = prev.find((s) => s.id === addon.id);
            if (exists) return prev.filter((s) => s.id !== addon.id);
            return [...prev, { id: addon.id, quantity: 1 }];
        });
    };

    const updateAddonQuantity = (id: string, quantity: number) => {
        setSelectedAddOns((prev) => prev.map((s) => (s.id === id ? { ...s, quantity } : s)));
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
                          addon_ids: selectedAddOns.map((s) => s.id).join(","),
                          addon_quantities: selectedAddOns.map((s) => s.quantity).join(","),
                      }
                    : {};

            // Build full selected add-ons with details from catalog
            const selectedAddOnDetails = selectedAddOns.map((s) => {
                const addon = availableAddOns.find((a) => a.id === s.id);
                return {
                    id: s.id,
                    descriptor: addon?.descriptor,
                    price: addon?.price,
                    quantity: s.quantity,
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
        <div className="max-w-2xl mx-auto">
            {isPayloadEditorActive && (
                <PayloadEditor
                    onAdd={handlePaste}
                    onClose={() => setIsPayloadEditorActive(false)}
                />
            )}

            {/* Paste Button */}
            <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setIsPayloadEditorActive(true)}
                        className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <FaRegPaste size={18} />
                        <span className="text-sm font-medium">Paste on_search Payload</span>
                    </button>
                    {!catalog && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-100 italic">
                            Paste on_search payload to load catalog
                        </span>
                    )}
                </div>
            </div>

            {errorWhilePaste && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                    <span className="font-bold">Error:</span> {errorWhilePaste}
                </div>
            )}

            {catalog && (
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                >
                    {/* Provider Info */}
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                            Provider
                        </p>
                        <p className="text-sm font-medium text-blue-900">
                            {catalog.provider.descriptor?.name || catalog.provider.id}
                        </p>
                        <p className="text-xs text-blue-500 mt-0.5">ID: {catalog.provider.id}</p>
                    </div>

                    {/* Item Selection */}
                    <div className="space-y-3">
                        <label className="mb-1 font-semibold block text-gray-700">
                            Select Insurance Product
                        </label>
                        <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
                            {catalog.items.map((item, index) => {
                                const isSelected = selectedItemIndex === index;
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            setValue("selectedItemIndex", index);
                                            setSelectedAddOns([]);
                                        }}
                                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                                            isSelected
                                                ? "bg-blue-50 border-l-4 border-l-blue-500"
                                                : "hover:bg-gray-50"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            checked={isSelected}
                                            onChange={() => {}}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {item.descriptor?.name || item.id}
                                            </p>
                                            {item.descriptor?.short_desc && (
                                                <p className="text-xs text-gray-500">
                                                    {item.descriptor.short_desc}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                ID: {item.id}
                                                {item.category_ids?.length
                                                    ? ` | Categories: ${item.category_ids.join(", ")}`
                                                    : ""}
                                            </p>
                                        </div>
                                        {item.add_ons && item.add_ons.length > 0 && (
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                {item.add_ons.length} add-on(s)
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Add-ons Selection */}
                    {availableAddOns.length > 0 && (
                        <div className="space-y-3">
                            <label className="mb-1 font-semibold block text-gray-700">
                                Select Add-ons (Optional)
                            </label>
                            <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100 max-h-64 overflow-y-auto">
                                {availableAddOns.map((addon) => {
                                    const isSelected = selectedAddOns.some(
                                        (s) => s.id === addon.id
                                    );
                                    const selectedItem = selectedAddOns.find(
                                        (s) => s.id === addon.id
                                    );
                                    const maxCount = addon.quantity?.maximum?.count ?? 10;

                                    return (
                                        <div
                                            key={addon.id}
                                            className={`p-3 transition-colors ${
                                                isSelected ? "bg-green-50" : "hover:bg-gray-50"
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
                                                        className="w-4 h-4 text-green-600 rounded border-gray-300"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {addon.descriptor?.name || addon.id}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {addon.descriptor?.code || addon.id}
                                                        </p>
                                                    </div>
                                                </div>
                                                {addon.price?.value && (
                                                    <span className="text-sm font-medium text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100">
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
                                                        className="w-16 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                            {selectedAddOns.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {selectedAddOns.map((s) => {
                                        const addon = availableAddOns.find((a) => a.id === s.id);
                                        return (
                                            <span
                                                key={s.id}
                                                className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium"
                                            >
                                                {addon?.descriptor?.name || s.id} x{s.quantity}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Fulfillment Info */}
                    {catalog.fulfillmentId && (
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <p className="text-xs text-gray-500">
                                Fulfillment ID:{" "}
                                <span className="font-mono text-gray-700">
                                    {catalog.fulfillmentId}
                                </span>
                            </p>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-3 rounded-lg font-semibold transition-all shadow-md ${
                            isSubmitting
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-green-600 text-white hover:bg-green-700 active:transform active:scale-[0.98]"
                        }`}
                    >
                        {isSubmitting
                            ? "Submitting..."
                            : `Submit Selection${
                                  selectedAddOns.length > 0
                                      ? ` with ${selectedAddOns.length} Add-on(s)`
                                      : ""
                              }`}
                    </button>
                </form>
            )}
        </div>
    );
}
