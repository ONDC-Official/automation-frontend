import { useState } from "react";
import { useForm } from "react-hook-form";
import PayloadEditor from "../../mini-components/payload-editor";
import { SubmitEventParams } from "../../../../types/flow-types";
import { toast } from "react-toastify";

interface AddOnItem {
  itemId: string;
  addOns: string[];
}

export default function TRV10AddOnSelect({
  submitEvent,
}: {
  submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
  const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
  const [itemOptions, setItemOptions] = useState<AddOnItem[]>([]);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      items: [{ itemId: "", addOns: [], count: 1 }],
    },
  });

  const handlePaste = (payload: any) => {
    try {
      const items = payload?.message?.order?.items || [];
      const results: AddOnItem[] = items.map((item: any) => ({
        itemId: item.id,
        addOns: (item.add_ons || []).map((a: any) => a.id),
      }));
      setItemOptions(results);
    } catch (err) {
      toast.error("Invalid payload structure");
      console.error(err);
    }
    setIsPayloadEditorActive(false);
  };

  const onSubmit = async (data: any) => {
    console.log("Selected Data:", data);
    await submitEvent({ jsonPath: {}, formData: data });
  };

  return (
    <div>
      {isPayloadEditorActive && <PayloadEditor onAdd={handlePaste} />}

      <button
        type="button"
        onClick={() => setIsPayloadEditorActive(true)}
        className="p-2 border rounded-full hover:bg-gray-100 mb-4"
      >
        Paste Payload
      </button>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 h-[500px] overflow-y-scroll p-4"
      >
        {itemOptions.map((item, index) => (
          <div key={item.itemId} className="border p-3 rounded space-y-2">
            {/* Add Ons dropdown */}
            <div className="flex flex-col mb-2">
              <label className="mb-1 font-semibold">Select Add Ons</label>
              <select
                className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                {...register(`items.${index}.addOns`)}
              >
                <option value="">Select Add On</option>
                {item.addOns.map((addon) => (
                  <option key={addon} value={addon}>
                    {addon}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div className="flex flex-col mb-2">
              <label className="mb-1 font-semibold">Quantity</label>
              <input
                type="number"
                className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                {...register(`items.${index}.count`, { valueAsNumber: true })}
                defaultValue={1}
              />
            </div>
          </div>
        ))}

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
