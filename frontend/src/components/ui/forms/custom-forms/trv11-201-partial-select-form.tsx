import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ComboBox } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import TextField from "@/components/Shadcn/TextField";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import {
    IOrderFulfillment,
    IOnConfirmPayload,
    IFormValues,
    ITRV11PartialSelectFormProps,
    DEFAULT_FORM_VALUES,
} from "../types/trv11-201-partial-select-form-types";

export default function TRV11PartialSelectForm({ submitEvent }: ITRV11PartialSelectFormProps) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [fulfillmentOptions, setFulfillmentOptions] = useState<IOrderFulfillment[]>([]);

    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<IFormValues>({
        defaultValues: DEFAULT_FORM_VALUES,
    });

    const onSubmit = async (data: IFormValues) => {
        if (!data.fulfillmentId) {
            toast.error("Please select a fulfillment.");
            return;
        }

        const fulfillment = fulfillmentOptions.find((f) => f.id === data.fulfillmentId);

        const output = {
            fulfillments: [
                {
                    id: data.fulfillmentId,
                    type: fulfillment?.type ?? "",
                },
            ],
        };

        await submitEvent({
            jsonPath: {},
            formData: output as unknown as Record<string, string>,
        });
    };

    const handlePaste = (payload: unknown) => {
        setErrorWhilePaste("");
        try {
            const parsed = payload as IOnConfirmPayload;
            const order = parsed?.message?.order;

            if (!order) {
                throw new Error("No 'order' object found in the payload.");
            }

            const ticketFulfillments = (order.fulfillments ?? []).filter(
                (f) => f.type?.toUpperCase() === "TICKET"
            );
            setFulfillmentOptions(ticketFulfillments);

            if (ticketFulfillments.length > 0) {
                setValue("fulfillmentId", ticketFulfillments[0].id);
            }

            toast.success(
                `Parsed ${(order.items ?? []).length} item(s) and ${ticketFulfillments.length} ticket fulfillment(s).`
            );
        } catch (err) {
            setErrorWhilePaste("Invalid on_confirm payload structure.");
            toast.error("Invalid on_confirm payload. Please check the pasted data.");
            console.error(err);
        }
        setIsPayloadEditorActive(false);
    };

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
                footer={<Button type="submit">Submit</Button>}
            >
                {errorWhilePaste && <p className="text-sm text-destructive">{errorWhilePaste}</p>}

                <div className="flex items-center gap-4">
                    <PastePayloadButton
                        label="Paste Payload"
                        onClick={() => setIsPayloadEditorActive(true)}
                        className="mb-0"
                    />
                    <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
                        Please paste the payload (on_confirm) to load fulfillment options.
                    </span>
                </div>

                <div className="rounded-xl border-2 border-dashed border-border p-6">
                    <h3 className="mb-4 text-base font-semibold text-foreground">
                        Select Fulfillment
                    </h3>

                    {fulfillmentOptions.length === 0 ? (
                        <TextField
                            control={control}
                            name="fulfillmentId"
                            label="Fulfillment ID"
                            required="Fulfillment ID is required"
                            placeholder="Enter Fulfillment ID manually or paste payload above"
                            errors={errors}
                        />
                    ) : (
                        <ComboBox
                            control={control}
                            name="fulfillmentId"
                            label="Fulfillment ID"
                            required
                            options={fulfillmentOptions.map((f) => ({
                                label: `${f.id} — ${f.type}`,
                                value: f.id,
                            }))}
                        />
                    )}
                </div>
            </FormDialogShell>
        </>
    );
}
