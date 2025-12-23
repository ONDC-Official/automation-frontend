
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { FaRegPaste } from "react-icons/fa6";
import PayloadEditor from "../../mini-components/payload-editor";
import { SubmitEventParams } from "../../../../types/flow-types";
import { toast } from "react-toastify";

interface AddOnInfo {
  id: string;
  maxQuantity: number;
}

interface ExtractedItem {
  itemid: string;
  providerid: string;
  addOns: AddOnInfo[];
}

export default function TRV10AddOnSelect({
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
        items: [{ itemId: "", count: 1, addOns: [], providerid: "" }],
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
    const formattedData = {
      ...data,
      items: data.items.map((item: any) => ({
        ...item,
        addOns: item.addOns.map((addon: any) => ({
          id: addon.id,
          quantity: addon.quantity
        }))
      }))
    };
    await submitEvent({ jsonPath: {}, formData: formattedData });
  };

  const handlePaste = (payload: any) => {
    try {
      if (!payload?.message?.catalog?.providers) return [];
      const providers = payload.message.catalog.providers;

      const results: ExtractedItem[] = [];
      providers.forEach((provider: any) => {
        const providerId = provider.id;
        if (!provider.items) return;
        provider.items.forEach((item: any) => {

          results.push({
            itemid: item.id,
            providerid: providerId,
            addOns: (item.add_ons || []).map((addon: any) => ({
              id: addon.id,

              maxQuantity: addon.quantity?.maximum?.count || 10,
            })),
          });

        });
      });
      console.log("result: ", results);
      setItemOptions(results);
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
          const selectedOption = options.find(
            (opt) => opt.itemid === selectedId
          );

          if (selectedOption) {

            setValue(`items.${index}.addOns`, []);
            setValue(`items.${index}.providerid`, selectedOption.providerid);
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

            {(() => {
              // Find the extracted item corresponding to the selected itemId
              const currentItemId = selectedItems[index]?.itemId;
              const selectedExtracted = itemOptions.find(
                (opt) => opt.itemid === currentItemId
              );

              if (selectedExtracted && selectedExtracted.addOns?.length > 0) {
                return (
                  <div className={fieldWrapperStyle}>
                    <label className={labelStyle}>Add Ons</label>
                    <select
                      className={inputStyle}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        const prev = getValues(`items.${index}.addOns`) || [];
                        // check if already added by ID
                        if (!prev.some((addon: any) => addon.id === val)) {
                          setValue(`items.${index}.addOns`, [
                            ...prev,
                            { id: val, quantity: 1 },
                          ]);
                        }
                      }}
                      value=""
                    >
                      <option value="">Select Add Ons</option>
                      {selectedExtracted.addOns.map((c: AddOnInfo) => (
                        <option key={c.id} value={c.id}>
                          {c.id}
                        </option>
                      ))}
                    </select>

                    <div className="flex flex-col gap-2 mt-2">
                      {selectedItems[index]?.addOns?.map(
                        (selectedAddOn: any) => {
                          const addOnInfo = selectedExtracted.addOns.find(
                            (a) => a.id === selectedAddOn.id
                          );
                          const maxQty = addOnInfo?.maxQuantity ?? 0;

                          return (
                            <div
                              key={selectedAddOn.id}
                              className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-100"
                            >
                              <span className="font-medium text-sm text-blue-800 flex-1">
                                {selectedAddOn.id}
                              </span>
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-600">
                                  Qty:
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={maxQty}
                                  value={selectedAddOn.quantity}
                                  onChange={(e) => {
                                    const newQty = Number(e.target.value);
                                    if (newQty > maxQty) {
                                      toast.error(`Max quantity for ${selectedAddOn.id} is ${maxQty}`);
                                      return;
                                    }
                                    const currentAddOns = getValues(
                                      `items.${index}.addOns`
                                    );
                                    const updated = currentAddOns.map(
                                      (a: any) =>
                                        a.id === selectedAddOn.id
                                          ? { ...a, quantity: newQty }
                                          : a
                                    );
                                    setValue(
                                      `items.${index}.addOns`,
                                      updated
                                    );
                                  }}
                                  className="w-16 border rounded p-1 text-sm bg-white"
                                />
                                <span className="text-xs text-gray-400">
                                  (Max: {maxQty})
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentAddOns = getValues(
                                    `items.${index}.addOns`
                                  );
                                  setValue(
                                    `items.${index}.addOns`,
                                    currentAddOns.filter(
                                      (a: any) => a.id !== selectedAddOn.id
                                    )
                                  );
                                }}
                                className="text-red-500 hover:text-red-700 ml-2"
                              >
                                &times;
                              </button>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        ))}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => append({ itemId: "", count: 1, addOns: [], providerid: "" })}
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
        {/* <button
          type="button"
          onClick={() => {
            const values = getValues();
            console.log("Current form values:", values);
          }}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Preview Data
        </button> */}
      </form>
    </div>
  );
}
