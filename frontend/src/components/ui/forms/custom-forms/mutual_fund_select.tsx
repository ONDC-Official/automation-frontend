import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { FaRegPaste } from "react-icons/fa6";
import { toast } from "react-toastify";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import { SubmitEventParams } from "@/types/flow-types";
import { FormFieldConfigType } from "../config-form/config-form";

/* ─────────────── on_search raw types ─────────────── */
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
    context?: {
        bap_id?: string;
        bap_uri?: string;
        bpp_id?: string;
        bpp_uri?: string;
        domain?: string;
        transaction_id?: string;
        ttl?: string;
        version?: string;
        location?: unknown;
    };
    message?: { catalog?: { providers?: RawProvider[] } };
}

/* ─────────────── parsed catalog ─────────────── */
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

/* ─────────────── form types ─────────────── */
interface Cred {
    id: string;
    type: string;
}
interface FormValues {
    providerId: string;
    fulfillmentId: string;
    creds: Cred[];
    personId: string;
    customerPersonId: string;
    itemId: string;
    itemValue: string;
}

export default function SelectMutualFundFIS14({
    submitEvent,
    formConfig = [],
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    formConfig?: FormFieldConfigType[];
}) {
    // Extra fields from config (not the main fis14 component field)
    const extraFields = formConfig.filter((f) => f.type !== "fis14_mutul_fund_select");
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [catalog, setCatalog] = useState<CatalogData | null>(null);

    // Track values of extra text fields separately to avoid polluting typed FormValues
    const [extraData, setExtraData] = useState<Record<string, string>>(
        Object.fromEntries(extraFields.map((f) => [f.name, String(f.default ?? "")]))
    );

    // Inline validation errors for extra fields
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
            fulfillmentId: "",
            creds: [{ id: "", type: "" }],
            personId: "",
            customerPersonId: "",
            itemId: "",
            itemValue: "",
        },
    });

    useFieldArray({ control, name: "creds" });

    const watchedProviderId = watch("providerId");
    const watchedItemId = watch("itemId");
    const watchedFulfillmentId = watch("fulfillmentId");

    // Derived selections
    const selectedProvider = catalog?.providers.find((p) => p.id === watchedProviderId);
    const selectedItem = selectedProvider?.items.find((i) => i.id === watchedItemId);

    // Fulfillments: if item has fulfillment_ids, filter to those; else show all
    const availableFulfillments =
        selectedItem && selectedItem.fulfillmentIds.length > 0
            ? (selectedProvider?.fulfillments ?? []).filter((f) =>
                  selectedItem.fulfillmentIds.includes(f.id)
              )
            : (selectedProvider?.fulfillments ?? []);

    const selectedFulfillment = availableFulfillments.find((f) => f.id === watchedFulfillmentId);

    /* ── paste handler ── */
    const handlePaste = (payload: unknown) => {
        try {
            const raw = payload as OnSearchPayload;
            const rawProviders = raw?.message?.catalog?.providers;
            if (!rawProviders || rawProviders.length === 0) throw new Error("No providers found");

            const providers: ParsedProvider[] = rawProviders.map((p) => ({
                id: p.id,
                name: p.descriptor?.name ?? p.id,
                // Show ALL items — no code filter
                items: (p.items ?? []).map((i) => ({
                    id: i.id,
                    name: i.descriptor?.name ?? i.id,
                    fulfillmentIds: i.fulfillment_ids ?? [],
                })),
                fulfillments: (p.fulfillments ?? []).map((f) => ({
                    id: f.id,
                    type: f.type,
                })),
            }));

            setCatalog({ providers, context: raw.context });

            // Pre-select first provider
            setValue("providerId", providers[0].id);
            setValue("fulfillmentId", "");
            setValue("itemId", "");

            toast.success(`Loaded ${providers.length} provider(s)`);
            setIsPayloadEditorActive(false);
        } catch (err) {
            toast.error("Invalid on_search payload");
            console.error(err);
        }
    };

    /* ── submit handler ── */
    const onSubmit = async (data: FormValues) => {
        if (!catalog) {
            toast.error("Please paste an on_search payload first");
            return;
        }

        // Validate required extra fields
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

        const agentCreds = data.creds.filter((c) => c.id || c.type);

        const fulfillmentObj: Record<string, unknown> = {
            id: data.fulfillmentId,
            type: selectedFulfillment?.type ?? "",
        };

        if (agentCreds.length > 0 || data.personId) {
            fulfillmentObj.agent = {
                ...(agentCreds.length > 0 ? { organization: { creds: agentCreds } } : {}),
                ...(data.personId ? { person: { id: data.personId } } : {}),
            };
        }

        if (data.customerPersonId) {
            fulfillmentObj.customer = { person: { id: data.customerPersonId } };
        }

        const selectPayload = {
            message: {
                order: {
                    fulfillments: [fulfillmentObj],
                    items: [
                        {
                            id: data.itemId,
                            quantity: {
                                selected: {
                                    measure: { unit: "INR", value: data.itemValue },
                                },
                            },
                        },
                    ],
                    provider: { id: data.providerId },
                },
            },
        };

        // Build formData map for extra fields (e.g. city_code)
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

    /* ── styles ── */
    const inp =
        "w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-400";
    const lbl = "block text-xs font-semibold text-gray-600 mb-1";
    const errCls = "text-red-500 text-xs mt-1";
    const section = "p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3";
    const sectionTitle = "text-xs font-bold text-gray-700 uppercase tracking-wide";

    return (
        <div className="p-4 space-y-4 bg-white rounded-lg shadow-sm border border-gray-100">
            {/* ── Header ── */}
            <div
                className={`flex justify-between items-center p-3 rounded-lg border transition-all ${
                    catalog ? "bg-gray-50 border-gray-200" : "bg-amber-50 border-amber-400 border-2"
                }`}
            >
                <div>
                    <p className="text-sm font-semibold text-gray-700">
                        Mutual Fund Select (FIS14)
                    </p>
                    <p
                        className={`text-xs ${catalog ? "text-gray-400" : "text-amber-600 font-medium"}`}
                    >
                        {catalog
                            ? `${catalog.providers.length} provider(s) loaded`
                            : "⚠ Paste on_search payload to begin"}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsPayloadEditorActive(true)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md font-medium transition-all ${
                        catalog
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-amber-500 text-white hover:bg-amber-600 ring-2 ring-amber-300 ring-offset-1 animate-pulse"
                    }`}
                >
                    <FaRegPaste size={14} />
                    {catalog ? "Edit Payload" : "Paste Payload"}
                </button>
            </div>

            {isPayloadEditorActive && (
                <PayloadEditor
                    onAdd={handlePaste}
                    onClose={() => setIsPayloadEditorActive(false)}
                />
            )}

            {/* ── Empty state ── */}
            {!catalog && !isPayloadEditorActive && (
                <button
                    type="button"
                    onClick={() => setIsPayloadEditorActive(true)}
                    className="w-full text-center py-10 border-2 border-dashed border-amber-400 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                    <div className="mx-auto w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center mb-3 text-amber-600">
                        <FaRegPaste size={18} />
                    </div>
                    <p className="text-sm text-amber-700 font-semibold">No payload loaded</p>
                    <p className="text-xs text-amber-500 mt-1">
                        Click here or use the button above to paste your on_search payload
                    </p>
                </button>
            )}

            {/* ── Form ── */}
            {catalog && (
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-4 max-h-[540px] overflow-y-auto pr-1"
                >
                    {/* ── Provider ── */}
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
                                            // Reset cascading fields
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

                    {/* ── Item ── */}
                    <div className={section}>
                        <p className={sectionTitle}>Item</p>

                        <div className="flex flex-col">
                            <label className={lbl}>Item ID *</label>
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
                                            // Reset fulfillment when item changes
                                            setValue("fulfillmentId", "");
                                        }}
                                    >
                                        <option value="">
                                            {selectedProvider
                                                ? "Select an item"
                                                : "Select a provider first"}
                                        </option>
                                        {(selectedProvider?.items ?? [])
                                            .filter((_, index) => index !== 0)
                                            .map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name} ({item.id})
                                                </option>
                                            ))}
                                    </select>
                                )}
                            />
                            {errors.itemId && <p className={errCls}>{errors.itemId.message}</p>}
                        </div>

                        <div className="flex flex-col">
                            <label className={lbl}>Item Value (INR) *</label>
                            <input
                                type="text"
                                placeholder="e.g. 3000"
                                {...register("itemValue", { required: "Required" })}
                                className={inp}
                            />
                            {errors.itemValue && (
                                <p className={errCls}>{errors.itemValue.message}</p>
                            )}
                        </div>
                    </div>

                    {/* ── Fulfillment ── */}
                    <div className={section}>
                        <p className={sectionTitle}>Fulfillment</p>

                        <div className="flex flex-col">
                            <label className={lbl}>Fulfillment ID *</label>
                            <Controller
                                name="fulfillmentId"
                                control={control}
                                rules={{ required: "Required" }}
                                render={({ field }) => (
                                    <select {...field} className={inp} disabled={!selectedProvider}>
                                        <option value="">
                                            {selectedProvider
                                                ? "Select fulfillment"
                                                : "Select a provider first"}
                                        </option>
                                        {availableFulfillments.map((f) => (
                                            <option key={f.id} value={f.id}>
                                                {f.id}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            />
                            {errors.fulfillmentId && (
                                <p className={errCls}>{errors.fulfillmentId.message}</p>
                            )}
                        </div>

                        {/* Auto-populated type */}
                        {selectedFulfillment && (
                            <div className="flex flex-col">
                                <label className={lbl}>Fulfillment Type</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={selectedFulfillment.type}
                                    className="w-full border border-gray-200 rounded-md p-2 text-sm bg-blue-50 text-blue-700 font-semibold cursor-not-allowed"
                                />
                            </div>
                        )}
                    </div>

                    {/* ── Fulfillment Creds (commented out) ── */}
                    {/* <div className={section}>
                        <div className="flex justify-between items-center">
                            <p className={sectionTitle}>Fulfillment Creds</p>
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
                                        {...register(`creds.${index}.id`, { required: "Required" })}
                                        className={inp}
                                    />
                                    {errors.creds?.[index]?.id && (
                                        <p className={errCls}>{errors.creds[index]?.id?.message}</p>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <label className={lbl}>Type *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. ARN"
                                        {...register(`creds.${index}.type`, {
                                            required: "Required",
                                        })}
                                        className={inp}
                                    />
                                    {errors.creds?.[index]?.type && (
                                        <p className={errCls}>
                                            {errors.creds[index]?.type?.message}
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
                    </div> */}

                    {/* ── Person Details (commented out) ── */}
                    {/* <div className={section}>
                        <p className={sectionTitle}>Person Details</p>

                        <div className="flex flex-col">
                            <label className={lbl}>Person ID (Agent) *</label>
                            <input
                                type="text"
                                placeholder="e.g. euin:E52432"
                                {...register("personId", { required: "Required" })}
                                className={inp}
                            />
                            {errors.personId && <p className={errCls}>{errors.personId.message}</p>}
                        </div>

                        <div className="flex flex-col">
                            <label className={lbl}>Customer Person ID *</label>
                            <input
                                type="text"
                                placeholder="e.g. pan:ARRPP7771N"
                                {...register("customerPersonId", { required: "Required" })}
                                className={inp}
                            />
                            {errors.customerPersonId && (
                                <p className={errCls}>{errors.customerPersonId.message}</p>
                            )}
                        </div>
                    </div> */}

                    {/* ── Extra fields from config (e.g. city_code) ── */}
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
                                            // Clear error when user starts typing
                                            if (extraErrors[field.name]) {
                                                setExtraErrors((prev) => {
                                                    const next = { ...prev };
                                                    delete next[field.name];
                                                    return next;
                                                });
                                            }
                                        }}
                                        className={`${inp} ${
                                            extraErrors[field.name]
                                                ? "border-red-500 focus:ring-red-500"
                                                : ""
                                        }`}
                                    />
                                    {extraErrors[field.name] && (
                                        <p className={errCls}>{extraErrors[field.name]}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Submit ── */}
                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-[0.98]"
                    >
                        Submit
                    </button>
                </form>
            )}
        </div>
    );
}
