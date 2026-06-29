import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { ComboBoxControl } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import TextField from "@/components/Shadcn/TextField";
import { Field, FieldLabel } from "@/components/Shadcn/TextField/field";
import { Input } from "@/components/Shadcn/TextField/input";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import { SubmitEventParams } from "@/types/flow-types";
import { FormFieldConfigType } from "../config-form/config-form";
import { cn } from "@/lib/utils";

interface RawItem {
    id: string;
    descriptor?: { name?: string; code?: string };
    parent_item_id?: string;
    fulfillment_ids?: string[];
}
interface RawFulfillment {
    id: string;
    type: string;
}
interface RawProvider {
    id: string;
    descriptor?: { name?: string };
    items?: RawItem[];
    fulfillments?: RawFulfillment[];
}
interface OnSearchPayload {
    context?: Record<string, unknown>;
    message?: { catalog?: { providers?: RawProvider[] } };
}

interface ParsedProvider {
    id: string;
    name: string;
    items: { id: string; name: string; fulfillmentIds: string[] }[];
    fulfillments: { id: string; type: string }[];
}
interface CatalogData {
    providers: ParsedProvider[];
    context: OnSearchPayload["context"];
}

type RedeemMode = "AMOUNT" | "MF_UNITS" | "REDEEM_ALL";

interface AgentCred {
    id: string;
    type: string;
}
interface FormValues {
    providerId: string;
    itemId: string;
    fulfillmentId: string;
    redeemMode: RedeemMode;
    itemValue: string;
    customerPersonId: string;
    folioId: string;
    agentPersonId: string;
    agentCreds: AgentCred[];
}

const sectionClassName =
    "space-y-3 rounded-lg border border-border-default bg-surface-muted/20 p-4";

export default function FIS14MutualFundRedemptionSelectForm({
    submitEvent,
    formConfig = [],
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    formConfig?: FormFieldConfigType[];
}) {
    const extraFields = formConfig.filter((field) => field.type !== "fis14_mf_redemption_select");
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [catalog, setCatalog] = useState<CatalogData | null>(null);
    const [extraData, setExtraData] = useState<Record<string, string>>(
        Object.fromEntries(extraFields.map((field) => [field.name, String(field.default ?? "")]))
    );
    const [extraErrors, setExtraErrors] = useState<Record<string, string>>({});

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: {
            providerId: "",
            itemId: "",
            fulfillmentId: "",
            redeemMode: "AMOUNT",
            itemValue: "",
            customerPersonId: "",
            folioId: "",
            agentPersonId: "",
            agentCreds: [{ id: "", type: "" }],
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: "agentCreds" });

    const watchedProviderId = watch("providerId");
    const watchedItemId = watch("itemId");
    const watchedFulfillmentId = watch("fulfillmentId");
    const watchedRedeemMode = watch("redeemMode");

    const selectedProvider = catalog?.providers.find(
        (provider) => provider.id === watchedProviderId
    );
    const selectedItem = selectedProvider?.items.find((item) => item.id === watchedItemId);

    const availableFulfillments =
        selectedItem && selectedItem.fulfillmentIds.length > 0
            ? (selectedProvider?.fulfillments ?? []).filter((fulfillment) =>
                  selectedItem.fulfillmentIds.includes(fulfillment.id)
              )
            : (selectedProvider?.fulfillments ?? []);

    const selectedFulfillment = availableFulfillments.find(
        (fulfillment) => fulfillment.id === watchedFulfillmentId
    );

    const handlePaste = (payload: unknown) => {
        try {
            const raw = payload as OnSearchPayload;
            const rawProviders = raw?.message?.catalog?.providers;
            if (!rawProviders || rawProviders.length === 0) throw new Error("No providers found");

            const providers: ParsedProvider[] = rawProviders.map((provider) => ({
                id: provider.id,
                name: provider.descriptor?.name ?? provider.id,
                items: (provider.items ?? []).map((item) => ({
                    id: item.id,
                    name: item.descriptor?.name ?? item.id,
                    fulfillmentIds: item.fulfillment_ids ?? [],
                })),
                fulfillments: (provider.fulfillments ?? []).map((fulfillment) => ({
                    id: fulfillment.id,
                    type: fulfillment.type,
                })),
            }));

            setCatalog({ providers, context: raw.context });
            setValue("providerId", providers[0].id);
            setValue("fulfillmentId", "");
            setValue("itemId", "");
            toast.success(`Loaded ${providers.length} provider(s)`);
            setIsPayloadEditorActive(false);
        } catch (error) {
            toast.error("Invalid on_search payload");
            console.error(error);
        }
    };

    const onSubmit = async (data: FormValues) => {
        if (!catalog) {
            toast.error("Please paste an on_search payload first");
            return;
        }

        const newExtraErrors: Record<string, string> = {};
        extraFields.forEach((field) => {
            if (field.required !== false && !extraData[field.name]?.trim()) {
                newExtraErrors[field.name] = "This field is required";
            }
        });
        if (Object.keys(newExtraErrors).length > 0) {
            setExtraErrors(newExtraErrors);
            return;
        }

        let measure: { unit: string; value: string };
        if (data.redeemMode === "REDEEM_ALL") {
            measure = { unit: "MF_UNITS", value: "-1" };
        } else if (data.redeemMode === "MF_UNITS") {
            measure = { unit: "MF_UNITS", value: data.itemValue };
        } else {
            measure = { unit: "INR", value: data.itemValue };
        }

        const agentCreds = data.agentCreds.filter((cred) => cred.id || cred.type);

        const customerPersonObj: Record<string, unknown> = {
            id: data.customerPersonId,
        };
        if (data.folioId) {
            customerPersonObj.creds = [{ id: data.folioId, type: "FOLIO" }];
        }

        const fulfillmentObj: Record<string, unknown> = {
            id: data.fulfillmentId,
            type: selectedFulfillment?.type ?? "",
            customer: { person: customerPersonObj },
        };

        if (agentCreds.length > 0 || data.agentPersonId) {
            fulfillmentObj.agent = {
                ...(data.agentPersonId ? { person: { id: data.agentPersonId } } : {}),
                ...(agentCreds.length > 0 ? { organization: { creds: agentCreds } } : {}),
            };
        }

        const selectPayload = {
            message: {
                order: {
                    provider: { id: data.providerId },
                    items: [
                        {
                            id: data.itemId,
                            quantity: {
                                selected: { measure },
                            },
                            fulfillment_ids: [data.fulfillmentId],
                        },
                    ],
                    fulfillments: [fulfillmentObj],
                },
            },
        };

        const extraFieldsData: Record<string, string> = {};
        extraFields.forEach((field) => {
            extraFieldsData[field.name] = extraData[field.name] ?? "";
        });

        await submitEvent({
            jsonPath: {},
            formData: {
                data: JSON.stringify(selectPayload),
                ...extraFieldsData,
            },
        });
    };

    const providerOptions =
        catalog?.providers.map((provider) => ({
            value: provider.id,
            label: `${provider.name} (${provider.id})`,
        })) ?? [];

    const itemOptions =
        (selectedProvider?.items ?? [])
            .filter((_, index) => index !== 0)
            .map((item) => ({
                value: item.id,
                label: `${item.name} (${item.id})`,
            })) ?? [];

    const fulfillmentOptions = availableFulfillments.map((fulfillment) => ({
        value: fulfillment.id,
        label: `${fulfillment.id} — ${fulfillment.type}`,
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
                onSubmit={handleSubmit(onSubmit)}
                footer={catalog ? <Button type="submit">Submit</Button> : null}
            >
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-text-primary">
                        Mutual Fund Redemption Select (FIS14)
                    </p>
                    <p
                        className={cn(
                            "text-xs",
                            catalog ? "text-text-secondary" : "text-amber-600"
                        )}
                    >
                        {catalog
                            ? `${catalog.providers.length} provider(s) loaded`
                            : "Paste on_search payload to begin"}
                    </p>
                </div>

                <PastePayloadButton
                    onClick={() => setIsPayloadEditorActive(true)}
                    label={catalog ? "Edit Payload" : "Paste Payload"}
                />

                {catalog && (
                    <>
                        <div className={sectionClassName}>
                            <FieldLabel className="font-semibold uppercase tracking-wide">
                                Provider
                            </FieldLabel>
                            <Controller
                                name="providerId"
                                control={control}
                                rules={{ required: "Required" }}
                                render={({ field }) => (
                                    <ComboBoxControl
                                        label="Provider ID"
                                        required
                                        value={field.value}
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            setValue("itemId", "");
                                            setValue("fulfillmentId", "");
                                        }}
                                        options={providerOptions}
                                        placeholder="Select provider"
                                        error={errors.providerId?.message}
                                    />
                                )}
                            />
                        </div>

                        <div className={sectionClassName}>
                            <FieldLabel className="font-semibold uppercase tracking-wide">
                                Item
                            </FieldLabel>
                            <Controller
                                name="itemId"
                                control={control}
                                rules={{ required: "Required" }}
                                render={({ field }) => (
                                    <ComboBoxControl
                                        label="Item ID"
                                        required
                                        value={field.value}
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            setValue("fulfillmentId", "");
                                        }}
                                        options={itemOptions}
                                        placeholder={
                                            selectedProvider
                                                ? "Select an item"
                                                : "Select a provider first"
                                        }
                                        disabled={!selectedProvider}
                                        error={errors.itemId?.message}
                                    />
                                )}
                            />
                        </div>

                        <div className={sectionClassName}>
                            <FieldLabel className="font-semibold uppercase tracking-wide">
                                Fulfillment
                            </FieldLabel>
                            <Controller
                                name="fulfillmentId"
                                control={control}
                                rules={{ required: "Required" }}
                                render={({ field }) => (
                                    <ComboBoxControl
                                        label="Fulfillment ID"
                                        required
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        options={fulfillmentOptions}
                                        placeholder={
                                            selectedProvider
                                                ? "Select fulfillment"
                                                : "Select a provider first"
                                        }
                                        disabled={!selectedProvider}
                                        error={errors.fulfillmentId?.message}
                                    />
                                )}
                            />
                            {selectedFulfillment && (
                                <Field>
                                    <FieldLabel>Fulfillment Type</FieldLabel>
                                    <Input value={selectedFulfillment.type} disabled readOnly />
                                </Field>
                            )}
                        </div>

                        {selectedFulfillment && (
                            <div className={sectionClassName}>
                                <FieldLabel className="font-semibold uppercase tracking-wide">
                                    Redemption Mode
                                </FieldLabel>
                                <div className="flex flex-wrap gap-4">
                                    {(["AMOUNT", "MF_UNITS", "REDEEM_ALL"] as RedeemMode[]).map(
                                        (mode) => (
                                            <label
                                                key={mode}
                                                className="flex cursor-pointer items-center gap-2 text-sm font-medium text-text-primary"
                                            >
                                                <input
                                                    type="radio"
                                                    value={mode}
                                                    {...register("redeemMode")}
                                                    className="accent-primary"
                                                />
                                                {mode === "AMOUNT" && "Redeem by Amount"}
                                                {mode === "MF_UNITS" && "Redeem by Units"}
                                                {mode === "REDEEM_ALL" && "Redeem All"}
                                            </label>
                                        )
                                    )}
                                </div>
                                <p className="text-xs text-text-secondary">
                                    {watchedRedeemMode === "AMOUNT" &&
                                        'Will send: measure = { unit: "INR", value: <amount> }'}
                                    {watchedRedeemMode === "MF_UNITS" &&
                                        'Will send: measure = { unit: "MF_UNITS", value: <units> }'}
                                    {watchedRedeemMode === "REDEEM_ALL" &&
                                        'Will send: measure = { unit: "MF_UNITS", value: "-1" } — full redemption'}
                                </p>
                                {watchedRedeemMode !== "REDEEM_ALL" && (
                                    <TextField
                                        control={control}
                                        name="itemValue"
                                        label={
                                            watchedRedeemMode === "AMOUNT"
                                                ? "Amount (INR)"
                                                : "Number of Units (MF_UNITS)"
                                        }
                                        required="Required"
                                        placeholder={
                                            watchedRedeemMode === "AMOUNT" ? "e.g. 3000" : "e.g. 50"
                                        }
                                        errors={errors}
                                    />
                                )}
                                {watchedRedeemMode === "REDEEM_ALL" && (
                                    <p className="rounded-md border border-border-default bg-surface-muted/40 p-2 text-xs text-text-secondary">
                                        Full redemption — value <strong>-1</strong> will be sent
                                        automatically.
                                    </p>
                                )}
                            </div>
                        )}

                        <div className={sectionClassName}>
                            <FieldLabel className="font-semibold uppercase tracking-wide">
                                Customer
                            </FieldLabel>
                            <TextField
                                control={control}
                                name="customerPersonId"
                                label="Customer PAN ID"
                                required="Required"
                                placeholder="e.g. pan:ARRPP7771N"
                                errors={errors}
                            />
                            <TextField
                                control={control}
                                name="folioId"
                                label="Folio Number"
                                placeholder="e.g. 78953432/32"
                                description="Sent as customer.person.creds[0] with type FOLIO"
                                errors={errors}
                            />
                        </div>

                        <div className={sectionClassName}>
                            <FieldLabel className="font-semibold uppercase tracking-wide">
                                Agent
                            </FieldLabel>
                            <TextField
                                control={control}
                                name="agentPersonId"
                                label="Agent EUIN ID"
                                required="Required"
                                placeholder="e.g. euin:E52432"
                                errors={errors}
                            />
                            <div className="flex items-center justify-between pt-1">
                                <FieldLabel>Agent Organisation Creds</FieldLabel>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ id: "", type: "" })}
                                >
                                    <PlusIcon className="size-4" />
                                    Add Cred
                                </Button>
                            </div>
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-end gap-2">
                                    <TextField
                                        control={control}
                                        name={`agentCreds.${index}.id`}
                                        label="ID"
                                        required="Required"
                                        placeholder="e.g. ARN-124567"
                                        errors={errors}
                                        className="flex-1"
                                    />
                                    <TextField
                                        control={control}
                                        name={`agentCreds.${index}.type`}
                                        label="Type"
                                        required="Required"
                                        placeholder="e.g. ARN or SUB_BROKER_ARN"
                                        errors={errors}
                                        className="flex-1"
                                    />
                                    {fields.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={() => remove(index)}
                                            aria-label="Remove cred"
                                        >
                                            <TrashIcon className="size-4 text-destructive" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {extraFields.length > 0 && (
                            <div className={sectionClassName}>
                                <FieldLabel className="font-semibold uppercase tracking-wide">
                                    Additional Fields
                                </FieldLabel>
                                {extraFields.map((field) => (
                                    <Field key={field.name}>
                                        <FieldLabel>
                                            {field.label}
                                            {field.required !== false ? " *" : ""}
                                        </FieldLabel>
                                        <input
                                            type="text"
                                            value={extraData[field.name] ?? ""}
                                            onChange={(event) => {
                                                setExtraData((prev) => ({
                                                    ...prev,
                                                    [field.name]: event.target.value,
                                                }));
                                                if (extraErrors[field.name]) {
                                                    setExtraErrors((prev) => {
                                                        const next = { ...prev };
                                                        delete next[field.name];
                                                        return next;
                                                    });
                                                }
                                            }}
                                            className={cn(
                                                "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs",
                                                extraErrors[field.name] && "border-destructive"
                                            )}
                                        />
                                        {extraErrors[field.name] && (
                                            <p className="text-xs text-destructive">
                                                {extraErrors[field.name]}
                                            </p>
                                        )}
                                    </Field>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </FormDialogShell>
        </>
    );
}
