import { useState } from "react";
import { useForm, useFieldArray, Controller, FieldPath } from "react-hook-form";
import { FaRegPaste } from "react-icons/fa6";
import PayloadEditor from "../../mini-components/payload-editor";
import { SubmitEventParams } from "../../../../types/flow-types";
import { toast } from "react-toastify";

type OfferKey = `offers_${string}`;

type CatalogItem = { id: string };
type CatalogLocation = { id: string };
type CatalogOffer = { id: string };

type CatalogProvider = {
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

    order_type: "ILBP";

    items: {
        itemId: string;
        quantity: number;
        location: string;
        bidding_price: number; // ✅ ONLY THIS
    }[];
} & Partial<Record<OfferKey, boolean>>;

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
                    bidding_price: 0,
                },
                {
                    itemId: "",
                    quantity: 1,
                    location: "",
                    bidding_price: 0,
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

    const inputStyle = "border p-2 w-full";

    const renderSelectOrInput = (name: string, options: string[]) => {
        if (!options.length) {
            return <input {...register(name as FieldPath<FormValues>)} className={inputStyle} />;
        }
        return (
            <select {...register(name as FieldPath<FormValues>)} className={inputStyle}>
                <option value="">Select...</option>
                {options.map((o) => (
                    <option key={o}>{o}</option>
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

            <button onClick={() => setIsPayloadEditorActive(true)}>
                <FaRegPaste />
            </button>

            {!isDataPasted ? (
                <div>Paste on_search payload</div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* FIXED ORDER TYPE */}
                    <input type="hidden" value="ILBP" {...register("order_type")} />
                    <b>Order Type: ILBP</b>

                    {/* PROVIDER */}
                    {renderSelectOrInput("provider", providerOptions)}

                    {/* LOCATION */}
                    <Controller
                        name="provider_location"
                        control={control}
                        render={({ field }) => {
                            const provider = providers.find((p) => p.id === selectedProvider);
                            const locations = provider?.locations || [];

                            return (
                                <>
                                    {locations.map((loc) => (
                                        <label key={loc.id}>
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
                                </>
                            );
                        }}
                    />

                    {/* ITEMS */}
                    {fields.map((field, index) => (
                        <div key={field.id} className="border p-2">
                            {renderSelectOrInput(`items.${index}.itemId`, itemOptions)}

                            <input
                                type="number"
                                {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                placeholder="Quantity"
                            />

                            {/* ONLY BIDDING PRICE */}
                            <input
                                type="number"
                                {...register(`items.${index}.bidding_price`, {
                                    valueAsNumber: true,
                                })}
                                placeholder="Your Bid"
                            />

                            {renderSelectOrInput(`items.${index}.location`, locationOptions)}
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={() =>
                            append({
                                itemId: "",
                                quantity: 1,
                                location: "",
                                bidding_price: 0,
                            })
                        }
                    >
                        Add Item
                    </button>

                    {fields.map((field, index) => (
                        <div key={field.id}>
                            {/* your inputs */}

                            <button type="button" onClick={() => remove(index)}>
                                Remove
                            </button>
                        </div>
                    ))}

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
        if (!item.bidding_price || item.bidding_price <= 0) {
            errors.push(`Item ${index + 1}: Bid required`);
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}
