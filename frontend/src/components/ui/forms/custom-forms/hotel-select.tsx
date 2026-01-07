import { useState } from "react";
import { useForm } from "react-hook-form";
import { FaRegPaste } from "react-icons/fa6";
import { toast } from "react-toastify";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import { SubmitEventParams } from "@/types/flow-types";

interface IHotelCatalogItem {
  id: string;
  name: string;
  locationIds: string[];
  addOns: { id: string; name: string }[];
}

interface IHotelFormData {
  itemId: string;
  quantity: number;
  addOnId: string;
  adultsCount: number;
  childrenCount: number;
  providerId: string;
  locationId: string;
}

interface IHotelSelectProps {
  submitEvent: (params: SubmitEventParams) => Promise<void>;
}

const FORM_STYLES = {
  inputStyle: "w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
  labelStyle: "block text-sm font-medium text-gray-700 mb-1",
  fieldWrapperStyle: "mb-4",
  sectionStyle: "border p-4 rounded-lg bg-gray-50 mb-4",
};

const DEFAULT_FORM_DATA: IHotelFormData = {
  itemId: "",
  quantity: 1,
  addOnId: "",
  adultsCount: 1,
  childrenCount: 0,
  providerId: "",
  locationId: "",
};

export default function HotelSelect({ submitEvent }: IHotelSelectProps) {
  const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
  const [errorWhilePaste, setErrorWhilePaste] = useState("");
  const [availableItems, setAvailableItems] = useState<IHotelCatalogItem[]>([]);

  const { register, handleSubmit, watch, reset } = useForm<IHotelFormData>({
    defaultValues: DEFAULT_FORM_DATA,
  });

  // Watch selected item to get its addons
  const selectedItemId = watch("itemId");
  const selectedItem = availableItems.find((item) => item.id === selectedItemId);
  const availableAddons = selectedItem?.addOns || [];

  /* ------------------- HANDLE PASTE ------------------- */
  const handlePaste = (payload: any) => {
    try {
      if (!payload?.message?.catalog?.providers) {
        throw new Error("Invalid Schema - Expected on_search payload with catalog.providers");
      }

      const provider = payload.message.catalog.providers[0];

      // Extract items from catalog
      const catalogItems: IHotelCatalogItem[] = (provider.items || []).map((item: any) => ({
        id: item.id,
        name: item.descriptor?.name || item.id,
        locationIds: item.location_ids || [],
        addOns: (item.add_ons || []).map((addon: any) => ({
          id: addon.id,
          name: addon.descriptor?.name || addon.descriptor?.short_desc || addon.id,
        })),
      }));

      setAvailableItems(catalogItems);
      setErrorWhilePaste("");

      // Pre-populate form with first item
      if (catalogItems.length > 0) {
        reset({
          providerId: provider.id,
          locationId: catalogItems[0].locationIds[0] || "",
          itemId: catalogItems[0].id,
          quantity: 1,
          addOnId: catalogItems[0].addOns?.[0]?.id || "",
          adultsCount: 1,
          childrenCount: 0,
        });
        toast.success(`Found ${catalogItems.length} items in catalog`);
      }
    } catch (err) {
      setErrorWhilePaste("Invalid payload structure. Expected on_search response.");
      toast.error("Invalid payload structure");
      console.error(err);
    }

    setIsPayloadEditorActive(false);
  };

  /* ------------------- FINAL SUBMIT ------------------- */
  const onSubmit = async (data: IHotelFormData) => {
    const selectPayload = {
      provider: {
        id: data.providerId,
      },
      items: [
        {
          id: data.itemId,
          location_ids: data.locationId ? [data.locationId] : [],
          quantity: {
            selected: {
              count: data.quantity,
            },
          },
          ...(data.addOnId && {
            add_ons: [{ id: data.addOnId }],
          }),
        },
      ],
      fulfillments: [
        {
          tags: [
            {
              descriptor: { code: "GUESTS" },
              list: [
                { descriptor: { code: "ADULTS" }, value: String(data.adultsCount) },
                { descriptor: { code: "CHILDREN" }, value: String(data.childrenCount) },
              ],
            },
          ],
        },
      ],
    };

    await submitEvent({
      jsonPath: {},
      formData: {
        data: JSON.stringify(selectPayload),
      },
    });
  };

  const { inputStyle, labelStyle, fieldWrapperStyle, sectionStyle } = FORM_STYLES;

  return (
    <div>
      {isPayloadEditorActive && <PayloadEditor onAdd={handlePaste} />}
      {errorWhilePaste && <p className="text-red-500 text-sm italic mt-1">{errorWhilePaste}</p>}

      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => setIsPayloadEditorActive(true)}
          className="p-2 border rounded-full hover:bg-gray-100 flex items-center gap-2"
          title="Paste on_search payload"
        >
          <FaRegPaste size={14} />
          <span className="text-sm">Paste on_search payload</span>
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 h-[500px] overflow-y-scroll p-4">
        {/* ITEM SELECTION */}
        <div className={sectionStyle}>
          <h3 className="font-semibold text-gray-800 mb-3">Room Selection</h3>

          {/* ITEM ID */}
          <div className={fieldWrapperStyle}>
            <label className={labelStyle}>
              Item ID <span className="text-red-500">*</span>
            </label>
            {availableItems.length > 0 ? (
              <select {...register("itemId", { required: true })} className={inputStyle}>
                <option value="">Select a room/item</option>
                {availableItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.id})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Paste on_search payload to populate items"
                {...register("itemId", { required: true })}
                className={inputStyle}
              />
            )}
          </div>

          {/* QUANTITY */}
          <div className={fieldWrapperStyle}>
            <label className={labelStyle}>
              Quantity (Number of rooms) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              {...register("quantity", { valueAsNumber: true, required: true })}
              className={inputStyle}
            />
          </div>

          {/* ADD-ON ID */}
          <div className={fieldWrapperStyle}>
            <label className={labelStyle}>Add-On (optional)</label>
            {availableAddons.length > 0 ? (
              <select {...register("addOnId")} className={inputStyle}>
                <option value="">No add-on</option>
                {availableAddons.map((addon) => (
                  <option key={addon.id} value={addon.id}>
                    {addon.name} ({addon.id})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="No add-ons available"
                {...register("addOnId")}
                className={inputStyle}
              />
            )}
          </div>
        </div>

        {/* GUEST DETAILS */}
        <div className={sectionStyle}>
          <h3 className="font-semibold text-gray-800 mb-3">Guest Details</h3>

          {/* ADULTS COUNT */}
          <div className={fieldWrapperStyle}>
            <label className={labelStyle}>
              Number of Adults <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              {...register("adultsCount", { valueAsNumber: true, required: true })}
              className={inputStyle}
            />
          </div>

          {/* CHILDREN COUNT */}
          <div className={fieldWrapperStyle}>
            <label className={labelStyle}>Number of Children</label>
            <input
              type="number"
              min="0"
              {...register("childrenCount", { valueAsNumber: true })}
              className={inputStyle}
            />
          </div>
        </div>

        {/* Hidden fields */}
        <input type="hidden" {...register("providerId")} />
        <input type="hidden" {...register("locationId")} />

        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
          Submit Select Request
        </button>
      </form>
    </div>
  );
}
