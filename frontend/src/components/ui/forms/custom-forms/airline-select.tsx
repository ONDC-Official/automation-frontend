import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { FaRegPaste } from "react-icons/fa6";
import PayloadEditor from "../../mini-components/payload-editor";
import { SubmitEventParams } from "../../../../types/flow-types";
import { toast } from "react-toastify";

interface ExtractedItem {
  itemid: string;
  providerid: string;
  addOns: string[];
}

export default function AirlineSelect({
  submitEvent,
}: {
  submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
  const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
  const [errorWhilePaste, setErrorWhilePaste] = useState("");

  const { control, handleSubmit, watch, register, setValue, getValues } =
    useForm({
      defaultValues: {
        provider: "" as string,
        items: [{ itemId: "", count: 1, addOns: [] }],
      } as any,
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const selectedItems = watch("items");
  const [itemOptions, setItemOptions] = useState<ExtractedItem[]>([]);

  const onSubmit = async (data: any) => {
    console.log("Form Data", data);
    await submitEvent({ jsonPath: {}, formData: data });
  };

  const handlePaste = (payload: any) => {
    try {
      if (!payload?.message?.catalog?.providers) return [];

      const providers = payload.message.catalog.providers;
      const results: ExtractedItem[] = [];

      providers.forEach((provider: any) => {
        const providerId = provider.id;
        const fulfillmentId = provider.fulfillments?.[0]?.id;
        if (!fulfillmentId) return;

        if (!provider.items) return;

        setValue("fulfillment", fulfillmentId);

        provider.items.forEach((item: any) => {
          results.push({
            itemid: item.id,
            providerid: providerId,
            addOns: (item.add_ons || []).map((addon: any) => addon.id),
          });
        });
      });

      setItemOptions(results);
      console.log("result (no parent): ", results);
    } catch (err) {
      setErrorWhilePaste("Invalid payload structure.");
      toast.error("Invalid payload structure. Please check the pasted data.");
      console.error(err);
    }
    setIsPayloadEditorActive(false);
  };

  const inputStyle =
    "border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
  const labelStyle = "mb-1 font-semibold";
  const fieldWrapperStyle = "flex flex-col mb-2";

  const renderSelectOrInput = (
    name: string,
    options: ExtractedItem[],
    index: number,
    placeholder = ""
  ) => {
    if (options.length === 0) {
      return (
        <input
          type="text"
          {...register(name)}
          placeholder={placeholder}
          className={inputStyle}
        />
      );
    }
    return (
      <select
        {...register(name)}
        onChange={(e) => {
          const selectedId = e.target.value;
          const selectedOption = options.find((opt) => opt.itemid === selectedId);

          if (selectedOption) {
            setValue("provider", selectedOption.providerid);
            setValue(`items.${index}.addOns`, []);
          }
        }}
        className={inputStyle}
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option.itemid} value={option.itemid}>
            {option.itemid}
          </option>
        ))}
      </select>
    );
  };

  return (
    <div>
      {isPayloadEditorActive && <PayloadEditor onAdd={handlePaste} />}
      {errorWhilePaste && (
        <p className="text-red-500 text-sm italic mt-1">{errorWhilePaste}</p>
      )}
      <button
        type="button"
        onClick={() => setIsPayloadEditorActive(true)}
        className="p-2 border rounded-full hover:bg-gray-100"
      >
        <FaRegPaste size={14} />
      </button>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 h-[500px] overflow-y-scroll p-4"
      >
        {fields.map((field, index) => (
          <div key={field.id} className="border p-3 rounded space-y-2">
            <div className={fieldWrapperStyle}>
              <label className={labelStyle}>Select Item {index + 1}</label>
              {renderSelectOrInput(`items.${index}.itemId`, itemOptions, index)}
            </div>

            <div className={fieldWrapperStyle}>
              <label className={labelStyle}>Quantity</label>
              <input
                type="number"
                {...register(`items.${index}.count`, {
                  valueAsNumber: true,
                })}
                className={inputStyle}
              />
            </div>

            {itemOptions && itemOptions[index]?.addOns?.length > 0 && (
              <div className={fieldWrapperStyle}>
                <label className={labelStyle}>Add Ons</label>
                <select
                  className={inputStyle}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    const prev = getValues(`items.${index}.addOns`) || [];
                    if (!prev.includes(val)) {
                      setValue(`items.${index}.addOns`, [...prev, val]);
                    }
                  }}
                >
                  <option value="">Select Add Ons</option>
                  {itemOptions[index].addOns.map((c: any) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedItems[index]?.addOns?.map((c: any, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => append({ itemId: "", quantity: 1, location: "" })}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Item
          </button>
          {fields.length > 1 && (
            <button
              type="button"
              onClick={() => remove(fields.length - 1)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Remove Item
            </button>
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
