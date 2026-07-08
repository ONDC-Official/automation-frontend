import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/Shadcn/Button/button";
import { DateTimePicker } from "@/components/Shadcn/DateTimePicker";
import TextField from "@/components/Shadcn/TextField";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { toPayloadIso } from "@/components/ui/forms/utils/date-utils";
import { SubmitEventParams } from "@/types/flow-types";

type FormValues = {
    city_code: string;
    start_gps: string;
    end_gps: string;
    scheduled_time: string;
};

export default function TRV10ScheduleForm({
    submitEvent,
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
    const { control, handleSubmit } = useForm<FormValues>({
        defaultValues: {
            city_code: "",
            start_gps: "",
            end_gps: "",
            scheduled_time: "",
        },
    });

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
                    end_gps: "$.message.intent.fulfillment.stops[?(@.type=='END')].location.gps",
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
        <FormDialogShell
            onSubmit={handleSubmit(onSubmit)}
            footer={<Button type="submit">Submit</Button>}
        >
            <TextField control={control} name="city_code" label="Enter city code" required />

            <TextField
                control={control}
                name="start_gps"
                label="Enter start gps coordinates"
                placeholder="12.9716,77.5946"
                required
            />

            <TextField
                control={control}
                name="end_gps"
                label="Enter end gps coordinates"
                placeholder="12.2958,76.6394"
                required
            />

            <DateTimePicker
                control={control}
                name="scheduled_time"
                label="Enter Time (24-hour format)"
                required
            />
        </FormDialogShell>
    );
}
