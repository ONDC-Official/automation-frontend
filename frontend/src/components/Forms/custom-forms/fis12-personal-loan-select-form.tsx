import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ClipboardDocumentIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { ComboBoxControl } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import TextField from "@/components/Shadcn/TextField";
import { FieldLabel } from "@/components/Shadcn/TextField/field";
import PayloadEditor from "@/components/PayloadEditor/PastePayloadModal";
import FormDialogShell from "@/components/Forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/Forms/paste-payload-button";
import { cn } from "@/lib/utils";
import type {
    IOnSearchPayload,
    IRawTag,
    IParsedProvider,
    IParsedFulfillment,
    IGeneralInfo,
    IFormValues,
    IFIS12PersonalLoanSelectFormProps,
} from "../types/fis12-personal-loan-select-form-types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseGeneralInfo(tags?: IRawTag[]): IGeneralInfo {
    const infoTag = tags?.find((t) => t.descriptor?.code === "GENERAL_INFO");
    if (!infoTag) return {};
    const get = (code: string) => infoTag.list?.find((e) => e.descriptor?.code === code)?.value;
    return {
        minInterestRate: get("MIN_INTEREST_RATE"),
        maxInterestRate: get("MAX_INTEREST_RATE"),
        minTenure: get("MIN_TENURE"),
        maxTenure: get("MAX_TENURE"),
        minLoanAmount: get("MIN_LOAN_AMOUNT"),
        maxLoanAmount: get("MAX_LOAN_AMOUNT"),
    };
}

const FULFILLMENT_TYPE_LABEL: Record<string, string> = {
    SEMI_ONLINE: "Semi-Online (Offline Journey)",
    ONLINE: "Online (Single Redirection)",
    DEDUPE: "De-Dupe / Pre-Qualifier",
};

const STOP_TYPE_ICON: Record<string, string> = {
    PERSONAL_INFORMATION: "👤",
    LOAN_OFFER: "💰",
    JOURNEY_OFFLINE: "📋",
    SINGLE_REDIRECTION: "🔗",
    KYC: "🪪",
    BANK_ACCOUNT_VERIFICATION: "🏦",
    REPAYMENT: "🔄",
    LOAN_AGREEMENT: "📝",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoanInfoBadge({ info }: { info: IGeneralInfo }) {
    const rows = [
        info.minInterestRate && info.maxInterestRate
            ? {
                  label: "Interest Rate",
                  value: `${info.minInterestRate} – ${info.maxInterestRate} p.a.`,
              }
            : null,
        info.minTenure && info.maxTenure
            ? { label: "Tenure", value: `${info.minTenure} – ${info.maxTenure}` }
            : null,
        info.minLoanAmount
            ? { label: "Min Loan", value: `₹${Number(info.minLoanAmount).toLocaleString("en-IN")}` }
            : null,
        info.maxLoanAmount
            ? { label: "Max Loan", value: `₹${Number(info.maxLoanAmount).toLocaleString("en-IN")}` }
            : null,
    ].filter(Boolean) as { label: string; value: string }[];

    if (!rows.length) return null;

    return (
        <div className="rounded-md border border-border-default bg-surface-muted/30 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Loan Details
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                {rows.map(({ label, value }) => (
                    <div key={label} className="flex flex-col">
                        <span className="text-[10px] text-text-secondary">{label}</span>
                        <span className="text-xs font-medium text-text-primary">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FulfillmentJourney({ fulfillment }: { fulfillment: IParsedFulfillment }) {
    if (!fulfillment.stops.length) return null;

    return (
        <div className="rounded-md border border-border-default bg-surface-muted/20 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {FULFILLMENT_TYPE_LABEL[fulfillment.type] ?? fulfillment.type} — Journey Steps
            </p>
            <ol className="relative ml-2 border-l border-border-default">
                {fulfillment.stops.map((stop, idx) => (
                    <li key={stop.id} className="mb-3 ml-4">
                        <span className="absolute -left-[9px] flex size-4 items-center justify-center rounded-full border border-border-default bg-surface text-[9px] font-bold text-text-secondary">
                            {idx + 1}
                        </span>
                        <div className="flex items-start gap-1.5">
                            <span className="text-sm leading-none">
                                {STOP_TYPE_ICON[stop.type] ?? "•"}
                            </span>
                            <div>
                                <p className="text-xs font-medium text-text-primary">
                                    {stop.type.replace(/_/g, " ")}
                                </p>
                                {stop.name && stop.name !== "PENDING" && (
                                    <p className="text-[10px] text-text-secondary">{stop.name}</p>
                                )}
                                {stop.shortDesc && (
                                    <p className="text-[10px] italic text-text-secondary">
                                        {stop.shortDesc}
                                    </p>
                                )}
                            </div>
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export default function FIS12PersonalLoanSelectForm({
    submitEvent,
}: IFIS12PersonalLoanSelectFormProps) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [providers, setProviders] = useState<IParsedProvider[]>([]);

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<IFormValues>({
        defaultValues: { providerId: "", itemId: "", formSubmissionId: "" },
    });

    const watchedProviderId = watch("providerId");
    const watchedItemId = watch("itemId");

    const selectedProvider = providers.find((p) => p.id === watchedProviderId);

    // All items (Personal Loan + Pre-Qualifier) are available for selection
    const availableItems = selectedProvider?.items ?? [];

    const selectedItem = availableItems.find((i) => i.id === watchedItemId);

    // Find the fulfillment linked to the selected item
    const selectedFulfillment = selectedItem
        ? (selectedProvider?.fulfillments ?? []).find((f) =>
              selectedItem.fulfillmentIds.includes(f.id)
          )
        : undefined;

    const hasXInput = !!selectedItem?.xinput;

    // ─── Payload paste ──────────────────────────────────────────────────────

    const handlePaste = (payload: unknown) => {
        try {
            const raw = payload as IOnSearchPayload;
            const rawProviders = raw?.message?.catalog?.providers;
            if (!rawProviders?.length) throw new Error("No providers found");

            const parsed: IParsedProvider[] = rawProviders.map((p) => ({
                id: p.id,
                name: p.descriptor?.name ?? p.id,
                items: (p.items ?? []).map((item) => ({
                    id: item.id,
                    name: item.descriptor?.name ?? item.id,
                    code: item.descriptor?.code,
                    fulfillmentIds: item.fulfillment_ids ?? [],
                    generalInfo: parseGeneralInfo(item.tags),
                    xinput: item.xinput?.form
                        ? { formId: item.xinput.form.id, url: item.xinput.form.url }
                        : undefined,
                })),
                fulfillments: (p.fulfillments ?? []).map((f) => ({
                    id: f.id,
                    type: f.type,
                    stops: (f.stops ?? []).map((s) => ({
                        id: s.id,
                        type: s.type,
                        name: s.instructions?.name,
                        code: s.instructions?.code,
                        shortDesc: s.instructions?.short_desc,
                    })),
                })),
            }));

            setProviders(parsed);
            setValue("providerId", parsed[0]?.id ?? "");
            setValue("itemId", "");
            setValue("formSubmissionId", "");
            toast.success(`Loaded ${parsed.length} provider(s)`);
            setIsPayloadEditorActive(false);
        } catch (err) {
            toast.error("Invalid on_search payload — could not parse providers");
            console.error(err);
        }
    };

    // ─── Submit ─────────────────────────────────────────────────────────────

    const onSubmit = async (data: IFormValues) => {
        if (!providers.length) {
            toast.error("Paste an on_search payload first");
            return;
        }
        if (!data.providerId || !data.itemId) {
            toast.error("Please select a provider and an item");
            return;
        }

        // Build the xinput block only when the item has an xinput form
        const xinputBlock =
            hasXInput && selectedItem?.xinput
                ? {
                      xinput: {
                          form: { id: selectedItem.xinput.formId },
                          form_response: {
                              status: "SUCCESS",
                              submission_id:
                                  data.formSubmissionId ||
                                  `${selectedItem.xinput.formId}_SUBMISSION_ID`,
                          },
                      },
                  }
                : {};

        const selectPayload = {
            message: {
                order: {
                    provider: { id: data.providerId },
                    items: [
                        {
                            id: data.itemId,
                            ...xinputBlock,
                        },
                    ],
                },
            },
        };

        await submitEvent({
            jsonPath: {},
            formData: { data: JSON.stringify(selectPayload) },
        });
    };

    // ─── Derived options ─────────────────────────────────────────────────────

    const providerOptions = providers.map((p) => ({
        value: p.id,
        label: `${p.name} (${p.id})`,
    }));

    const itemOptions = availableItems.map((i) => ({
        value: i.id,
        label: `${i.name} (${i.id})`,
    }));

    const sectionCls = "space-y-3 rounded-lg border border-border-default bg-surface-muted/20 p-4";

    // ─── Render ──────────────────────────────────────────────────────────────

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
                footer={
                    providers.length > 0 ? (
                        <Button type="submit">Submit Personal Loan Select</Button>
                    ) : null
                }
            >
                {/* Header */}
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-text-primary">
                        Personal Loan Select (FIS12)
                    </p>
                    <p
                        className={cn(
                            "text-xs",
                            providers.length > 0 ? "text-text-secondary" : "text-brand-normal"
                        )}
                    >
                        {providers.length > 0
                            ? `${providers.length} provider(s) loaded`
                            : "Paste on_search payload to begin"}
                    </p>
                </div>

                <PastePayloadButton
                    onClick={() => setIsPayloadEditorActive(true)}
                    label={providers.length > 0 ? "Edit Payload" : "Paste Payload"}
                />

                {/* Empty state */}
                {providers.length === 0 && !isPayloadEditorActive && (
                    <div className="rounded-xl border border-dashed border-border-default bg-surface-muted/30 py-12 text-center">
                        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
                            <ClipboardDocumentIcon className="size-5" />
                        </div>
                        <h3 className="font-medium text-text-primary">No payload loaded</h3>
                        <p className="mt-1 text-sm text-text-secondary">
                            Paste an on_search payload to see available loan products
                        </p>
                    </div>
                )}

                {providers.length > 0 && (
                    <div className="space-y-4">
                        {/* Provider selection */}
                        <div className={sectionCls}>
                            <FieldLabel className="font-semibold uppercase tracking-wide">
                                Provider
                            </FieldLabel>
                            <Controller
                                name="providerId"
                                control={control}
                                rules={{ required: "Required" }}
                                render={({ field }) => (
                                    <ComboBoxControl
                                        label="Lending Provider"
                                        required
                                        value={field.value}
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            setValue("itemId", "");
                                            setValue("formSubmissionId", "");
                                        }}
                                        options={providerOptions}
                                        placeholder="Select a lender"
                                        error={errors.providerId?.message}
                                    />
                                )}
                            />
                        </div>

                        {/* Item (loan product) selection */}
                        {selectedProvider && (
                            <div className={sectionCls}>
                                <FieldLabel className="font-semibold uppercase tracking-wide">
                                    Loan Product
                                </FieldLabel>
                                <Controller
                                    name="itemId"
                                    control={control}
                                    rules={{ required: "Required" }}
                                    render={({ field }) => (
                                        <ComboBoxControl
                                            label="Select Loan Item"
                                            required
                                            value={field.value}
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                                setValue("formSubmissionId", "");
                                            }}
                                            options={itemOptions}
                                            placeholder="Select a loan product"
                                            error={errors.itemId?.message}
                                        />
                                    )}
                                />

                                {/* Loan product details card */}
                                {selectedItem && (
                                    <div className="space-y-3">
                                        {/* Item identity badge */}
                                        <div className="flex items-center gap-2 rounded-md border border-border-default bg-surface px-3 py-2">
                                            <CheckCircleIcon className="size-4 shrink-0 text-green-500" />
                                            <div>
                                                <p className="text-xs font-semibold text-text-primary">
                                                    {selectedItem.name}
                                                </p>
                                                <p className="font-mono text-[10px] text-text-secondary">
                                                    ID: {selectedItem.id}
                                                    {selectedItem.code
                                                        ? ` · ${selectedItem.code}`
                                                        : ""}
                                                </p>
                                            </div>
                                        </div>

                                        {/* General info (interest rates / tenure / amounts) */}
                                        <LoanInfoBadge info={selectedItem.generalInfo} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Journey steps */}
                        {selectedFulfillment && (
                            <div className={sectionCls}>
                                <FulfillmentJourney fulfillment={selectedFulfillment} />
                                <div className="flex items-center gap-2 rounded-md bg-surface-muted/30 px-3 py-2 text-xs text-text-secondary">
                                    <span className="font-medium">Fulfillment Type:</span>
                                    <span
                                        className={cn(
                                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                            selectedFulfillment.type === "ONLINE"
                                                ? "bg-blue-100 text-blue-700"
                                                : selectedFulfillment.type === "SEMI_ONLINE"
                                                  ? "bg-amber-100 text-amber-700"
                                                  : "bg-gray-100 text-gray-700"
                                        )}
                                    >
                                        {selectedFulfillment.type}
                                    </span>
                                    <span className="text-[10px]">
                                        {FULFILLMENT_TYPE_LABEL[selectedFulfillment.type] ?? ""}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* x-input form details */}
                        {hasXInput && selectedItem?.xinput && (
                            <div className={sectionCls}>
                                <FieldLabel className="font-semibold uppercase tracking-wide">
                                    x-Input Form Details
                                </FieldLabel>

                                {/* Read-only form ID info */}
                                <div className="rounded-md border border-border-default bg-surface-muted/30 px-3 py-2 text-xs">
                                    <p className="text-text-secondary">
                                        Form ID:{" "}
                                        <span className="font-mono font-medium text-text-primary">
                                            {selectedItem.xinput.formId}
                                        </span>
                                    </p>
                                    {selectedItem.xinput.url && (
                                        <p className="mt-1 truncate text-text-secondary">
                                            URL:{" "}
                                            <a
                                                href={selectedItem.xinput.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-brand-normal underline"
                                            >
                                                {selectedItem.xinput.url}
                                            </a>
                                        </p>
                                    )}
                                </div>

                                <TextField
                                    control={control}
                                    name="formSubmissionId"
                                    label="Form Submission ID"
                                    required
                                    placeholder={`e.g. ${selectedItem.xinput.formId}_SUBMISSION_ID`}
                                    rules={{ required: "Submission ID is required for this item" }}
                                />
                                <p className="text-xs text-text-secondary">
                                    This is the{" "}
                                    <span className="font-mono">form_response.submission_id</span>{" "}
                                    returned after the customer completes the x-input form at the
                                    BPP URL.
                                </p>
                            </div>
                        )}

                        {/* Payload preview */}
                        {selectedItem && (
                            <div className="rounded-md border border-border-default bg-surface-muted/20 p-3">
                                <p className="mb-1 text-xs font-semibold text-text-secondary">
                                    Select Payload Preview
                                </p>
                                <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-[10px] text-text-secondary">
                                    {JSON.stringify(
                                        {
                                            provider: { id: watchedProviderId },
                                            items: [
                                                {
                                                    id: watchedItemId,
                                                    ...(hasXInput && selectedItem.xinput
                                                        ? {
                                                              xinput: {
                                                                  form: {
                                                                      id: selectedItem.xinput
                                                                          .formId,
                                                                  },
                                                                  form_response: {
                                                                      status: "SUCCESS",
                                                                      submission_id:
                                                                          watch(
                                                                              "formSubmissionId"
                                                                          ) ||
                                                                          `${selectedItem.xinput.formId}_SUBMISSION_ID`,
                                                                  },
                                                              },
                                                          }
                                                        : {}),
                                                },
                                            ],
                                        },
                                        null,
                                        2
                                    )}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </FormDialogShell>
        </>
    );
}
