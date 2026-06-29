import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { ComboBoxControl } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import TextField from "@/components/Shadcn/TextField";
import { Field, FieldLabel } from "@/components/Shadcn/TextField/field";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import { SubmitEventParams } from "@/types/flow-types";
import { FormFieldConfigType } from "../config-form/config-form";
import { cn } from "@/lib/utils";

interface RawTag {
    descriptor?: { name?: string; code?: string };
    list?: { descriptor?: { name?: string; code?: string }; value?: string }[];
}
interface RawItem {
    id: string;
    descriptor?: { name?: string; code?: string };
    parent_item_id?: string;
    fulfillment_ids?: string[];
    tags?: RawTag[];
}
interface RawFulfillment {
    id: string;
    type: string;
    tags?: RawTag[];
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

interface ThresholdInfo {
    frequency?: string;
    frequencyDates?: string;
    frequencyDayType?: string;
    amountMin?: string;
    amountMax?: string;
    amountMultiples?: string;
    installmentsMin?: string;
    installmentsMax?: string;
    cumulativeAmountMin?: string;
}
interface ParsedFulfillment {
    id: string;
    type: string;
    thresholds: ThresholdInfo;
}
interface ParsedItem {
    id: string;
    name: string;
    fulfillmentIds: string[];
}
interface ParsedProvider {
    id: string;
    name: string;
    items: ParsedItem[];
    fulfillments: ParsedFulfillment[];
}
interface CatalogData {
    providers: ParsedProvider[];
}

interface AgentCred {
    id: string;
    type: string;
}
interface FormValues {
    providerId: string;
    itemId: string;
    fulfillmentId: string;
    amount: string;
    installments: string;
    startDate: string;
    sipDay: string;
    customerPersonId: string;
    folioId: string;
    agentPersonId: string;
    agentCreds: AgentCred[];
    staticTermsUrl: string;
}

function parseThresholds(tags?: RawTag[]): ThresholdInfo {
    const thresholdTag = tags?.find((t) => t.descriptor?.code === "THRESHOLDS");
    if (!thresholdTag) return {};
    const get = (code: string) =>
        thresholdTag.list?.find((e) => e.descriptor?.code === code)?.value;
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

export default function FIS14MutualFundSIPSelectForm({
    submitEvent,
    formConfig = [],
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    formConfig?: FormFieldConfigType[];
}) {
    const extraFields = formConfig.filter((f) => f.type !== "fis14_mf_sip_select");
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [catalog, setCatalog] = useState<CatalogData | null>(null);
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
    } = useForm<FormValues>({
        defaultValues: {
            providerId: "",
            itemId: "",
            fulfillmentId: "",
            amount: "",
            installments: "",
            startDate: "",
            sipDay: "",
            customerPersonId: "",
            folioId: "",
            agentPersonId: "",
            agentCreds: [{ id: "", type: "" }],
            staticTermsUrl: "https://buyerapp.com/legal/ondc:fis14/static_terms?v=0.1",
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: "agentCreds" });

    const watchedProviderId = watch("providerId");
    const watchedItemId = watch("itemId");
    const watchedFulfillmentId = watch("fulfillmentId");
    const watchedInstallments = watch("installments");
    const watchedStartDate = watch("startDate");
    const watchedSipDay = watch("sipDay");
    const watchedAmount = watch("amount");

    const selectedProvider = catalog?.providers.find((p) => p.id === watchedProviderId);
    const planItems = selectedProvider?.items.filter((i) => i.fulfillmentIds.length > 0) ?? [];
    const selectedItem = planItems.find((i) => i.id === watchedItemId);

    const sipFulfillments = (selectedProvider?.fulfillments ?? []).filter(
        (f) =>
            f.type === "SIP" && (selectedItem ? selectedItem.fulfillmentIds.includes(f.id) : true)
    );
    const selectedFulfillment = sipFulfillments.find((f) => f.id === watchedFulfillmentId);
    const thresholds = selectedFulfillment?.thresholds ?? {};

    const frequencyLabel =
        thresholds.frequency === "P1M"
            ? "Monthly"
            : thresholds.frequency === "P1D"
              ? `Daily (${thresholds.frequencyDayType ?? ""})`
              : (thresholds.frequency ?? "");

    const frequencyPreview =
        selectedFulfillment && watchedInstallments && watchedStartDate
            ? buildFrequency(
                  thresholds.frequency ?? "P1M",
                  watchedStartDate,
                  watchedInstallments,
                  watchedSipDay
              )
            : null;

    const handlePaste = (payload: unknown) => {
        try {
            const raw = payload as OnSearchPayload;
            const rawProviders = raw?.message?.catalog?.providers;
            if (!rawProviders?.length) throw new Error("No providers");

            const providers: ParsedProvider[] = rawProviders.map((p) => ({
                id: p.id,
                name: p.descriptor?.name ?? p.id,
                items: (p.items ?? [])
                    .filter((i) => !!i.parent_item_id)
                    .map((i) => ({
                        id: i.id,
                        name: i.descriptor?.name ?? i.id,
                        fulfillmentIds: i.fulfillment_ids ?? [],
                    })),
                fulfillments: (p.fulfillments ?? [])
                    .filter((f) => f.type === "SIP")
                    .map((f) => ({ id: f.id, type: f.type, thresholds: parseThresholds(f.tags) })),
            }));

            setCatalog({ providers });
            setValue("providerId", providers[0]?.id ?? "");
            setValue("itemId", "");
            setValue("fulfillmentId", "");
            toast.success(`Loaded ${providers.length} provider(s) — SIP fulfillments only`);
            setIsPayloadEditorActive(false);
        } catch (err) {
            toast.error("Invalid on_search payload");
            console.error(err);
        }
    };

    const onSubmit = async (data: FormValues) => {
        if (!catalog) {
            toast.error("Paste an on_search payload first");
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

        const frequency = buildFrequency(
            thresholds.frequency ?? "P1M",
            data.startDate,
            data.installments,
            data.sipDay
        );
        const agentCreds = data.agentCreds.filter((c) => c.id || c.type);

        const fulfillmentObj: Record<string, unknown> = {
            id: data.fulfillmentId,
            type: "SIP",
            customer: {
                person: {
                    id: data.customerPersonId,
                    ...(data.folioId ? { creds: [{ id: data.folioId, type: "FOLIO" }] } : {}),
                },
            },
            stops: [{ time: { schedule: { frequency } } }],
        };

        if (data.agentPersonId || agentCreds.length) {
            fulfillmentObj.agent = {
                ...(data.agentPersonId ? { person: { id: data.agentPersonId } } : {}),
                ...(agentCreds.length ? { organization: { creds: agentCreds } } : {}),
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
                                selected: { measure: { value: data.amount, unit: "INR" } },
                            },
                        },
                    ],
                    fulfillments: [fulfillmentObj],
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

    const sectionClassName =
        "space-y-3 rounded-lg border border-border-default bg-surface-muted/20 p-4";
    const badge = "inline-block rounded-full px-2 py-0.5 text-xs font-semibold";

    const providerOptions =
        catalog?.providers.map((provider) => ({
            value: provider.id,
            label: `${provider.name} (${provider.id})`,
        })) ?? [];

    const planItemOptions = planItems.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.id})`,
    }));

    const sipFulfillmentOptions = sipFulfillments.map((fulfillment) => ({
        value: fulfillment.id,
        label: `${fulfillment.id} — ${fulfillment.type} (${fulfillment.thresholds.frequency ?? "?"}${fulfillment.thresholds.frequencyDayType ? ` · ${fulfillment.thresholds.frequencyDayType}` : ""})`,
    }));

    const sipDayOptions = (
        thresholds.frequencyDates ??
        "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28"
    )
        .split(",")
        .map((day) => ({ value: day.trim(), label: day.trim() }));

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
                footer={catalog ? <Button type="submit">Submit SIP Select</Button> : null}
            >
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-text-primary">
                        Mutual Fund SIP Select (FIS14)
                    </p>
                    <p
                        className={cn(
                            "text-xs",
                            catalog ? "text-text-secondary" : "text-brand-normal"
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
                    <div className="space-y-4">
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
                                Scheme Plan
                            </FieldLabel>
                            <Controller
                                name="itemId"
                                control={control}
                                rules={{ required: "Required" }}
                                render={({ field }) => (
                                    <ComboBoxControl
                                        label="Scheme Plan Item"
                                        required
                                        value={field.value}
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            setValue("fulfillmentId", "");
                                        }}
                                        options={planItemOptions}
                                        placeholder={
                                            selectedProvider
                                                ? "Select scheme plan"
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
                                SIP Fulfillment
                            </FieldLabel>
                            <Controller
                                name="fulfillmentId"
                                control={control}
                                rules={{ required: "Required" }}
                                render={({ field }) => (
                                    <ComboBoxControl
                                        label="SIP Fulfillment"
                                        required
                                        value={field.value}
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            setValue("installments", "");
                                            setValue("sipDay", "");
                                        }}
                                        options={sipFulfillmentOptions}
                                        placeholder={
                                            selectedItem
                                                ? "Select SIP fulfillment"
                                                : "Select scheme plan first"
                                        }
                                        disabled={!selectedItem}
                                        error={errors.fulfillmentId?.message}
                                    />
                                )}
                            />
                            {selectedFulfillment && (
                                <div className="space-y-1 rounded-md border border-border-default bg-surface-muted/40 p-3 text-xs text-text-secondary">
                                    <p className="mb-1 font-semibold text-text-primary">
                                        SIP Thresholds
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
                                                Valid SIP Dates: {thresholds.frequencyDates}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedFulfillment && (
                            <div className={sectionClassName}>
                                <FieldLabel className="font-semibold uppercase tracking-wide">
                                    SIP Schedule
                                </FieldLabel>
                                <TextField
                                    control={control}
                                    name="amount"
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
                                {watchedAmount && watchedInstallments && (
                                    <div className="rounded-md bg-surface-muted/40 p-2 text-xs text-text-secondary">
                                        <span className="font-semibold">Cumulative Total:</span> ₹
                                        {(
                                            Number(watchedAmount) * Number(watchedInstallments)
                                        ).toLocaleString()}
                                        {thresholds.cumulativeAmountMin &&
                                            Number(watchedAmount) * Number(watchedInstallments) <
                                                Number(thresholds.cumulativeAmountMin) && (
                                                <span className="ml-2 text-destructive">
                                                    Below min ₹{thresholds.cumulativeAmountMin}
                                                </span>
                                            )}
                                    </div>
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
                                required
                                placeholder="e.g. pan:arrpp7771n"
                                rules={{ required: "Required" }}
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
                                placeholder="e.g. euin:E52432"
                                rules={{ required: "Required" }}
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
                                    onClick={() => append({ id: "", type: "" })}
                                >
                                    <PlusIcon className="size-3" />
                                    Add Cred
                                </Button>
                            </div>
                            {fields.map((field, index) => (
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
                                    {fields.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="mb-1 text-destructive hover:text-destructive"
                                            onClick={() => remove(index)}
                                        >
                                            <TrashIcon className="size-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

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
                                            className={cn(
                                                "flex h-9 w-full rounded-md border border-border-default bg-surface px-3 py-1 text-sm text-text-primary shadow-sm transition-colors placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
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
                    </div>
                )}
            </FormDialogShell>
        </>
    );
}
