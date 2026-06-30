import { useState } from "react";
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

type IProvider = {
    id: string;
    descriptor?: { name?: string };
    tags?: Array<{
        descriptor?: { code?: string };
        list?: Array<{ descriptor?: { code?: string }; value?: string }>;
    }>;
};

const extractPolicyId = (provider?: IProvider): string =>
    provider?.tags
        ?.find((tag) => tag.descriptor?.code === "MASTER_POLICY")
        ?.list?.find((entry) => entry.descriptor?.code === "POLICY_ID")?.value ?? "";

export default function Fis13SearchDiscoverProductForm({
    submitEvent,
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [allProviders, setAllProviders] = useState<IProvider[]>([]);
    const [selectedProviderId, setSelectedProviderId] = useState("");
    const [policyId, setPolicyId] = useState("");
    const [isManualMode, setIsManualMode] = useState(false);
    const [manualProviderId, setManualProviderId] = useState("");
    const [manualPolicyId, setManualPolicyId] = useState("");

    const { handleSubmit } = useForm();
    const selectedProvider = allProviders.find((provider) => provider.id === selectedProviderId);
    const hasData = allProviders.length > 0;

    const providerOptions = allProviders.map((provider) => ({
        value: provider.id,
        label: `${provider.id}${provider.descriptor?.name ? ` - ${provider.descriptor.name}` : ""}`,
    }));

    const handlePaste = (payload: unknown) => {
        try {
            const message = (payload as { message?: { catalog?: { providers?: IProvider[] } } })
                ?.message;
            const providers = message?.catalog?.providers;

            if (!providers?.length) {
                throw new Error("Invalid payload: No providers found");
            }

            setAllProviders(providers);
            const firstProvider = providers[0];
            setSelectedProviderId(firstProvider.id);
            setPolicyId(extractPolicyId(firstProvider));
            setIsManualMode(false);
            setIsPayloadEditorActive(false);
            toast.success("Payload parsed successfully");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to parse payload";
            toast.error(message);
        }
    };

    const handleProviderChange = (providerId: string) => {
        setSelectedProviderId(providerId);
        const provider = allProviders.find((entry) => entry.id === providerId);
        setPolicyId(extractPolicyId(provider));
    };

    const onSubmit = async () => {
        if (!selectedProvider) {
            toast.error("Please select a provider");
            return;
        }

        await submitEvent({
            jsonPath: {},
            formData: {
                provider: {
                    id: selectedProvider.id,
                    tags: [
                        {
                            descriptor: { code: "MASTER_POLICY" },
                            list: [{ descriptor: { code: "POLICY_ID" }, value: policyId }],
                        },
                    ],
                },
            } as unknown as Record<string, string>,
        });
    };

    const onManualSubmit = async () => {
        if (!manualProviderId) {
            toast.error("Please enter Provider ID");
            return;
        }

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
                },
            } as unknown as Record<string, string>,
        });
    };

    if (isManualMode) {
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
                    onClick={() => setIsManualMode(false)}
                >
                    <ArrowLeftIcon className="size-4" />
                    Back to Paste Payload
                </Button>

                <h3 className="text-sm font-semibold text-text-primary">Enter Details Manually</h3>

                <Field>
                    <FieldLabel className="font-semibold">Provider ID</FieldLabel>
                    <Input
                        value={manualProviderId}
                        onChange={(event) => setManualProviderId(event.target.value)}
                        placeholder="e.g. P1"
                    />
                </Field>
                <Field>
                    <FieldLabel className="font-semibold">Policy ID</FieldLabel>
                    <Input
                        value={manualPolicyId}
                        onChange={(event) => setManualPolicyId(event.target.value)}
                        placeholder="e.g. e103b4a5-..."
                    />
                </Field>
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
                <p className="text-sm text-text-secondary">
                    Paste the <strong>on_search</strong> payload to load provider options.
                </p>

                <div className="space-y-4 rounded-lg border border-border-default p-4">
                    <h3 className="text-sm font-semibold text-text-primary">
                        Select Provider &amp; Policy
                    </h3>

                    {hasData ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <ComboBoxControl
                                label="Provider ID"
                                value={selectedProviderId}
                                onValueChange={handleProviderChange}
                                options={providerOptions}
                                placeholder="Select provider..."
                            />
                            <Field>
                                <FieldLabel className="font-semibold">Policy ID</FieldLabel>
                                <Input
                                    value={policyId}
                                    onChange={(event) => setPolicyId(event.target.value)}
                                />
                            </Field>
                        </div>
                    ) : (
                        <p className="py-6 text-center text-sm text-text-secondary">
                            No providers loaded. Please paste an on_search payload first.
                        </p>
                    )}
                </div>

                {!hasData && !isPayloadEditorActive && (
                    <details
                        className="text-sm"
                        onToggle={(event) =>
                            setIsManualMode((event.target as HTMLDetailsElement).open)
                        }
                    >
                        <summary className="cursor-pointer font-medium text-text-secondary hover:text-text-primary">
                            Advanced: Enter Manually
                        </summary>
                    </details>
                )}
            </FormDialogShell>
        </>
    );
}
