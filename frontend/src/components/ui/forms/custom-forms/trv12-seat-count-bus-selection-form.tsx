import { useEffect, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { ComboBox } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import { SubmitEventParams } from "@/types/flow-types";

type FulfillmentTagListItem = {
    descriptor: { code: string };
    value: string;
};

type FulfillmentTag = {
    descriptor: { code: string };
    list: FulfillmentTagListItem[];
};

type Fulfillment = {
    type?: string;
    tags?: FulfillmentTag[];
};

type OnSelectPayload = {
    message?: {
        order?: {
            fulfillments?: Fulfillment[];
        };
    };
};

type SeatSelectionFormValues = {
    items: Array<{ seatNumber: string }>;
};

export default function TRV12BusSeatCountSelectionForm({
    submitEvent,
    payload,
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    payload?: OnSelectPayload;
}) {
    const [allowedSeatsCount, setAllowedSeatsCount] = useState(0);
    const [availableSeats, setAvailableSeats] = useState<string[]>([]);
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");

    const parseAndSetData = (data: unknown) => {
        try {
            const parsed = data as OnSelectPayload;
            if (!parsed?.message?.order?.fulfillments) {
                throw new Error("Invalid payload structure: missing fulfillments");
            }

            const fulfillments = parsed.message.order.fulfillments;

            const ticketFulfillments = fulfillments.filter((f) => f.type === "TICKET");
            setAllowedSeatsCount(ticketFulfillments.length);

            const tripFulfillment = fulfillments.find((f) => f.type === "TRIP");

            const seats: string[] = [];
            if (tripFulfillment?.tags) {
                tripFulfillment.tags.forEach((tag) => {
                    if (tag.descriptor.code === "SEAT_GRID") {
                        const seatNumberArg = tag.list.find(
                            (item) => item.descriptor.code === "NUMBER"
                        );
                        if (seatNumberArg) {
                            seats.push(seatNumberArg.value);
                        }
                    }
                });
            }
            setAvailableSeats(seats);
            setErrorWhilePaste("");
            toast.success("Payload processed successfully");
        } catch (err) {
            console.error(err);
            setErrorWhilePaste("Invalid payload structure.");
            toast.error("Invalid payload structure");
        }
    };

    useEffect(() => {
        if (payload) {
            parseAndSetData(payload);
        }
    }, [payload]);

    const handlePaste = (pastedPayload: unknown) => {
        parseAndSetData(pastedPayload);
        setIsPayloadEditorActive(false);
    };

    const { control, handleSubmit } = useForm<SeatSelectionFormValues>({
        defaultValues: {
            items: [{ seatNumber: "" }],
        },
    });

    const { fields, append, remove } = useFieldArray<SeatSelectionFormValues, "items">({
        control,
        name: "items",
    });

    const watchedItems = useWatch<SeatSelectionFormValues, "items">({
        control,
        name: "items",
    });

    const onSubmit = async (data: SeatSelectionFormValues) => {
        const cleanedData = {
            items: data.items
                .map((item) => ({
                    seatNumber: item.seatNumber?.trim(),
                }))
                .filter((item) => item.seatNumber !== ""),
        };

        await submitEvent({
            jsonPath: {},
            formData: cleanedData as unknown as Record<string, string>,
        });
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
                footer={
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            className="gap-1"
                            onClick={() => append({ seatNumber: "" })}
                            disabled={fields.length >= allowedSeatsCount}
                        >
                            <PlusIcon className="size-4" />
                            Add Seat
                        </Button>
                        <Button type="submit">Submit</Button>
                    </>
                }
            >
                {errorWhilePaste && <p className="text-sm text-destructive">{errorWhilePaste}</p>}

                <div className="flex items-center gap-2">
                    <PastePayloadButton
                        label="Paste on_select"
                        onClick={() => setIsPayloadEditorActive(true)}
                        className="mb-0"
                        title="Paste on_select payload"
                    />
                    <span className="rounded bg-destructive/10 px-2 py-1 text-xs font-bold text-destructive">
                        Please enter the on_select payload to select the seat here
                    </span>
                </div>

                <div className="text-sm text-muted-foreground">
                    Allowed Seats: {allowedSeatsCount}
                    <br />
                    Available Seats:{" "}
                    {availableSeats.length > 0 ? availableSeats.join(", ") : "None loaded"}
                </div>

                {fields.map((field, index) => {
                    const otherSelectedSeats = watchedItems
                        ?.filter((_, i) => i !== index)
                        .map((item) => item.seatNumber);

                    const seatOptions = availableSeats.filter(
                        (seat) => !otherSelectedSeats?.includes(seat)
                    );

                    return (
                        <div
                            key={field.id}
                            className="flex items-end gap-2 rounded border border-border p-3"
                        >
                            <div className="min-w-0 flex-1">
                                <ComboBox
                                    control={control}
                                    name={`items.${index}.seatNumber`}
                                    label={`Seat ${index + 1}`}
                                    options={seatOptions}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Remove seat"
                                onClick={() => remove(index)}
                                className="text-destructive hover:text-destructive"
                            >
                                <TrashIcon className="size-4" />
                            </Button>
                        </div>
                    );
                })}
            </FormDialogShell>
        </>
    );
}
