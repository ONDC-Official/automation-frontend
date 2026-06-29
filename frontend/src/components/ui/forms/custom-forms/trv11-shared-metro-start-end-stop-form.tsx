import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ComboBoxControl } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import { Input } from "@/components/Shadcn/TextField/input";
import { Field, FieldLabel } from "@/components/Shadcn/TextField/field";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import { cn } from "@/lib/utils";

interface IStop {
    id: string;
    type: string;
    location?: {
        descriptor?: {
            name?: string;
            code?: string;
        };
        gps?: string;
    };
    instructions?: {
        name?: string;
        short_desc?: string;
    };
    parent_stop_id?: string;
}

interface IFulfillment {
    id: string;
    type: string;
    stops?: IStop[];
}

interface IOnSearchPayload {
    context: Record<string, unknown>;
    message: {
        catalog: {
            providers: Array<{
                fulfillments: IFulfillment[];
            }>;
        };
    };
}

export interface IMetroStartEndStopFormProps {
    submitEvent: (data: {
        jsonPath: Record<string, string | number>;
        formData: Record<string, string>;
    }) => Promise<void>;
    fulfillmentType: "TRIP" | "ROUTE";
    showVehicleCategoryField: boolean;
}

const stopToOption = (stop: IStop) => {
    const code = stop.location?.descriptor?.code || stop.id;
    const name = stop.location?.descriptor?.name || `Stop ${stop.id}`;
    const codeSuffix = stop.location?.descriptor?.code ? ` (${stop.location.descriptor.code})` : "";
    return { value: code, label: `${name}${codeSuffix}` };
};

export const MetroStartEndStopForm = ({
    submitEvent,
    fulfillmentType,
    showVehicleCategoryField,
}: IMetroStartEndStopFormProps) => {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [stops, setStops] = useState<IStop[]>([]);
    const [selectedStartStopCode, setSelectedStartStopCode] = useState("");
    const [selectedEndStopCode, setSelectedEndStopCode] = useState("");
    const [isParsed, setIsParsed] = useState(false);
    const [fulfillmentId, setFulfillmentId] = useState("");
    const [cityCode, setCityCode] = useState("std:080");
    const [vehicleCategory, setVehicleCategory] = useState("METRO");
    const [bppId, setBppId] = useState("");
    const [collector, setCollector] = useState("BAP");

    const handlePaste = (payload: unknown) => {
        try {
            const parsed = payload as IOnSearchPayload;
            const providers = parsed?.message?.catalog?.providers;

            if (!providers || providers.length === 0) {
                throw new Error("Invalid payload: No providers found");
            }

            const fulfillment = providers[0].fulfillments?.find(
                (entry) => entry.type === fulfillmentType
            );

            if (!fulfillment) {
                throw new Error(`No fulfillment of type ${fulfillmentType} found`);
            }

            if (!fulfillment.stops || fulfillment.stops.length === 0) {
                throw new Error(`No stops found in ${fulfillmentType} fulfillment`);
            }

            setFulfillmentId(fulfillment.id);

            const bppIdFromPayload = parsed?.context?.bpp_id;
            if (bppIdFromPayload) {
                setBppId(bppIdFromPayload as string);
            }

            setStops(fulfillment.stops);
            setIsParsed(true);
            setIsPayloadEditorActive(false);
            toast.success(`Found ${fulfillment.stops.length} stops`);
        } catch (error: unknown) {
            console.error(error);
            toast.error(
                "Failed to parse payload: " +
                    (error instanceof Error ? error.message : "Unknown error")
            );
        }
    };

    const selectedStartIndex = useMemo(() => {
        if (!selectedStartStopCode) return -1;
        return stops.findIndex((stop) => stop.location?.descriptor?.code === selectedStartStopCode);
    }, [stops, selectedStartStopCode]);

    const selectedEndIndex = useMemo(() => {
        if (!selectedEndStopCode) return -1;
        return stops.findIndex((stop) => stop.location?.descriptor?.code === selectedEndStopCode);
    }, [stops, selectedEndStopCode]);

    const availableStartStops = useMemo(() => {
        if (selectedEndIndex === -1) return stops;
        return stops.filter((_, index) => index < selectedEndIndex);
    }, [stops, selectedEndIndex]);

    const availableEndStops = useMemo(() => {
        if (selectedStartIndex === -1) return stops;
        return stops.filter((_, index) => index > selectedStartIndex);
    }, [stops, selectedStartIndex]);

    const handleClearPayload = () => {
        setIsParsed(false);
        setStops([]);
        setFulfillmentId("");
        toast.info("Payload cleared");
    };

    const handleReset = () => {
        setStops([]);
        setSelectedStartStopCode("");
        setSelectedEndStopCode("");
        setIsParsed(false);
        setFulfillmentId("");
        setCityCode("std:080");
        setVehicleCategory("METRO");
        setBppId("");
        setCollector("BAP");
    };

    const handleSubmit = async () => {
        if (!cityCode.trim()) {
            toast.error("Please enter city code");
            return;
        }

        if (!bppId.trim()) {
            toast.error("Please enter BPP ID");
            return;
        }

        if (!selectedStartStopCode) {
            toast.error("Please select a start station");
            return;
        }

        if (!selectedEndStopCode) {
            toast.error("Please select an end station");
            return;
        }

        if (selectedStartStopCode === selectedEndStopCode) {
            toast.error("Start and end stations cannot be the same");
            return;
        }

        await submitEvent({
            jsonPath: {},
            formData: {
                city_code: cityCode,
                vehicle_category: vehicleCategory,
                bpp_id: bppId,
                collector,
                fulfillment_id: fulfillmentId,
                start_stop_code: selectedStartStopCode,
                end_stop_code: selectedEndStopCode,
            },
        });
    };

    const collectorOptions = [
        { value: "BAP", label: "BAP" },
        { value: "BPP", label: "BPP" },
    ];

    const vehicleCategoryOptions = [{ value: "METRO", label: "METRO" }];

    return (
        <>
            {isPayloadEditorActive && (
                <PayloadEditor
                    onAdd={handlePaste}
                    onClose={() => setIsPayloadEditorActive(false)}
                />
            )}

            <FormDialogShell
                onSubmit={(event) => {
                    event.preventDefault();
                    void handleSubmit();
                }}
                footer={<Button type="submit">Submit</Button>}
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-text-primary">
                        Search Configuration
                    </h3>
                    <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
                        Reset Form
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <PastePayloadButton
                        onClick={() => setIsPayloadEditorActive(true)}
                        label={isParsed ? "Modify Payload" : "Paste Payload"}
                        className="mb-0"
                    />
                    <span className="text-sm text-text-secondary">
                        Paste on_search payload (optional)
                    </span>
                    {isParsed && (
                        <Button type="button" variant="link" size="sm" onClick={handleClearPayload}>
                            Clear
                        </Button>
                    )}
                </div>

                <div
                    className={cn(
                        "space-y-4 rounded-xl border border-border-default bg-surface-muted/20 p-4"
                    )}
                >
                    <Field>
                        <FieldLabel className="font-semibold">
                            Enter City Code <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                            value={cityCode}
                            onChange={(event) => setCityCode(event.target.value)}
                            placeholder="e.g., std:080"
                            required
                        />
                    </Field>

                    {showVehicleCategoryField && (
                        <ComboBoxControl
                            label="Vehicle Category"
                            required
                            value={vehicleCategory}
                            onValueChange={setVehicleCategory}
                            options={vehicleCategoryOptions}
                            placeholder="Select vehicle category"
                        />
                    )}

                    <Field>
                        <FieldLabel className="font-semibold">
                            BPP ID <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                            value={bppId}
                            onChange={(event) => setBppId(event.target.value)}
                            placeholder="Enter BPP ID"
                            required
                        />
                    </Field>

                    <ComboBoxControl
                        label="Choose Collector"
                        required
                        value={collector}
                        onValueChange={setCollector}
                        options={collectorOptions}
                        placeholder="Select collector"
                    />

                    {isParsed ? (
                        <>
                            <ComboBoxControl
                                label="Start Station"
                                required
                                value={selectedStartStopCode}
                                onValueChange={setSelectedStartStopCode}
                                options={availableStartStops.map(stopToOption)}
                                placeholder="Select a start station"
                            />
                            <ComboBoxControl
                                label="End Station"
                                required
                                value={selectedEndStopCode}
                                onValueChange={setSelectedEndStopCode}
                                options={availableEndStops.map(stopToOption)}
                                placeholder="Select an end station"
                            />
                        </>
                    ) : (
                        <>
                            <Field>
                                <FieldLabel className="font-semibold">
                                    Start Station <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Input
                                    value={selectedStartStopCode}
                                    onChange={(event) =>
                                        setSelectedStartStopCode(event.target.value)
                                    }
                                    placeholder="Enter Start Station Code"
                                    required
                                />
                            </Field>
                            <Field>
                                <FieldLabel className="font-semibold">
                                    End Station <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Input
                                    value={selectedEndStopCode}
                                    onChange={(event) => setSelectedEndStopCode(event.target.value)}
                                    placeholder="Enter End Station Code"
                                    required
                                />
                            </Field>
                        </>
                    )}
                </div>
            </FormDialogShell>
        </>
    );
};

export default MetroStartEndStopForm;
