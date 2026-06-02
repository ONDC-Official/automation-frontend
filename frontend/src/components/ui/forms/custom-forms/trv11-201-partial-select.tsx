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

    const [parsedItems, setParsedItems] = useState<OrderItem[]>([]);
    const [fulfillmentOptions, setFulfillmentOptions] = useState<OrderFulfillment[]>([]);
    const [providerId, setProviderId] = useState("");
    const [orderId, setOrderId] = useState("");

    const {
        handleSubmit,
        register,
        watch,
        setValue,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: { fulfillmentId: "" },
    });

    const selectedFulfillmentId = watch("fulfillmentId");
    const selectedFulfillment = fulfillmentOptions.find(
        (f: any) => f.id === selectedFulfillmentId
    );


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

            setParsedItems(order.items ?? []);
            const ticketFulfillments = (order.fulfillments ?? []).filter(
                (f) => f.type?.toUpperCase() === "TICKET"
            );
            setFulfillmentOptions(ticketFulfillments);
            setProviderId(order.provider?.id ?? "");
            setOrderId(order.id ?? "");

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


    const inputStyle =
        "border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
    const labelStyle = "mb-1 font-semibold";
    const fieldWrapperStyle = "flex flex-col mb-2";


    return (
        <div>
            {isPayloadEditorActive && (
                <PayloadEditor
                    onAdd={handlePaste}
                    onClose={() => setIsPayloadEditorActive(false)}
                />
            )}

            {errorWhilePaste && (
                <p className="text-red-500 text-sm italic mt-1">{errorWhilePaste}</p>
            )}

            <div className="flex items-center gap-3 mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <button
                    type="button"
                    onClick={() => setIsPayloadEditorActive(true)}
                    className="p-2 border rounded-full hover:bg-gray-100 bg-white shrink-0"
                    title="Paste on_confirm payload"
                >
                    <FaRegPaste size={14} />
                </button>
                <p className="text-sm text-blue-700">
                    Paste the <strong>on_confirm</strong> payload to auto-populate
                    the fulfillment list below.
                </p>
            </div>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 h-[500px] overflow-y-scroll p-4"
            >
                {(orderId || providerId) && (
                    <div className="border p-3 rounded bg-gray-50 space-y-2 text-sm">
                        {orderId && (
                            <div className={fieldWrapperStyle}>
                                <label className={labelStyle}>Order ID</label>
                                <div
                                    className={`${inputStyle} bg-gray-100 text-gray-700 cursor-default`}
                                >
                                    {orderId}
                                </div>
                            </div>
                        )}
                        {providerId && (
                            <div className={fieldWrapperStyle}>
                                <label className={labelStyle}>Provider ID</label>
                                <div
                                    className={`${inputStyle} bg-gray-100 text-gray-700 cursor-default`}
                                >
                                    {providerId}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {parsedItems.length > 0 && (
                    <div className="border p-3 rounded space-y-2 bg-gray-50">
                        <h3 className="font-bold text-sm text-gray-700 mb-1">
                            Ordered Items
                        </h3>
                        {parsedItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between text-sm border-b pb-1 last:border-b-0"
                            >
                                <span className="font-medium text-gray-800">
                                    {item.descriptor?.name
                                        ? `${item.descriptor.name} (${item.id})`
                                        : item.id}
                                    {item.descriptor?.code && (
                                        <span className="ml-1 text-xs text-gray-400">
                                            [{item.descriptor.code}]
                                        </span>
                                    )}
                                </span>
                                <span className="text-gray-500 text-xs">
                                    Qty: {item.quantity?.selected?.count ?? 1}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="border p-3 rounded space-y-2">
                    <div className={fieldWrapperStyle}>
                        <label className={labelStyle}>
                            Select Fulfillment{" "}
                            <span className="text-red-500">*</span>
                        </label>

                        {fulfillmentOptions.length === 0 ? (
                            <input
                                type="text"
                                {...register("fulfillmentId", { required: "Fulfillment ID is required" })}
                                placeholder="Enter Fulfillment ID manually or paste payload above"
                                className={inputStyle}
                            />
                        ) : (
                            <select
                                {...register("fulfillmentId", { required: "Fulfillment ID is required" })}
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

                    {selectedFulfillment && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded text-xs font-mono text-green-800">
                            <p className="font-bold mb-1 text-green-900 not-italic">
                                Output Preview:
                            </p>
                            <pre className="whitespace-pre-wrap break-all">
                                {JSON.stringify(
                                    {
                                        fulfillments: [
                                            {
                                                id: selectedFulfillment.id,
                                                type: selectedFulfillment.type,
                                            },
                                        ],
                                    },
                                    null,
                                    2
                                )}
                            </pre>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                >
                    Submit
                </button>
            </form>
        </div>
    );
}
