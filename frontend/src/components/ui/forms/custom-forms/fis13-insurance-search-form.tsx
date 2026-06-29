import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

import { ComboBoxControl } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import { Input } from "@/components/Shadcn/TextField/input";
import { Field, FieldLabel } from "@/components/Shadcn/TextField/field";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import { toast } from "sonner";
import { SubmitEventParams } from "@/types/flow-types";

export interface IFis13ManualBapInput {
    code: string;
    label: string;
    type: string;
}

interface IDynamicInput {
    descriptor: { code: string; short_desc?: string };
    value: string;
}

type ICatalogItem = {
    id: string;
    tags?: Array<{
        descriptor?: { code?: string };
        list?: IDynamicInput[];
    }>;
};

type IProvider = {
    id: string;
    tags?: unknown[];
    items?: ICatalogItem[];
};

const GENDER_OPTIONS = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
];

const getInputType = (code: string): string => {
    const upperCode = code.toUpperCase();
    if (upperCode.includes("DATE") || upperCode.includes("DOB") || upperCode.includes("BIRTH")) {
        return "date";
    }
    if (upperCode.includes("EMAIL")) return "email";
    if (upperCode.includes("PHONE") || upperCode.includes("MOBILE") || upperCode.includes("TEL")) {
        return "tel";
    }
    if (
        upperCode.includes("PAN") ||
        upperCode.includes("AADHAR") ||
        upperCode.includes("AADHAAR") ||
        upperCode.includes("GSTIN") ||
        upperCode.includes("LICENSE") ||
        upperCode.includes("PASSPORT")
    ) {
        return "text";
    }
    if (
        upperCode.includes("AGE") ||
        upperCode.includes("AMOUNT") ||
        upperCode.includes("PINCODE") ||
        upperCode.includes("PIN_CODE")
    ) {
        return "number";
    }
    return "text";
};

const formatLabel = (code: string): string =>
    code
        .split("_")
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(" ");

export const Fis13InsuranceSearchForm = ({
    submitEvent,
    manualBapInputs,
    pasteHint = "Please paste the on_search payload to load item options.",
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    manualBapInputs: IFis13ManualBapInput[];
    pasteHint?: string;
}) => {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [allProviders, setAllProviders] = useState<IProvider[]>([]);
    const [selectedProviderId, setSelectedProviderId] = useState("");
    const [selectedItemId, setSelectedItemId] = useState("");
    const [dynamicInputs, setDynamicInputs] = useState<IDynamicInput[]>([]);
    const [editablePolicyId, setEditablePolicyId] = useState("");
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [manualProviderId, setManualProviderId] = useState("");
    const [manualPolicyId, setManualPolicyId] = useState("");
    const [manualItemId, setManualItemId] = useState("");

    const { register, handleSubmit } = useForm();

    const selectedProvider = allProviders.find((provider) => provider.id === selectedProviderId);
    const availableItems = selectedProvider?.items ?? [];
    const hasData = allProviders.length > 0;

    const extractedPolicyId =
        (
            selectedProvider?.tags as
                | Array<{
                      descriptor?: { code?: string };
                      list?: Array<{ descriptor?: { code?: string }; value?: string }>;
                  }>
                | undefined
        )
            ?.find((tag) => tag.descriptor?.code === "MASTER_POLICY")
            ?.list?.find((entry) => entry.descriptor?.code === "POLICY_ID")?.value ?? "";

    useEffect(() => {
        setEditablePolicyId(extractedPolicyId);
    }, [extractedPolicyId]);

    useEffect(() => {
        if (!selectedProvider || !selectedItemId) {
            setDynamicInputs([]);
            return;
        }

        const selectedItem = selectedProvider.items?.find((item) => item.id === selectedItemId);
        const bapInputsTag = selectedItem?.tags?.find(
            (tag) => tag.descriptor?.code === "BAP_INPUTS"
        );
        setDynamicInputs(bapInputsTag?.list ?? []);
    }, [selectedProviderId, selectedItemId, selectedProvider]);

    const providerOptions = allProviders.map((provider) => ({
        value: provider.id,
        label: provider.id,
    }));

    const itemOptions = availableItems.map((item) => ({
        value: item.id,
        label: item.id,
    }));

    const handlePaste = (payload: unknown) => {
        try {
            const providers = (payload as { message?: { catalog?: { providers?: IProvider[] } } })
                ?.message?.catalog?.providers;

            if (!providers?.length) {
                throw new Error("Invalid payload: No providers found");
            }

            setAllProviders(providers);
            const firstProvider = providers[0];
            const firstItem = firstProvider.items?.[0];
            setSelectedProviderId(firstProvider.id);
            setSelectedItemId(firstItem?.id ?? "");
            setIsAdvancedOpen(false);
            setIsPayloadEditorActive(false);
            toast.success("Payload parsed successfully");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to parse payload";
            toast.error(message);
        }
    };

    const onSubmit = async (formData: Record<string, string>) => {
        if (!selectedProvider) {
            toast.error("Please select a provider");
            return;
        }

        const provider = JSON.parse(JSON.stringify(selectedProvider)) as IProvider;
        const selectedItem = provider.items?.find((item) => item.id === selectedItemId);

        if (selectedItem) {
            const bapInputsTag = selectedItem.tags?.find(
                (tag) => tag.descriptor?.code === "BAP_INPUTS"
            );
            bapInputsTag?.list?.forEach((input) => {
                const value = formData[input.descriptor.code];
                if (value !== undefined) {
                    input.value = value;
                }
            });
        }

        await submitEvent({
            jsonPath: {},
            formData: {
                provider: {
                    id: provider.id,
                    tags: provider.tags,
                    items: provider.items?.filter((item) => item.id === selectedItemId) ?? [],
                },
            } as unknown as Record<string, string>,
        });
    };

    const onManualSubmit = async (formData: Record<string, string>) => {
        if (!manualProviderId || !manualItemId) {
            toast.error("Please fill in Provider ID and Item ID");
            return;
        }

        const bapInputsList = manualBapInputs.map((input) => ({
            descriptor: { code: input.code },
            value: formData[`manual_${input.code}`] ?? "",
        }));

        await submitEvent({
            jsonPath: {},
            formData: {
                provider: {
                    id: manualProviderId,
                    tags: [
                        {
                            descriptor: { code: "MASTER_POLICY" },
                            list: [{ descriptor: { code: "POLICY_ID" }, value: manualPolicyId }],
                        },
                    ],
                    items: [
                        {
                            id: manualItemId,
                            tags: [
                                {
                                    descriptor: { code: "BAP_INPUTS" },
                                    list: bapInputsList,
                                },
                            ],
                        },
                    ],
                },
            } as unknown as Record<string, string>,
        });
    };

    const renderManualBapFields = () => (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {manualBapInputs.map((input) => (
                <Field key={input.code}>
                    <FieldLabel className="font-semibold">{input.label}</FieldLabel>
                    {input.type === "select" ? (
                        <select
                            {...register(`manual_${input.code}`)}
                            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                        >
                            <option value="">Select...</option>
                            {GENDER_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <Input type={input.type} {...register(`manual_${input.code}`)} />
                    )}
                </Field>
            ))}
        </div>
    );

    const renderManualSelectionFields = () => (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field>
                <FieldLabel className="font-semibold">Provider ID</FieldLabel>
                <Input
                    value={manualProviderId}
                    onChange={(event) => setManualProviderId(event.target.value)}
                    placeholder="e.g. s1"
                />
            </Field>
            <Field>
                <FieldLabel className="font-semibold">Policy ID</FieldLabel>
                <Input
                    value={manualPolicyId}
                    onChange={(event) => setManualPolicyId(event.target.value)}
                    placeholder="e.g. pl-120"
                />
            </Field>
            <Field>
                <FieldLabel className="font-semibold">Item ID</FieldLabel>
                <Input
                    value={manualItemId}
                    onChange={(event) => setManualItemId(event.target.value)}
                    placeholder="e.g. I1"
                />
            </Field>
        </div>
    );

    if (isAdvancedOpen) {
        return (
            <FormDialogShell
                onSubmit={handleSubmit(onManualSubmit)}
                footer={<Button type="submit">Submit</Button>}
            >
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-fit gap-1"
                    onClick={() => setIsAdvancedOpen(false)}
                >
                    <ArrowLeftIcon className="size-4" />
                    Back to Paste Payload
                </Button>

                <h3 className="text-sm font-semibold text-text-primary">Add Item Manually</h3>
                {renderManualSelectionFields()}
                <div className="space-y-4 border-t border-border-default pt-4">
                    <h4 className="text-sm font-semibold text-text-primary">Buyer Details</h4>
                    {renderManualBapFields()}
                </div>
            </FormDialogShell>
        );
    }

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
                    <Button type="submit" disabled={!hasData}>
                        Submit
                    </Button>
                }
            >
                <PastePayloadButton
                    onClick={() => setIsPayloadEditorActive(true)}
                    label="Paste on_search"
                />
                <p className="text-sm text-text-secondary">{pasteHint}</p>

                <div className="space-y-4 rounded-lg border border-border-default p-4">
                    <h3 className="text-sm font-semibold text-text-primary">Select Items</h3>

                    {hasData ? (
                        <>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <ComboBoxControl
                                    label="Provider ID"
                                    value={selectedProviderId}
                                    onValueChange={(value) => {
                                        setSelectedProviderId(value);
                                        const provider = allProviders.find(
                                            (entry) => entry.id === value
                                        );
                                        setSelectedItemId(provider?.items?.[0]?.id ?? "");
                                    }}
                                    options={providerOptions}
                                />
                                <Field>
                                    <FieldLabel className="font-semibold">Policy ID</FieldLabel>
                                    <Input
                                        value={editablePolicyId}
                                        onChange={(event) =>
                                            setEditablePolicyId(event.target.value)
                                        }
                                    />
                                </Field>
                                <ComboBoxControl
                                    label="Item ID"
                                    value={selectedItemId}
                                    onValueChange={setSelectedItemId}
                                    options={itemOptions}
                                />
                            </div>

                            {dynamicInputs.length > 0 && (
                                <div className="space-y-4 border-t border-border-default pt-4">
                                    <h4 className="text-sm font-semibold text-text-primary">
                                        Buyer Details
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        {dynamicInputs.map((input) => (
                                            <Field key={input.descriptor.code}>
                                                <FieldLabel className="font-semibold">
                                                    {formatLabel(input.descriptor.code)}
                                                </FieldLabel>
                                                <Input
                                                    type={getInputType(input.descriptor.code)}
                                                    {...register(input.descriptor.code)}
                                                />
                                            </Field>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="py-6 text-center text-sm text-text-secondary">
                            No items loaded. Please paste a payload first.
                        </p>
                    )}
                </div>

                {!hasData && !isPayloadEditorActive && (
                    <details
                        className="text-sm"
                        onToggle={(event) =>
                            setIsAdvancedOpen((event.target as HTMLDetailsElement).open)
                        }
                    >
                        <summary className="cursor-pointer font-medium text-text-secondary hover:text-text-primary">
                            Advanced: Add Item Manually
                        </summary>
                    </details>
                )}
            </FormDialogShell>
        </>
    );
};
