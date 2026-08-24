import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@components/Shadcn/Button";
import { DateTimePicker } from "@components/Shadcn/DateTimePicker";
import TextField from "@components/Shadcn/TextField";
import FormDialogShell from "@components/Forms/form-dialog-shell";
import { toPayloadIso } from "@components/Forms/utils/date-utils";
import { SubmitEventParams } from "@/types/flow-types";

type FormValues = {
    city_code: string;
    start_gps: string;
    end_gps: string;
    scheduled_time: string;
    start_address: string;
    start_city_code: string;
    start_district: string;
    start_country_code: string;
    start_area_code: string;
    end_address: string;
    end_city_code: string;
    end_district: string;
    end_country_code: string;
    end_area_code: string;
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
            start_address: "MG Road, Bengaluru",
            start_city_code: "std:080",
            start_district: "Bangalore",
            start_country_code: "IND",
            start_area_code: "560001",
            end_address: "MG Road, Bengaluru",
            end_city_code: "std:080",
            end_district: "Bangalore",
            end_country_code: "IND",
            end_area_code: "560001",
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
                    end_gps:
                        "$.message.intent.fulfillment.stops[?(@.type=='END')].location.gps",
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
                    end_address:
                        "$.message.intent.fulfillment.stops[?(@.type=='END')].location.address",
                    end_city_code:
                        "$.message.intent.fulfillment.stops[?(@.type=='END')].location.city.code",
                    end_district:
                        "$.message.intent.fulfillment.stops[?(@.type=='END')].location.district",
                    end_country_code:
                        "$.message.intent.fulfillment.stops[?(@.type=='END')].location.country.code",
                    end_area_code:
                        "$.message.intent.fulfillment.stops[?(@.type=='END')].location.area_code",
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
            <div className="space-y-4">
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

            <div className="border border-muted-foreground/20 rounded-lg p-4 mt-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground">Drop (End) Location Details</h3>
                
                <TextField
                    control={control}
                    name="end_address"
                    label="Drop Address"
                    placeholder="MG Road, Bengaluru"
                    required
                />
                
                <div className="grid grid-cols-2 gap-4">
                    <TextField
                        control={control}
                        name="end_city_code"
                        label="Drop City Code"
                        placeholder="std:080"
                        required
                    />
                    <TextField
                        control={control}
                        name="end_district"
                        label="Drop District"
                        placeholder="Bangalore"
                        required
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <TextField
                        control={control}
                        name="end_country_code"
                        label="Drop Country Code"
                        placeholder="IND"
                        required
                    />
                    <TextField
                        control={control}
                        name="end_area_code"
                        label="Drop Area Code"
                        placeholder="560001"
                        required
                    />
                </div>
            </div>
        </FormDialogShell>
    );
}
