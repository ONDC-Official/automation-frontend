import { useState } from "react";
import { useForm } from "react-hook-form";
import { FaRegPaste } from "react-icons/fa6";
import PayloadEditor from "../../mini-components/payload-editor";
import { SubmitEventParams } from "../../../../types/flow-types";
import { toast } from "react-toastify";

interface OrderItem {
    id: string;
    descriptor?: { name?: string; code?: string };
    quantity?: { selected?: { count: number } };
    fulfillment_ids?: string[];
}

interface OrderFulfillment {
    id: string;
    type: string;
}

interface OrderProvider {
    id: string;
    descriptor?: { name?: string };
}

interface OnConfirmPayload {
    message?: {
        order?: {
            id?: string;
            items?: OrderItem[];
            fulfillments?: OrderFulfillment[];
            provider?: OrderProvider;
        };
    };
}

type FormValues = {
    fulfillmentId: string;
};

export default function TRV11PartialSelect({
    submitEvent,
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");

    const [fulfillmentOptions, setFulfillmentOptions] = useState<OrderFulfillment[]>([]);

    const {
        handleSubmit,
        register,
        setValue,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: { fulfillmentId: "" },
    });

    const onSubmit = async (data: FormValues) => {
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
            const parsed = payload as OnConfirmPayload;
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

    const inputStyle = "w-full p-2 border border-gray-300 rounded text-sm";
    const labelStyle = "block text-sm font-medium text-gray-600 mb-1";

    return (
        <div className="p-4">
            {isPayloadEditorActive && (
                <PayloadEditor
                    onAdd={handlePaste}
                    onClose={() => setIsPayloadEditorActive(false)}
                />
            )}

            {errorWhilePaste && (
                <p className="text-red-500 text-sm italic mt-1 mb-4">{errorWhilePaste}</p>
            )}

            {/* Top Row: Paste Button + Hint */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    type="button"
                    onClick={() => setIsPayloadEditorActive(true)}
                    className="flex items-center gap-2 py-2.5 px-5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-xs"
                >
                    <FaRegPaste size={18} />
                    <span>Paste Payload</span>
                </button>
                <span className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg">
                    Please paste the payload (on_confirm) to load fulfillment options.
                </span>
            </div>

            {/* Main Form Section */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 mb-6">
                    <h3 className="text-base font-semibold text-gray-800 mb-4">Select Fulfillment</h3>

                    <div className="space-y-1">
                        <label className={labelStyle}>
                            Fulfillment ID <span className="text-red-500">*</span>
                        </label>

                        {fulfillmentOptions.length === 0 ? (
                            <input
                                type="text"
                                {...register("fulfillmentId", {
                                    required: "Fulfillment ID is required",
                                })}
                                placeholder="Enter Fulfillment ID manually or paste payload above"
                                className={inputStyle}
                            />
                        ) : (
                            <select
                                {...register("fulfillmentId", {
                                    required: "Fulfillment ID is required",
                                })}
                                className={inputStyle}
                            >
                                <option value="">Select Fulfillment...</option>
                                {fulfillmentOptions.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.id} — {f.type}
                                    </option>
                                ))}
                            </select>
                        )}

                        {errors.fulfillmentId && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.fulfillmentId.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="w-full py-3 rounded-lg font-semibold transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                >
                    Submit
                </button>
            </form>
        </div>
    );
}
