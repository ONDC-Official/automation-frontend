import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { FaRegPaste } from "react-icons/fa6";
import { toast } from "react-toastify";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import LoadingButton from "./loading-button";

interface CatalogItem {
  id: string;
  name: string;
  addOns: { id: string; name: string }[];
}

interface GenericFormWithPasteProps {
  defaultValues?: any;
  children: React.ReactNode;
  onSubmit: (data: any) => Promise<void>;
  className?: string;
  triggerSubmit?: boolean;
  enablePaste?: boolean;
}

const GenericFormWithPaste = ({
  defaultValues,
  children,
  onSubmit,
  className,
  triggerSubmit = false,
  enablePaste = false,
}: GenericFormWithPasteProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({ defaultValues });
  const isRequestTriggered = useRef(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
  const [errorWhilePaste, setErrorWhilePaste] = useState("");
  const [availableItems, setAvailableItems] = useState<CatalogItem[]>([]);

  // Watch selected item to get its addons
  const selectedItemId = watch("item_id");
  const selectedItem = availableItems.find((item) => item.id === selectedItemId);
  const availableAddons = selectedItem?.addOns || [];

  const handlePaste = (payload: any) => {
    try {
      if (!payload?.message?.catalog?.providers) {
        throw new Error("Invalid Schema - Expected on_search payload with catalog.providers");
      }

      const provider = payload.message.catalog.providers[0];
      const items = provider.items || [];

      if (!items.length) {
        throw new Error("No items found in catalog");
      }

      // Extract items with their addons
      const catalogItems: CatalogItem[] = items.map((item: any) => ({
        id: item.id,
        name: item.descriptor?.name || item.id,
        addOns: (item.add_ons || []).map((addon: any) => ({
          id: addon.id,
          name: addon.descriptor?.name || addon.descriptor?.short_desc || addon.id,
        })),
      }));

      setAvailableItems(catalogItems);

      const firstItem = catalogItems[0];

      // Set form values
      setValue("item_id", firstItem.id);
      setValue("quantity", "1");
      setValue("add_on_id", firstItem.addOns?.[0]?.id || "");
      setValue("adults_count", "1");
      setValue("children_count", "0");

      setErrorWhilePaste("");
      toast.success(`Found ${catalogItems.length} items in catalog`);
    } catch (err: any) {
      setErrorWhilePaste(err.message || "Invalid payload structure");
      toast.error(err.message || "Invalid payload structure");
      console.error(err);
    }

    setIsPayloadEditorActive(false);
  };

  const handleSubmitForm = async (data: any) => {
    setIsLoading(true);
    setIsSuccess(false);
    setIsError(false);
    try {
      await onSubmit(data);
      setIsSuccess(true);
    } catch (error: any) {
      setIsError(true);
      console.error(error?.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (triggerSubmit && !isRequestTriggered.current) {
      isRequestTriggered.current = true;
      handleSubmit(handleSubmitForm)();
    }
  }, []);

  // Custom render function that adds dropdowns for item_id and add_on_id when data is available
  const renderChildren = () => {
    return React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child;

      const childProps = child.props as any;
      const fieldName = childProps.name;

      // Replace item_id text input with dropdown when items are available
      if (fieldName === "item_id" && availableItems.length > 0) {
        return (
          <div className="mb-2 w-full bg-gray-50 border rounded-md p-2 flex">
            <div className="flex justify-between w-full">
              <label className="text-sm font-medium text-gray-600 mb-2">
                {childProps.label || "Item ID"} <span className="text-red-500 ml-1">*</span>
              </label>
            </div>
            <select
              {...register("item_id", { required: true })}
              className="p-2 rounded bg-transparent border outline-none focus:border-blue-500 w-full"
            >
              <option value="">Select an item</option>
              {availableItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.id})
                </option>
              ))}
            </select>
            {errors["item_id"] && (
              <p className="text-red-500 text-xs italic">This field is required</p>
            )}
          </div>
        );
      }

      // Replace add_on_id text input with dropdown when addons are available
      if (fieldName === "add_on_id" && availableAddons.length > 0) {
        return (
          <div className="mb-2 w-full bg-gray-50 border rounded-md p-2 flex">
            <div className="flex justify-between w-full">
              <label className="text-sm font-medium text-gray-600 mb-2">
                {childProps.label || "Add-on ID"}
              </label>
            </div>
            <select
              {...register("add_on_id")}
              className="p-2 rounded bg-transparent border outline-none focus:border-blue-500 w-full"
            >
              <option value="">No add-on (optional)</option>
              {availableAddons.map((addon) => (
                <option key={addon.id} value={addon.id}>
                  {addon.name} ({addon.id})
                </option>
              ))}
            </select>
          </div>
        );
      }

      // For other fields, pass register, errors, setValue as usual
      return React.cloneElement(child as React.ReactElement, { register, errors, setValue });
    });
  };

  return (
    <div>
      {enablePaste && (
        <>
          {isPayloadEditorActive && <PayloadEditor onAdd={handlePaste} />}
          {errorWhilePaste && <p className="text-red-500 text-sm italic mb-2">{errorWhilePaste}</p>}
          <button
            type="button"
            onClick={() => setIsPayloadEditorActive(true)}
            className="p-2 border rounded-full hover:bg-gray-100 mb-3 flex items-center gap-2"
            title="Paste on_search payload to auto-populate fields"
          >
            <FaRegPaste size={14} />
            <span className="text-sm">Paste on_search</span>
          </button>
        </>
      )}
      <form onSubmit={handleSubmit(handleSubmitForm)} className={className}>
        {renderChildren()}
        <LoadingButton type="submit" buttonText="Submit" isLoading={isLoading} isSuccess={isSuccess} isError={isError} />
      </form>
    </div>
  );
};

export default GenericFormWithPaste;
