import { useState } from "react";
import { useForm } from "react-hook-form";
import { FaRegPaste } from "react-icons/fa6";
import PayloadEditor from "../../mini-components/payload-editor";
import { SubmitEventParams } from "../../../../types/flow-types";
import { toast } from "react-toastify";

interface Descriptor {
    name?: string;
    code?: string;
    short_desc?: string;
}

interface Price {
    currency: string;
    value: string;
}

interface Item {
    id: string;
    descriptor?: Descriptor;
    price?: Price;
    parent_item_id?: string;
    [key: string]: unknown;
}

interface Provider {
    id: string;
    descriptor?: Descriptor;
    items?: Item[];
    [key: string]: unknown;
}

interface FormValues {
    provider: Provider | null;
    items: Item[];
}

interface CatalogPayload {
    message?: {
        catalog?: {
            providers?: Provider[];
        };
    };
}

export default function FIS12Select({
    submitEvent,
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [extractedProviders, setExtractedProviders] = useState<Provider[]>([]);

    const { handleSubmit, setValue, watch, getValues } = useForm<FormValues>({
        defaultValues: {
            provider: null,
            items: [],
        },
    });

    const selectedProvider = watch("provider");
    const selectedItems = watch("items");

    const handlePaste = (payload: unknown) => {
        try {
            const data = payload as CatalogPayload;
            const providers = data?.message?.catalog?.providers || [];
            if (providers.length === 0) {
                toast.error("No providers found in the payload.");
                return;
            }
            setExtractedProviders(providers);
            // Default select the first provider
            setValue("provider", providers[0]);
            setValue("items", []);
            toast.success("Payload parsed successfully!");
        } catch (error) {
            toast.error("Failed to parse payload.");
            console.error(error);
        }
        setIsPayloadEditorActive(false);
    };

    const onSubmit = async (data: FormValues) => {
        if (!data.provider) {
            toast.error("Please select a provider.");
            return;
        }
        if (data.items.length === 0) {
            toast.error("Please select at least one item.");
            return;
        }

        const formattedData = {
            order: {
                items: data.items.map((item) => ({
                    id: item.id,
                    parent_item_id: item.parent_item_id,
                })),
                provider: {
                    id: data.provider.id,
                },
            },
        };

        await submitEvent({
            jsonPath: {},
            formData: formattedData as unknown as Record<string, string>,
        });
    };

    const toggleItemSelection = (item: Item) => {
        const currentItems = getValues("items") || [];
        const isSelected = currentItems.some((i) => i.id === item.id);
        if (isSelected) {
            setValue(
                "items",
                currentItems.filter((i) => i.id !== item.id)
            );
        } else {
            setValue("items", [...currentItems, item]);
        }
    };

    return (
        <div className="p-4 space-y-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                <div>
                    <p className="text-sm text-gray-500">
                        Select items from the provided on_search payload
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsPayloadEditorActive(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all font-medium shadow-sm"
                >
                    <FaRegPaste size={16} />
                    Paste Payload
                </button>
            </div>

            {isPayloadEditorActive && <PayloadEditor onAdd={handlePaste} />}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {extractedProviders.length > 0 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                            <label className="block text-sm font-semibold text-blue-900 mb-2">
                                Provider
                            </label>
                            <select
                                className="w-full border border-blue-200 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                                onChange={(e) => {
                                    const provider = extractedProviders.find(
                                        (p) => p.id === e.target.value
                                    );
                                    setValue("provider", provider || null);
                                    setValue("items", []);
                                }}
                                value={selectedProvider?.id || ""}
                            >
                                <option value="" disabled>
                                    Select a provider
                                </option>
                                {extractedProviders.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.descriptor?.name || p.id}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedProvider && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Select Items ({selectedItems.length} selected)
                                    </label>
                                    {selectedItems.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setValue("items", [])}
                                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                                        >
                                            Clear Selection
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {(selectedProvider.items || []).map((item) => {
                                        const isSelected = selectedItems.some(
                                            (i) => i.id === item.id
                                        );
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => toggleItemSelection(item)}
                                                className={`cursor-pointer p-4 border rounded-xl transition-all duration-200 group ${
                                                    isSelected
                                                        ? "border-blue-500 bg-blue-50 shadow-md transform scale-[1.01]"
                                                        : "border-gray-200 hover:border-blue-200 hover:bg-gray-50 bg-white"
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                            isSelected
                                                                ? "bg-blue-600 border-blue-600"
                                                                : "border-gray-300 group-hover:border-blue-300"
                                                        }`}
                                                    >
                                                        {isSelected && (
                                                            <svg
                                                                className="w-4 h-4 text-white"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={3}
                                                                    d="M5 13l4 4L19 7"
                                                                />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between">
                                                            <div>
                                                                <h3
                                                                    className={`font-bold transition-colors ${isSelected ? "text-blue-900" : "text-gray-800"}`}
                                                                >
                                                                    {item.descriptor?.name ||
                                                                        item.id}
                                                                </h3>
                                                                <p className="text-xs font-mono text-gray-500">
                                                                    {item.id}
                                                                </p>
                                                            </div>
                                                            {item.price && (
                                                                <div className="text-right">
                                                                    <p className="text-sm font-bold text-green-600">
                                                                        {item.price.currency}{" "}
                                                                        {item.price.value}
                                                                    </p>
                                                                    {item.descriptor?.code && (
                                                                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 uppercase">
                                                                            {item.descriptor.code}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {item.descriptor?.short_desc && (
                                                            <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                                                {item.descriptor.short_desc}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {extractedProviders.length === 0 && !isPayloadEditorActive && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                        <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
                            <FaRegPaste size={20} />
                        </div>
                        <h3 className="text-gray-600 font-medium">No payload loaded</h3>
                        <p className="text-sm text-gray-400 mt-1">
                            Paste an on_search payload to get started
                        </p>
                    </div>
                )}

                {extractedProviders.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform active:scale-[0.98]"
                        >
                            Confirm Selection and Proceed
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
