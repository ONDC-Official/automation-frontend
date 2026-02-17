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
    selectedItem: Item | null;
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

    const { handleSubmit, setValue, watch } = useForm<FormValues>({
        defaultValues: {
            provider: null,
            selectedItem: null,
        },
    });

    const selectedProvider = watch("provider");
    const selectedItem = watch("selectedItem");

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
            setValue("selectedItem", null);
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
        if (!data.selectedItem) {
            toast.error("Please select an item.");
            return;
        }

        const formattedData = {
            order: {
                items: [
                    {
                        id: data.selectedItem.id,
                        parent_item_id: data.selectedItem.parent_item_id,
                    },
                ],
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
                                    setValue("selectedItem", null);
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
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Select Item
                                    </label>
                                    <select
                                        className="w-full border border-gray-200 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                                        onChange={(e) => {
                                            const item = selectedProvider.items?.find(
                                                (i) => i.id === e.target.value
                                            );
                                            setValue("selectedItem", item || null);
                                        }}
                                        value={selectedItem?.id || ""}
                                    >
                                        <option value="" disabled>
                                            Select an item
                                        </option>
                                        {(selectedProvider.items || []).map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.id}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedItem && (
                                    <div className="p-4 border border-blue-100 bg-blue-50 rounded-lg animate-in fade-in zoom-in-95 duration-200">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-blue-900">
                                                    {selectedItem.descriptor?.name ||
                                                        selectedItem.id}
                                                </h3>
                                                <p className="text-xs font-mono text-blue-700">
                                                    ID: {selectedItem.id}
                                                </p>
                                                {selectedItem.parent_item_id && (
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        Parent:{" "}
                                                        <span className="font-semibold">
                                                            {selectedItem.parent_item_id}
                                                        </span>
                                                    </p>
                                                )}
                                            </div>
                                            {selectedItem.price && (
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-green-600">
                                                        {selectedItem.price.currency}{" "}
                                                        {selectedItem.price.value}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
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
