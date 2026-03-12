import { useState } from "react";
import { SubmitEventParams } from "../../../../types/flow-types";
import { FaRegPaste } from "react-icons/fa6";
import PayloadEditor from "../../mini-components/payload-editor";

interface ReteB2BItem {
    itemId: string;
    quantity: number;
    location: string;
    fulfillment_id: string;
}

interface RetailerCustomerInput {
    type: "new" | "existing";
    customer_id?: string;
    phone_number?: string;
    email?: string;
    tax_number?: string;
    provider_tax_number?: string;
    shop_name?: string;
    address?: string;
    city_code: string;
    state_code?: string;
    available_offers?: string[];
    items: ReteB2BItem[];
}


type CatalogItem = { id: string };
type CatalogLocation = { id: string };
type CatalogFulfillment = { id: string };

type CatalogOffer = {
    id: string;
    descriptor: {
        code: string;
    };
};

type CatalogProvider = {
    id: string;
    items: CatalogItem[];
    locations: CatalogLocation[];
    fulfillments?: CatalogFulfillment[];
    offers?: CatalogOffer[];
};

type OnSearchPayload = {
    message: {
        catalog: {
            "bpp/providers": CatalogProvider[];
        };
    };
};

export default function ReteB2BSelect({
    submitEvent,
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {

    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [isDataPasted, setIsDataPasted] = useState(false);

    const [, setProviders] = useState<CatalogProvider[]>([]);
    const [itemOptions, setItemOptions] = useState<string[]>([]);
    const [locationOptions, setLocationOptions] = useState<string[]>([]);
    const [fulfillmentOptions, setFulfillmentOptions] = useState<string[]>([]);
    const [offers, setOffers] = useState<CatalogOffer[]>([]);

    const [form, setForm] = useState<RetailerCustomerInput>({
        type: "new",
        city_code: "",
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

    const handlePaste = (data: unknown) => {
        try {

            const providers = (data as OnSearchPayload).message.catalog["bpp/providers"];
            setProviders(providers);

            const provider = providers[0];

            if (provider) {

                setItemOptions(provider.items?.map((i) => i.id) || []);
                setLocationOptions(provider.locations?.map((l) => l.id) || []);

                if (provider.fulfillments) {
                    setFulfillmentOptions(provider.fulfillments.map((f) => f.id));
                }

                const collectedOffers: CatalogOffer[] = [];

                if (provider.offers) {
                    collectedOffers.push(...provider.offers);
                }
                provider.items?.forEach((item: any) => {

                    if (item.tags) {

                        const offerTag = item.tags.find(
                            (t: any) => t.code === "offers"
                        );

                        if (offerTag?.list) {

                            offerTag.list.forEach((o: any) => {
                                collectedOffers.push({
                                    id: o.value,
                                    descriptor: { code: o.code || "unknown" },
                                });
                            });
                        }
                    }
                });

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

    const handleChange = (key: keyof RetailerCustomerInput, value: string) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleItemChange = (
        index: number,
        key: keyof ReteB2BItem,
        value: string | number
    ) => {

        const updatedItems = [...form.items];

        updatedItems[index] = {
            ...updatedItems[index],
            [key]: value,
        };

        setForm({
            ...form,
            items: updatedItems,
        });
    };

    const addItem = () => {

        if (form.items.length >= 5) return;

        setForm({
            ...form,
            items: [
                ...form.items,
                {
                    itemId: "",
                    quantity: 1,
                    location: "",
                    fulfillment_id: "",
                },
            ],
        });
    };

    const removeItem = (index: number) => {

        if (form.items.length === 1) return; 

        const updatedItems = form.items.filter((_, i) => i !== index);

        setForm({
            ...form,
            items: updatedItems,
        });
    };

    const toggleOffer = (offerId: string) => {

        const selected = form.available_offers || [];

        if (selected.includes(offerId)) {

            setForm({
                ...form,
                available_offers: selected.filter((id) => id !== offerId),
            });

        } else {

            setForm({
                ...form,
                available_offers: [...selected, offerId],
            });
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

        await submitEvent({
            jsonPath: form,
            formData: {},
        });
    };

    const inputStyle =
        "w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900";

    const label = (text: string, required: boolean) => (
        <label className="text-sm font-medium">
            {text} {required && <span className="text-red-500">*</span>}
        </label>
    );

    return (
        <div className="flex flex-col gap-4 p-4">

            {isPayloadEditorActive && (
                <PayloadEditor
                    onAdd={handlePaste}
                    onClose={() => setIsPayloadEditorActive(false)}
                />
            )}

            <button
                onClick={() => setIsPayloadEditorActive(true)}
                className="p-2 border rounded-full w-fit"
            >
                <FaRegPaste />
            </button>

            {!isDataPasted && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-2">
                    Paste on_search payload to continue
                </div>
            )}

            {isDataPasted && (
                <>
                    {label("Retailer Type", false)}
                    <select
                        value={form.type}
                        onChange={(e) => handleChange("type", e.target.value)}
                        className={inputStyle}
                    >
                        <option value="new">New Retailer</option>
                        <option value="existing">Existing Retailer</option>
                    </select>

                    {label("Customer ID", form.type === "new")}
                    <input
                        value={form.customer_id}
                        onChange={(e) => handleChange("customer_id", e.target.value)}
                        className={inputStyle}
                    />

                    {label("City Code", true)}
                    <input
                        value={form.city_code}
                        onChange={(e) => handleChange("city_code", e.target.value)}
                        className={inputStyle}
                    />

                    {label("Phone Number", form.type === "new")}
                    <input
                        value={form.phone_number}
                        onChange={(e) => handleChange("phone_number", e.target.value)}
                        className={inputStyle}
                    />

                    {label("Email", form.type === "new")}
                    <input
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className={inputStyle}
                    />

                    {label("GST Number", form.type === "new")}
                    <input
                        value={form.tax_number}
                        onChange={(e) => handleChange("tax_number", e.target.value)}
                        className={inputStyle}
                    />

                    {label("PAN Number", form.type === "new")}
                    <input
                        value={form.provider_tax_number}
                        onChange={(e) =>
                            handleChange("provider_tax_number", e.target.value)
                        }
                        className={inputStyle}
                    />

                    {label("Shop Name", form.type === "new")}
                    <input
                        value={form.shop_name}
                        onChange={(e) => handleChange("shop_name", e.target.value)}
                        className={inputStyle}
                    />

                    {label("Address", form.type === "new")}
                    <input
                        value={form.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                        className={inputStyle}
                    />

                    {/* ITEMS */}

                    <div>
                        <h3 className="font-bold">Items</h3>

                        {form.items.map((item, index) => (
                            <div key={index} className="flex gap-2 mb-2 items-center">

                                <select
                                    value={item.itemId}
                                    onChange={(e) =>
                                        handleItemChange(index, "itemId", e.target.value)
                                    }
                                    className={inputStyle}
                                >
                                    <option value="">Item</option>

                                    {itemOptions.map((id) => (
                                        <option key={id}>{id}</option>
                                    ))}
                                </select>

                                <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) =>
                                        handleItemChange(index, "quantity", Number(e.target.value))
                                    }
                                    className={inputStyle}
                                />

                                <select
                                    value={item.location}
                                    onChange={(e) =>
                                        handleItemChange(index, "location", e.target.value)
                                    }
                                    className={inputStyle}
                                >
                                    <option value="">Location</option>

                                    {locationOptions.map((loc) => (
                                        <option key={loc}>{loc}</option>
                                    ))}
                                </select>

                                <select
                                    value={item.fulfillment_id}
                                    onChange={(e) =>
                                        handleItemChange(index, "fulfillment_id", e.target.value)
                                    }
                                    className={inputStyle}
                                >
                                    <option value="">Fulfillment</option>

                                    {fulfillmentOptions.map((f) => (
                                        <option key={f}>{f}</option>
                                    ))}
                                </select>

                                {/* REMOVE BUTTON */}

                                <button
                                    onClick={() => removeItem(index)}
                                    className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                                >
                                    Remove
                                </button>

                            </div>
                        ))}
                        <button
                            className="bg-gray-200 p-2 rounded"
                            onClick={addItem}
                        >
                            Add Item
                        </button>
                    </div>

                    {/* OFFERS */}

                    <div>
                        <h3 className="font-bold">Available Offers</h3>

                        {offers.map((offer) => (
                            <label key={offer.id} className="flex items-center gap-2">

                                <input
                                    type="checkbox"
                                    checked={form.available_offers?.includes(offer.id) || false}
                                    onChange={() => toggleOffer(offer.id)}
                                />

                                {offer.id} ({offer.descriptor.code})
                            </label>
                        ))}
                    </div>

                    <button
                        className="bg-blue-500 text-white p-2 rounded"
                        onClick={submit}
                    >
                        Submit
                    </button>
                </>
            )}
        </div>
    );
}