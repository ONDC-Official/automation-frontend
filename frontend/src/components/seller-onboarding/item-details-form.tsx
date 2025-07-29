import React, { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  ItemDetails,
  SellerOnboardingData,
} from "../../pages/seller-onboarding";
import { toast } from "react-toastify";
import { FaPlus, FaMinus, FaBox } from "react-icons/fa";
import { Select, Input } from "antd";
import LoadingButton from "../ui/forms/loading-button";
import { categoryProtocolMappings, countries } from "../../constants/common";

interface ItemDetailsFormProps {
  initialData: SellerOnboardingData;
  onNext: (data: Partial<SellerOnboardingData>) => void;
  onPrevious: () => void;
}

interface FormData {
  items: ItemDetails[];
}

const ItemDetailsForm: React.FC<ItemDetailsFormProps> = ({
  initialData,
  onNext,
  onPrevious,
}) => {
  const [selectedSubCategory, setSelectedSubCategory] = useState("");

  console.log("selectedSubCategory", selectedSubCategory);
  const parseDuration = (duration: string) => {
    if (!duration) return { unit: "hour", value: "1" };

    const dayMatch = duration.match(/^P(\d+)D$/);
    if (dayMatch) {
      return { unit: "day", value: dayMatch[1] };
    }

    const hourMatch = duration.match(/^PT(\d+)H$/);
    if (hourMatch) {
      return { unit: "hour", value: hourMatch[1] };
    }

    const minuteMatch = duration.match(/^PT(\d+)M$/);
    if (minuteMatch) {
      return { unit: "minute", value: minuteMatch[1] };
    }

    return { unit: "hour", value: "1" };
  };

  const processInitialItems = () => {
    return (
      initialData.items?.map((item) => {
        const processedItem = { ...item };

        // if (item.code && item.code.includes(":")) {
        //   const [type, ...valueParts] = item.code.split(":");
        //   processedItem.code_type = type;
        //   processedItem.code_value = valueParts.join(":");
        // }

        if (item.return_window) {
          const parsed = parseDuration(item.return_window);
          processedItem.return_window_unit = parsed.unit;
          processedItem.return_window_value = parsed.value;
        }

        if (item.replacement_window) {
          const parsed = parseDuration(item.replacement_window);
          processedItem.replacement_window_unit = parsed.unit;
          processedItem.replacement_window_value = parsed.value;
        }

        if (item.time_to_ship) {
          const parsed = parseDuration(item.time_to_ship);
          processedItem.time_to_ship_unit = parsed.unit;
          processedItem.time_to_ship_value = parsed.value;
        }

        return processedItem;
      }) || [
        {
          name: "",
          domain: "",
          code_type: "EAN",
          code_value: "",
          symbol: "",
          short_desc: "",
          long_desc: "",
          images: "",
          unit: "",
          value: "",
          available_count: "",
          maximum_count: "",
          minimum_count: "",
          selling_price: "",
          mrp: "",
          currency: "INR",
          brand: "",
          category: "",
          default_fulfillment_type: "Delivery",
          store: "",
          returnable: true,
          cancellable: true,
          return_window: "PT1H",
          return_window_unit: "hour",
          return_window_value: "1",
          replacement_window: "PT1H",
          replacement_window_unit: "hour",
          replacement_window_value: "1",
          time_to_ship: "PT45M",
          time_to_ship_unit: "minute",
          time_to_ship_value: "45",
          cod_availability: false,
          consumer_care_name: "",
          consumer_care_email: "",
          consumer_care_contact: "",
          // Miscellaneous Details
          country_of_origin: "",
          veg_non_veg: "",
          back_image: "",
          refer_back_image: false,
          // Statutory Requirements - Packaged Commodities
          manufacturer_or_packer_name: "",
          manufacturer_or_packer_address: "",
          common_or_generic_name_of_commodity: "",
          net_quantity_or_measure_of_commodity_in_pkg: "",
          month_year_of_manufacture_packing_import: "",
          // Statutory Requirements - Prepackaged Food
          imported_product_country_of_origin: "",
          nutritional_info: "",
          additives_info: "",
          brand_owner_name: "",
          brand_owner_address: "",
          brand_owner_fssai_license_no: "",
          other_fssai_license_no: "",
          importer_name: "",
          importer_address: "",
          importer_fssai_license_no: "",
        },
      ]
    );
  };

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      items: processInitialItems(),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");

  const updateIsoDuration = (
    index: number,
    field: string,
    unit: string,
    value: string
  ) => {
    const isoValue =
      unit === "day"
        ? `P${value}D`
        : `PT${value}${unit === "hour" ? "H" : "M"}`;
    setValue(`items.${index}.${field}` as any, isoValue);
  };

  const updateCode = (index: number, type: string, value: string) => {
    setValue(`items.${index}.code` as any, `${type}:${value}`);
  };

  const addItem = () => {
    append({
      name: "",
      domain: "",
      code_type: "EAN",
      code_value: "",
      symbol: "",
      short_desc: "",
      long_desc: "",
      images: "",
      unit: "",
      value: "",
      available_count: "",
      maximum_count: "",
      minimum_count: "",
      selling_price: "",
      mrp: "",
      currency: "INR",
      brand: "",
      category: "",
      default_fulfillment_type: "Delivery",
      store: "",
      returnable: true,
      cancellable: true,
      return_window: "PT1H",
      return_window_unit: "hour",
      return_window_value: "1",
      replacement_window: "PT1H",
      replacement_window_unit: "hour",
      replacement_window_value: "1",
      time_to_ship: "PT45M",
      time_to_ship_unit: "minute",
      time_to_ship_value: "45",
      cod_availability: false,
      consumer_care_name: "",
      consumer_care_email: "",
      consumer_care_contact: "",
      // Miscellaneous Details
      country_of_origin: "",
      veg_non_veg: "",
      back_image: "",
      refer_back_image: false,
      // Statutory Requirements - Packaged Commodities
      manufacturer_or_packer_name: "",
      manufacturer_or_packer_address: "",
      common_or_generic_name_of_commodity: "",
      net_quantity_or_measure_of_commodity_in_pkg: "",
      month_year_of_manufacture_packing_import: "",
      // Statutory Requirements - Prepackaged Food
      imported_product_country_of_origin: "",
      nutritional_info: "",
      additives_info: "",
      brand_owner_name: "",
      brand_owner_address: "",
      brand_owner_fssai_license_no: "",
      other_fssai_license_no: "",
      importer_name: "",
      importer_address: "",
      importer_fssai_license_no: "",
    });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      toast.error("At least one item is required");
    }
  };

  const onSubmit = (data: FormData) => {
    onNext(data);
    toast.success("Item details saved successfully!");
  };

  function getProtocolKeysByCategory(category: string): string[] {
    const mapping = categoryProtocolMappings.find(
      (item) => item.category.toLowerCase() === category.toLowerCase()
    );
    return mapping?.protocolKeys || [];
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Item Details</h2>
        <p className="text-gray-600">
          Add your product/service items with detailed information
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="bg-gray-50 rounded-lg p-6 border border-gray-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <FaBox className="text-blue-500" />
                Item {index + 1}
              </h3>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-red-500 hover:text-red-700 p-1"
                disabled={fields.length === 1}
              >
                <FaMinus />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-700 mb-3">Description</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <Controller
                      name={`items.${index}.name`}
                      control={control}
                      rules={{ required: "Name is required" }}
                      render={({ field, fieldState: { error } }) => (
                        <>
                          <Input
                            {...field}
                            placeholder="Enter Item Name"
                            size="large"
                            status={error ? "error" : undefined}
                          />
                          {error && (
                            <p className="text-red-500 text-xs mt-1">
                              {error.message}
                            </p>
                          )}
                        </>
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Domain *
                    </label>
                    <Controller
                      name={`items.${index}.domain`}
                      control={control}
                      rules={{ required: "Domain is required" }}
                      render={({ field, fieldState: { error } }) => (
                        <>
                          <Select
                            {...field}
                            className="w-full"
                            size="large"
                            placeholder="Select Domain"
                            allowClear
                            status={error ? "error" : undefined}
                          >
                            {initialData?.domain?.map((domain) => (
                              <Select.Option key={domain} value={domain}>
                                {domain}
                              </Select.Option>
                            ))}
                          </Select>
                          {error && (
                            <p className="text-red-500 text-xs mt-1">
                              {error.message}
                            </p>
                          )}
                        </>
                      )}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Code *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Code Type *
                        </label>
                        <Controller
                          name={`items.${index}.code_type`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              className="w-full"
                              size="large"
                              placeholder="Select Code Type"
                              onChange={(value) => {
                                field.onChange(value);
                              }}
                            >
                              <Select.Option value="EAN">EAN</Select.Option>
                              <Select.Option value="ISBN">ISBN</Select.Option>
                              <Select.Option value="GTIN">GTIN</Select.Option>
                              <Select.Option value="HSN">HSN</Select.Option>
                              <Select.Option value="Others">
                                Others
                              </Select.Option>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">
                          Code Value *
                        </label>
                        <Controller
                          name={`items.${index}.code_value`}
                          control={control}
                          rules={{ required: "Code value is required" }}
                          render={({ field, fieldState: { error } }) => (
                            <>
                              <Input
                                {...field}
                                placeholder="Enter Code Value"
                                size="large"
                                status={error ? "error" : undefined}
                                onChange={(e) => {
                                  field.onChange(e);
                                  const codeType =
                                    watchItems[index]?.code_type || "EAN";
                                  updateCode(index, codeType, e.target.value);
                                }}
                              />
                              {error && (
                                <p className="text-red-500 text-xs mt-1">
                                  {error.message}
                                </p>
                              )}
                            </>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Symbol URL *
                    </label>
                    <Controller
                      name={`items.${index}.symbol`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="url"
                          placeholder="Enter Symbol Image URL"
                          size="large"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Images URL *
                    </label>
                    <Controller
                      name={`items.${index}.images`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="url"
                          placeholder="Enter Item Images URL"
                          size="large"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Short Description *
                    </label>
                    <Controller
                      name={`items.${index}.short_desc`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="Enter Short Description"
                          size="large"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Long Description *
                    </label>
                    <Controller
                      name={`items.${index}.long_desc`}
                      control={control}
                      render={({ field }) => (
                        <Input.TextArea
                          {...field}
                          placeholder="Enter Detailed Description"
                          rows={3}
                          size="large"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-3">Quantity</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit *
                    </label>
                    <Controller
                      name={`items.${index}.unit`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          className="w-full"
                          size="large"
                          placeholder="Select Unit"
                        >
                          <Select.Option value="unit">Unit</Select.Option>
                          <Select.Option value="dozen">Dozen</Select.Option>
                          <Select.Option value="gram">Gram</Select.Option>
                          <Select.Option value="litre">Litre</Select.Option>
                          <Select.Option value="millilitre">
                            Millilitre
                          </Select.Option>
                          <Select.Option value="kilogram">
                            Kilogram
                          </Select.Option>
                          <Select.Option value="tonne">Tonne</Select.Option>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Value *
                    </label>
                    <Controller
                      name={`items.${index}.value`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="Enter Quantity Value"
                          size="large"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Available Count *
                    </label>
                    <Controller
                      name={`items.${index}.available_count`}
                      control={control}
                      rules={{ required: "Available count is required" }}
                      render={({ field, fieldState: { error } }) => (
                        <>
                          <Select
                            {...field}
                            className="w-full"
                            size="large"
                            placeholder="Select Available Count"
                          >
                            <Select.Option value="99">99</Select.Option>
                            <Select.Option value="0">0</Select.Option>
                          </Select>
                         
                          {error && (
                            <p className="text-red-500 text-xs mt-1">
                              {error.message}
                            </p>
                          )}
                        </>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Count *
                    </label>
                    <Controller
                      name={`items.${index}.maximum_count`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          placeholder="Enter Maximum Count"
                          size="large"
                          min={0}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Count *
                    </label>
                    <Controller
                      name={`items.${index}.minimum_count`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          placeholder="Enter Minimum Count"
                          size="large"
                          min={0}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-3">Price</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selling Price *
                    </label>
                    <Controller
                      name={`items.${index}.selling_price`}
                      control={control}
                      rules={{ required: "Selling price is required" }}
                      render={({ field, fieldState: { error } }) => (
                        <>
                          <Input
                            {...field}
                            type="number"
                            placeholder="Enter Selling Price"
                            size="large"
                            min={0}
                            status={error ? "error" : undefined}
                          />
                          {error && (
                            <p className="text-red-500 text-xs mt-1">
                              {error.message}
                            </p>
                          )}
                        </>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MRP *
                    </label>
                    <Controller
                      name={`items.${index}.mrp`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          placeholder="Enter MRP"
                          size="large"
                          min={0}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency *
                    </label>
                    <Controller
                      name={`items.${index}.currency`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          className="w-full"
                          size="large"
                          placeholder="Select Currency"
                        >
                          <Select.Option value="INR">INR</Select.Option>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-700 mb-3">
                  Additional Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Store *
                    </label>
                    <Controller
                      name={`items.${index}.store`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          className="w-full"
                          size="large"
                          placeholder="Select Store"
                          allowClear
                          onChange={(value) => {
                            field.onChange(value);
                            setValue(`items.${index}.category` as any, "");
                          }}
                        >
                          {initialData?.stores?.map((store) => (
                            <Select.Option
                              value={store.locality}
                              key={store.locality}
                            >
                              {store.locality}
                            </Select.Option>
                          ))}
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <Controller
                      name={`items.${index}.category`}
                      control={control}
                      rules={{ required: "Category is required" }}
                      render={({ field, fieldState: { error } }) => {
                        const selectedStore = watchItems[index]?.store;
                        const store = initialData?.stores?.find(
                          (s) => s.locality === selectedStore
                        );
                        console.log("store", store);

                        const subcategories =
                          store?.supported_subcategories || [];
                        console.log("subcategories", subcategories);

                        return (
                          <>
                            <Select
                              {...field}
                              className="w-full"
                              size="large"
                              placeholder={
                                selectedStore
                                  ? "Select Category"
                                  : "Please Select A Store First"
                              }
                              disabled={!selectedStore}
                              status={error ? "error" : undefined}
                              onChange={(value) => {
                                field.onChange(value);
                                setSelectedSubCategory(value);
                              }}
                            >
                              {subcategories.length === 0 && selectedStore ? (
                                <Select.Option value="" disabled>
                                  No categories available for this store
                                </Select.Option>
                              ) : (
                                subcategories.map((category) => (
                                  <Select.Option
                                    value={category}
                                    key={category}
                                  >
                                    {category}
                                  </Select.Option>
                                ))
                              )}
                            </Select>
                            {error && (
                              <p className="text-red-500 text-xs mt-1">
                                {error.message}
                              </p>
                            )}
                          </>
                        );
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Fulfillment Type *
                    </label>
                    <Controller
                      name={`items.${index}.default_fulfillment_type`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          className="w-full"
                          size="large"
                          placeholder="Select Fulfillment Type"
                        >
                          <Select.Option value="Delivery">
                            Delivery
                          </Select.Option>
                          <Select.Option value="Self-Pickup">
                            Self-Pickup
                          </Select.Option>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Return Window *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Controller
                        name={`items.${index}.return_window_unit`}
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            className="w-full"
                            size="large"
                            placeholder="Select Time Unit"
                            onChange={(value) => {
                              field.onChange(value);
                             
                            }}
                          >
                            <Select.Option value="minute">
                              Minutes
                            </Select.Option>
                            <Select.Option value="hour">Hours</Select.Option>
                            <Select.Option value="day">Days</Select.Option>
                          </Select>
                        )}
                      />
                      <Controller
                        name={`items.${index}.return_window_value`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            placeholder="Value"
                            size="large"
                            min={1}
                            onChange={(e) => {
                              field.onChange(e);
                              const unit =
                                watchItems[index]?.return_window_unit || "hour";
                              updateIsoDuration(
                                index,
                                "return_window",
                                unit,
                                e.target.value
                              );
                            }}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Replacement Window *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Controller
                        name={`items.${index}.replacement_window_unit`}
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            className="w-full"
                            size="large"
                            placeholder="Select Time Unit"
                            onChange={(value) => {
                              field.onChange(value);
                              const numValue =
                                watchItems[index]?.replacement_window_value ||
                                "1";
                              updateIsoDuration(
                                index,
                                "replacement_window",
                                value,
                                numValue
                              );
                            }}
                          >
                            <Select.Option value="minute">
                              Minutes
                            </Select.Option>
                            <Select.Option value="hour">Hours</Select.Option>
                            <Select.Option value="day">Days</Select.Option>
                          </Select>
                        )}
                      />
                      <Controller
                        name={`items.${index}.replacement_window_value`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            placeholder="Value"
                            size="large"
                            min={1}
                            onChange={(e) => {
                              field.onChange(e);
                              const unit =
                                watchItems[index]?.replacement_window_unit ||
                                "hour";
                              updateIsoDuration(
                                index,
                                "replacement_window",
                                unit,
                                e.target.value
                              );
                            }}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time to Ship *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Controller
                        name={`items.${index}.time_to_ship_unit`}
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            className="w-full"
                            size="large"
                            placeholder="Select Time Unit"
                            onChange={(value) => {
                              field.onChange(value);
                              const numValue =
                                watchItems[index]?.time_to_ship_value || "45";
                              updateIsoDuration(
                                index,
                                "time_to_ship",
                                value,
                                numValue
                              );
                            }}
                          >
                            <Select.Option value="minute">
                              Minutes
                            </Select.Option>
                            <Select.Option value="hour">Hours</Select.Option>
                            <Select.Option value="day">Days</Select.Option>
                          </Select>
                        )}
                      />
                      <Controller
                        name={`items.${index}.time_to_ship_value`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            placeholder="Value"
                            size="large"
                            min={1}
                            onChange={(e) => {
                              field.onChange(e);
                              const unit =
                                watchItems[index]?.time_to_ship_unit ||
                                "minute";
                              updateIsoDuration(
                                index,
                                "time_to_ship",
                                unit,
                                e.target.value
                              );
                            }}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Returnable *
                    </label>
                    <Controller
                      name={`items.${index}.returnable`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          value={field.value ? "yes" : "no"}
                          onChange={(value) => field.onChange(value === "yes")}
                          className="w-full"
                          size="large"
                          placeholder="Select option"
                        >
                          <Select.Option value="yes">Yes</Select.Option>
                          <Select.Option value="no">No</Select.Option>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cancellable *
                    </label>
                    <Controller
                      name={`items.${index}.cancellable`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          value={field.value ? "yes" : "no"}
                          onChange={(value) => field.onChange(value === "yes")}
                          className="w-full"
                          size="large"
                          placeholder="Select option"
                        >
                          <Select.Option value="yes">Yes</Select.Option>
                          <Select.Option value="no">No</Select.Option>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CoD Availability *
                    </label>
                    <Controller
                      name={`items.${index}.cod_availability`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          value={field.value ? "yes" : "no"}
                          onChange={(value) => field.onChange(value === "yes")}
                          className="w-full"
                          size="large"
                          placeholder="Select option"
                        >
                          <Select.Option value="yes">Yes</Select.Option>
                          <Select.Option value="no">No</Select.Option>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </div>

              {(() => {
                const selectedCategory = watchItems[index]?.category || "";
                const protocolKeys =
                  getProtocolKeysByCategory(selectedCategory);

                if (protocolKeys.length === 0) return null;

                const hasPackaged = protocolKeys.includes(
                  "@ondc/org/statutory_reqs_packaged_commodities"
                );
                const hasPrepackaged = protocolKeys.includes(
                  "@ondc/org/statutory_reqs_prepackaged_food"
                );

                const referBackImage =
                  watchItems[index]?.refer_back_image || false;

                return (
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-gray-700 mb-3">
                      Statutory Requirements ({selectedCategory})
                    </h4>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Refer Back Image
                      </label>
                      <Controller
                        name={`items.${index}.refer_back_image`}
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            value={field.value ? "yes" : "no"}
                            onChange={(value) =>
                              field.onChange(value === "yes")
                            }
                            className="w-full"
                            size="large"
                            placeholder="Select option"
                          >
                            <Select.Option value="yes">Yes</Select.Option>
                            <Select.Option value="no">No</Select.Option>
                          </Select>
                        )}
                      />
                      {referBackImage && (
                        <p className="text-sm text-blue-600 mt-1">
                          When referring to back image, statutory requirements
                          are not needed.
                        </p>
                      )}
                    </div>

                    {!referBackImage && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {hasPackaged && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Manufacturer or Packer Name
                              </label>
                              <Controller
                                name={`items.${index}.manufacturer_or_packer_name`}
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    placeholder="Enter Manufacturer Or Packer Name"
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Manufacturer or Packer Address
                              </label>
                              <Controller
                                name={`items.${index}.manufacturer_or_packer_address`}
                                control={control}
                                render={({ field }) => (
                                  <Input.TextArea
                                    {...field}
                                    placeholder="Enter Manufacturer Or Packer Address"
                                    rows={2}
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Common or Generic Name of Commodity
                              </label>
                              <Controller
                                name={`items.${index}.common_or_generic_name_of_commodity`}
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    placeholder="Enter Common Or Generic Name"
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Net Quantity or Measure
                              </label>
                              <Controller
                                name={`items.${index}.net_quantity_or_measure_of_commodity_in_pkg`}
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    placeholder="e.g., 500g, 1L"
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Month and Year of Manufacture
                              </label>
                              <Controller
                                name={`items.${index}.month_year_of_manufacture_packing_import`}
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    placeholder="e.g., 10/2024"
                                    size="large"
                                    type="date"
                                  />
                                )}
                              />
                            </div>
                          </>
                        )}

                        {hasPrepackaged && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Imported Product Country of Origin
                              </label>
                              <Controller
                                name={`items.${index}.imported_product_country_of_origin`}
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    placeholder="Enter Country Of Origin"
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nutritional Info
                              </label>
                              <Controller
                                name={`items.${index}.nutritional_info`}
                                control={control}
                                render={({ field }) => (
                                  <Input.TextArea
                                    {...field}
                                    placeholder="Enter Nutritional Information"
                                    rows={3}
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Additives Info
                              </label>
                              <Controller
                                name={`items.${index}.additives_info`}
                                control={control}
                                render={({ field }) => (
                                  <Input.TextArea
                                    {...field}
                                    placeholder="Enter Additives Information"
                                    rows={2}
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Brand Owner Name
                              </label>
                              <Controller
                                name={`items.${index}.brand_owner_name`}
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    placeholder="Enter Brand Owner Name"
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Brand Owner Address
                              </label>
                              <Controller
                                name={`items.${index}.brand_owner_address`}
                                control={control}
                                render={({ field }) => (
                                  <Input.TextArea
                                    {...field}
                                    placeholder="Enter Brand Owner Address"
                                    rows={2}
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Brand Owner FSSAI License No
                              </label>
                              <Controller
                                name={`items.${index}.brand_owner_fssai_license_no`}
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    placeholder="Enter FSSAI License Number"
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Other FSSAI License No
                              </label>
                              <Controller
                                name={`items.${index}.other_fssai_license_no`}
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    placeholder="Enter other FSSAI license number"
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Importer Name
                              </label>
                              <Controller
                                name={`items.${index}.importer_name`}
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    placeholder="Enter Importer Name"
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Importer Address
                              </label>
                              <Controller
                                name={`items.${index}.importer_address`}
                                control={control}
                                render={({ field }) => (
                                  <Input.TextArea
                                    {...field}
                                    placeholder="Enter Importer Address"
                                    rows={2}
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Importer FSSAI License No
                              </label>
                              <Controller
                                name={`items.${index}.importer_fssai_license_no`}
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    placeholder="Enter Importer FSSAI License Number"
                                    size="large"
                                  />
                                )}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-700 mb-3">
                  Miscellaneous Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country of Origin
                    </label>
                    <Controller
                      name={`items.${index}.country_of_origin`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          className="w-full"
                          size="large"
                          placeholder="Select Country"
                          showSearch
                          filterOption={(input, option) =>
                            (option?.label ?? "")
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                          options={countries}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Veg/NonVeg/Egg
                    </label>
                    <Controller
                      name={`items.${index}.veg_non_veg`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          className="w-full"
                          size="large"
                          placeholder="Select type"
                          allowClear
                        >
                          <Select.Option value="veg">Veg</Select.Option>
                          <Select.Option value="non-veg">Non-Veg</Select.Option>
                          <Select.Option value="egg">Egg</Select.Option>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Back Image URL
                    </label>
                    <Controller
                      name={`items.${index}.back_image`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="url"
                          placeholder="Enter back image URL"
                          size="large"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Consumer Care Section */}
              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-700 mb-3">
                  Consumer Care
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <Controller
                      name={`items.${index}.consumer_care_name`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="Enter consumer care name"
                          size="large"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <Controller
                      name={`items.${index}.consumer_care_email`}
                      control={control}
                      rules={{
                        required: "Consumer care email is required",
                        pattern: {
                          value:
                            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                          message: "Please enter a valid email address",
                        },
                        validate: {
                          validEmail: (value: string | undefined) => {
                            if (!value) return true;
                            const email = value.toLowerCase();
                            if (email.includes(".."))
                              return "Email cannot contain consecutive dots";
                            if (email.startsWith(".") || email.endsWith("."))
                              return "Email cannot start or end with a dot";
                            if (email.split("@")[0].length > 64)
                              return "Local part of email is too long";
                            return true;
                          },
                        },
                      }}
                      render={({ field, fieldState: { error } }) => (
                        <>
                          <Input
                            {...field}
                            type="email"
                            placeholder="Enter consumer care email"
                            size="large"
                            status={error ? "error" : undefined}
                          />
                          {error && (
                            <p className="text-red-500 text-xs mt-1">
                              {error.message}
                            </p>
                          )}
                        </>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact No.
                    </label>
                    <Controller
                      name={`items.${index}.consumer_care_contact`}
                      control={control}
                      rules={{
                        required: "Contact number is required",
                        pattern: {
                          value: /^[+]?[1-9][0-9]{9,14}$/,
                          message:
                            "Please enter a valid contact number (10-15 digits)",
                        },
                        validate: {
                          validPhone: (value: string | undefined) => {
                            if (!value) return true;
                            // Remove spaces and hyphens for validation
                            const phone = value.replace(/[\s-]/g, "");
                            // Indian phone number validation
                            if (phone.startsWith("+91")) {
                              if (phone.length !== 13)
                                return "Indian number with +91 must be 13 digits total";
                              const numberPart = phone.substring(3);
                              if (!/^[6-9][0-9]{9}$/.test(numberPart))
                                return "Indian mobile numbers must start with 6-9";
                            } else if (phone.length === 10) {
                              if (!/^[6-9][0-9]{9}$/.test(phone))
                                return "Indian mobile numbers must start with 6-9";
                            } else if (!phone.startsWith("+")) {
                              return "Please enter 10 digit number or include country code with +";
                            }
                            return true;
                          },
                        },
                      }}
                      render={({ field, fieldState: { error } }) => (
                        <>
                          <Input
                            {...field}
                            type="tel"
                            placeholder="Enter contact number (e.g., 9876543210 or +919876543210)"
                            size="large"
                            maxLength={15}
                            status={error ? "error" : undefined}
                          />
                          {error && (
                            <p className="text-red-500 text-xs mt-1">
                              {error.message}
                            </p>
                          )}
                        </>
                      )}
                    />
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-700 mb-3">Attributes</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand
                    </label>
                    <Controller
                      name={`items.${index}.brand`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="Enter brand name"
                          size="large"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="text-center">
          <button
            type="button"
            onClick={addItem}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2 mx-auto"
          >
            <FaPlus />
            Add Another Item
          </button>
        </div>

        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onPrevious}
            className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors duration-200"
          >
            Previous
          </button>
          <LoadingButton
            type="submit"
            buttonText="Next"
            isLoading={isSubmitting}
          />
        </div>
      </form>
    </div>
  );
};

export default ItemDetailsForm;
