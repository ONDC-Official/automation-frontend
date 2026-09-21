import { useEffect, useState } from "react";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";

import { ComboBoxControl } from "@components/Shadcn/ComboBox";
import { Button } from "@components/Shadcn/Button";
import { Checkbox } from "@components/Shadcn/Checkbox";
import TextField from "@components/Shadcn/TextField";
import { Field, FieldLabel } from "@components/Shadcn/TextField/field";
import { LabelWithToolTip } from "@components/Shadcn/TextField";
import { Input } from "@components/Shadcn/Input";
import { SelectControl } from "@components/Shadcn/Select";
import PayloadEditor from "@components/PayloadEditor/PastePayloadModal";
import FormDialogShell from "@components/Forms/form-dialog-shell";
import { PastePayloadButton } from "@components/Forms/paste-payload-button";
import { getItemsAndCustomistions } from "@utils/generic-utils";
import { SubmitEventParams } from "@/types/flow-types";
import { CatalogLocation } from "../types/ret10-grocery-select-form-types";
import { validateFormDataRET11 } from "./ret10-grocery-select-form";
import { cn } from "@/lib/utils";

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

export interface SelectedItem {
    id: string;
    quantity: number;
    customisations: string[];
    relation: Record<string, string>;
    lastCustomisation?: string[];
}

type FormValues = {
    bpp_id: string;
    provider: string;
    provider_location: string[];
    location_gps: string;
    location_pin_code: string;
    available_offers: { offerId: string }[];
} & Partial<Record<OfferKey, boolean>>;

const OFFER_OPTIONS = [
    { value: "discp60", label: "60% Discount (discp60)" },
    { value: "flat150", label: "Flat ₹150 Off (flat150)" },
    { value: "slab1", label: "15% Bulk Slab (slab1)" },
    { value: "slab2", label: "10% High Volume (slab2)" },
    { value: "freebie1", label: "Free Gift (freebie1)" },
    { value: "buy2get3", label: "Buy 2 Get 3 (buy2get3)" },
];

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

const toComboOptions = (values: string[]) => values.map((value) => ({ value, label: value }));

const RET11NestedSelectForm = ({
    name,
    label,
    setValue,
    submitEvent,
}: ItemCustomisationSelectorProps) => {
    const [items, setItems] = useState<SelectedItem[]>([
        { id: "", quantity: 1, customisations: [], relation: {} },
    ]);

    const { control, handleSubmit, watch } = useForm<FormValues>({
        defaultValues: {
            bpp_id: "",
            provider: "",
            provider_location: [],
            location_gps: "",
            location_pin_code: "",
            available_offers: [],
        },
    });

    const { fields: offerFields, append: appendOffer, remove: removeOffer } = useFieldArray({
        control,
        name: "available_offers",
    });

    const [catalogData, setCatalogData] = useState<unknown | null>(null);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [itemsList, setItemsList] = useState<ItemList>({});
    const [categoryList, setCategoryList] = useState<CategoryList>({});
    const [groupMapping, setGroupMapping] = useState<CustomisationToGroupMapping>({});
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [providerOptions, setProviderOptions] = useState<string[]>([]);
    const [providers, setProviders] = useState<CatalogProvider[]>([]);

    const selectedProvider = watch("provider");
    const hasCatalogData = catalogData != null;

    const onSubmit = async (data: FormValues) => {
        const { valid, errors } = validateFormDataRET11(data, items);
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
    }, [items, name, setValue]);

    const handleItemChange = (index: number, value: string) => {
        const updated = [...items];
        updated[index] = { id: value, quantity: 1, customisations: [], relation: {} };
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
        setItems((prev) => [...prev, { id: "", quantity: 1, customisations: [], relation: {} }]);
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
                throw new Error("Providers not present");
            }

            const catalogProviders = (parsedText as OnSearchPayload).message.catalog[
                "bpp/providers"
            ];
            setProviders(catalogProviders);
            setProviderOptions(catalogProviders.map((provider) => provider.id));

            setCatalogData(parsedText);
            setErrorWhilePaste("");
            const response = getItemsAndCustomistions(payload);
            setItemsList(response?.itemList || {});
            setCategoryList(response?.catagoriesList || {});
            setGroupMapping(response?.cutomistionToGroupMapping || {});
            toast.success("Catalog loaded");
        } catch (err: unknown) {
            const e = err as { message?: string };
            setErrorWhilePaste(e.message || "Something went wrong");
            toast.error(e.message || "Invalid payload structure");
            console.error("Error while handling paste: ", err);
        }
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
                onSubmit={hasCatalogData ? handleSubmit(onSubmit) : undefined}
                footer={
                    hasCatalogData ? (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                className="gap-1"
                                onClick={addItem}
                            >
                                <PlusIcon className="size-4" />
                                Add Item
                            </Button>
                            <Button type="submit">Submit</Button>
                        </>
                    ) : null
                }
            >
                <div className="flex items-center justify-between gap-2">
                    <LabelWithToolTip labelInfo="" label={label} />
                </div>

                {errorWhilePaste && <p className="text-sm text-destructive">{errorWhilePaste}</p>}

                <PastePayloadButton
                    label={hasCatalogData ? "Edit on_search" : "Paste on_search"}
                    onClick={() => setIsPayloadEditorActive(true)}
                />

                {hasCatalogData ? (
                    <div className="space-y-4">
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
                                    });
                                } else {
                                    customisationsObj =
                                        categoryList[itemsList[`${item?.id}`]]?.items || {};
                                }

                                availableCustomisations = Object.keys(customisationsObj);
                            }

                            return (
                                <div
                                    key={index}
                                    className="relative space-y-4 rounded-lg border border-border-default bg-surface-muted/20 p-4"
                                >
                                    {index !== 0 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute -right-2 -top-2 size-8 bg-surface text-destructive hover:text-destructive"
                                            onClick={() => removeItem(index)}
                                            aria-label="Remove item"
                                        >
                                            <MinusIcon className="size-4" />
                                        </Button>
                                    )}

                                    <LabelWithToolTip labelInfo="" label="Item" />

                                    <SelectControl
                                        value={item.id}
                                        onValueChange={(value) => handleItemChange(index, value)}
                                        placeholder="Select Item"
                                        options={Object.entries(itemsList).map(([itemId]) => ({
                                            key: itemId,
                                            value: itemId,
                                        }))}
                                    />

                                    <Field>
                                        <FieldLabel>Quantity</FieldLabel>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={item.quantity}
                                            onChange={(e) => {
                                                const updated = [...items];
                                                updated[index].quantity = parseInt(e.target.value) || 1;
                                                setItems(updated);
                                            }}
                                        />
                                    </Field>

                                    {item.id && (
                                        <>
                                            <LabelWithToolTip labelInfo="" label="Customisation" />
                                            <SelectControl
                                                key={`customisation-${index}-${item.customisations.length}`}
                                                onValueChange={(value) =>
                                                    handleCustomisationChange(
                                                        index,
                                                        value,
                                                        groupMapping[value] ||
                                                            itemsList[`${item?.id}`]
                                                    )
                                                }
                                                placeholder="Select Customisation"
                                                options={availableCustomisations.map((c) => ({
                                                    key: c,
                                                    value: c,
                                                }))}
                                            />

                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {item.customisations.map((c: string, i: number) => (
                                                    <span
                                                        key={i}
                                                        className={cn(
                                                            "rounded px-2 py-1 text-sm",
                                                            "bg-surface-muted text-text-primary"
                                                        )}
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

                        <TextField
                            control={control}
                            name="bpp_id"
                            label="Enter BPP ID"
                            placeholder="Enter BPP ID"
                        />

                        {providerOptions.length > 0 ? (
                            <Controller
                                name="provider"
                                control={control}
                                render={({ field }) => (
                                    <ComboBoxControl
                                        label="Select Provider Id"
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        options={toComboOptions(providerOptions)}
                                        placeholder="Select provider"
                                    />
                                )}
                            />
                        ) : (
                            <TextField
                                control={control}
                                name="provider"
                                label="Select Provider Id"
                                placeholder="Enter provider id"
                            />
                        )}

                        <Controller
                            name="provider_location"
                            control={control}
                            defaultValue={[]}
                            render={({ field }) => {
                                const provider = providers.find((p) => p.id === selectedProvider);
                                const locations = provider?.locations || [];

                                if (locations.length === 0) {
                                    return (
                                        <Field>
                                            <FieldLabel>Provider Location Id</FieldLabel>
                                            <Input
                                                type="text"
                                                value={
                                                    Array.isArray(field.value)
                                                        ? field.value.join(",")
                                                        : String(field.value ?? "")
                                                }
                                                onChange={(event) =>
                                                    field.onChange(event.target.value)
                                                }
                                                placeholder="Enter location id"
                                            />
                                        </Field>
                                    );
                                }

                                return (
                                    <Field>
                                        <FieldLabel>Provider Location Id</FieldLabel>
                                        <div className="flex flex-col gap-2">
                                            {locations.map((loc: CatalogLocation) => (
                                                <label
                                                    key={loc.id}
                                                    className="inline-flex cursor-pointer items-center gap-2 text-sm text-text-primary"
                                                >
                                                    <Checkbox
                                                        checked={field.value.includes(loc.id)}
                                                        onCheckedChange={() =>
                                                            field.onChange(loc.id)
                                                        }
                                                    />
                                                    <span>{loc.id}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </Field>
                                );
                            }}
                        />

                        <TextField
                            control={control}
                            name="location_gps"
                            label="Delivery Location GPS"
                        />

                        <TextField
                            control={control}
                            name="location_pin_code"
                            label="Delivery Pin Code"
                        />

                        <div className="space-y-4 rounded-lg border border-border-default bg-surface-muted/20 p-4">
                            <div className="flex items-center justify-between">
                                <LabelWithToolTip labelInfo="" label="Available Offers" />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => appendOffer({ offerId: "" })}
                                    disabled={offerFields.length >= 5}
                                >
                                    <PlusIcon className="mr-1 size-4" />
                                    Add Offer
                                </Button>
                            </div>
                            <p className="text-sm text-text-secondary">Click 'Add Offer' to apply promotions</p>
                            
                            {offerFields.map((field, index) => (
                                <div key={field.id} className="relative mt-2 flex items-end gap-2">
                                    <div className="flex-1">
                                        <Controller
                                            name={`available_offers.${index}.offerId`}
                                            control={control}
                                            render={({ field: { value, onChange } }) => (
                                                <ComboBoxControl
                                                    label={`Offer ${index + 1}`}
                                                    value={value}
                                                    onValueChange={onChange}
                                                    options={OFFER_OPTIONS}
                                                    placeholder="Select Offer"
                                                />
                                            )}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="mb-1 text-destructive hover:text-destructive"
                                        onClick={() => removeOffer(index)}
                                    >
                                        <MinusIcon className="size-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="rounded-md border border-border-default bg-surface-muted/30 p-3 text-sm text-text-secondary">
                        Paste an <strong>on_search</strong> payload to load items and provider
                        details.
                    </p>
                )}
            </FormDialogShell>
        </>
    );
};

export default RET11NestedSelectForm;
