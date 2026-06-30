import { useState } from "react";
import { toast } from "sonner";

import { ComboBoxControl } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";

import type {
    IStop,
    IOnSearchPayload,
    ITrv11Metro210EndStopUpdateFormProps,
} from "../types/trv11-210-metro-end-stop-update-form-types";

export default function Trv11Metro210EndStopUpdateForm({
    submitEvent,
}: ITrv11Metro210EndStopUpdateFormProps) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [stops, setStops] = useState<IStop[]>([]);
    const [selectedStopId, setSelectedStopId] = useState("");
    const [isParsed, setIsParsed] = useState(false);
    const [fulfillmentId, setFulfillmentId] = useState("");

    const handlePaste = (payload: unknown) => {
        try {
            const parsed = payload as IOnSearchPayload;
            const providers = parsed?.message?.catalog?.providers;

            if (!providers || providers.length === 0) {
                throw new Error("Invalid payload: No providers found");
            }

            const tripFulfillment = providers[0].fulfillments?.find(
                (entry) => entry.type === "TRIP"
            );

            if (!tripFulfillment) {
                throw new Error("No fulfillment of type TRIP found");
            }

            if (!tripFulfillment.stops || tripFulfillment.stops.length === 0) {
                throw new Error("No stops found in TRIP fulfillment");
            }

            setFulfillmentId(tripFulfillment.id);

            const filteredStops = tripFulfillment.stops.filter((stop) => stop.type !== "START");

            if (filteredStops.length === 0) {
                throw new Error("No intermediate stops found");
            }

            const last3Stops = filteredStops.slice(-3);

            setStops(last3Stops);
            setIsParsed(true);
            setIsPayloadEditorActive(false);
            toast.success(
                `Showing last ${last3Stops.length} stops (out of ${filteredStops.length} total)`
            );
        } catch (error: unknown) {
            console.error(error);
            toast.error(
                "Failed to parse payload: " +
                    (error instanceof Error ? error.message : "Unknown error")
            );
        }
    };

    const handleSubmit = async () => {
        if (!selectedStopId) {
            toast.error("Please select an end station");
            return;
        }

        const selectedStop = stops.find((stop) => stop.id === selectedStopId);

        await submitEvent({
            jsonPath: {},
            formData: {
                fulfillment_id: fulfillmentId,
                stops: JSON.stringify(selectedStop),
            },
        });
    };

    const handleReset = () => {
        setStops([]);
        setSelectedStopId("");
        setIsParsed(false);
        setFulfillmentId("");
    };

    if (!isParsed) {
        return (
            <>
                {isPayloadEditorActive && (
                    <PayloadEditor
                        onAdd={handlePaste}
                        onClose={() => setIsPayloadEditorActive(false)}
                    />
                )}

                <FormDialogShell footer={null}>
                    <h3 className="text-lg font-semibold text-text-primary">
                        Paste the master on_search Payload
                    </h3>
                    <p className="text-sm text-text-secondary">
                        Paste the on_search payload to load end station options.
                    </p>
                    <PastePayloadButton
                        onClick={() => setIsPayloadEditorActive(true)}
                        label="Paste Payload"
                    />
                </FormDialogShell>
            </>
        );
    }

    return (
        <FormDialogShell
            footer={
                <Button type="button" onClick={handleSubmit}>
                    Confirm Selection
                </Button>
            }
        >
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">Select End Station</h3>
                <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
                    Reset
                </Button>
            </div>

            <ComboBoxControl
                label="Select End Station"
                required
                value={selectedStopId}
                onValueChange={setSelectedStopId}
                placeholder="Select a station"
                options={stops.map((stop) => ({
                    value: stop.id,
                    label: `${stop.location?.descriptor?.name || `Stop ${stop.id}`}${
                        stop.location?.descriptor?.code ? ` (${stop.location.descriptor.code})` : ""
                    }`,
                }))}
            />
        </FormDialogShell>
    );
}
