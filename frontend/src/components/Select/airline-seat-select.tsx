import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "react-toastify";
import {
  ISeatFormData,
  IAirlineSeatSelectProps,
  FORM_STYLES,
  DEFAULT_SEAT_FORM_DATA,
} from "./airline.types";

export default function AirlineSeatSelect({
  submitEvent,
  defaultValues = DEFAULT_SEAT_FORM_DATA,
}: IAirlineSeatSelectProps) {
  const { control, register, handleSubmit } = useForm<ISeatFormData>({
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "seats",
  });

  const onSubmit = async (data: ISeatFormData) => {
    const seatNumbers = data.seats.map((s) => s.seatNumber.trim()).filter((s) => s !== "");

    if (seatNumbers.length === 0) {
      toast.error("Please enter at least one seat number");
      return;
    }

    // Format seats as expected by the API
    const formattedSeats = seatNumbers.map((seat) => ({
      value: seat,
    }));

    await submitEvent({
      jsonPath: {},
      formData: {
        seats: JSON.stringify(formattedSeats),
      },
    });
  };

  const { inputStyle, labelStyle, fieldWrapperStyle } = FORM_STYLES;

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">Select Seats</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <div className={fieldWrapperStyle + " flex-1"}>
              <label className={labelStyle}>Seat {index + 1}</label>
              <input
                type="text"
                placeholder="e.g. 12A"
                {...register(`seats.${index}.seatNumber`)}
                className={inputStyle}
              />
            </div>
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="mt-6 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => append({ seatNumber: "" })}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add Another Seat
        </button>

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Submit Seat Selection
        </button>
      </form>
    </div>
  );
}
