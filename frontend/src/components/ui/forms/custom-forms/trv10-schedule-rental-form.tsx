import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/Shadcn/Button/button";
import { DateTimePicker } from "@/components/Shadcn/DateTimePicker";
import TextField from "@/components/Shadcn/TextField";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import { toPayloadIso } from "@/components/ui/forms/utils/date-utils";
import { SubmitEventParams } from "@/types/flow-types";

type FormValues = {
    city_code: string;
    start_gps: string;
    scheduled_time: string;
};

export default function TRV10ScheduleRentalForm({
    submitEvent,
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);

    const { control, handleSubmit } = useForm<FormValues>({
        defaultValues: {
            city_code: "",
            start_gps: "",
            scheduled_time: "",
        },
    });

    const handlePaste = (_payload: unknown) => {
        setIsPayloadEditorActive(false);
        toast.success("Payload pasted successfully");
    };

    const onSubmit = async (data: FormValues) => {
        try {
            const formattedData = {
                ...data,
                scheduled_time: toPayloadIso(data.scheduled_time, {
                    fieldType: "datetime-local",
                }),
            };

            await submitEvent({
                jsonPath: {
                    city_code: "$.context.location.city.code",
                    start_gps:
                        "$.message.intent.fulfillment.stops[?(@.type=='START')].location.gps",
                    scheduled_time:
                        "$.message.intent.fulfillment.stops[?(@.type=='START')].time.timestamp",
                },
                formData: formattedData as unknown as Record<string, string>,
            });
        } catch (err) {
            console.error(err);
            toast.error("Submission failed");
        }
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
                <PastePayloadButton
                    label="Paste Payload"
                    onClick={() => setIsPayloadEditorActive(true)}
                    className="mb-0"
                />

                <TextField control={control} name="city_code" label="Enter city code" required />

                <TextField
                    control={control}
                    name="start_gps"
                    label="Enter start gps coordinates"
                    placeholder="12.9716,77.5946"
                    required
                />

                <DateTimePicker
                    control={control}
                    name="scheduled_time"
                    label="Enter Time (24-hour format)"
                    required
                />
            </FormDialogShell>
        </>
    );
}
