import React, { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ComboBox } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import SpinnerDialog from "@/components/Shadcn/SpinnerDialog";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import { ICatalogItem, IGenericFormWithPasteProps } from "@/components/ui/forms/generic-form.types";

const GenericFormWithPaste = ({
    defaultValues,
    children,
    onSubmit,
    className,
    triggerSubmit = false,
    enablePaste = false,
}: IGenericFormWithPasteProps) => {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        setValue,
        watch,
    } = useForm({ defaultValues });
    const isRequestTriggered = useRef(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [availableItems, setAvailableItems] = useState<ICatalogItem[]>([]);

    const selectedItemId = watch("item_id") as string;
    const selectedItem = availableItems.find((item) => item.id === selectedItemId);
    const availableAddons = selectedItem?.addOns || [];

    const handlePaste = (payload: Record<string, unknown>) => {
        try {
            const message = payload?.message as Record<string, unknown> | undefined;
            const catalog = message?.catalog as Record<string, unknown> | undefined;
            const providers = catalog?.providers as Record<string, unknown>[] | undefined;

            if (!providers) {
                throw new Error(
                    "Invalid Schema - Expected on_search payload with catalog.providers"
                );
            }

            const provider = providers[0] as Record<string, unknown>;
            const items = (provider.items || []) as Record<string, unknown>[];

            if (!items.length) {
                throw new Error("No items found in catalog");
            }

            const catalogItems: ICatalogItem[] = items.map((item) => {
                const descriptor = item.descriptor as Record<string, unknown> | undefined;
                const addOns = (item.add_ons || []) as Record<string, unknown>[];

                return {
                    id: (item.id as string) || "",
                    name: (descriptor?.name as string) || (item.id as string) || "",
                    addOns: addOns.map((addon) => {
                        const addonDescriptor = addon.descriptor as
                            | Record<string, unknown>
                            | undefined;
                        return {
                            id: (addon.id as string) || "",
                            name:
                                (addonDescriptor?.name as string) ||
                                (addonDescriptor?.short_desc as string) ||
                                (addon.id as string) ||
                                "",
                        };
                    }),
                };
            });

            setAvailableItems(catalogItems);

            const firstItem = catalogItems[0];

            setValue("item_id", firstItem.id);
            setValue("quantity", "1");
            setValue("add_on_id", firstItem.addOns?.[0]?.id || "");
            setValue("adults_count", "1");
            setValue("children_count", "0");

            setErrorWhilePaste("");
            toast.success(`Found ${catalogItems.length} items in catalog`);
        } catch (err) {
            const error = err as Error;
            setErrorWhilePaste(error.message || "Invalid payload structure");
            toast.error(error.message || "Invalid payload structure");
            console.error(err);
        }

        setIsPayloadEditorActive(false);
    };

    const handleSubmitForm = useCallback(
        async (data: Record<string, unknown>) => {
            setIsLoading(true);

            try {
                await onSubmit(data);
            } catch (error) {
                setIsLoading(false);
                console.error((error as Error)?.message);
            } finally {
                setIsLoading(false);
            }
        },
        [onSubmit]
    );

    useEffect(() => {
        if (triggerSubmit && !isRequestTriggered.current) {
            isRequestTriggered.current = true;
            handleSubmit(handleSubmitForm)();
        }
    }, [triggerSubmit, handleSubmit, handleSubmitForm]);

    const renderChildren = () => {
        return React.Children.map(children, (child) => {
            if (!React.isValidElement(child)) return child;

            const childProps = child.props as Record<string, unknown>;
            const fieldName = childProps.name as string;

            if (fieldName === "item_id" && availableItems.length > 0) {
                return (
                    <ComboBox
                        control={control}
                        name="item_id"
                        label={(childProps.label as string) || "Item ID"}
                        required
                        options={availableItems.map((item) => ({
                            label: `${item.name} (${item.id})`,
                            value: item.id,
                        }))}
                    />
                );
            }

            if (fieldName === "add_on_id" && availableAddons.length > 0) {
                return (
                    <ComboBox
                        control={control}
                        name="add_on_id"
                        label={(childProps.label as string) || "Add-on ID"}
                        options={availableAddons.map((addon) => ({
                            label: `${addon.name} (${addon.id})`,
                            value: addon.id,
                        }))}
                    />
                );
            }

            return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
                register,
                control,
                errors,
                setValue,
            });
        });
    };

    return (
        <>
            {isLoading && <SpinnerDialog />}
            <FormDialogShell
                onSubmit={handleSubmit(handleSubmitForm)}
                className={className}
                footer={
                    <Button type="submit" variant="default" isLoading={isLoading}>
                        Submit
                    </Button>
                }
            >
                {enablePaste && (
                    <>
                        {isPayloadEditorActive && (
                            <PayloadEditor onAdd={handlePaste as (payload: unknown) => void} />
                        )}
                        {errorWhilePaste && (
                            <p className="text-sm text-destructive">{errorWhilePaste}</p>
                        )}
                        <PastePayloadButton
                            onClick={() => setIsPayloadEditorActive(true)}
                            className="mb-0"
                            title="Paste on_search payload to auto-populate fields"
                        />
                    </>
                )}
                {renderChildren()}
            </FormDialogShell>
        </>
    );
};

export default GenericFormWithPaste;
