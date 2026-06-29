import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { ComboBoxControl } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import TextField from "@/components/Shadcn/TextField";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import { SubmitEventParams } from "@/types/flow-types";
import { cn } from "@/lib/utils";

interface IHotelProvider {
    id: string;
    name: string;
}

interface IHotelFormData {
    providerId: string;
    providerName: string;
    checkInDate: string;
    checkOutDate: string;
}

interface IHotelSelectProps {
    submitEvent: (params: SubmitEventParams) => Promise<void>;
}

const DEFAULT_HOTEL_FORM_DATA: IHotelFormData = {
    providerId: "",
    providerName: "",
    checkInDate: "",
    checkOutDate: "",
};

export default function TRV13HotelSelectProviderForm({ submitEvent }: IHotelSelectProps) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [availableProviders, setAvailableProviders] = useState<IHotelProvider[]>([]);

    const { control, handleSubmit, reset, setValue } = useForm<IHotelFormData>({
        defaultValues: DEFAULT_HOTEL_FORM_DATA,
    });

    const handlePaste = (payload: Record<string, unknown>) => {
        try {
            const message = payload?.message as Record<string, unknown> | undefined;
            const catalog = message?.catalog as Record<string, unknown> | undefined;
            const providers = catalog?.providers as Record<string, unknown>[] | undefined;

            if (!providers) {
                throw new Error(
                    "Invalid Schema - Expected on_search payload with catalog.providers"
                );
            }

            const providerList: IHotelProvider[] = providers.map((prov) => {
                const descriptor = prov.descriptor as Record<string, unknown> | undefined;
                return {
                    id: (prov.id as string) || "",
                    name: (descriptor?.name as string) || (prov.id as string) || "",
                };
            });

            setAvailableProviders(providerList);

            reset({
                providerId: providerList[0]?.id || "",
                providerName: providerList[0]?.name || "",
                checkInDate: "",
                checkOutDate: "",
            });

            setErrorWhilePaste("");
            toast.success(`Found ${providerList.length} provider(s)`);
        } catch (err) {
            const error = err as Error;
            setErrorWhilePaste(error.message || "Invalid payload structure");
            toast.error(error.message || "Invalid payload structure");
            console.error(err);
        }

        setIsPayloadEditorActive(false);
    };

    const onSubmit = async (data: IHotelFormData) => {
        const convertToISO = (dateString: string): string => {
            if (!dateString) return "";
            try {
                return new Date(dateString).toISOString();
            } catch (error: unknown) {
                const err = error as Error;
                console.error("Invalid date format:", err.message, dateString);
                return dateString;
            }
        };

        const formattedData = {
            ...data,
            checkInDate: convertToISO(data.checkInDate),
            checkOutDate: convertToISO(data.checkOutDate),
        };

        await submitEvent({
            jsonPath: {},
            formData: {
                data: JSON.stringify(formattedData),
            },
        });
    };

    const providerIdOptions = availableProviders.map((provider) => ({
        value: provider.id,
        label: provider.id,
    }));

    const providerNameOptions = availableProviders.map((provider) => ({
        value: provider.name,
        label: provider.name,
    }));

    return (
        <>
            {isPayloadEditorActive && (
                <PayloadEditor onAdd={handlePaste as (payload: unknown) => void} />
            )}

            <FormDialogShell
                onSubmit={handleSubmit(onSubmit)}
                footer={<Button type="submit">Submit</Button>}
            >
                <PastePayloadButton onClick={() => setIsPayloadEditorActive(true)} />

                <p className="text-sm font-medium text-destructive">
                    Please paste the on_search payload first to select the provider ID and provider
                    name
                </p>

                {errorWhilePaste && <p className="text-sm text-destructive">{errorWhilePaste}</p>}

                <div
                    className={cn(
                        "space-y-4 rounded-lg border border-border-default bg-surface-muted/20 p-4"
                    )}
                >
                    <h3 className="font-semibold text-text-primary">Provider Selection</h3>

                    {availableProviders.length > 0 ? (
                        <>
                            <Controller
                                name="providerId"
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <ComboBoxControl
                                        label="Select Provider ID"
                                        required
                                        value={field.value}
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            const provider = availableProviders.find(
                                                (entry) => entry.id === value
                                            );
                                            if (provider) {
                                                setValue("providerName", provider.name);
                                            }
                                        }}
                                        options={providerIdOptions}
                                        placeholder="Select a provider ID"
                                    />
                                )}
                            />

                            <Controller
                                name="providerName"
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <ComboBoxControl
                                        label="Select Provider Name"
                                        required
                                        value={field.value}
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            const provider = availableProviders.find(
                                                (entry) => entry.name === value
                                            );
                                            if (provider) {
                                                setValue("providerId", provider.id);
                                            }
                                        }}
                                        options={providerNameOptions}
                                        placeholder="Select a provider name"
                                    />
                                )}
                            />
                        </>
                    ) : (
                        <>
                            <TextField
                                control={control}
                                name="providerId"
                                label="Select Provider ID"
                                required
                                placeholder="Select Provider ID"
                            />
                            <TextField
                                control={control}
                                name="providerName"
                                label="Select Provider Name"
                                required
                                placeholder="Select Provider Name"
                            />
                        </>
                    )}

                    <TextField
                        control={control}
                        name="checkInDate"
                        label="Enter Start Time (Check In)"
                        required
                        placeholder="yyyy-mm-dd"
                        description="Format: yyyy-mm-dd"
                    />

                    <TextField
                        control={control}
                        name="checkOutDate"
                        label="Enter End Time (Check Out)"
                        required
                        placeholder="yyyy-mm-dd"
                        description="Format: yyyy-mm-dd"
                    />
                </div>
            </FormDialogShell>
        </>
    );
}
