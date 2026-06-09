import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { FaRegPaste, FaPlus, FaTrash } from "react-icons/fa6";
import { toast } from "react-toastify";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import { SubmitEventParams } from "@/types/flow-types";
import { FormFieldConfigType } from "../config-form/config-form";

/* ─────────────── raw on_search types ─────────────── */
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

/* ─────────────── parsed catalog ─────────────── */
interface ThresholdInfo {
    frequency?: string; // P1M, P1D
    frequencyDates?: string; // "1,2,...,28"
    frequencyDayType?: string; // BUSINESS | CALENDAR
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

/* ─────────────── form types ─────────────── */
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
    startDate: string; // yyyy-MM-dd
    sipDay: string; // day of month for P1M
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
    // R{installments}/{date}/{frequency}
    // For P1M: set day in startDate from sipDay
    let date = startDate;
    if (freq === "P1M" && sipDay) {
        const parts = startDate.split("-");
        if (parts.length === 3) {
            const day = sipDay.padStart(2, "0");
            date = `${parts[0]}-${parts[1]}-${day}`;
        }
    }
    return `R${installments}/${date}/${freq}`;
}

export default function SelectMutualFundSIPFIS14({
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
    // Only SCHEME_PLAN items (have parent_item_id)
    const planItems = selectedProvider?.items.filter((i) => i.fulfillmentIds.length > 0) ?? [];
    const selectedItem = planItems.find((i) => i.id === watchedItemId);

    // Only SIP fulfillments linked to selected item
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

    /* ── paste handler ── */
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
                    .map((f) => ({
                        id: f.id,
                        type: f.type,
                        thresholds: parseThresholds(f.tags),
                    })),
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

    /* ── submit ── */
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

    /* ── styles ── */
    const inp =
        "w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-400";
    const lbl = "block text-xs font-semibold text-gray-600 mb-1";
    const errCls = "text-red-500 text-xs mt-1";
    const section = "p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3";
    const sectionTitle = "text-xs font-bold text-gray-700 uppercase tracking-wide";
    const hint = "text-xs text-gray-400 mt-1";
    const badge = "inline-block text-xs px-2 py-0.5 rounded-full font-semibold";

    return (
        <div className="p-4 space-y-4 bg-white rounded-lg shadow-sm border border-gray-100">
            {/* Header */}
            <div
                className={`flex justify-between items-center p-3 rounded-lg border transition-all ${catalog ? "bg-gray-50 border-gray-200" : "bg-blue-50 border-blue-400 border-2"}`}
            >
                <div>
                    <p className="text-sm font-semibold text-gray-700">
                        Mutual Fund SIP Select (FIS14)
                    </p>
                    <p
                        className={`text-xs ${catalog ? "text-gray-400" : "text-blue-600 font-medium"}`}
                    >
                        {catalog
                            ? `${catalog.providers.length} provider(s) loaded`
                            : "⚠ Paste on_search payload to begin"}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsPayloadEditorActive(true)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md font-medium transition-all ${catalog ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-500 text-white hover:bg-blue-600 ring-2 ring-blue-300 ring-offset-1 animate-pulse"}`}
                >
                    <FaRegPaste size={14} /> {catalog ? "Edit Payload" : "Paste Payload"}
                </button>
            </div>

            {isPayloadEditorActive && (
                <PayloadEditor
                    onAdd={handlePaste}
                    onClose={() => setIsPayloadEditorActive(false)}
                />
            )}

            {!catalog && !isPayloadEditorActive && (
                <button
                    type="button"
                    onClick={() => setIsPayloadEditorActive(true)}
                    className="w-full text-center py-10 border-2 border-dashed border-blue-400 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                    <div className="mx-auto w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center mb-3 text-blue-600">
                        <FaRegPaste size={18} />
                    </div>
                    <p className="text-sm text-blue-700 font-semibold">No payload loaded</p>
                    <p className="text-xs text-blue-500 mt-1">
                        Paste your on_search payload to build the SIP select
                    </p>
                </button>
            )}

            {catalog && (
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-4 max-h-[700px] overflow-y-auto pr-1"
                >
                    {/* Provider */}
                    <div className={section}>
                        <p className={sectionTitle}>Provider</p>
                        <div className="flex flex-col">
                            <label className={lbl}>Provider ID *</label>
                            <Controller
                                name="providerId"
                                control={control}
                                rules={{ required: "Required" }}
                                render={({ field }) => (
                                    <select
                                        {...field}
                                        className={inp}
                                        onChange={(e) => {
                                            field.onChange(e);
                                            setValue("itemId", "");
                                            setValue("fulfillmentId", "");
                                        }}
                                    >
                                        <option value="">Select provider</option>
                                        {catalog.providers.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} ({p.id})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            />
                            {errors.providerId && (
                                <p className={errCls}>{errors.providerId.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Item (Scheme Plan) */}
                    <div className={section}>
                        <p className={sectionTitle}>Scheme Plan</p>
                        <div className="flex flex-col">
                            <label className={lbl}>Scheme Plan Item *</label>
                            <Controller
                                name="itemId"
                                control={control}
                                rules={{ required: "Required" }}
                                render={({ field }) => (
                                    <select
                                        {...field}
                                        className={inp}
                                        disabled={!selectedProvider}
                                        onChange={(e) => {
                                            field.onChange(e);
                                            setValue("fulfillmentId", "");
                                        }}
                                    >
                                        <option value="">
                                            {selectedProvider
                                                ? "Select scheme plan"
                                                : "Select a provider first"}
                                        </option>
                                        {planItems.map((i) => (
                                            <option key={i.id} value={i.id}>
                                                {i.name} ({i.id})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            />
                            {errors.itemId && <p className={errCls}>{errors.itemId.message}</p>}
                        </div>
                    </div>

                    {/* SIP Fulfillment */}
                    <div className={section}>
                        <p className={sectionTitle}>SIP Fulfillment</p>
                        <div className="flex flex-col">
                            <label className={lbl}>SIP Fulfillment *</label>
                            <Controller
                                name="fulfillmentId"
                                control={control}
                                rules={{ required: "Required" }}
                                render={({ field }) => (
                                    <select
                                        {...field}
                                        className={inp}
                                        disabled={!selectedItem}
                                        onChange={(e) => {
                                            field.onChange(e);
                                            setValue("installments", "");
                                            setValue("sipDay", "");
                                        }}
                                    >
                                        <option value="">
                                            {selectedItem
                                                ? "Select SIP fulfillment"
                                                : "Select scheme plan first"}
                                        </option>
                                        {sipFulfillments.map((f) => (
                                            <option key={f.id} value={f.id}>
                                                {f.id} — {f.type} ({f.thresholds.frequency ?? "?"}{" "}
                                                {f.thresholds.frequencyDayType
                                                    ? `· ${f.thresholds.frequencyDayType}`
                                                    : ""}
                                                )
                                            </option>
                                        ))}
                                    </select>
                                )}
                            />
                            {errors.fulfillmentId && (
                                <p className={errCls}>{errors.fulfillmentId.message}</p>
                            )}
                        </div>

                        {/* Threshold hints */}
                        {selectedFulfillment && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 space-y-1 text-xs text-blue-800">
                                <p className="font-semibold text-blue-700 mb-1">
                                    📋 SIP Thresholds
                                </p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    {frequencyLabel && (
                                        <p>
                                            Frequency:{" "}
                                            <span className={`${badge} bg-blue-100 text-blue-700`}>
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

                    {/* SIP Schedule */}
                    {selectedFulfillment && (
                        <div className={section}>
                            <p className={sectionTitle}>SIP Schedule</p>

                            <div className="flex flex-col">
                                <label className={lbl}>SIP Amount (INR) *</label>
                                <input
                                    type="number"
                                    placeholder={`e.g. ${thresholds.amountMin ?? "5000"}`}
                                    {...register("amount", {
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
                                    })}
                                    className={inp}
                                />
                                {errors.amount && <p className={errCls}>{errors.amount.message}</p>}
                            </div>

                            <div className="flex flex-col">
                                <label className={lbl}>Number of Installments *</label>
                                <input
                                    type="number"
                                    placeholder={`${thresholds.installmentsMin ?? "6"}–${thresholds.installmentsMax ?? "12"}`}
                                    {...register("installments", {
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
                                    })}
                                    className={inp}
                                />
                                {errors.installments && (
                                    <p className={errCls}>{errors.installments.message}</p>
                                )}
                            </div>

                            <div className="flex flex-col">
                                <label className={lbl}>SIP Start Date *</label>
                                <input
                                    type="date"
                                    {...register("startDate", { required: "Required" })}
                                    className={inp}
                                />
                                {errors.startDate && (
                                    <p className={errCls}>{errors.startDate.message}</p>
                                )}
                            </div>

                            {/* SIP Day — only for P1M frequency */}
                            {thresholds.frequency === "P1M" && (
                                <div className="flex flex-col">
                                    <label className={lbl}>SIP Day of Month *</label>
                                    <Controller
                                        name="sipDay"
                                        control={control}
                                        rules={{ required: "Required" }}
                                        render={({ field }) => (
                                            <select {...field} className={inp}>
                                                <option value="">Select day</option>
                                                {(
                                                    thresholds.frequencyDates ??
                                                    "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28"
                                                )
                                                    .split(",")
                                                    .map((d) => (
                                                        <option key={d.trim()} value={d.trim()}>
                                                            {d.trim()}
                                                        </option>
                                                    ))}
                                            </select>
                                        )}
                                    />
                                    {errors.sipDay && (
                                        <p className={errCls}>{errors.sipDay.message}</p>
                                    )}
                                    <p className={hint}>Valid dates from BPP thresholds</p>
                                </div>
                            )}

                            {/* Frequency preview */}
                            {frequencyPreview && (
                                <div className="bg-green-50 border border-green-200 rounded-md p-2">
                                    <p className="text-xs font-semibold text-green-700 mb-0.5">
                                        Schedule Preview
                                    </p>
                                    <code className="text-xs text-green-800 font-mono">
                                        {frequencyPreview}
                                    </code>
                                    <p className={hint}>
                                        Format: R{"{installments}"}/{"{start_date}"}/{"{frequency}"}
                                    </p>
                                </div>
                            )}

                            {/* Cumulative amount preview */}
                            {watchedAmount && watchedInstallments && (
                                <div className="bg-gray-100 rounded-md p-2 text-xs text-gray-600">
                                    <span className="font-semibold">Cumulative Total:</span> ₹
                                    {(
                                        Number(watchedAmount) * Number(watchedInstallments)
                                    ).toLocaleString()}
                                    {thresholds.cumulativeAmountMin &&
                                        Number(watchedAmount) * Number(watchedInstallments) <
                                            Number(thresholds.cumulativeAmountMin) && (
                                            <span className="text-red-500 ml-2">
                                                ⚠ Below min ₹{thresholds.cumulativeAmountMin}
                                            </span>
                                        )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Customer */}
                    <div className={section}>
                        <p className={sectionTitle}>Customer</p>
                        <div className="flex flex-col">
                            <label className={lbl}>Customer PAN ID *</label>
                            <input
                                type="text"
                                placeholder="e.g. pan:arrpp7771n"
                                {...register("customerPersonId", { required: "Required" })}
                                className={inp}
                            />
                            {errors.customerPersonId && (
                                <p className={errCls}>{errors.customerPersonId.message}</p>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <label className={lbl}>Folio Number (optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. 78953432/32"
                                {...register("folioId")}
                                className={inp}
                            />
                            <p className={hint}>
                                Leave empty for new folio — sent as customer.person.creds[0] type
                                FOLIO
                            </p>
                        </div>
                    </div>

                    {/* Agent */}
                    <div className={section}>
                        <p className={sectionTitle}>Agent</p>
                        <div className="flex flex-col">
                            <label className={lbl}>Agent EUIN *</label>
                            <input
                                type="text"
                                placeholder="e.g. euin:E52432"
                                {...register("agentPersonId", { required: "Required" })}
                                className={inp}
                            />
                            {errors.agentPersonId && (
                                <p className={errCls}>{errors.agentPersonId.message}</p>
                            )}
                        </div>

                        <div className="flex justify-between items-center pt-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Agent Organisation Creds
                            </p>
                            <button
                                type="button"
                                onClick={() => append({ id: "", type: "" })}
                                className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                <FaPlus size={10} /> Add Cred
                            </button>
                        </div>
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-2 items-end">
                                <div className="flex-1 flex flex-col">
                                    <label className={lbl}>ID *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. ARN-124567"
                                        {...register(`agentCreds.${index}.id`, {
                                            required: "Required",
                                        })}
                                        className={inp}
                                    />
                                    {errors.agentCreds?.[index]?.id && (
                                        <p className={errCls}>
                                            {errors.agentCreds[index]?.id?.message}
                                        </p>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <label className={lbl}>Type *</label>
                                    <input
                                        type="text"
                                        placeholder="ARN or SUB_BROKER_ARN"
                                        {...register(`agentCreds.${index}.type`, {
                                            required: "Required",
                                        })}
                                        className={inp}
                                    />
                                    {errors.agentCreds?.[index]?.type && (
                                        <p className={errCls}>
                                            {errors.agentCreds[index]?.type?.message}
                                        </p>
                                    )}
                                </div>
                                {fields.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="mb-[2px] p-2 text-red-400 hover:text-red-600"
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* BAP Terms */}
                    <div className={section}>
                        <p className={sectionTitle}>BAP Terms</p>
                        <div className="flex flex-col">
                            <label className={lbl}>Static Terms URL</label>
                            <input type="text" {...register("staticTermsUrl")} className={inp} />
                            <p className={hint}>
                                Included in order.tags as BAP_TERMS — OFFLINE_CONTRACT is always
                                "true"
                            </p>
                        </div>
                    </div>

                    {/* Extra fields */}
                    {extraFields.length > 0 && (
                        <div className={section}>
                            <p className={sectionTitle}>Additional Fields</p>
                            {extraFields.map((field) => (
                                <div key={field.name} className="flex flex-col">
                                    <label className={lbl}>
                                        {field.label}
                                        {field.required !== false ? " *" : ""}
                                    </label>
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
                                                    const n = { ...prev };
                                                    delete n[field.name];
                                                    return n;
                                                });
                                        }}
                                        className={`${inp} ${extraErrors[field.name] ? "border-red-500 focus:ring-red-500" : ""}`}
                                    />
                                    {extraErrors[field.name] && (
                                        <p className={errCls}>{extraErrors[field.name]}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-[0.98]"
                    >
                        Submit SIP Select
                    </button>
                </form>
            )}
        </div>
    );
}
