import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { FaRegPaste } from "react-icons/fa6";
import PayloadEditor from "@components/PayloadEditor";
import { SubmitEventParams } from "@/types/flow-types";
import { toast } from "react-toastify";

interface FormItem {
  itemId: string;
  count: number;
  addOnId: string;
  addOnCount: number;
}

interface FormData {
  provider: string;
  fulfillment: string;
  items: FormItem[];
}

export default function AirlineSelect({
  submitEvent,
}: {
  submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
  const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
  const [errorWhilePaste, setErrorWhilePaste] = useState("");

  const { control, register, handleSubmit, setValue } = useForm<FormData>({
    defaultValues: {
      provider: "",
      fulfillment: "",
      items: [
        {
          itemId: "",
          count: 1,
          addOnId: "",
          addOnCount: 1,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  interface PastePayload {
    message?: {
      catalog?: {
        providers?: Array<{
          id?: string;
          fulfillments?: Array<{ id?: string }>;
        }>;
      };
    };
  }

  /* ------------------- HANDLE PASTE ------------------- */
  const handlePaste = (payload: PastePayload) => {
    try {
      if (!payload?.message?.catalog?.providers) {
        throw new Error("Invalid Schema");
      }

      const provider = payload.message.catalog.providers[0];

      setValue("provider", provider.id || "");
      setValue("fulfillment", provider.fulfillments?.[0]?.id || "");
    } catch (err) {
      setErrorWhilePaste("Invalid payload structure.");
      toast.error("Invalid payload structure");
      console.error(err);
    }

    setIsPayloadEditorActive(false);
  };

  /* ------------------- FINAL SUBMIT ------------------- */
  const onSubmit = async (data: FormData) => {
    const finalItems = data.items.map((item) => ({
      itemId: item.itemId,
      count: item.count,
      addOns: item.addOnId
        ? [
            {
              id: item.addOnId,
              count: item.addOnCount || 1,
            },
          ]
        : [],
    }));

    const finalPayload = {
      provider: data.provider,
      fulfillment: data.fulfillment,
      items: finalItems,
    };

    await submitEvent({
      jsonPath: {},
      formData: {
        data: JSON.stringify(finalPayload),
      },
    });
  };

  const inputStyle =
    "border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
  const labelStyle = "mb-1 font-semibold text-sm";
  const fieldWrapperStyle = "flex flex-col mb-2";

  return (
    <div>
      {isPayloadEditorActive && (
        <PayloadEditor
          mode="modal"
          onAdd={(payload: unknown) => handlePaste(payload as PastePayload)}
        />
      )}
      {errorWhilePaste && <p className="text-red-500 text-sm italic mt-1">{errorWhilePaste}</p>}

      <button
        type="button"
        onClick={() => setIsPayloadEditorActive(true)}
        className="p-2 border rounded-full hover:bg-gray-100 mb-3"
      >
        <FaRegPaste size={14} />
      </button>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 h-[500px] overflow-y-scroll p-4">
        {fields.map((field, index) => (
          <div key={field.id} className="border p-4 rounded-lg space-y-2">
            {/* ITEM ID */}
            <div className={fieldWrapperStyle}>
              <label className={labelStyle}>Item ID</label>
              <input
                type="text"
                placeholder="Enter Item ID"
                {...register(`items.${index}.itemId`)}
                className={inputStyle}
              />
            </div>

            {/* ITEM QUANTITY */}
            <div className={fieldWrapperStyle}>
              <label className={labelStyle}>Item Quantity</label>
              <input
                type="number"
                min="1"
                {...register(`items.${index}.count`, {
                  valueAsNumber: true,
                })}
                className={inputStyle}
              />
            </div>

            {/* ADD-ON ID */}
            <div className={fieldWrapperStyle}>
              <label className={labelStyle}>Add-On ID</label>
              <input
                type="text"
                placeholder="Enter Add-On ID"
                {...register(`items.${index}.addOnId`)}
                className={inputStyle}
              />
            </div>

            {/* ADD-ON QUANTITY */}
            <div className={fieldWrapperStyle}>
              <label className={labelStyle}>Add-On Quantity</label>
              <input
                type="number"
                // min="1"
                {...register(`items.${index}.addOnCount`, {
                  valueAsNumber: true,
                })}
                className={inputStyle}
              />
            </div>

            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Remove Item
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            append({
              itemId: "",
              count: 1,
              addOnId: "",
              addOnCount: 1,
            })
          }
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add Another Item
        </button>

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
