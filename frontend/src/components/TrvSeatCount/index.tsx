import { useEffect, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import { FaTrash } from "react-icons/fa";
import { FaRegPaste } from "react-icons/fa6";

import { SubmitEventParams } from "@/types/flow-types";
import PayloadEditor from "@/components/PayloadEditor";

interface TagListItem {
  descriptor: {
    code: string;
  };
  value: string;
}

interface Tag {
  descriptor: {
    code: string;
  };
  list: TagListItem[];
}

interface Fulfillment {
  type: string;
  tags?: Tag[];
}

interface Order {
  fulfillments: Fulfillment[];
}

interface Message {
  order: Order;
}

interface OnSelectPayload {
  message: Message;
}

interface FormData {
  items: Array<{
    seatNumber: string;
  }>;
}

export default function TRV12busSeatSelection({
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

  const isOnSelectPayload = (data: unknown): data is OnSelectPayload => {
    if (!data || typeof data !== "object") return false;
    const obj = data as Record<string, unknown>;
    if (!obj.message || typeof obj.message !== "object") return false;
    const message = obj.message as Record<string, unknown>;
    if (!message.order || typeof message.order !== "object") return false;
    const order = message.order as Record<string, unknown>;
    if (!Array.isArray(order.fulfillments)) return false;
    return true;
  };

  const parseAndSetData = (data: OnSelectPayload) => {
    try {
      if (!data?.message?.order?.fulfillments) {
        throw new Error("Invalid payload structure: missing fulfillments");
      }

      // 1. Calculate allowed seats count (fulfillments of type TICKET)
      const ticketFulfillments = data.message.order.fulfillments.filter(
        (f: Fulfillment) => f.type === "TICKET"
      );
      setAllowedSeatsCount(ticketFulfillments.length);

      // 2. Extract available seats (fulfillments of type TRIP -> tags)
      const tripFulfillment = data.message.order.fulfillments.find(
        (f: Fulfillment) => f.type === "TRIP"
      );

      const seats: string[] = [];
      if (tripFulfillment && tripFulfillment.tags) {
        tripFulfillment.tags.forEach((tag: Tag) => {
          if (tag.descriptor.code === "SEAT_GRID") {
            const seatNumberArg = tag.list.find(
              (item: TagListItem) => item.descriptor.code === "NUMBER"
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
    if (!isOnSelectPayload(pastedPayload)) {
      setErrorWhilePaste("Invalid payload structure.");
      toast.error("Invalid payload structure");
      return;
    }
    parseAndSetData(pastedPayload);
    setIsPayloadEditorActive(false);
  };

  const { control, register, handleSubmit } = useForm({
    defaultValues: {
      items: [{ seatNumber: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = useWatch({
    control,
    name: "items",
  });

  const inputStyle =
    "border rounded p-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
  const labelStyle = "mb-1 font-semibold";
  const fieldWrapperStyle = "flex flex-col mb-2";

  const onSubmit = async (data: FormData) => {
    const cleanedData = {
      items: data.items
        .map((item) => ({
          seatNumber: item.seatNumber?.trim(),
        }))
        .filter((item) => item.seatNumber !== ""),
    };

    await submitEvent({ jsonPath: {}, formData: cleanedData as unknown as Record<string, string> });
  };

  return (
    <div className="p-4">
      {isPayloadEditorActive && <PayloadEditor onAdd={handlePaste} />}
      {errorWhilePaste && <p className="text-red-500 text-sm italic mt-1">{errorWhilePaste}</p>}

      <div className="flex justify-start mb-2 items-center gap-2">
        <button
          type="button"
          onClick={() => setIsPayloadEditorActive(true)}
          className="p-2 border rounded-full hover:bg-gray-100"
          title="Paste Payload"
        >
          <FaRegPaste size={14} />
        </button>
        <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded">
          Please enter the on_select payload to select the seat here
        </span>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        Allowed Seats: {allowedSeatsCount} <br />
        Available Seats: {availableSeats.length > 0 ? availableSeats.join(", ") : "None loaded"}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="border p-3 rounded space-y-2">
            <div className={fieldWrapperStyle}>
              <label className={labelStyle}>Seat {index + 1}</label>
              <div className="flex items-center gap-2">
                <select {...register(`items.${index}.seatNumber`)} className={inputStyle}>
                  <option value="">Select a seat</option>
                  {availableSeats
                    .filter((seat) => {
                      const otherSelectedSeats = watchedItems
                        ?.filter((_, i: number) => i !== index)
                        .map((item: { seatNumber: string }) => item.seatNumber);
                      return !otherSelectedSeats?.includes(seat);
                    })
                    .map((seat) => (
                      <option key={seat} value={seat}>
                        {seat}
                      </option>
                    ))}
                </select>
                <FaTrash
                  onClick={() => remove(index)}
                  className="text-red-600 cursor-pointer hover:text-red-800 w-5 h-5"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => append({ seatNumber: "" })}
            disabled={fields.length >= allowedSeatsCount}
            className={`px-4 py-2 text-white rounded ${
              fields.length >= allowedSeatsCount
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Add Seat
          </button>

          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
