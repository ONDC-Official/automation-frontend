import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { FaRegPaste, FaPlus, FaTrash } from "react-icons/fa6";
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

/* ─────────────── redeem mode ─────────────── */
type RedeemMode = "AMOUNT" | "MF_UNITS" | "REDEEM_ALL";

const REDEMPTION_TYPES = new Set(["REDEMPTION", "INSTANT_REDEMPTION"]);

/* ─────────────── form types ─────────────── */
interface AgentCred {
    id: string;
    type: string;
}
interface FormValues {
    providerId: string;
    itemId: string;
    fulfillmentId: string;
    redeemMode: RedeemMode;
    itemValue: string; // amount or units (ignored when mode=ALL)
    customerPersonId: string; // PAN  → customer.person.id
    folioId: string; // FOLIO cred id → customer.person.creds[0].id
    agentPersonId: string; // EUIN → agent.person.id
    agentCreds: AgentCred[]; // ARN / SUB_BROKER_ARN → agent.organization.creds
}

export default function SelectMutualFundRedemptionFIS14({
    submitEvent,
    formConfig = [],
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    formConfig?: FormFieldConfigType[];
}) {
    const extraFields = formConfig.filter((f) => f.type !== "fis14_mf_redemption_select");
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

    const selectedProvider = catalog?.providers.find((p) => p.id === watchedProviderId);
    const selectedItem = selectedProvider?.items.find((i) => i.id === watchedItemId);

    const availableFulfillments =
        selectedItem && selectedItem.fulfillmentIds.length > 0
            ? (selectedProvider?.fulfillments ?? []).filter((f) =>
                  selectedItem.fulfillmentIds.includes(f.id)
              )
            : (selectedProvider?.fulfillments ?? []);

    const selectedFulfillment = availableFulfillments.find((f) => f.id === watchedFulfillmentId);
    const isRedemptionType = REDEMPTION_TYPES.has(selectedFulfillment?.type ?? "");

    /* ── paste handler ── */
    const handlePaste = (payload: unknown) => {
        try {
            const raw = payload as OnSearchPayload;
            const rawProviders = raw?.message?.catalog?.providers;
            if (!rawProviders || rawProviders.length === 0) throw new Error("No providers found");

            const providers: ParsedProvider[] = rawProviders.map((p) => ({
                id: p.id,
                name: p.descriptor?.name ?? p.id,
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

        // Validate extra fields
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

        /* ── Build measure based on redeem mode ── */
        let measure: { unit: string; value: string };
        if (data.redeemMode === "REDEEM_ALL") {
            measure = { unit: "MF_UNITS", value: "-1" };
        } else if (data.redeemMode === "MF_UNITS") {
            measure = { unit: "MF_UNITS", value: data.itemValue };
        } else {
            measure = { unit: "INR", value: data.itemValue };
        }

        /* ── Build fulfillment object ── */
        const agentCreds = data.agentCreds.filter((c) => c.id || c.type);

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
                        Mutual Fund Redemption Select (FIS14)
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
                    className="space-y-4 max-h-[600px] overflow-y-auto pr-1"
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
                                                {f.id} — {f.type}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            />
                            {errors.fulfillmentId && (
                                <p className={errCls}>{errors.fulfillmentId.message}</p>
                            )}
                        </div>

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

                    {/* ── Redemption Mode (only for REDEMPTION / INSTANT_REDEMPTION) ── */}
                    {isRedemptionType && (
                        <div className={section}>
                            <p className={sectionTitle}>Redemption Mode</p>
                            <div className="flex gap-4 flex-wrap">
                                {(["AMOUNT", "MF_UNITS", "REDEEM_ALL"] as RedeemMode[]).map(
                                    (mode) => (
                                        <label
                                            key={mode}
                                            className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700"
                                        >
                                            <input
                                                type="radio"
                                                value={mode}
                                                {...register("redeemMode")}
                                                className="accent-blue-600"
                                            />
                                            {mode === "AMOUNT" && "Redeem by Amount"}
                                            {mode === "MF_UNITS" && "Redeem by Units"}
                                            {mode === "REDEEM_ALL" && "Redeem All"}
                                        </label>
                                    )
                                )}
                            </div>

                            {/* Mode hint */}
                            <p className="text-xs text-gray-400">
                                {watchedRedeemMode === "AMOUNT" &&
                                    'Will send: measure = { unit: "INR", value: <amount> }'}
                                {watchedRedeemMode === "MF_UNITS" &&
                                    'Will send: measure = { unit: "MF_UNITS", value: <units> }'}
                                {watchedRedeemMode === "REDEEM_ALL" &&
                                    'Will send: measure = { unit: "MF_UNITS", value: "-1" } — full redemption'}
                            </p>

                            {/* Value input — hidden for Redeem All */}
                            {watchedRedeemMode !== "REDEEM_ALL" && (
                                <div className="flex flex-col">
                                    <label className={lbl}>
                                        {watchedRedeemMode === "AMOUNT"
                                            ? "Amount (INR) *"
                                            : "Number of Units (MF_UNITS) *"}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={
                                            watchedRedeemMode === "AMOUNT" ? "e.g. 3000" : "e.g. 50"
                                        }
                                        {...register("itemValue", { required: "Required" })}
                                        className={inp}
                                    />
                                    {errors.itemValue && (
                                        <p className={errCls}>{errors.itemValue.message}</p>
                                    )}
                                </div>
                            )}

                            {/* Redeem All info box */}
                            {watchedRedeemMode === "REDEEM_ALL" && (
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-xs text-blue-700">
                                    ⚡ Full redemption — all units will be redeemed. Value{" "}
                                    <strong>-1</strong> will be sent automatically.
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Non-redemption: simple amount field ── */}
                    {!isRedemptionType && selectedFulfillment && (
                        <div className={section}>
                            <p className={sectionTitle}>Quantity</p>
                            <div className="flex flex-col">
                                <label className={lbl}>Amount (INR) *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 5000"
                                    {...register("itemValue", { required: "Required" })}
                                    className={inp}
                                />
                                {errors.itemValue && (
                                    <p className={errCls}>{errors.itemValue.message}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Customer Details ── */}
                    <div className={section}>
                        <p className={sectionTitle}>Customer</p>
                        <div className="flex flex-col">
                            <label className={lbl}>Customer PAN ID *</label>
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
                        <div className="flex flex-col">
                            <label className={lbl}>Folio Number</label>
                            <input
                                type="text"
                                placeholder="e.g. 78953432/32"
                                {...register("folioId")}
                                className={inp}
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                Sent as customer.person.creds[0] with type FOLIO
                            </p>
                        </div>
                    </div>

                    {/* ── Agent Details ── */}
                    <div className={section}>
                        <p className={sectionTitle}>Agent</p>
                        <div className="flex flex-col">
                            <label className={lbl}>Agent EUIN ID *</label>
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

                        {/* Agent org creds */}
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
                                        placeholder="e.g. ARN or SUB_BROKER_ARN"
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

                    {/* ── Extra fields from config ── */}
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
