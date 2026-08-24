import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@components/Shadcn/Button";
import { DateTimePicker } from "@components/Shadcn/DateTimePicker";
import TextField from "@components/Shadcn/TextField";
import PayloadEditor from "@components/PayloadEditor/PastePayloadModal";
import FormDialogShell from "@components/Forms/form-dialog-shell";
import { PastePayloadButton } from "@components/Forms/paste-payload-button";
import { toPayloadIso } from "@components/Forms/utils/date-utils";
import { SubmitEventParams } from "@/types/flow-types";

type FormValues = {
    city_code: string;
    start_gps: string;
    scheduled_time: string;
    start_address: string;
    start_city_code: string;
    start_district: string;
    start_country_code: string;
    start_area_code: string;
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
            start_address: "MG Road, Bengaluru",
            start_city_code: "std:080",
            start_district: "Bangalore",
            start_country_code: "IND",
            start_area_code: "560001",
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
                    start_address:
                        "$.message.intent.fulfillment.stops[?(@.type=='START')].location.address",
                    start_city_code:
                        "$.message.intent.fulfillment.stops[?(@.type=='START')].location.city.code",
                    start_district:
                        "$.message.intent.fulfillment.stops[?(@.type=='START')].location.district",
                    start_country_code:
                        "$.message.intent.fulfillment.stops[?(@.type=='START')].location.country.code",
                    start_area_code:
                        "$.message.intent.fulfillment.stops[?(@.type=='START')].location.area_code",
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

                <div className="space-y-4">
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
                </div>

                <div className="border border-muted-foreground/20 rounded-lg p-4 mt-6 space-y-4">
                    <h3 className="text-sm font-bold text-foreground">Pickup (Start) Location Details</h3>
                    
                    <TextField
                        control={control}
                        name="start_address"
                        label="Pickup Address"
                        placeholder="MG Road, Bengaluru"
                        required
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <TextField
                            control={control}
                            name="start_city_code"
                            label="Pickup City Code"
                            placeholder="std:080"
                            required
                        />
                        <TextField
                            control={control}
                            name="start_district"
                            label="Pickup District"
                            placeholder="Bangalore"
                            required
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <TextField
                            control={control}
                            name="start_country_code"
                            label="Pickup Country Code"
                            placeholder="IND"
                            required
                        />
                        <TextField
                            control={control}
                            name="start_area_code"
                            label="Pickup Area Code"
                            placeholder="560001"
                            required
                        />
                    </div>
                </div>
            </FormDialogShell>
        </>
    );
}
