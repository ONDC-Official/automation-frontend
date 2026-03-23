import { useState } from "react";
import { useForm, useFieldArray, Controller, FieldPath } from "react-hook-form";
import { FaRegPaste } from "react-icons/fa6";
import PayloadEditor from "../../mini-components/payload-editor";
import { SubmitEventParams } from "../../../../types/flow-types";
import { toast } from "react-toastify";

type CatalogItem = { id: string };
type CatalogLocation = { id: string };

type CatalogProvider = {
    id: string;
    items: CatalogItem[];
    locations: CatalogLocation[];
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
    order_type: "ILBP";

    items: {
        itemId: string;
        quantity: number;
        location: string;
        bidding_price: string; // ✅ STRING
    }[];
};

export default function RetINVLInitILBP({
    submitEvent,
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [isDataPasted, setIsDataPasted] = useState(false);

    const { control, handleSubmit, watch, register } = useForm<FormValues>({
        defaultValues: {
            city_code: "",
            provider: "",
            provider_location: [],
            location_gps: "",
            location_pin_code: "",
            order_type: "ILBP",
            items: [
                {
                    itemId: "",
                    quantity: 1,
                    location: "",
                    bidding_price: "",
                },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });

    const [providers, setProviders] = useState<CatalogProvider[]>([]);
    const [providerOptions, setProviderOptions] = useState<string[]>([]);
    const [itemOptions, setItemOptions] = useState<string[]>([]);
    const [locationOptions, setLocationOptions] = useState<string[]>([]);

    const selectedProvider = watch("provider");

    const handlePaste = (data: unknown) => {
        try {
            const providers = (data as OnSearchPayload).message.catalog["bpp/providers"];
            setProviders(providers);
            setProviderOptions(providers.map((p) => p.id));

            const provider = providers[0];
            if (provider) {
                setItemOptions(provider.items.map((i) => i.id));
                setLocationOptions(provider.locations.map((l) => l.id));
            }

            setIsDataPasted(true);
        } catch {
            toast.error("Invalid payload");
        }

        setIsPayloadEditorActive(false);
    };

    const onSubmit = async (data: FormValues) => {
        const { valid, errors } = validateFormData(data);

        if (!valid) {
            toast.error(errors[0]);
            return;
        }

        await submitEvent({
            jsonPath: {},
            formData: data as unknown as Record<string, string>,
        });
    };

    const inputStyle =
        "border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
    const labelStyle = "mb-1 font-semibold";
    const fieldWrapperStyle = "flex flex-col mb-2";

    const renderSelectOrInput = (name: string, options: string[]) => {
        if (!options.length) {
            return <input {...register(name as FieldPath<FormValues>)} className={inputStyle} />;
        }
        return (
            <select {...register(name as FieldPath<FormValues>)} className={inputStyle}>
                <option value="">Select...</option>
                {options.map((o) => (
                    <option key={o} value={o}>
                        {o}
                    </option>
                ))}
            </select>
        );
    };

    return (
        <div>
            {isPayloadEditorActive && (
                <PayloadEditor
                    onAdd={handlePaste}
                    onClose={() => setIsPayloadEditorActive(false)}
                />
            )}

            <button
                type="button"
                onClick={() => setIsPayloadEditorActive(true)}
                className="p-2 border rounded-full"
            >
                <FaRegPaste size={14} />
            </button>

            {!isDataPasted ? (
                <div className="p-3 bg-blue-50 border-l-4 border-blue-500">
                    Paste on_search payload to continue
                </div>
            ) : (
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-4 p-4 h-[500px] overflow-y-scroll"
                >
                    {/* ORDER TYPE */}
                    <input type="hidden" value="ILBP" {...register("order_type")} />
                    <div className="p-2 bg-blue-50 border-l-4 border-blue-500">
                        <b>Order Type: ILBP</b>
                    </div>

                    {/* PROVIDER */}
                    <div className={fieldWrapperStyle}>
                        <label className={labelStyle}>Provider</label>
                        {renderSelectOrInput("provider", providerOptions)}
                    </div>

                    {/* PROVIDER LOCATION */}
                    <Controller
                        name="provider_location"
                        control={control}
                        render={({ field }) => {
                            const provider = providers.find((p) => p.id === selectedProvider);
                            const locations = provider?.locations || [];

                            return (
                                <div className="flex flex-col gap-2">
                                    {locations.map((loc) => (
                                        <label
                                            key={loc.id}
                                            className="inline-flex gap-2 items-center"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={field.value?.includes(loc.id)}
                                                onChange={() => {
                                                    const val = field.value || [];
                                                    field.onChange(
                                                        val.includes(loc.id)
                                                            ? val.filter((v) => v !== loc.id)
                                                            : [...val, loc.id]
                                                    );
                                                }}
                                            />
                                            {loc.id}
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

                    {/* ITEMS */}
                    {fields.map((field, index) => (
                        <div key={field.id} className="border p-3 rounded space-y-2">
                            <div className={fieldWrapperStyle}>
                                <label className={labelStyle}>Item ID</label>
                                {renderSelectOrInput(`items.${index}.itemId`, itemOptions)}
                            </div>

                            <div className={fieldWrapperStyle}>
                                <label className={labelStyle}>Quantity</label>
                                <input
                                    type="number"
                                    {...register(`items.${index}.quantity`, {
                                        valueAsNumber: true,
                                    })}
                                    className={inputStyle}
                                />
                            </div>

                            <div className={fieldWrapperStyle}>
                                <label className={labelStyle}>Bidding Price</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    {...register(`items.${index}.bidding_price`)}
                                    className={inputStyle}
                                    placeholder="Enter your bid"
                                />
                            </div>

                            <div className={fieldWrapperStyle}>
                                <label className={labelStyle}>Item Location</label>
                                {renderSelectOrInput(`items.${index}.location`, locationOptions)}
                            </div>

                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="px-3 py-1 bg-red-500 text-white rounded"
                            >
                                Remove
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={() =>
                            append({
                                itemId: "",
                                quantity: 1,
                                location: "",
                                bidding_price: "",
                            })
                        }
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        Add Item
                    </button>

                    <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">
                        Submit
                    </button>
                </form>
            )}
        </div>
    );
}

// VALIDATION
function validateFormData(data: FormValues) {
    const errors: string[] = [];

    data.items.forEach((item, index) => {
        if (!item.bidding_price || Number(item.bidding_price) <= 0) {
            errors.push(`Item ${index + 1}: Valid bid required`);
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}
