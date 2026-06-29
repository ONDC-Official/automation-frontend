import { useEffect, useState } from "react";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { Button } from "@/components/Shadcn/Button/button";
import { LabelWithToolTip } from "@/components/Shadcn/TextField";
import { SelectControl } from "@/components/Shadcn/Select";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import { getItemsAndCustomistions } from "@/utils/generic-utils";
import { SubmitEventParams } from "@/types/flow-types";
import { SessionCache } from "@/types/session-types";
import { cn } from "@/lib/utils";

interface SelectedItem {
    id: string;
    customisations: string[];
    relation: Record<string, string>;
    lastCustomisation?: string[];
}

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
    sessionData?: SessionCache | null;
};

const RET11NestedSelect = ({
    name,
    label,
    setValue,
    submitEvent,
    sessionData,
}: ItemCustomisationSelectorProps) => {
    const minItems = sessionData?.activeFlow === "RTO_PLUS_PART_CANCELLATION" ? 2 : 1;
    const [items, setItems] = useState<SelectedItem[]>(
        Array.from({ length: minItems }, () => ({ id: "", customisations: [], relation: {} }))
    );

    const [catalogData, setCatalogData] = useState<unknown | null>(null);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [itemsList, setItemsList] = useState<ItemList>({});
    const [categoryList, setCategoryList] = useState<CategoryList>({});
    const [groupMapping, setGroupMapping] = useState<CustomisationToGroupMapping>({});
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const hasCatalogData = catalogData != null;

    useEffect(() => {
        if (items.length < minItems) {
            const extra = Array.from({ length: minItems - items.length }, () => ({
                id: "",
                customisations: [],
                relation: {},
            }));
            setItems((prev: SelectedItem[]) => [...prev, ...extra]);
        }
    }, [minItems, items.length]);

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
        if (items.length <= minItems) return;
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

    const handleSubmit = async () => {
        const filledItems = items.filter((item: SelectedItem) => item.id !== "");
        if (filledItems.length < minItems) {
            toast.error(`At least ${minItems} items must be selected for this flow.`);
            return;
        }
        await submitEvent?.({ jsonPath: {}, formData: items as unknown as Record<string, string> });
    };

    const footer =
        submitEvent && hasCatalogData ? (
            <Button type="button" onClick={handleSubmit}>
                Submit
            </Button>
        ) : null;

    return (
        <>
            {isPayloadEditorActive && (
                <PayloadEditor
                    onAdd={handlePaste}
                    onClose={() => setIsPayloadEditorActive(false)}
                />
            )}

            <FormDialogShell footer={footer}>
                <div className="flex items-center justify-between gap-2">
                    <LabelWithToolTip labelInfo="" label={label} />
                    {hasCatalogData && (
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={addItem}
                            aria-label="Add item"
                        >
                            <PlusIcon className="size-4" />
                        </Button>
                    )}
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
                                    {items.length > minItems && index >= minItems && (
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
                    </div>
                ) : (
                    <p className="rounded-md border border-border-default bg-surface-muted/30 p-3 text-sm text-text-secondary">
                        Paste an <strong>on_search</strong> payload to load items and
                        customisations.
                    </p>
                )}
            </FormDialogShell>
        </>
    );
};

export default RET11NestedSelect;
