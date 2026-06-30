import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ComboBoxControl } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import { Input } from "@/components/Shadcn/TextField/input";
import { Field, FieldLabel } from "@/components/Shadcn/TextField/field";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import { SubmitEventParams } from "@/types/flow-types";
import { cn } from "@/lib/utils";
import type {
    IOnSearchPayload,
    IProvider,
    ITRV11Metro210CommonItemFulfillmentSelectionFormProps,
} from "../types/trv11-210-common-item-fulfillment-select-form-types";

const METRO_UNLIMITED_PASS_FLOW = "METRO_UNLIMITED_PASS_FLOW";
const METRO_CARD_PURCHASE = "METRO_CARD_PURCHASE";
const METRO_CARD_RECHARGE = "METRO_CARD_RECHARGE";

const ITEM_CODE_FILTER: Record<string, string> = {
    [METRO_UNLIMITED_PASS_FLOW]: "PASS",
    [METRO_CARD_PURCHASE]: "PURCHASE",
    [METRO_CARD_RECHARGE]: "RECHARGE",
};

const FULFILLMENT_TYPE_FILTER: Record<string, string> = {
    [METRO_UNLIMITED_PASS_FLOW]: "PASS",
    [METRO_CARD_PURCHASE]: "PASS",
    [METRO_CARD_RECHARGE]: "ONLINE",
};

export default function TRV11Metro210CommonItemFulfillmentSelectionForm({
    submitEvent,
    flowId,
}: ITRV11Metro210CommonItemFulfillmentSelectionFormProps) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [jsonPayload, setJsonPayload] = useState("");
    const [providers, setProviders] = useState<IProvider[]>([]);
    const [isParsed, setIsParsed] = useState(false);
    const [rawPayload, setRawPayload] = useState<IOnSearchPayload | null>(null);

    const [selectedProviderId, setSelectedProviderId] = useState("");
    const [selectedItemId, setSelectedItemId] = useState("");
    const [selectedFulfillmentId, setSelectedFulfillmentId] = useState("");
    const [selectedQuantity, setSelectedQuantity] = useState("");
    const [credType, setCredType] = useState("");
    const [credValue, setCredValue] = useState("");
    const [cardIdentifier, setCardIdentifier] = useState("");
    const [cityCode, setCityCode] = useState("std:080");

    const isUnlimitedPassFlow = flowId === METRO_UNLIMITED_PASS_FLOW;
    const isRechargeFlow = flowId === METRO_CARD_RECHARGE;

    useEffect(() => {
        setJsonPayload("");
        setProviders([]);
        setIsParsed(false);
        setRawPayload(null);
        setSelectedProviderId("");
        setSelectedItemId("");
        setSelectedFulfillmentId("");
        setSelectedQuantity("");
        setCredType("");
        setCredValue("");
        setCardIdentifier("");
        setCityCode("std:080");
    }, [flowId]);

    const handlePaste = (payload: unknown) => {
        try {
            const parsed = payload as IOnSearchPayload;
            const parsedProviders = parsed?.message?.catalog?.providers;

            if (!parsedProviders || parsedProviders.length === 0) {
                throw new Error("Invalid payload: No providers found");
            }

            setProviders(parsedProviders);
            setRawPayload(parsed);
            setJsonPayload(JSON.stringify(parsed));
            setIsParsed(true);
            setIsPayloadEditorActive(false);
            toast.success(`Found ${parsedProviders.length} provider(s)`);
        } catch (error: unknown) {
            console.error(error);
            toast.error(
                "Failed to parse payload: " +
                    (error instanceof Error ? error.message : "Unknown error")
            );
        }
    };

    const selectedProvider = useMemo(
        () => providers.find((provider) => provider.id === selectedProviderId) || null,
        [providers, selectedProviderId]
    );

    const availableItems = useMemo(() => {
        const allItems = selectedProvider?.items || [];
        const codeFilter = flowId ? ITEM_CODE_FILTER[flowId] : undefined;
        if (!codeFilter) return allItems;
        return allItems.filter((item) => item.descriptor?.code === codeFilter);
    }, [selectedProvider, flowId]);

    const availableFulfillments = useMemo(() => {
        const allFulfillments = selectedProvider?.fulfillments || [];
        const typeFilter = flowId ? FULFILLMENT_TYPE_FILTER[flowId] : undefined;
        if (!typeFilter) return allFulfillments;
        return allFulfillments.filter((fulfillment) => fulfillment.type === typeFilter);
    }, [selectedProvider, flowId]);

    const selectedFulfillment = useMemo(
        () =>
            availableFulfillments.find((fulfillment) => fulfillment.id === selectedFulfillmentId) ||
            null,
        [availableFulfillments, selectedFulfillmentId]
    );

    const availableCredTypes = useMemo(() => {
        const creds = selectedFulfillment?.customer?.person?.creds || [];
        return creds.map((cred) => cred.type).filter(Boolean);
    }, [selectedFulfillment]);

    const selectedItem = useMemo(
        () => availableItems.find((item) => item.id === selectedItemId) || null,
        [availableItems, selectedItemId]
    );

    const quantityOptions = useMemo(() => {
        if (!selectedItem?.quantity) return [];
        const min = selectedItem.quantity.minimum?.count ?? 1;
        const max = selectedItem.quantity.maximum?.count ?? 1;
        const options: number[] = [];
        for (let index = min; index <= max; index += 1) {
            options.push(index);
        }
        return options;
    }, [selectedItem]);

    const handleProviderChange = (providerId: string) => {
        setSelectedProviderId(providerId);
        setSelectedItemId("");
        setSelectedFulfillmentId("");
        setSelectedQuantity("");
    };

    const handleItemChange = (itemId: string) => {
        setSelectedItemId(itemId);
        setSelectedQuantity("");
    };

    const handleFulfillmentChange = (fulfillmentId: string) => {
        setSelectedFulfillmentId(fulfillmentId);
        setCredType("");
        setCredValue("");
    };

    const handleClearPayload = () => {
        setJsonPayload("");
        setIsParsed(false);
        setProviders([]);
        setRawPayload(null);
        toast.info("Payload cleared");
    };

    const handleReset = () => {
        setJsonPayload("");
        setProviders([]);
        setIsParsed(false);
        setRawPayload(null);
        setSelectedProviderId("");
        setSelectedItemId("");
        setSelectedFulfillmentId("");
        setSelectedQuantity("");
        setCredType("");
        setCredValue("");
        setCardIdentifier("");
        setCityCode("std:080");
    };

    const handleSubmit = async () => {
        if (!selectedProviderId) {
            toast.error("Please select a Provider ID");
            return;
        }
        if (!selectedItemId) {
            toast.error("Please select an Item ID");
            return;
        }
        if (!selectedFulfillmentId) {
            toast.error("Please select a Fulfillment ID");
            return;
        }
        if (isUnlimitedPassFlow && !selectedQuantity) {
            toast.error("Please select Item Quantity");
            return;
        }
        if (isUnlimitedPassFlow && !credValue.trim()) {
            toast.error("Please enter the credential value");
            return;
        }
        if (isRechargeFlow && !cardIdentifier.trim()) {
            toast.error("Please enter the Card Identifier");
            return;
        }
        if (!cityCode.trim()) {
            toast.error("Please enter the City Code");
            return;
        }

        const formData: Record<string, string> = {
            provider_id: selectedProviderId,
            item_id: selectedItemId,
            fulfillment_id: selectedFulfillmentId,
            city_code: cityCode.trim(),
            payload: jsonPayload,
        };

        if (isUnlimitedPassFlow) {
            formData.item_quantity = selectedQuantity;
            formData.cred_type = credType;
            formData.cred_value = credValue.trim();
        }

        if (isRechargeFlow) {
            formData.card_identifier = cardIdentifier.trim();
        }

        await submitEvent({
            jsonPath: {},
            formData,
            catalog: rawPayload as unknown as SubmitEventParams["catalog"],
        });
    };

    const providerOptions = providers.map((provider) => ({
        value: provider.id,
        label: provider.descriptor?.name
            ? `${provider.descriptor.name} (${provider.id})`
            : provider.id,
    }));

    const itemOptions = availableItems.map((item) => ({
        value: item.id,
        label: item.descriptor?.name ? `${item.descriptor.name} (${item.id})` : item.id,
    }));

    const fulfillmentOptions = availableFulfillments.map((fulfillment) => ({
        value: fulfillment.id,
        label: `${fulfillment.id} (${fulfillment.type})`,
    }));

    const quantityComboOptions = quantityOptions.map((qty) => ({
        value: String(qty),
        label: String(qty),
    }));

    const credTypeOptions = availableCredTypes.map((type) => ({
        value: type,
        label: type,
    }));

    return (
        <>
            {isPayloadEditorActive && (
                <PayloadEditor
                    onAdd={handlePaste}
                    onClose={() => setIsPayloadEditorActive(false)}
                />
            )}

            <FormDialogShell
                onSubmit={(event) => {
                    event.preventDefault();
                    void handleSubmit();
                }}
                footer={<Button type="submit">Submit</Button>}
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-text-primary">
                        Search Configuration
                    </h3>
                    <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
                        Reset Form
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <PastePayloadButton
                        onClick={() => setIsPayloadEditorActive(true)}
                        label={isParsed ? "Modify Payload" : "Paste Payload"}
                        className="mb-0"
                    />
                    <span className="text-sm text-text-secondary">
                        Paste on_search payload (optional)
                    </span>
                    {isParsed && (
                        <Button type="button" variant="link" size="sm" onClick={handleClearPayload}>
                            Clear
                        </Button>
                    )}
                </div>

                <div
                    className={cn(
                        "space-y-4 rounded-xl border border-border-default bg-surface-muted/20 p-4"
                    )}
                >
                    <Field>
                        <FieldLabel className="font-semibold">
                            Enter City Code <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                            value={cityCode}
                            onChange={(event) => setCityCode(event.target.value)}
                            placeholder="std:080"
                            required
                        />
                    </Field>

                    {isParsed ? (
                        <ComboBoxControl
                            label="Provider ID"
                            required
                            value={selectedProviderId}
                            onValueChange={handleProviderChange}
                            options={providerOptions}
                            placeholder="Select a provider"
                        />
                    ) : (
                        <Field>
                            <FieldLabel className="font-semibold">
                                Provider ID <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                value={selectedProviderId}
                                onChange={(event) => setSelectedProviderId(event.target.value)}
                                placeholder="Enter Provider ID"
                                required
                            />
                        </Field>
                    )}

                    {isParsed ? (
                        <ComboBoxControl
                            label="Item ID"
                            required
                            value={selectedItemId}
                            onValueChange={handleItemChange}
                            options={itemOptions}
                            placeholder="Select an item"
                            disabled={!selectedProviderId}
                        />
                    ) : (
                        <Field>
                            <FieldLabel className="font-semibold">
                                Item ID <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                value={selectedItemId}
                                onChange={(event) => setSelectedItemId(event.target.value)}
                                placeholder="Enter Item ID"
                                required
                            />
                        </Field>
                    )}

                    {isParsed && selectedProviderId && availableItems.length === 0 && (
                        <p className="text-xs text-amber-600">
                            No items with code &ldquo;{flowId ? ITEM_CODE_FILTER[flowId] : ""}
                            &rdquo; found for this provider.
                        </p>
                    )}

                    {isParsed ? (
                        <ComboBoxControl
                            label="Fulfillment ID"
                            required
                            value={selectedFulfillmentId}
                            onValueChange={handleFulfillmentChange}
                            options={fulfillmentOptions}
                            placeholder="Select a fulfillment"
                            disabled={!selectedProviderId}
                        />
                    ) : (
                        <Field>
                            <FieldLabel className="font-semibold">
                                Fulfillment ID <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                value={selectedFulfillmentId}
                                onChange={(event) => setSelectedFulfillmentId(event.target.value)}
                                placeholder="Enter Fulfillment ID"
                                required
                            />
                        </Field>
                    )}

                    {isParsed && selectedProviderId && availableFulfillments.length === 0 && (
                        <p className="text-xs text-amber-600">
                            No fulfillments with type &ldquo;
                            {flowId ? FULFILLMENT_TYPE_FILTER[flowId] : ""}&rdquo; found for this
                            provider.
                        </p>
                    )}

                    {isUnlimitedPassFlow &&
                        (isParsed ? (
                            <ComboBoxControl
                                label="Item Quantity"
                                required
                                value={selectedQuantity}
                                onValueChange={setSelectedQuantity}
                                options={quantityComboOptions}
                                placeholder="Select quantity"
                                disabled={!selectedItemId || quantityOptions.length === 0}
                            />
                        ) : (
                            <Field>
                                <FieldLabel className="font-semibold">
                                    Item Quantity <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Input
                                    type="number"
                                    value={selectedQuantity}
                                    onChange={(event) => setSelectedQuantity(event.target.value)}
                                    placeholder="Enter Quantity"
                                    required
                                />
                            </Field>
                        ))}

                    {isUnlimitedPassFlow &&
                        isParsed &&
                        selectedItemId &&
                        quantityOptions.length === 0 && (
                            <p className="text-xs text-amber-600">
                                No quantity range defined for the selected item.
                            </p>
                        )}

                    {isUnlimitedPassFlow && (
                        <>
                            {isParsed ? (
                                <ComboBoxControl
                                    label="Credential Type"
                                    required
                                    value={credType}
                                    onValueChange={setCredType}
                                    options={credTypeOptions}
                                    placeholder="Select credential type"
                                    disabled={
                                        !selectedFulfillmentId || availableCredTypes.length === 0
                                    }
                                />
                            ) : (
                                <Field>
                                    <FieldLabel className="font-semibold">
                                        Credential Type <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <Input
                                        value={credType}
                                        onChange={(event) => setCredType(event.target.value)}
                                        placeholder="e.g. AADHAAR, PAN"
                                        required
                                    />
                                </Field>
                            )}

                            {isParsed &&
                                selectedFulfillmentId &&
                                availableCredTypes.length === 0 && (
                                    <p className="text-xs text-amber-600">
                                        No credential types found for the selected fulfillment.
                                    </p>
                                )}

                            <Field>
                                <FieldLabel className="font-semibold">
                                    {credType || "Credential"} Value{" "}
                                    <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Input
                                    value={credValue}
                                    onChange={(event) => setCredValue(event.target.value)}
                                    disabled={isParsed && !credType}
                                    placeholder={
                                        isParsed
                                            ? credType
                                                ? `Enter ${credType} number`
                                                : "Select a credential type first"
                                            : "Enter Credential Value"
                                    }
                                />
                            </Field>
                        </>
                    )}

                    {isRechargeFlow && (
                        <>
                            <Field>
                                <FieldLabel className="font-semibold">Credential Type</FieldLabel>
                                <Input
                                    value="CARD_IDENTIFIER"
                                    disabled
                                    className="bg-surface-muted text-text-secondary"
                                />
                            </Field>

                            <Field>
                                <FieldLabel className="font-semibold">
                                    CARD_IDENTIFIER Value{" "}
                                    <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Input
                                    value={cardIdentifier}
                                    onChange={(event) => setCardIdentifier(event.target.value)}
                                    placeholder="Enter Card Identifier value"
                                />
                            </Field>
                        </>
                    )}
                </div>
            </FormDialogShell>
        </>
    );
}
