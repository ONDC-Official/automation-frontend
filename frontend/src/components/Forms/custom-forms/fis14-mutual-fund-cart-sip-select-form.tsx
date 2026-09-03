import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { ComboBoxControl } from "@components/Shadcn/ComboBox";
import { Button } from "@components/Shadcn/Button";
import TextField from "@components/Shadcn/TextField";
import { Field, FieldLabel } from "@components/Shadcn/TextField/field";
import { Input } from "@components/Shadcn/Input";
import PayloadEditor from "@components/PayloadEditor/PastePayloadModal";
import FormDialogShell from "@components/Forms/form-dialog-shell";
import { PastePayloadButton } from "@components/Forms/paste-payload-button";
import { cn } from "@/lib/utils";
import type {
    IRawTag,
    IOnSearchPayload,
    IThresholdInfo,
    IParsedProvider,
    ICatalogData,
    ICartFormValues,
    IFIS14MutualFundCartSIPSelectFormProps,
} from "../types/fis14-mutual-fund-cart-sip-select-form-types";

// ─── Utilities ────────────────────────────────────────────────────────────────

function parseThresholds(tags?: IRawTag[]): IThresholdInfo {
    const tag = tags?.find((t) => t.descriptor?.code === "THRESHOLDS");
    if (!tag) return {};
    const get = (code: string) => tag.list?.find((e) => e.descriptor?.code === code)?.value;
    return {
        frequency: get("FREQUENCY"),
        frequencyDates: get("FREQUENCY_DATES"),
        frequencyDayType: get("FREQUENCY_DAY_TYPE"),
        amountMin: get("AMOUNT_MIN"),
        amountMax: get("AMOUNT_MAX"),
        amountMultiples: get("AMOUNT_MULTIPLES"),
        installmentsMin: get("INSTALMENTS_COUNT_MIN"),
        installmentsMax: get("INSTALMENTS_COUNT_MAX"),
        cumulativeAmountMin: get("CUMULATIVE_AMOUNT_MIN"),
    };
}

function buildFrequency(
    freq: string,
    startDate: string,
    installments: string,
    sipDay: string
): string {
    let date = startDate;
    if (freq === "P1M" && sipDay) {
        const parts = startDate.split("-");
        if (parts.length === 3) {
            date = `${parts[0]}-${parts[1]}-${sipDay.padStart(2, "0")}`;
        }
    }
    return `R${installments}/${date}/${freq}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FIS14MutualFundCartSIPSelectForm({
    submitEvent,
    formConfig = [],
}: IFIS14MutualFundCartSIPSelectFormProps) {
    const extraFields = formConfig.filter((f) => f.type !== "fis14_mf_cart_sip_select");
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [catalog, setCatalog] = useState<ICatalogData | null>(null);
    const [extraData, setExtraData] = useState<Record<string, string>>(
        Object.fromEntries(extraFields.map((f) => [f.name, String(f.default ?? "")]))
    );
    const [extraErrors, setExtraErrors] = useState<Record<string, string>>({});

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ICartFormValues>({
        defaultValues: {
            providerId: "",
            fulfillmentId: "",
            cartItems: [{ itemId: "", amount: "" }],
            installments: "",
            startDate: "",
            sipDay: "",
            customerPersonId: "",
            folioId: "",
            agentPersonId: "",
            agentCreds: [{ id: "", type: "" }],
            staticTermsUrl: "https://buyer.setu.gov.in/legal/ondc:fis14/static_terms?v=0.1",
        },
    });

    const {
        fields: cartItemFields,
        append: appendCartItem,
        remove: removeCartItem,
    } = useFieldArray({ control, name: "cartItems" });

    const {
        fields: agentCredFields,
        append: appendAgentCred,
        remove: removeAgentCred,
    } = useFieldArray({ control, name: "agentCreds" });

    // ── Watched values ──
    const watchedProviderId = watch("providerId");
    const watchedFulfillmentId = watch("fulfillmentId");
    const watchedInstallments = watch("installments");
    const watchedStartDate = watch("startDate");
    const watchedSipDay = watch("sipDay");

    const selectedProvider = catalog?.providers.find((p) => p.id === watchedProviderId);
    const planItems = selectedProvider?.items ?? [];
    const availableFulfillments = selectedProvider?.fulfillments ?? [];

    const selectedFulfillment = availableFulfillments.find((f) => f.id === watchedFulfillmentId);
    const isSip = selectedFulfillment?.type === "SIP";
    const thresholds = selectedFulfillment?.thresholds ?? {};

    const frequencyLabel =
        thresholds.frequency === "P1M"
            ? "Monthly"
            : thresholds.frequency === "P1D"
              ? `Daily (${thresholds.frequencyDayType ?? ""})`
              : (thresholds.frequency ?? "");

    const frequencyPreview =
        isSip && selectedFulfillment && watchedInstallments && watchedStartDate
            ? buildFrequency(
                  thresholds.frequency ?? "P1M",
                  watchedStartDate,
                  watchedInstallments,
                  watchedSipDay
              )
            : null;

    // ── Paste handler ──
    const handlePaste = (payload: unknown) => {
        try {
            const raw = payload as IOnSearchPayload;
            const rawProviders = raw?.message?.catalog?.providers;
            if (!rawProviders?.length) throw new Error("No providers");

            const providers: IParsedProvider[] = rawProviders.map((p) => ({
                id: p.id,
                name: p.descriptor?.name ?? p.id,
                items: (p.items ?? [])
                    .filter((i) => !!i.parent_item_id)
                    .map((i) => ({
                        id: i.id,
                        name: i.descriptor?.name ?? i.id,
                        fulfillmentIds: i.fulfillment_ids ?? [],
                    })),
                fulfillments: (p.fulfillments ?? []).map((f) => ({
                    id: f.id,
                    type: f.type,
                    thresholds: parseThresholds(f.tags),
                })),
            }));

            setCatalog({ providers });
            setValue("providerId", providers[0]?.id ?? "");
            setValue("fulfillmentId", providers[0]?.fulfillments[0]?.id ?? "");
            toast.success(`Loaded ${providers.length} provider(s) from catalog`);
            setIsPayloadEditorActive(false);
        } catch (err) {
            toast.error("Invalid on_search payload");
            console.error(err);
        }
    };

    // ── Submit ──
    const onSubmit = async (data: ICartFormValues) => {
        if (!catalog) {
            toast.error("Paste an on_search payload first");
            return;
        }

        const validCartItems = data.cartItems.filter((r) => r.itemId && r.amount);
        if (validCartItems.length === 0) {
            toast.error("Add at least one cart item");
            return;
        }

        const newExtraErrors: Record<string, string> = {};
        extraFields.forEach((f) => {
            if (f.required !== false && !extraData[f.name]?.trim())
                newExtraErrors[f.name] = "Required";
        });
        if (Object.keys(newExtraErrors).length) {
            setExtraErrors(newExtraErrors);
            return;
        }

        const agentCreds = data.agentCreds.filter((c) => c.id || c.type);

        // Collect all used fulfillments
        const usedFulfillmentIds = new Set<string>();
        if (data.fulfillmentId) {
            usedFulfillmentIds.add(data.fulfillmentId);
        }
        validCartItems.forEach((row) => {
            if (row.fulfillmentId) {
                usedFulfillmentIds.add(row.fulfillmentId);
            }
        });

        const fulfillmentsPayload = Array.from(usedFulfillmentIds).map((fulId) => {
            const fulObj = availableFulfillments.find((f) => f.id === fulId);
            const isFulSip = fulObj?.type === "SIP";
            const fulThresholds = fulObj?.thresholds ?? {};

            const fObj: Record<string, unknown> = {
                id: fulId,
                type: fulObj?.type ?? "SIP",
                customer: {
                    person: {
                        id: data.customerPersonId,
                        ...(data.folioId ? { creds: [{ id: data.folioId, type: "FOLIO" }] } : {}),
                    },
                },
            };

            if (isFulSip && data.startDate && data.installments) {
                const frequency = buildFrequency(
                    fulThresholds.frequency ?? "P1M",
                    data.startDate,
                    data.installments,
                    data.sipDay
                );
                fObj.stops = [{ time: { schedule: { frequency } } }];
            }

            if (data.agentPersonId || agentCreds.length) {
                fObj.agent = {
                    ...(data.agentPersonId ? { person: { id: data.agentPersonId } } : {}),
                    ...(agentCreds.length ? { organization: { creds: agentCreds } } : {}),
                };
            }

            return fObj;
        });

        const selectPayload = {
            message: {
                order: {
                    provider: { id: data.providerId },
                    items: validCartItems.map((row) => {
                        const targetFulfillmentId = row.fulfillmentId || data.fulfillmentId;
                        return {
                            id: row.itemId,
                            quantity: {
                                selected: { measure: { value: row.amount, unit: "INR" } },
                            },
                            fulfillment_ids: targetFulfillmentId ? [targetFulfillmentId] : [],
                        };
                    }),
                    fulfillments: fulfillmentsPayload,
                    tags: [
                        {
                            display: false,
                            descriptor: { name: "BAP Terms of Engagement", code: "BAP_TERMS" },
                            list: [
                                {
                                    descriptor: {
                                        name: "Static Terms (Transaction Level)",
                                        code: "STATIC_TERMS",
                                    },
                                    value: data.staticTermsUrl,
                                },
                                {
                                    descriptor: {
                                        name: "Offline Contract",
                                        code: "OFFLINE_CONTRACT",
                                    },
                                    value: "true",
                                },
                            ],
                        },
                    ],
                },
            },
        };

        const extraFieldsData: Record<string, string> = {};
        extraFields.forEach((f) => {
            extraFieldsData[f.name] = extraData[f.name] ?? "";
        });

        await submitEvent({
            jsonPath: {},
            formData: { data: JSON.stringify(selectPayload), ...extraFieldsData },
        });
    };

    // ── UI helpers ──
    const sectionClassName =
        "space-y-3 rounded-lg border border-border-default bg-surface-muted/20 p-4";
    const badge = "inline-block rounded-full px-2 py-0.5 text-xs font-semibold";

    const providerOptions =
        catalog?.providers.map((p) => ({ value: p.id, label: `${p.name} (${p.id})` })) ?? [];

    const planItemOptions = planItems.map((i) => ({
        value: i.id,
        label: `${i.name} (${i.id})`,
    }));

    const fulfillmentOptions = availableFulfillments.map((f) => ({
        value: f.id,
        label: `${f.id} — ${f.type}${
            f.thresholds.frequency
                ? ` (${f.thresholds.frequency}${
                      f.thresholds.frequencyDayType ? ` · ${f.thresholds.frequencyDayType}` : ""
                  })`
                : ""
        }`,
    }));

    const sipDayOptions = (
        thresholds.frequencyDates ??
        "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28"
    )
        .split(",")
        .map((d) => ({ value: d.trim(), label: d.trim() }));

    // ── Render ──
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
                footer={catalog ? <Button type="submit">Submit Cart SIP Select</Button> : null}
            >
                {/* Header */}
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-text-primary">
                        Mutual Fund Cart SIP Select (FIS14)
                    </p>
                    <p
                        className={cn(
                            "text-xs",
                            catalog ? "text-text-secondary" : "text-brand-normal"
                        )}
                    >
                        {catalog
                            ? `${catalog.providers.length} provider(s) loaded — add multiple items for cart flows`
                            : "Paste on_search payload to begin"}
                    </p>
                </div>

                <PastePayloadButton
                    onClick={() => setIsPayloadEditorActive(true)}
                    label={catalog ? "Edit Payload" : "Paste Payload"}
                />

                {catalog && (
                    <div className="space-y-4">
                        {/* Provider */}
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
                                            setValue("fulfillmentId", "");
                                        }}
                                        options={providerOptions}
                                        placeholder="Select provider"
                                        error={errors.providerId?.message}
                                    />
                                )}
                            />
                        </div>

                        {/* Cart Items */}
                        <div className={sectionClassName}>
                            <div className="flex items-center justify-between">
                                <FieldLabel className="font-semibold uppercase tracking-wide">
                                    Cart Items
                                </FieldLabel>
                                <span className="text-xs text-text-secondary">
                                    {cartItemFields.length} item
                                    {cartItemFields.length !== 1 ? "s" : ""}
                                </span>
                            </div>

                            <p className="text-xs text-text-secondary">
                                Add two or more scheme plans to test Cart flows. Each item shares
                                the SIP fulfillment below.
                            </p>

                            <div className="space-y-3">
                                {cartItemFields.map((field, index) => (
                                    <div
                                        key={field.id}
                                        className="rounded-md border border-border-default bg-surface-muted/30 p-3 space-y-2"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-xs font-semibold text-text-primary">
                                                Item {index + 1}
                                            </p>
                                            {cartItemFields.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-6 text-destructive hover:text-destructive"
                                                    onClick={() => removeCartItem(index)}
                                                >
                                                    <TrashIcon className="size-3.5" />
                                                </Button>
                                            )}
                                        </div>

                                        <Controller
                                            name={`cartItems.${index}.itemId`}
                                            control={control}
                                            rules={{ required: "Required" }}
                                            render={({ field: f }) => (
                                                <ComboBoxControl
                                                    label="Scheme Plan Item"
                                                    required
                                                    value={f.value}
                                                    onValueChange={f.onChange}
                                                    options={planItemOptions}
                                                    placeholder={
                                                        selectedProvider
                                                            ? "Select scheme plan"
                                                            : "Select a provider first"
                                                    }
                                                    disabled={!selectedProvider}
                                                    error={
                                                        (
                                                            errors.cartItems?.[index] as {
                                                                itemId?: { message?: string };
                                                            }
                                                        )?.itemId?.message
                                                    }
                                                />
                                            )}
                                        />

                                        <TextField
                                            control={control}
                                            name={`cartItems.${index}.amount`}
                                            label="SIP Amount (INR)"
                                            type="number"
                                            required
                                            placeholder={`e.g. ${thresholds.amountMin ?? "5000"}`}
                                            rules={{
                                                required: "Required",
                                                min: thresholds.amountMin
                                                    ? {
                                                          value: Number(thresholds.amountMin),
                                                          message: `Min ₹${thresholds.amountMin}`,
                                                      }
                                                    : undefined,
                                                max: thresholds.amountMax
                                                    ? {
                                                          value: Number(thresholds.amountMax),
                                                          message: `Max ₹${thresholds.amountMax}`,
                                                      }
                                                    : undefined,
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1 w-full"
                                onClick={() => appendCartItem({ itemId: "", amount: "" })}
                                disabled={!selectedProvider}
                            >
                                <PlusIcon className="size-3" />
                                Add Cart Item
                            </Button>
                        </div>

                        {/* Fulfillment */}
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
                                        label="Primary Fulfillment"
                                        required
                                        value={field.value}
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            setValue("installments", "");
                                            setValue("sipDay", "");
                                        }}
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
                                <div className="space-y-1 rounded-md border border-border-default bg-surface-muted/40 p-3 text-xs text-text-secondary">
                                    <p className="mb-1 font-semibold text-text-primary">
                                        Fulfillment Details ({selectedFulfillment.type})
                                    </p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                        {frequencyLabel && (
                                            <p>
                                                Frequency:{" "}
                                                <span
                                                    className={cn(
                                                        badge,
                                                        "bg-surface-muted text-text-primary"
                                                    )}
                                                >
                                                    {frequencyLabel}
                                                </span>
                                            </p>
                                        )}
                                        {thresholds.amountMin && (
                                            <p>Amount Min: ₹{thresholds.amountMin}</p>
                                        )}
                                        {thresholds.amountMax && (
                                            <p>Amount Max: ₹{thresholds.amountMax}</p>
                                        )}
                                        {thresholds.amountMultiples && (
                                            <p>Multiples of: ₹{thresholds.amountMultiples}</p>
                                        )}
                                        {thresholds.installmentsMin && (
                                            <p>Installments Min: {thresholds.installmentsMin}</p>
                                        )}
                                        {thresholds.installmentsMax && (
                                            <p>Installments Max: {thresholds.installmentsMax}</p>
                                        )}
                                        {thresholds.cumulativeAmountMin && (
                                            <p>Cumulative Min: ₹{thresholds.cumulativeAmountMin}</p>
                                        )}
                                        {thresholds.frequencyDates && (
                                            <p className="col-span-2">
                                                Valid Dates: {thresholds.frequencyDates}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SIP Schedule (Only for SIP fulfillments) */}
                        {isSip && selectedFulfillment && (
                            <div className={sectionClassName}>
                                <FieldLabel className="font-semibold uppercase tracking-wide">
                                    SIP Schedule
                                </FieldLabel>
                                <TextField
                                    control={control}
                                    name="installments"
                                    label="Number of Installments"
                                    type="number"
                                    required
                                    placeholder={`${thresholds.installmentsMin ?? "6"}–${thresholds.installmentsMax ?? "12"}`}
                                    rules={{
                                        required: "Required",
                                        min: thresholds.installmentsMin
                                            ? {
                                                  value: Number(thresholds.installmentsMin),
                                                  message: `Min ${thresholds.installmentsMin}`,
                                              }
                                            : undefined,
                                        max: thresholds.installmentsMax
                                            ? {
                                                  value: Number(thresholds.installmentsMax),
                                                  message: `Max ${thresholds.installmentsMax}`,
                                              }
                                            : undefined,
                                    }}
                                />
                                <TextField
                                    control={control}
                                    name="startDate"
                                    label="SIP Start Date"
                                    type="date"
                                    required
                                    rules={{ required: "Required" }}
                                />
                                {thresholds.frequency === "P1M" && (
                                    <Controller
                                        name="sipDay"
                                        control={control}
                                        rules={{ required: "Required" }}
                                        render={({ field }) => (
                                            <ComboBoxControl
                                                label="SIP Day of Month"
                                                required
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                options={sipDayOptions}
                                                placeholder="Select day"
                                                error={errors.sipDay?.message}
                                            />
                                        )}
                                    />
                                )}
                                {thresholds.frequency === "P1M" && (
                                    <p className="text-xs text-text-secondary">
                                        Valid dates from BPP thresholds
                                    </p>
                                )}
                                {frequencyPreview && (
                                    <div className="rounded-md border border-border-default bg-surface-muted/40 p-2">
                                        <p className="mb-0.5 text-xs font-semibold text-text-primary">
                                            Schedule Preview
                                        </p>
                                        <code className="font-mono text-xs text-text-secondary">
                                            {frequencyPreview}
                                        </code>
                                        <p className="mt-1 text-xs text-text-secondary">
                                            Format: R{"{installments}"}/{"{start_date}"}/
                                            {"{frequency}"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Customer */}
                        <div className={sectionClassName}>
                            <FieldLabel className="font-semibold uppercase tracking-wide">
                                Customer
                            </FieldLabel>
                            <TextField
                                control={control}
                                name="customerPersonId"
                                label="Customer PAN ID"
                                required
                                placeholder="e.g. ARRPP7771N"
                                rules={{
                                    required: "Required",
                                    pattern: {
                                        value: /^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/,
                                        message:
                                            "Must be a valid 10-character PAN (e.g. ABCDE1234F)",
                                    },
                                }}
                            />
                            <TextField
                                control={control}
                                name="folioId"
                                label="Folio Number (optional)"
                                placeholder="e.g. 78953432/32"
                            />
                            <p className="text-xs text-text-secondary">
                                Leave empty for new folio — sent as customer.person.creds[0] type
                                FOLIO
                            </p>
                        </div>

                        {/* Agent */}
                        <div className={sectionClassName}>
                            <div className="flex items-center justify-between">
                                <FieldLabel className="font-semibold uppercase tracking-wide">
                                    Agent
                                </FieldLabel>
                            </div>
                            <TextField
                                control={control}
                                name="agentPersonId"
                                label="Agent EUIN"
                                required
                                placeholder="e.g. E52432"
                                rules={{
                                    required: "Required",
                                    pattern: {
                                        value: /^[A-Za-z][0-9]{5,7}$/,
                                        message: "Must be a valid EUIN number (e.g. E52432)",
                                    },
                                }}
                            />
                            <div className="flex items-center justify-between pt-1">
                                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                    Agent Organisation Creds
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    onClick={() => appendAgentCred({ id: "", type: "" })}
                                >
                                    <PlusIcon className="size-3" />
                                    Add Cred
                                </Button>
                            </div>
                            {agentCredFields.map((field, index) => (
                                <div key={field.id} className="flex items-end gap-2">
                                    <div className="flex-1">
                                        <TextField
                                            control={control}
                                            name={`agentCreds.${index}.id`}
                                            label="ID"
                                            required
                                            placeholder="e.g. ARN-124567"
                                            rules={{ required: "Required" }}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <TextField
                                            control={control}
                                            name={`agentCreds.${index}.type`}
                                            label="Type"
                                            required
                                            placeholder="ARN or SUB_BROKER_ARN"
                                            rules={{ required: "Required" }}
                                        />
                                    </div>
                                    {agentCredFields.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="mb-1 text-destructive hover:text-destructive"
                                            onClick={() => removeAgentCred(index)}
                                        >
                                            <TrashIcon className="size-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* BAP Terms */}
                        <div className={sectionClassName}>
                            <FieldLabel className="font-semibold uppercase tracking-wide">
                                BAP Terms
                            </FieldLabel>
                            <TextField
                                control={control}
                                name="staticTermsUrl"
                                label="Static Terms URL"
                            />
                            <p className="text-xs text-text-secondary">
                                Included in order.tags as BAP_TERMS — OFFLINE_CONTRACT is always
                                "true"
                            </p>
                        </div>

                        {/* Extra fields */}
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
                                        <Input
                                            type="text"
                                            value={extraData[field.name] ?? ""}
                                            onChange={(e) => {
                                                setExtraData((prev) => ({
                                                    ...prev,
                                                    [field.name]: e.target.value,
                                                }));
                                                if (extraErrors[field.name])
                                                    setExtraErrors((prev) => {
                                                        const next = { ...prev };
                                                        delete next[field.name];
                                                        return next;
                                                    });
                                            }}
                                            aria-invalid={!!extraErrors[field.name]}
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
                    </div>
                )}
            </FormDialogShell>
        </>
    );
}
