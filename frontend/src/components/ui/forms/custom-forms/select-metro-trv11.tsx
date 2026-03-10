import { useState } from "react";
import { useForm, useFieldArray, FieldPath } from "react-hook-form";
import { FaRegPaste } from "react-icons/fa6";
import PayloadEditor from "../../mini-components/payload-editor";
import { SubmitEventParams } from "../../../../types/flow-types";
import { toast } from "react-toastify";

interface CatalogItem {
    id: string;
    descriptor: { code: string; name: string };
    price: { currency: string; value: string };
    quantity: {
        minimum: { count: number };
        maximum: { count: number };
    };
}

type FormItem = {
    itemId: string;
    count: number;
};

type FormValues = {
    billingName: string;
    billingEmail: string;
    billingPhone: string;
    items: FormItem[];
};

type OnSearchPayload = {
    message?: {
        catalog?: {
            providers?: Array<{
                id: string;
                items?: CatalogItem[];
            }>;
        };
    };
};

export default function SelectMetroTRV11({
    submitEvent,
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);

    const { control, handleSubmit, register } = useForm<FormValues>({
        defaultValues: {
            billingName: "",
            billingEmail: "",
            billingPhone: "",
            items: [{ itemId: "", count: 1 }],
        },
    });

    const { fields, append, remove } = useFieldArray<FormValues, "items">({
        control,
        name: "items",
    });

    const onSubmit = async (data: FormValues) => {
        // Validate at least one item is selected
        const validItems = data.items.filter((item) => item.itemId !== "");
        if (validItems.length === 0) {
            toast.error("Please select at least one item.");
            return;
        }

        // Build the output in the required shape
        const output = {
            billing: {
                name: data.billingName,
                email: data.billingEmail,
                phone: data.billingPhone,
            },
            items: validItems.map((item) => ({
                id: item.itemId,
                quantity: {
                    selected: {
                        count: item.count,
                    },
                },
            })),
        };

        await submitEvent({
            jsonPath: {},
            formData: output as unknown as Record<string, string>,
        });
    };

    const handlePaste = (payload: unknown) => {
        try {
            const parsed = payload as OnSearchPayload;
            if (!parsed?.message?.catalog?.providers) {
                setErrorWhilePaste("Invalid payload: no providers found.");
                toast.error("Invalid payload: no providers found.");
                return;
            }

            const providers = parsed.message.catalog.providers;
            const allItems: CatalogItem[] = [];

            providers.forEach((provider) => {
                if (provider.items) {
                    provider.items.forEach((item) => {
                        allItems.push(item);
                    });
                }
            });

            if (allItems.length === 0) {
                setErrorWhilePaste("No items found in the payload.");
                toast.error("No items found in the payload.");
                return;
            }

            setCatalogItems(allItems);
            setErrorWhilePaste("");
            toast.success(`Found ${allItems.length} item(s) from payload.`);
        } catch (err) {
            setErrorWhilePaste("Invalid payload structure.");
            toast.error(
                "Invalid payload structure. Please check the pasted data."
            );
            console.error(err);
        }
        setIsPayloadEditorActive(false);
    };

    const inputStyle =
        "border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
    const labelStyle = "mb-1 font-semibold";
    const fieldWrapperStyle = "flex flex-col mb-2";

    const getItemConstraints = (itemId: string) => {
        const item = catalogItems.find((i) => i.id === itemId);
        return {
            min: item?.quantity?.minimum?.count ?? 1,
            max: item?.quantity?.maximum?.count ?? 99,
        };
    };

    return (
        <div>
            {isPayloadEditorActive && <PayloadEditor onAdd={handlePaste} />}
            {errorWhilePaste && (
                <p className="text-red-500 text-sm italic mt-1">
                    {errorWhilePaste}
                </p>
            )}
            <button
                type="button"
                onClick={() => setIsPayloadEditorActive(true)}
                className="p-2 border rounded-full hover:bg-gray-100"
                title="Paste on_search payload"
            >
                <FaRegPaste size={14} />
            </button>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 h-[500px] overflow-y-scroll p-4"
            >
                {/* Billing Details Section */}
                <div className="border p-3 rounded space-y-2">
                    <h3 className="font-bold text-lg mb-2">Billing Details</h3>

                    <div className={fieldWrapperStyle}>
                        <label className={labelStyle}>Name</label>
                        <input
                            type="text"
                            {...register("billingName" as FieldPath<FormValues>)}
                            placeholder="Enter billing name"
                            className={inputStyle}
                            required
                        />
                    </div>

                    <div className={fieldWrapperStyle}>
                        <label className={labelStyle}>Email</label>
                        <input
                            type="email"
                            {...register(
                                "billingEmail" as FieldPath<FormValues>
                            )}
                            placeholder="Enter billing email"
                            className={inputStyle}
                            required
                        />
                    </div>

                    <div className={fieldWrapperStyle}>
                        <label className={labelStyle}>Phone</label>
                        <input
                            type="tel"
                            {...register(
                                "billingPhone" as FieldPath<FormValues>
                            )}
                            placeholder="Enter billing phone"
                            className={inputStyle}
                            required
                        />
                    </div>
                </div>

                {/* Items Section */}
                <div className="border p-3 rounded space-y-2">
                    <h3 className="font-bold text-lg mb-2">Select Items</h3>

                    {fields.map((field, index) => (
                        <div
                            key={field.id}
                            className="border p-3 rounded space-y-2 bg-gray-50"
                        >
                            <div className={fieldWrapperStyle}>
                                <label className={labelStyle}>
                                    Item {index + 1}
                                </label>
                                {catalogItems.length === 0 ? (
                                    <input
                                        type="text"
                                        {...register(
                                            `items.${index}.itemId` as FieldPath<FormValues>
                                        )}
                                        placeholder="Paste payload first or enter item ID"
                                        className={inputStyle}
                                    />
                                ) : (
                                    <select
                                        {...register(
                                            `items.${index}.itemId` as FieldPath<FormValues>
                                        )}
                                        className={inputStyle}
                                    >
                                        <option value="">
                                            Select an item...
                                        </option>
                                        {catalogItems.map((item) => (
                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.descriptor.name} (
                                                {item.id}) — ₹
                                                {item.price.value}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className={fieldWrapperStyle}>
                                <label className={labelStyle}>Quantity</label>
                                <input
                                    type="number"
                                    {...register(`items.${index}.count`, {
                                        valueAsNumber: true,
                                    })}
                                    min={getItemConstraints(field.itemId).min}
                                    max={getItemConstraints(field.itemId).max}
                                    className={inputStyle}
                                />
                            </div>

                            {fields.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="text-sm text-red-500 hover:text-red-700 underline"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={() => append({ itemId: "", count: 1 })}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Add Item
                    </button>
                </div>

                <button
                    type="submit"
                    className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                >
                    Submit
                </button>
            </form>
        </div>
    );
}
