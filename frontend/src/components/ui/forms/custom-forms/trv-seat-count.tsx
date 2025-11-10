import { useForm, useFieldArray } from "react-hook-form";
import { FaTrash } from "react-icons/fa"; 
import { SubmitEventParams } from "../../../../types/flow-types";

export default function TRV12busSeatSelection({
  submitEvent,
}: {
  submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
  const { control, register, handleSubmit } = useForm({
    defaultValues: {
      items: [{ seatNumber: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const inputStyle =
    "border rounded p-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
  const labelStyle = "mb-1 font-semibold";
  const fieldWrapperStyle = "flex flex-col mb-2";

  const onSubmit = async (data: any) => {
    const cleanedData = {
      items: data.items
        .map((item: any) => ({
          seatNumber: item.seatNumber?.trim(),
        }))
        .filter((item: any) => item.seatNumber !== ""),
    };

    await submitEvent({ jsonPath: {}, formData: cleanedData });
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="border p-3 rounded space-y-2">
            <div className={fieldWrapperStyle}>
              <label className={labelStyle}>Seat {index + 1}</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter seat number"
                  {...register(`items.${index}.seatNumber`)}
                  className={inputStyle}
                />
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
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
