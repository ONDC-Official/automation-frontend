import { Controller, useForm } from "react-hook-form";

import { ComboBoxControl } from "@components/Shadcn/ComboBox";
import { Button } from "@components/Shadcn/Button";
import TextField from "@components/Shadcn/TextField";
import FormDialogShell from "@components/Forms/form-dialog-shell";
import { cn } from "@/lib/utils";

export interface IUserInputFormData {
    city_code: string;
    start_time: string;
    end_time: string;
    collected_by: string;
}

export interface IFormProps {
    submitEvent: (payload: {
        jsonPath: Record<string, unknown>;
        formData: { data: string };
    }) => Promise<void>;
}

// Generates dynamic initial values: start_time = NOW, end_time = NOW + 2 Days
const getInitialDefaults = () => {
    const now = new Date();
    const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    return {
        city_code: "std:080",
        start_time: now.toISOString(),
        end_time: twoDaysLater.toISOString(),
        collected_by: "BPP",
    };
};

export default function TRV14SearchIncrementalPullForm({ submitEvent }: IFormProps) {
    const { control, handleSubmit } = useForm<IUserInputFormData>({
        defaultValues: getInitialDefaults(),
    });

    const onSubmit = async (data: IUserInputFormData) => {
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

        const payloadData = {
            city_code: data.city_code,
            start_time: convertToISO(data.start_time),
            end_time: convertToISO(data.end_time),
            collected_by: data.collected_by,
        };

        await submitEvent({
            jsonPath: {},
            formData: {
                data: JSON.stringify(payloadData),
            },
        });
    };

    const collectedByOptions = [
        { value: "BAP", label: "BAP" },
        { value: "BPP", label: "BPP" },
    ];

    return (
        <FormDialogShell
            onSubmit={handleSubmit(onSubmit)}
            footer={<Button type="submit">Submit</Button>}
        >
            <div
                className={cn(
                    "space-y-4 rounded-lg border border-border-default bg-surface-muted/20 p-4"
                )}
            >
                <h3 className="font-semibold text-text-primary">Required Parameters</h3>

                {/* Fully editable text input pre-filled with std:080 */}
                <TextField
                    control={control}
                    name="city_code"
                    label="City Code"
                    required
                    placeholder="Enter city code (e.g., std:080)"
                    rules={{ required: "City code is required" }}
                />

                <TextField
                    control={control}
                    name="start_time"
                    label="Start Time"
                    required
                    placeholder="ISO Date Time"
                    rules={{ required: "Start time is required" }}
                />

                <TextField
                    control={control}
                    name="end_time"
                    label="End Time"
                    required
                    placeholder="ISO Date Time"
                    rules={{ required: "End time is required" }}
                />

                <Controller
                    name="collected_by"
                    control={control}
                    rules={{ required: "Collected by is required" }}
                    render={({ field }) => (
                        <ComboBoxControl
                            label="Collected By"
                            required
                            value={field.value}
                            onValueChange={field.onChange}
                            options={collectedByOptions}
                            placeholder="Select collected_by"
                        />
                    )}
                />
            </div>
        </FormDialogShell>
    );
}
