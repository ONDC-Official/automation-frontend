import { useEffect, useState } from "react";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { ComboBoxControl } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import { Checkbox } from "@/components/Shadcn/Checkbox";
import TextField from "@/components/Shadcn/TextField";
import { Field, FieldLabel } from "@/components/Shadcn/TextField/field";
import { LabelWithToolTip } from "@/components/Shadcn/TextField";
import { SelectControl } from "@/components/Shadcn/Select";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import { getItemsAndCustomistions } from "@/utils/generic-utils";
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

const toComboOptions = (values: string[]) => values.map((value) => ({ value, label: value }));

const RET11NestedSelectForm = ({
    name,
    label,
    setValue,
    submitEvent,
}: ItemCustomisationSelectorProps) => {
    const [items, setItems] = useState<SelectedItem[]>([
        { id: "", customisations: [], relation: {} },
    ]);

    const { control, handleSubmit, watch } = useForm<FormValues>({
        defaultValues: {
            provider: "",
            provider_location: [],
            location_gps: "",
            location_pin_code: "",
        },
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
                                            <input
                                                type="text"
                                                value={
                                                    Array.isArray(field.value)
                                                        ? field.value.join(",")
                                                        : String(field.value ?? "")
                                                }
                                                onChange={(event) =>
                                                    field.onChange(event.target.value)
                                                }
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring focus-visible:ring-ring/50"
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
