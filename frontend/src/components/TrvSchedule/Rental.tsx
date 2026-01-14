import { useState } from "react";
import { useForm } from "react-hook-form";
import PayloadEditor from "@components/PayloadEditor";
import { SubmitEventParams } from "@/types/flow-types";
import { toast } from "react-toastify";

export default function TRV10ScheduleRentalForm({
  submitEvent,
}: {
  submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
  const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      city_code: "",
      start_gps: "",
      scheduled_time: "",
    },
  });

  interface PastePayload {
    message?: unknown;
  }

  const handlePaste = (_payload: PastePayload) => {
    setIsPayloadEditorActive(false);
    toast.success("Payload pasted successfully");
  };

  interface FormData {
    city_code: string;
    start_gps: string;
    scheduled_time: string;
  }

  const onSubmit = async (data: FormData) => {
    try {
      const formattedData = {
        ...data,
        scheduled_time: new Date(data.scheduled_time).toISOString(),
      };

      await submitEvent({
        jsonPath: {
          city_code: "$.context.location.city.code",
          start_gps: "$.message.intent.fulfillment.stops[?(@.type=='START')].location.gps",
          scheduled_time: "$.message.intent.fulfillment.stops[?(@.type=='START')].time.timestamp",
        },
        formData: formattedData,
      });
    } catch (err) {
      console.error(err);
      toast.error("Submission failed");
    }
  };

  return (
    <div>
      {isPayloadEditorActive && (
        <PayloadEditor
          mode="modal"
          onAdd={(payload: unknown) => handlePaste(payload as PastePayload)}
        />
      )}

      <button
        type="button"
        onClick={() => setIsPayloadEditorActive(true)}
        className="p-2 border rounded-full hover:bg-gray-100 mb-4"
      >
        Paste Payload
      </button>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 h-[500px] overflow-y-scroll p-4">
        <div className="flex flex-col">
          <label className="mb-1 font-semibold">Enter city code</label>
          <input type="text" className="border rounded p-2" {...register("city_code")} />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-semibold">Enter start gps coordinates</label>
          <input
            type="text"
            className="border rounded p-2"
            placeholder="12.9716,77.5946"
            {...register("start_gps")}
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-semibold">Enter Time (24-hour format)</label>
          <input
            type="datetime-local"
            className="border rounded p-2"
            {...register("scheduled_time")}
          />
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
