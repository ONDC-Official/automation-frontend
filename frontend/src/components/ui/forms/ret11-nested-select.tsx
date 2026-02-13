import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa6";
import { FaMinus } from "react-icons/fa6";
import { FaRegPaste } from "react-icons/fa6";
import { inputClass } from "./inputClass";
import { LabelWithToolTip } from "./form-input";
import { getItemsAndCustomistions } from "../../../utils/generic-utils";
import PayloadEditor from "../mini-components/payload-editor";
import { SubmitEventParams } from "@/types/flow-types";
import { CatalogLocation, validateFormDataRET11 } from "./custom-forms/ret10-grocery-select";
import { toast } from "react-toastify";
import { Controller, FieldPath, useForm } from "react-hook-form";

type OfferKey = `offers_${string}`;

export type CatalogProvider = {
    id: string;
    locations: CatalogLocation[];
};

type OnSearchPayload = {
    message: {
        catalog: {
            "bpp/providers": CatalogProvider[];
        };
    };
};
interface SelectedItem {
    id: string;
    customisations: string[];
    relation: Record<string, string>;
    lastCustomisation?: string[];
}

type FormValues = {
    provider: string;
    provider_location: string[];
    location_gps: string;
    location_pin_code: string;
} & Partial<Record<OfferKey, boolean>>;

type ItemList = Record<string, string>;
type CategoryList = Record<
    string,
    { child?: string[]; items?: Record<string, { child: string[] }> }
>;
type CustomisationToGroupMapping = Record<string, string>;

type ItemCustomisationSelectorProps = {
    name: string;
    label: string;
    setValue?: (name: string, value: SelectedItem[]) => void;
    submitEvent?: (data: SubmitEventParams) => Promise<void>;
};

const inputStyle =
    "border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
const labelStyle = "mb-1 font-semibold";
const fieldWrapperStyle = "flex flex-col mb-2";

const ItemCustomisationSelectorRET11 = ({
    // register,
    name,
    label,
    setValue,
    submitEvent,
}: ItemCustomisationSelectorProps) => {
    const [items, setItems] = useState<SelectedItem[]>([
        { id: "", customisations: [], relation: {} },
    ]);

    const { control, handleSubmit, watch, register } = useForm<FormValues>({
        defaultValues: {
            provider: "",
            provider_location: [],
            location_gps: "",
            location_pin_code: "",
        },
    });

    const [catalogData, setCatalogData] = useState<unknown | null>(null);
    const [errroWhilePaste, setErrroWhilePaste] = useState("");
    const [itemsList, setItemsList] = useState<ItemList>({});
    const [categoryList, setCategoryList] = useState<CategoryList>({});
    const [groupMapping, setGroupMapping] = useState<CustomisationToGroupMapping>({});
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);

    const [providerOptions, setProviderOptions] = useState<string[]>([]);
    const [providers, setProviders] = useState<CatalogProvider[]>([]);

    const selectedProvider = watch("provider");

    const hasCatalogData = catalogData != null;

    const onSubmit = async (data: FormValues) => {
        const { valid, errors } = validateFormDataRET11(data);
        if (!valid) {
            toast.error(`Form validation failed: ${errors[0]}`);
            return;
        }

        await submitEvent?.({
            jsonPath: {},
            formData: {
                ...data,
                items: items,
            } as unknown as Record<string, string>,
        });
    };

    useEffect(() => {
        setValue?.(name, items);
    }, [items]);

    const handleItemChange = (index: number, value: string) => {
        const updated = [...items];
        updated[index] = { id: value, customisations: [], relation: {} };
        setItems(updated);
    };

    const handleCustomisationChange = (index: number, value: string, group?: string) => {
        if (!items[index].customisations.includes(value)) {
            const updated = [...items];
            updated[index].relation[`${value}`] = groupMapping[value];
            updated[index].customisations.push(value);
            if (group) {
                updated[index].lastCustomisation = (
                    categoryList[group].items as Record<string, { child: string[] }>
                )[value].child;
            }
            setItems(updated);
        }
    };

    const addItem = () => {
        setItems((prev) => [...prev, { id: "", customisations: [], relation: {} }]);
    };

    const removeItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handlePaste = async (parsedText: unknown) => {
        setIsPayloadEditorActive(false);

        try {
            const payload = parsedText as Parameters<typeof getItemsAndCustomistions>[0];
            if (!payload?.context?.domain) {
                throw new Error("Domain not present");
            }

            if (!payload?.message?.catalog?.["bpp/providers"]) {
                throw new Error("Providers not presnt");
            }

            const providers = (parsedText as OnSearchPayload).message.catalog["bpp/providers"];
            setProviders(providers);

            const providerIDs = providers.map((p) => p.id);
            setProviderOptions(providerIDs);

            setCatalogData(parsedText);
            const response = getItemsAndCustomistions(payload);
            setItemsList(response?.itemList || {});
            setCategoryList(response?.catagoriesList || {});
            setGroupMapping(response?.cutomistionToGroupMapping || {});
        } catch (err: unknown) {
            const e = err as { message?: string };
            setErrroWhilePaste(e.message || "Something went wrong");
            console.error("Error while handling paste: ", err);
        }
    };

    const renderSelectOrInput = (name: string, options: string[], placeholder = "") => {
        if (options.length === 0) {
            return (
                <input
                    type="text"
                    {...register(name as unknown as FieldPath<FormValues>)}
                    placeholder={placeholder}
                    className={inputStyle}
                />
            );
        }
        return (
            <select {...register(name as unknown as FieldPath<FormValues>)} className={inputStyle}>
                <option value="">Select...</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        );
    };

    return (
        <div className="p-4 max-w-xl mx-auto space-y-4">
            {isPayloadEditorActive && <PayloadEditor onAdd={handlePaste} />}
            <div className="flex flex-direction-row gap-4">
                <LabelWithToolTip labelInfo="" label={label} />
                <>
                    {errroWhilePaste && (
                        <p className="text-red-500 text-sm italic mt-1 w-full">{errroWhilePaste}</p>
                    )}
                    <button
                        type="button"
                        onClick={() => setIsPayloadEditorActive(true)}
                        className="p-2 border rounded-full hover:bg-gray-100"
                    >
                        <FaRegPaste size={14} />
                    </button>
                </>

                {hasCatalogData && (
                    <button
                        type="button"
                        onClick={addItem}
                        className="p-2 border rounded-full hover:bg-gray-100"
                    >
                        <FaPlus size={14} />
                    </button>
                )}
            </div>

            {hasCatalogData ? (
                <>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-4 h-[500px] overflow-y-scroll p-4"
                    >
                        {items.map((item: SelectedItem, index: number) => {
                            let availableCustomisations: string[] = [];

                            if (item?.id) {
                                let customisationsObj: Record<string, { child: string[] }> = {};

                                if (item?.lastCustomisation) {
                                    item.lastCustomisation.forEach((lastCustom: string) => {
                                        customisationsObj = {
                                            ...customisationsObj,
                                            ...categoryList[lastCustom]?.items,
                                        };
                                        return categoryList[lastCustom]?.items || {};
                                    });
                                } else {
                                    customisationsObj =
                                        categoryList[itemsList[`${item?.id}`]]?.items || {};
                                }

                                const cutomistions = Object.entries(customisationsObj).map(
                                    (item) => {
                                        const [key, _] = item;
                                        return key;
                                    }
                                );

                                availableCustomisations = cutomistions;
                            }

                            return (
                                <div
                                    key={index}
                                    className="relative border p-4 rounded bg-white shadow space-y-4"
                                >
                                    {index !== 0 && (
                                        <div className="absolute top-[-10px] right-[-10px] bg-white">
                                            <button
                                                onClick={() => removeItem(index)}
                                                className=" p-2 border rounded-full hover:bg-gray-100"
                                            >
                                                <FaMinus size={14} />
                                            </button>
                                        </div>
                                    )}

                                    <LabelWithToolTip labelInfo="" label={"Item"} />

                                    <select
                                        className={inputClass}
                                        value={item.id}
                                        onChange={(e) => handleItemChange(index, e.target.value)}
                                    >
                                        <option value="">Select Item</option>
                                        {Object.entries(itemsList).map((key, index) => {
                                            const [item, _] = key;
                                            return (
                                                <option key={index} value={item}>
                                                    {item}
                                                </option>
                                            );
                                        })}
                                    </select>

                                    {item.id && (
                                        <>
                                            <LabelWithToolTip
                                                labelInfo=""
                                                label={"Customisation"}
                                            />
                                            <div className="flex gap-2 ">
                                                <select
                                                    className={inputClass}
                                                    value=""
                                                    onChange={(e) =>
                                                        handleCustomisationChange(
                                                            index,
                                                            e.target.value,
                                                            groupMapping[e.target.value] ||
                                                                itemsList[`${item?.id}`]
                                                        )
                                                    }
                                                >
                                                    <option value="">Select Customisation</option>
                                                    {availableCustomisations.map((c: string) => (
                                                        <option key={c} value={c}>
                                                            {c}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {item.customisations.map((c: string, i: number) => (
                                                    <span
                                                        key={i}
                                                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                                                    >
                                                        {c}
                                                    </span>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}

                        <div className={fieldWrapperStyle}>
                            <label className={labelStyle}>Select Provider Id</label>
                            {renderSelectOrInput("provider", providerOptions)}
                        </div>

                        <Controller
                            name="provider_location"
                            control={control}
                            defaultValue={[]}
                            render={({ field }) => {
                                const provider = providers.find((p) => p.id === selectedProvider);
                                const locations = provider?.locations || [];

                                if (locations.length === 0) {
                                    return (
                                        <>
                                            <label className={labelStyle}>
                                                Provider Location Id:
                                            </label>
                                            <input
                                                type="text"
                                                {...register("provider_location")}
                                                className={inputStyle}
                                            />
                                        </>
                                    );
                                }

                                return (
                                    <div className="flex flex-col gap-2">
                                        {locations.map((loc: CatalogLocation) => (
                                            <label
                                                key={loc.id}
                                                className="inline-flex gap-2 items-center"
                                            >
                                                <input
                                                    type="checkbox"
                                                    value={loc.id}
                                                    checked={field.value.includes(loc.id)}
                                                    onChange={() => field.onChange(loc.id)}
                                                    className="accent-blue-600"
                                                />
                                                <span>{loc.id}</span>
                                            </label>
                                        ))}
                                    </div>
                                );
                            }}
                        />

                        <div className={fieldWrapperStyle}>
                            <label className={labelStyle}>Delivery Location GPS</label>
                            <input {...register("location_gps")} className={inputStyle} />
                        </div>

                        <div className={fieldWrapperStyle}>
                            <label className={labelStyle}>Delivery Pin Code</label>
                            <input {...register("location_pin_code")} className={inputStyle} />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-400 text-white py-2 rounded hover:bg-blue-700"
                        >
                            Submit
                        </button>
                    </form>

                    {/* {submitEvent && (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                        >
                            Submit
                        </button>
                    )} */}
                </>
            ) : (
                <div className="flex items-start gap-3 border-l-4 border-blue-500 bg-blue-50 p-3 rounded">
                    <p className="text-sm text-blue-800 flex items-center gap-1">
                        Paste <strong>on_search</strong> payload using the button
                        <span className="p-2 border rounded-full hover:bg-gray-100">
                            <FaRegPaste size={14} />
                        </span>
                        to select items
                    </p>
                </div>
            )}
        </div>
    );
};

export default ItemCustomisationSelectorRET11;
