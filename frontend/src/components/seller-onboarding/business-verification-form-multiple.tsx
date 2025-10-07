import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { FaPlus, FaTrash, FaStore, FaClock } from "react-icons/fa";
import { Input, Select, DatePicker, Tabs } from "antd";
import TimeInput from "../ui/forms/time-input";
import { toast } from "react-toastify";
import LoadingButton from "../ui/forms/loading-button";
import {
  SellerOnboardingData,
  StoreDetails,
} from "../../pages/seller-onboarding";
import {
  indianStates,
  serviceabilityOptions,
  Types,
  unitOptions,
  weekDays,
} from "../../constants/common";
import { domainCategories } from "../../constants/categories";

interface BusinessVerificationFormProps {
  initialData: SellerOnboardingData;
  onNext: (data: Partial<SellerOnboardingData>) => void;
  onPrevious: () => void;
  isSubmitting?: boolean;
  isFinalStep?: boolean;
  onSubmit?: (data: Partial<SellerOnboardingData>) => void;
  category?: boolean;
  isFnBDomain?: boolean;
}

// Default timing structure
const defaultTiming = {
  type: undefined,
  day_from: undefined,
  day_to: undefined,
  time_from: "",
  time_to: "",
};

// Default store structure
const defaultStore: StoreDetails = {
  gps: "",
  locality: "",
  street: "",
  city: "",
  areaCode: "",
  state: undefined,
  holiday: [],
  phone: "",
  email: "",
  // Legacy single timing (kept for backward compatibility)
  type: undefined,
  day_from: undefined,
  day_to: undefined,
  time_from: "",
  time_to: "",
  // New multiple timings
  timings: [{ ...defaultTiming }],
  fssai_no: "",
  supported_subcategories: [],
  supported_fulfillments: undefined,
  minimum_order_value: 0,
  serviceabilities: [
    {
      location: "",
      category: "",
      type: undefined,
      val: "",
      unit: undefined,
    },
  ],
};

// Store Timings Section Component
const StoreTimingsSection = ({ storeIndex, control, watch }: any) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `stores.${storeIndex}.timings`,
  });

  const watchTimings = watch(`stores.${storeIndex}.timings`);
  const [timeFormat, setTimeFormat] = useState<"24h" | "12h">("24h");

  const handleFormatSync = (format: "24h" | "12h") => {
    setTimeFormat(format);
  };

  const addTiming = () => {
    append({ ...defaultTiming });
  };

  const removeTiming = (timingIndex: number) => {
    if (fields.length > 1) {
      remove(timingIndex);
    } else {
      toast.error("At least one timing configuration is required");
    }
  };

  return (
    <div className="space-y-4">
      {fields.map((field, timingIndex) => (
        <div
          key={field.id}
          className="border border-gray-200 rounded-lg p-4 bg-white"
        >
          <div className="flex justify-between items-start mb-4">
            <h5 className="text-sm font-semibold text-gray-700">
              Timing Configuration {timingIndex + 1}
            </h5>
            <div className="flex gap-2">
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTiming(timingIndex)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Remove timing"
                >
                  <FaTrash className="text-sm" />
                </button>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fulfillment Type<span className="text-red-500 ml-1">*</span>
              </label>
              <Controller
                name={`stores.${storeIndex}.timings.${timingIndex}.type`}
                control={control}
                rules={{
                  required: "Fulfillment type is required",
                }}
                render={({ field, fieldState: { error } }) => (
                  <>
                    <Select
                      {...field}
                      className="w-full"
                      size="large"
                      placeholder="Select Fulfillment Type"
                      allowClear
                      status={error ? "error" : undefined}
                    >
                      {Types.map((bt) => (
                        <Select.Option key={bt.value} value={bt.value}>
                          {bt.key}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operating Days - From
                <span className="text-red-500 ml-1">*</span>
              </label>
              <Controller
                name={`stores.${storeIndex}.timings.${timingIndex}.day_from`}
                control={control}
                rules={{
                  required: "Operating day from is required",
                }}
                render={({ field, fieldState: { error } }) => (
                  <>
                    <Select
                      {...field}
                      className="w-full"
                      size="large"
                      placeholder="Select Start Day"
                      allowClear
                      status={error ? "error" : undefined}
                    >
                      {weekDays.map((day) => (
                        <Select.Option key={day.value} value={day.value}>
                          {day.key}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operating Days - To<span className="text-red-500 ml-1">*</span>
              </label>
              <Controller
                name={`stores.${storeIndex}.timings.${timingIndex}.day_to`}
                control={control}
                rules={{
                  required: "Operating day to is required",
                }}
                render={({ field, fieldState: { error } }) => (
                  <>
                    <Select
                      {...field}
                      className="w-full"
                      size="large"
                      placeholder="Select End Day"
                      allowClear
                      status={error ? "error" : undefined}
                    >
                      {weekDays.map((day) => (
                        <Select.Option key={day.value} value={day.value}>
                          {day.key}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opening Time<span className="text-red-500 ml-1">*</span>
              </label>
              <Controller
                name={`stores.${storeIndex}.timings.${timingIndex}.time_from`}
                control={control}
                rules={{
                  required: "Opening time is required",
                }}
                render={({ field, fieldState: { error } }) => (
                  <>
                    <TimeInput
                      value={field.value}
                      onChange={field.onChange}
                      size="large"
                      status={error ? "error" : undefined}
                      format={timeFormat}
                      allowFormatToggle={true}
                      onFormatChange={handleFormatSync}
                      syncId={`store-${storeIndex}-timing-${timingIndex}`}
                      placeholder="Select opening time (24hr or 12hr format)"
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
                Closing Time<span className="text-red-500 ml-1">*</span>
              </label>
              <Controller
                name={`stores.${storeIndex}.timings.${timingIndex}.time_to`}
                control={control}
                rules={{
                  required: "Closing time is required",
                }}
                render={({ field, fieldState: { error } }) => (
                  <>
                    <TimeInput
                      value={field.value}
                      onChange={field.onChange}
                      size="large"
                      status={error ? "error" : undefined}
                      format={timeFormat}
                      allowFormatToggle={true}
                      onFormatChange={handleFormatSync}
                      syncId={`store-${storeIndex}-timing-${timingIndex}`}
                      placeholder="Select closing time (24hr or 12hr format)"
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

          {/* Show which days this timing covers */}
          {watchTimings?.[timingIndex]?.day_from &&
            watchTimings?.[timingIndex]?.day_to && (
              <div className="mt-3 text-xs text-gray-600">
                <span className="font-medium">Active:</span>{" "}
                {watchTimings[timingIndex].day_from} to{" "}
                {watchTimings[timingIndex].day_to}
                {watchTimings?.[timingIndex]?.type &&
                  ` • ${watchTimings[timingIndex].type}`}
              </div>
            )}
        </div>
      ))}

      <button
        type="button"
        onClick={addTiming}
        className="flex items-center gap-2 px-4 py-2 border border-sky-600 text-sky-600 rounded-md hover:bg-sky-50 transition-colors"
      >
        <FaPlus className="text-sm" /> Add Another Timing Configuration
      </button>

      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Tips:</strong> You can add multiple timing configurations for:
        </p>
        <ul className="text-xs text-blue-700 mt-1 ml-4 list-disc">
          <li>Different fulfillment types (Delivery, Pickup, etc.)</li>
          <li>Different day ranges (Weekdays vs Weekends)</li>
          <li>Special hours for specific days</li>
        </ul>
      </div>
    </div>
  );
};

const BusinessVerificationForm = ({
  initialData,
  onNext,
  onPrevious,
  isSubmitting = false,
  isFinalStep = false,
  onSubmit,
  isFnBDomain,
}: BusinessVerificationFormProps) => {
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [activeTabKey, setActiveTabKey] = useState<string>("0");
  function getCategoriesByDomains(domainNames: string[]): string[] {
    const categories: string[] = [];

    domainNames.forEach((name) => {
      const domain = domainCategories.find(
        (d) => d.domain.toLowerCase() === name.toLowerCase()
      );
      if (domain) {
        categories.push(...domain.categories);
      }
    });

    return categories;
  }

  useEffect(() => {
    try {
      if (initialData.domain) {
        const res = getCategoriesByDomains(initialData?.domain);
        setCategoryOptions(res);
      }
    } catch (error) {
      console.error("Error setting category options:", error);
      setCategoryOptions([]);
    }
  }, [initialData.domain]);

  const {
    handleSubmit,
    control,
    // formState: { errors },
    watch,
    // getValues,
    setValue,
    reset,
  } = useForm({
    defaultValues: {
      stores:
        initialData.stores && initialData.stores.length > 0
          ? initialData.stores.map((store) => ({
              ...store,
              // Ensure timings array exists
              timings:
                store.timings && store.timings.length > 0
                  ? store.timings
                  : [
                      {
                        type: store.type || undefined,
                        day_from: store.day_from || undefined,
                        day_to: store.day_to || undefined,
                        time_from: store.time_from || "",
                        time_to: store.time_to || "",
                      },
                    ],
            }))
          : [{ ...defaultStore }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "stores",
  });

  // Reset form when initialData changes (when navigating back)
  useEffect(() => {
    const storeData =
      initialData.stores && initialData.stores.length > 0
        ? initialData.stores.map((store) => ({
            ...store,
            // Ensure timings array exists
            timings:
              store.timings && store.timings.length > 0
                ? store.timings
                : [
                    {
                      type: store.type || undefined,
                      day_from: store.day_from || undefined,
                      day_to: store.day_to || undefined,
                      time_from: store.time_from || "",
                      time_to: store.time_to || "",
                    },
                  ],
          }))
        : [{ ...defaultStore }];

    reset({ stores: storeData });
  }, [initialData, reset]);

  const addStore = () => {
    append({ ...defaultStore });
    // Switch to the new store tab
    const newTabKey = fields.length.toString();
    setActiveTabKey(newTabKey);
  };

  const removeStore = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      // Switch to the first tab if current tab is being removed
      const currentActiveIndex = parseInt(activeTabKey);
      if (currentActiveIndex === index) {
        setActiveTabKey("0");
      } else if (currentActiveIndex > index) {
        // Adjust tab key if removing a tab before the current one
        setActiveTabKey((currentActiveIndex - 1).toString());
      }
    }
  };

  const convertTimeFormat = (time: string) => {
    if (!time) return "";
    return time.replace(":", "");
  };

  const onSubmitForm = (data: any) => {
    if (!data.stores || data.stores.length === 0) {
      toast.error("Please add at least one store before proceeding");
      return;
    }

    const hasValidStore = data.stores.some((store: any) => {
      const baseFieldsValid =
        store.gps &&
        store.locality &&
        store.street &&
        store.city &&
        store.areaCode &&
        store.state &&
        store.phone &&
        store.email;

      // Check timings validation
      const hasValidTimings =
        store.timings &&
        store.timings.length > 0 &&
        store.timings.some(
          (timing: any) =>
            timing.type &&
            timing.day_from &&
            timing.day_to &&
            timing.time_from &&
            timing.time_to
        );

      // Check additional required fields
      const additionalFieldsValid =
        store.supported_subcategories &&
        store.supported_subcategories.length > 0 &&
        store.supported_fulfillments &&
        store.minimum_order_value !== undefined &&
        store.minimum_order_value !== null &&
        store.minimum_order_value !== "";

      if (isFnBDomain) {
        return (
          baseFieldsValid &&
          store.fssai_no &&
          hasValidTimings &&
          additionalFieldsValid
        );
      }

      return baseFieldsValid && hasValidTimings && additionalFieldsValid;
    });

    if (!hasValidStore) {
      toast.error(
        "Please complete at least one store with all required fields before proceeding"
      );
      return;
    }

    const processedStores = data.stores.map((store: any) => {
      // Process timings
      let processedTimings = [];
      if (store.timings && store.timings.length > 0) {
        processedTimings = store.timings.map((timing: any) => ({
          type: timing.type || "",
          day_from: timing.day_from || "",
          day_to: timing.day_to || "",
          time_from: convertTimeFormat(timing.time_from) || "",
          time_to: convertTimeFormat(timing.time_to) || "",
        }));
      }

      return {
        gps: store.gps || "",
        locality: store.locality || "",
        street: store.street || "",
        city: store.city || "",
        areaCode: store.areaCode || "",
        state: store.state || "",
        holiday: store.holiday || [],
        phone: store.phone || "",
        email: store.email || "",

        // Legacy single timing (kept for backward compatibility)
        type: store.type || "",
        day_from: store.day_from || "",
        day_to: store.day_to || "",
        time_from: convertTimeFormat(store.time_from) || "",
        time_to: convertTimeFormat(store.time_to) || "",

        // New multiple timings
        timings: processedTimings,

        fssai_no: store.fssai_no || "",
        supported_subcategories: store?.supported_subcategories || [],
        supported_fulfillments: store?.supported_fulfillments || "",
        minimum_order_value: store.minimum_order_value || 0,

        // Serviceability
        serviceabilities: store.serviceabilities || [],
        serviceability_type: store.serviceability_type || "",
        subcategory: store.subcategory || "",
      };
    });

    const formData = {
      stores: processedStores,
      ...initialData,
    };

    if (isFinalStep && onSubmit) {
      onSubmit(formData);
    } else if (onNext) {
      onNext(formData);
    } else {
      console.error("No onNext or onSubmit handler provided!");
    }
  };

  const onFormError = (errors: any) => {
    console.log("Form validation errors:", errors);
  };

  // Render individual store content (defined before tabItems to avoid hoisting issues)
  const renderStoreContent = (index: number) => (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
      <div className="space-y-4 mb-6">
        <h4 className="text-md font-semibold text-gray-600">
          Location Details
        </h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GPS Coordinates<span className="text-red-500 ml-1">*</span>
            </label>
            <Controller
              name={`stores.${index}.gps`}
              control={control}
              rules={{
                required: "GPS coordinates are required",
                pattern: {
                  value:
                    /^-?([0-8]?[0-9]|90)(\.[0-9]{1,8})?,\s*-?((1[0-7][0-9]|[0-9]?[0-9])(\.[0-9]{1,8})?|180(\.0{1,8})?)$/,
                  message:
                    "Please enter valid GPS coordinates (e.g., 12.9716,77.5946)",
                },
                validate: {
                  validCoordinates: (value: string | undefined) => {
                    if (!value) return true;
                    const parts = value.split(",").map((p) => p.trim());
                    if (parts.length !== 2)
                      return "GPS coordinates must be in format: latitude,longitude";
                    const lat = parseFloat(parts[0]);
                    const lng = parseFloat(parts[1]);
                    if (isNaN(lat) || isNaN(lng))
                      return "Invalid GPS coordinates";
                    if (lat < -90 || lat > 90)
                      return "Latitude must be between -90 and 90";
                    if (lng < -180 || lng > 180)
                      return "Longitude must be between -180 and 180";
                    return true;
                  },
                },
              }}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input
                    {...field}
                    placeholder="Enter GPS Coordinates"
                    size="large"
                    status={error ? "error" : undefined}
                  />
                  {error && (
                    <p className="text-red-500 text-xs mt-1">{error.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Locality<span className="text-red-500 ml-1">*</span>
            </label>
            <Controller
              name={`stores.${index}.locality`}
              control={control}
              rules={{
                minLength: {
                  value: 3,
                  message: "Locality must be at least 3 characters",
                },
                maxLength: {
                  value: 100,
                  message: "Locality cannot exceed 100 characters",
                },
                pattern: {
                  value: /^[a-zA-Z\s\-.0-9]+$/,
                  message:
                    "Locality can only contain letters, numbers, spaces, hyphens, dots, and commas",
                },
              }}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input
                    {...field}
                    placeholder="Enter Locality"
                    size="large"
                    status={error ? "error" : undefined}
                  />
                  {error && (
                    <p className="text-red-500 text-xs mt-1">{error.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street<span className="text-red-500 ml-1">*</span>
            </label>
            <Controller
              name={`stores.${index}.street`}
              control={control}
              rules={{
                minLength: {
                  value: 5,
                  message: "Street address must be at least 5 characters",
                },
                maxLength: {
                  value: 200,
                  message: "Street address cannot exceed 200 characters",
                },
              }}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input
                    {...field}
                    placeholder="Enter Street Address"
                    size="large"
                    status={error ? "error" : undefined}
                  />
                  {error && (
                    <p className="text-red-500 text-xs mt-1">{error.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City<span className="text-red-500 ml-1">*</span>
            </label>
            <Controller
              name={`stores.${index}.city`}
              control={control}
              rules={{
                minLength: {
                  value: 2,
                  message: "City name must be at least 2 characters",
                },
                maxLength: {
                  value: 50,
                  message: "City name cannot exceed 50 characters",
                },
                pattern: {
                  value: /^[a-zA-Z\s\-.]+$/,
                  message:
                    "City name should only contain letters, spaces, hyphens, and dots",
                },
              }}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input
                    {...field}
                    placeholder="Enter City"
                    size="large"
                    status={error ? "error" : undefined}
                  />
                  {error && (
                    <p className="text-red-500 text-xs mt-1">{error.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PIN Code<span className="text-red-500 ml-1">*</span>
            </label>
            <Controller
              name={`stores.${index}.areaCode`}
              control={control}
              rules={{
                pattern: {
                  value: /^[1-9][0-9]{5}$/,
                  message: "PIN Code must be 6 digits and cannot start with 0",
                },
                validate: {
                  validPincode: (value: string | undefined) => {
                    if (!value) return true; // Allow empty values
                    const pincode = parseInt(value);
                    return (
                      (pincode >= 100000 && pincode <= 999999) ||
                      "Please enter a valid Indian PIN code"
                    );
                  },
                },
              }}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input
                    {...field}
                    placeholder="Enter PIN Code"
                    size="large"
                    status={error ? "error" : undefined}
                  />
                  {error && (
                    <p className="text-red-500 text-xs mt-1">{error.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State<span className="text-red-500 ml-1">*</span>
            </label>
            <Controller
              name={`stores.${index}.state`}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Select
                    {...field}
                    className="w-full"
                    size="large"
                    placeholder="Select State"
                    allowClear
                    status={error ? "error" : undefined}
                  >
                    {indianStates.map((state) => (
                      <Select.Option key={state.value} value={state.value}>
                        {state.key}
                      </Select.Option>
                    ))}
                  </Select>
                  {error && (
                    <p className="text-red-500 text-xs mt-1">{error.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone<span className="text-red-500 ml-1">*</span>
            </label>
            <Controller
              name={`stores.${index}.phone`}
              control={control}
              rules={{
                required: "Contact phone is required",
                pattern: {
                  value: /^[+]?[0-9]{10}$/,
                  message: "Phone number must be 10 digits",
                },
                validate: {
                  validPhone: (value: string | undefined) => {
                    if (!value) return true;
                    const cleaned = value.replace(/[^0-9+]/g, "");
                    if (cleaned.startsWith("+")) {
                      return (
                        (cleaned.length >= 11 && cleaned.length <= 16) ||
                        "International numbers must be 11-16 digits including country code"
                      );
                    }
                    return (
                      cleaned.length === 10 ||
                      "Indian phone numbers must be exactly 10 digits"
                    );
                  },
                },
              }}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input
                    {...field}
                    placeholder="Enter Contact Phone"
                    size="large"
                    status={error ? "error" : undefined}
                  />
                  {error && (
                    <p className="text-red-500 text-xs mt-1">{error.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email<span className="text-red-500 ml-1">*</span>
            </label>
            <Controller
              name={`stores.${index}.email`}
              control={control}
              rules={{
                required: "Contact email is required",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: "Please enter a valid email address",
                },
                validate: {
                  validEmail: (value: string | undefined) => {
                    if (!value) return true;
                    const trimmed = value.trim();
                    if (trimmed !== value) {
                      return "Email should not have leading or trailing spaces";
                    }
                    if (trimmed.includes("..")) {
                      return "Email cannot contain consecutive dots";
                    }
                    if (trimmed.startsWith(".") || trimmed.endsWith(".")) {
                      return "Email cannot start or end with a dot";
                    }
                    return true;
                  },
                },
              }}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input
                    {...field}
                    placeholder="Enter Contact Email"
                    size="large"
                    type="email"
                    status={error ? "error" : undefined}
                  />
                  {error && (
                    <p className="text-red-500 text-xs mt-1">{error.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Holiday Dates
            </label>
            <Controller
              name={`stores.${index}.holiday`}
              control={control}
              render={({ field, fieldState: { error } }) => {
                const selectedDates = field.value || [];

                const handleDateAdd = (dateStr: string) => {
                  if (dateStr && !selectedDates.includes(dateStr)) {
                    const newDates = [...selectedDates, dateStr];
                    field.onChange(newDates);
                  }
                };

                const handleDateRemove = (dateToRemove: string) => {
                  const newDates = selectedDates.filter(
                    (date) => date !== dateToRemove
                  );
                  field.onChange(newDates);
                };

                return (
                  <>
                    <div className="space-y-2">
                      <DatePicker
                        className="w-full"
                        size="large"
                        placeholder="Select a holiday date"
                        allowClear
                        status={error ? "error" : undefined}
                        format="YYYY-MM-DD"
                        value={null}
                        disabledDate={(current) => {
                          return current && current.isBefore(new Date(), "day");
                        }}
                        onChange={(date: any) => {
                          if (date) {
                            const dateStr = date.format("YYYY-MM-DD");
                            handleDateAdd(dateStr);
                          }
                        }}
                      />

                      {selectedDates.length > 0 && (
                        <div className="border border-gray-200 rounded-md p-2 bg-gray-50">
                          <div className="text-xs text-gray-600 mb-2">
                            Selected Holiday Dates:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {selectedDates.map((date, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {date}
                                <button
                                  type="button"
                                  onClick={() => handleDateRemove(date)}
                                  className="text-blue-600 hover:text-blue-800 ml-1"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {error && (
                      <p className="text-red-500 text-xs mt-1">
                        {error.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Select multiple dates when your store will be closed for
                      holidays
                    </p>
                  </>
                );
              }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-semibold text-gray-600 flex items-center gap-2">
            <FaClock className="text-sky-600" />
            Store Timings
          </h4>
        </div>

        <StoreTimingsSection
          storeIndex={index}
          control={control}
          watch={watch}
          setValue={setValue}
        />
      </div>

      <div className="space-y-4 mb-6">
        <h4 className="text-md font-semibold text-gray-600">
          Additional Details
        </h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isFnBDomain && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                FSSAI License No.<span className="text-red-500 ml-1">*</span>
              </label>
              <Controller
                name={`stores.${index}.fssai_no`}
                control={control}
                rules={{
                  required: "FSSAI License number is required",
                  pattern: {
                    value: /^[0-9]{14}$/,
                    message: "FSSAI License number must be exactly 14 digits",
                  },
                  validate: {
                    validFssai: (value: string | undefined) => {
                      if (!value) return true;
                      if (!/^[1-9][0-9]{13}$/.test(value)) {
                        return "FSSAI License number must start with 1-9 and be 14 digits total";
                      }
                      return true;
                    },
                  },
                }}
                render={({ field, fieldState: { error } }) => (
                  <>
                    <Input
                      {...field}
                      placeholder="Enter FSSAI License Number"
                      size="large"
                      maxLength={14}
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
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supported Subcategories
              <span className="text-red-500 ml-1">*</span>
            </label>
            <Controller
              name={`stores.${index}.supported_subcategories`}
              control={control}
              rules={{
                required: "Please select at least one subcategory",
                validate: {
                  notEmpty: (value) =>
                    value && value.length > 0
                      ? true
                      : "Please select at least one subcategory",
                },
              }}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Select
                    {...field}
                    mode="multiple"
                    className="w-full"
                    size="large"
                    placeholder="Select Subcategories"
                    allowClear
                    status={error ? "error" : undefined}
                    maxTagCount="responsive"
                    maxTagPlaceholder={(omittedValues) =>
                      `+${omittedValues.length} more`
                    }
                  >
                    {categoryOptions.map((category) => (
                      <Select.Option key={category} value={category}>
                        {category}
                      </Select.Option>
                    ))}
                  </Select>
                  {error && (
                    <p className="text-red-500 text-xs mt-1">{error.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Types of fulfillments supported
              <span className="text-red-500 ml-1">*</span>
            </label>
            <Controller
              name={`stores.${index}.supported_fulfillments`}
              control={control}
              rules={{
                required: "Please select a fulfillment type",
              }}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Select
                    {...field}
                    className="w-full"
                    size="large"
                    placeholder="Select Fulfillment Types"
                    allowClear
                    status={error ? "error" : undefined}
                  >
                    {Types.map((bt) => (
                      <Select.Option key={bt.value} value={bt.value}>
                        {bt.key}
                      </Select.Option>
                    ))}
                  </Select>
                  {error && (
                    <p className="text-red-500 text-xs mt-1">{error.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Order Value<span className="text-red-500 ml-1">*</span>
            </label>
            <Controller
              name={`stores.${index}.minimum_order_value`}
              control={control}
              rules={{
                required: "Minimum order value is required",
                pattern: {
                  value: /^[0-9]+(\.[0-9]{1,2})?$/,
                  message: "Please enter a valid amount (e.g., 100 or 100.50)",
                },
                min: {
                  value: 0,
                  message: "Minimum order value cannot be negative",
                },
              }}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input
                    {...field}
                    type="number"
                    placeholder="Enter Minimum Order Value"
                    size="large"
                    min={0}
                    status={error ? "error" : undefined}
                  />
                  {error && (
                    <p className="text-red-500 text-xs mt-1">{error.message}</p>
                  )}
                </>
              )}
            />
          </div>
        </div>
      </div>

      <ServiceabilitySection
        storeIndex={index}
        control={control}
        watch={watch}
        setValue={setValue}
      />
    </div>
  );

  // Create tab items for stores
  const tabItems = fields.map((_, index) => ({
    key: index.toString(),
    label: (
      <div className="flex items-center gap-2">
        <FaStore className="text-sky-600" />
        <span>Store {index + 1}</span>
        {fields.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeStore(index);
            }}
            className="ml-2 text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
            title="Remove Store"
          >
            <FaTrash className="text-xs" />
          </button>
        )}
      </div>
    ),
    children: renderStoreContent(index),
  }));

  return (
    <form
      onSubmit={handleSubmit(onSubmitForm, onFormError)}
      className="space-y-8"
    >
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FaStore className="text-sky-600" />
          Store Details
        </h2>
        <button
          type="button"
          onClick={addStore}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors"
        >
          <FaPlus /> Add Store
        </button>
      </div>

      <Tabs
        activeKey={activeTabKey}
        onChange={setActiveTabKey}
        type="card"
        className="mb-6"
        items={tabItems}
      />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> You have {fields.length} store
          {fields.length > 1 ? "s" : ""} configured. Each store will operate
          independently with its own timings and serviceability settings.
        </p>
      </div>

      {/* {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-red-800 font-semibold mb-2">
            Form Validation Errors:
          </h4>
          <pre className="text-xs text-red-700 overflow-auto">
            {JSON.stringify(errors, null, 2)}
          </pre>
        </div>
      )} */}

      <div className="flex justify-between pt-6 border-t">
        <button
          type="button"
          onClick={onPrevious}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={isSubmitting}
        >
          Previous
        </button>

        <LoadingButton
          buttonText={
            isFinalStep
              ? isSubmitting
                ? "Submitting..."
                : "Submit Application"
              : "Next Step"
          }
          type="submit"
          isLoading={isSubmitting}
        />
      </div>
    </form>
  );
};

const ServiceabilitySection = ({
  storeIndex,
  control,
  watch,
  setValue,
}: {
  storeIndex: number;
  control: any;
  watch: any;
  setValue: any;
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `stores.${storeIndex}.serviceabilities`,
  });

  const addServiceability = () => {
    append({
      location: `L${storeIndex + 1}`,
      category: "",
      type: undefined,
      val: "",
      unit: undefined,
    });
  };

  const watchServiceabilities = watch(`stores.${storeIndex}.serviceabilities`);
  const currentStore = watch(`stores.${storeIndex}`);
  const supportedSubcategories = currentStore?.supported_subcategories || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-semibold text-gray-600">
          Serviceability Details
        </h4>
        <button
          type="button"
          onClick={addServiceability}
          className="flex items-center gap-2 px-3 py-1 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors text-sm"
        >
          <FaPlus /> Add Serviceability
        </button>
      </div>

      {fields.map((field, serviceIndex) => {
        const serviceabilityType = watchServiceabilities?.[serviceIndex]?.type;

        return (
          <div
            key={field.id}
            className="border border-gray-200 rounded-lg p-4 bg-gray-50"
          >
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-sm font-semibold text-gray-600">
                Serviceability {serviceIndex + 1}
              </h5>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(serviceIndex)}
                  className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                >
                  <FaTrash />
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location ID
                </label>
                <Controller
                  name={`stores.${storeIndex}.serviceabilities.${serviceIndex}.location`}
                  control={control}
                  rules={{
                    required: "Location ID is required",
                    validate: {
                      noDuplicates: (value: string) => {
                        if (!value) return true;
                        const currentServiceability =
                          watchServiceabilities?.[serviceIndex];
                        if (!currentServiceability) return true;

                        const duplicateExists = watchServiceabilities?.some(
                          (srv: any, idx: number) => {
                            if (idx === serviceIndex) return false;

                            return (
                              srv.location === value &&
                              srv.category === currentServiceability.category &&
                              srv.type === currentServiceability.type &&
                              srv.val === currentServiceability.val &&
                              (srv.type === "10"
                                ? srv.unit === currentServiceability.unit
                                : true)
                            );
                          }
                        );

                        return duplicateExists
                          ? "A serviceability with these exact values already exists"
                          : true;
                      },
                    },
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <>
                      <Input
                        {...field}
                        placeholder="e.g., L1"
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
              </div> */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category<span className="text-red-500 ml-1">*</span>
                </label>
                <Controller
                  name={`stores.${storeIndex}.serviceabilities.${serviceIndex}.category`}
                  control={control}
                  rules={{
                    required: "Category is required",
                    validate: {
                      noDuplicates: (value: string) => {
                        if (!value) return true;
                        const currentServiceability =
                          watchServiceabilities?.[serviceIndex];
                        if (!currentServiceability) return true;

                        const duplicateExists = watchServiceabilities?.some(
                          (srv: any, idx: number) => {
                            if (idx === serviceIndex) return false;

                            return (
                              srv.location === currentServiceability.location &&
                              srv.category === value &&
                              srv.type === currentServiceability.type &&
                              srv.val === currentServiceability.val &&
                              (srv.type === "10"
                                ? srv.unit === currentServiceability.unit
                                : true)
                            );
                          }
                        );

                        return duplicateExists
                          ? "A serviceability with these exact values already exists"
                          : true;
                      },
                    },
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <>
                      <Select
                        {...field}
                        className="w-full"
                        size="large"
                        placeholder={
                          supportedSubcategories.length > 0
                            ? "Select Category"
                            : "No categories available"
                        }
                        allowClear
                        status={error ? "error" : undefined}
                        disabled={supportedSubcategories.length === 0}
                      >
                        {supportedSubcategories.map((category: string) => (
                          <Select.Option key={category} value={category}>
                            {category}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serviceability Type
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <Controller
                  name={`stores.${storeIndex}.serviceabilities.${serviceIndex}.type`}
                  control={control}
                  rules={{
                    required: "Serviceability type is required",
                    validate: {
                      noDuplicates: (value: string) => {
                        if (!value) return true;
                        const currentServiceability =
                          watchServiceabilities?.[serviceIndex];
                        if (!currentServiceability) return true;

                        const duplicateExists = watchServiceabilities?.some(
                          (srv: any, idx: number) => {
                            if (idx === serviceIndex) return false;

                            return (
                              srv.location === currentServiceability.location &&
                              srv.category === currentServiceability.category &&
                              srv.type === value &&
                              srv.val === currentServiceability.val &&
                              (value === "10"
                                ? srv.unit === currentServiceability.unit
                                : true)
                            );
                          }
                        );

                        return duplicateExists
                          ? "A serviceability with these exact values already exists"
                          : true;
                      },
                    },
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <>
                      <Select
                        {...field}
                        className="w-full"
                        size="large"
                        placeholder="Select Type"
                        allowClear
                        status={error ? "error" : undefined}
                        onChange={(value) => {
                          field.onChange(value);

                          // Always clear all related fields first when type changes
                          setValue(
                            `stores.${storeIndex}.serviceabilities.${serviceIndex}.val`,
                            ""
                          );
                          setValue(
                            `stores.${storeIndex}.serviceabilities.${serviceIndex}.unit`,
                            undefined
                          );
                          setValue(
                            `stores.${storeIndex}.serviceabilities.${serviceIndex}.location`,
                            `L${storeIndex + 1}`
                          );

                          // If no value selected (cleared), keep fields empty
                          if (!value) {
                            setValue(
                              `stores.${storeIndex}.serviceabilities.${serviceIndex}.location`,
                              `L${storeIndex + 1}`
                            );
                            return;
                          }

                          // Show user that fields were cleared due to type change
                          toast.info(
                            "Serviceability fields updated based on selected type"
                          );

                          // Set appropriate values based on serviceability type
                          if (value === "10") {
                            // Hyperlocal - clear for user input (radius and unit)
                            // val and unit will be filled by user
                            // Set default location
                            setValue(
                              `stores.${storeIndex}.serviceabilities.${serviceIndex}.location`,
                              `L${storeIndex + 1}`
                            );
                          } else if (value === "11") {
                            // Pincode - clear val for user input, set unit automatically
                            setValue(
                              `stores.${storeIndex}.serviceabilities.${serviceIndex}.unit`,
                              "pincode"
                            );
                            setValue(
                              `stores.${storeIndex}.serviceabilities.${serviceIndex}.location`,
                              `L${storeIndex + 1}`
                            );
                          } else if (value === "12") {
                            // PAN India - set both country code and unit automatically
                            setValue(
                              `stores.${storeIndex}.serviceabilities.${serviceIndex}.val`,
                              "IND"
                            );
                            setValue(
                              `stores.${storeIndex}.serviceabilities.${serviceIndex}.unit`,
                              "country"
                            );
                            setValue(
                              `stores.${storeIndex}.serviceabilities.${serviceIndex}.location`,
                              `L${storeIndex + 1}`
                            );
                          } else if (value === "13") {
                            // Polygon - set geojson unit, clear val for user input
                            setValue(
                              `stores.${storeIndex}.serviceabilities.${serviceIndex}.unit`,
                              "geojson"
                            );
                            setValue(
                              `stores.${storeIndex}.serviceabilities.${serviceIndex}.location`,
                              `L${storeIndex + 1}`
                            );
                          }
                        }}
                      >
                        {serviceabilityOptions.map((option) => (
                          <Select.Option
                            key={option.value}
                            value={option.value}
                          >
                            {option.key}
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
                <p className="text-xs text-gray-500 mt-1">
                  Recommended option for more accurate locations — polygon
                </p>
              </div>

              {serviceabilityType === "10" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Radius Value<span className="text-red-500 ml-1">*</span>
                    </label>
                    <Controller
                      name={`stores.${storeIndex}.serviceabilities.${serviceIndex}.val`}
                      control={control}
                      rules={{
                        required: "Radius value is required",
                        pattern: {
                          value: /^[0-9]+(\.[0-9]{1,2})?$/,
                          message: "Please enter a valid numeric value",
                        },
                        min: {
                          value: 0.1,
                          message: "Radius must be greater than 0",
                        },
                        validate: {
                          noDuplicates: (value: string) => {
                            if (!value) return true;
                            const currentServiceability =
                              watchServiceabilities?.[serviceIndex];
                            if (!currentServiceability) return true;

                            const duplicateExists = watchServiceabilities?.some(
                              (srv: any, idx: number) => {
                                if (idx === serviceIndex) return false;

                                return (
                                  srv.location ===
                                    currentServiceability.location &&
                                  srv.category ===
                                    currentServiceability.category &&
                                  srv.type === currentServiceability.type &&
                                  srv.val === value &&
                                  srv.unit === currentServiceability.unit
                                );
                              }
                            );

                            return duplicateExists
                              ? "A serviceability with these exact values already exists"
                              : true;
                          },
                        },
                      }}
                      render={({ field, fieldState: { error } }) => (
                        <>
                          <Input
                            {...field}
                            type="number"
                            placeholder="e.g., 5"
                            size="large"
                            min={0}
                            step="0.1"
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
                      Unit<span className="text-red-500 ml-1">*</span>
                    </label>
                    <Controller
                      name={`stores.${storeIndex}.serviceabilities.${serviceIndex}.unit`}
                      control={control}
                      rules={{
                        required: "Unit is required for hyperlocal type",
                        validate: {
                          noDuplicates: (value: string) => {
                            if (!value) return true;
                            const currentServiceability =
                              watchServiceabilities?.[serviceIndex];
                            if (!currentServiceability) return true;

                            const duplicateExists = watchServiceabilities?.some(
                              (srv: any, idx: number) => {
                                if (idx === serviceIndex) return false;

                                return (
                                  srv.location ===
                                    currentServiceability.location &&
                                  srv.category ===
                                    currentServiceability.category &&
                                  srv.type === currentServiceability.type &&
                                  srv.val === currentServiceability.val &&
                                  srv.unit === value
                                );
                              }
                            );

                            return duplicateExists
                              ? "A serviceability with these exact values already exists"
                              : true;
                          },
                        },
                      }}
                      render={({ field, fieldState: { error } }) => (
                        <>
                          <Select
                            {...field}
                            className="w-full"
                            size="large"
                            placeholder="Select Unit"
                            allowClear
                            status={error ? "error" : undefined}
                          >
                            {unitOptions.map((unit) => (
                              <Select.Option
                                key={unit.value}
                                value={unit.value}
                              >
                                {unit.key}
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
                </>
              )}

              {serviceabilityType === "11" && (
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pincodes (comma-separated)
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Controller
                    name={`stores.${storeIndex}.serviceabilities.${serviceIndex}.val`}
                    control={control}
                    rules={{
                      required: "Pincodes are required",
                      validate: {
                        validPincodes: (value: string) => {
                          if (!value) return "Pincodes are required";
                          const pincodes = value
                            .split(",")
                            .map((p) => p.trim());
                          for (const pincode of pincodes) {
                            if (!/^[1-9][0-9]{5}$/.test(pincode)) {
                              return `Invalid pincode: ${pincode}. Must be 6 digits and not start with 0`;
                            }
                          }
                          return true;
                        },
                        noDuplicates: (value: string) => {
                          if (!value) return true;
                          const currentServiceability =
                            watchServiceabilities?.[serviceIndex];
                          if (!currentServiceability) return true;

                          const duplicateExists = watchServiceabilities?.some(
                            (srv: any, idx: number) => {
                              if (idx === serviceIndex) return false;

                              return (
                                srv.location ===
                                  currentServiceability.location &&
                                srv.category ===
                                  currentServiceability.category &&
                                srv.type === currentServiceability.type &&
                                srv.val === value
                              );
                            }
                          );

                          return duplicateExists
                            ? "A serviceability with these exact values already exists"
                            : true;
                        },
                      },
                    }}
                    render={({ field, fieldState: { error } }) => (
                      <>
                        <Input.TextArea
                          {...field}
                          placeholder="e.g., 560001, 560002, 560003"
                          size="large"
                          rows={2}
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
              )}

              {serviceabilityType === "13" && (
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Polygon (GeoJSON format)
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Controller
                    name={`stores.${storeIndex}.serviceabilities.${serviceIndex}.val`}
                    control={control}
                    rules={{
                      required: "Polygon data is required",
                      validate: {
                        validGeoJson: (value: string) => {
                          if (!value) return "Polygon data is required";
                          try {
                            JSON.parse(value);
                            return true;
                          } catch (e) {
                            return "Invalid GeoJSON format";
                          }
                        },
                        noDuplicates: (value: string) => {
                          if (!value) return true;
                          const currentServiceability =
                            watchServiceabilities?.[serviceIndex];
                          if (!currentServiceability) return true;

                          // Check for duplicates
                          const duplicateExists = watchServiceabilities?.some(
                            (srv: any, idx: number) => {
                              if (idx === serviceIndex) return false; // Skip current item

                              // Check if all relevant fields match
                              return (
                                srv.location ===
                                  currentServiceability.location &&
                                srv.category ===
                                  currentServiceability.category &&
                                srv.type === currentServiceability.type &&
                                srv.val === value
                              );
                            }
                          );

                          return duplicateExists
                            ? "A serviceability with these exact values already exists"
                            : true;
                        },
                      },
                    }}
                    render={({ field, fieldState: { error } }) => (
                      <>
                        <Input.TextArea
                          {...field}
                          placeholder='{"type": "Polygon", "coordinates": [[[lng1, lat1], [lng2, lat2], ...]]}'
                          size="large"
                          rows={3}
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
              )}

              {serviceabilityType === "12" && (
                <>
                  <div className="lg:col-span-3 bg-blue-50 p-3 rounded">
                    <p className="text-sm text-blue-800">
                      Pan-India serviceability selected. This store will serve
                      customers across the entire country.
                    </p>
                  </div>
                  <Controller
                    name={`stores.${storeIndex}.serviceabilities.${serviceIndex}.val`}
                    control={control}
                    defaultValue="IND"
                    render={({ field }) => (
                      <input {...field} type="hidden" value="IND" />
                    )}
                  />
                  <Controller
                    name={`stores.${storeIndex}.serviceabilities.${serviceIndex}.unit`}
                    control={control}
                    defaultValue="country"
                    render={({ field }) => (
                      <input {...field} type="hidden" value="country" />
                    )}
                  />
                </>
              )}
            </div>
          </div>
        );
      })}

      {supportedSubcategories.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm mb-4">
          <p className="text-yellow-800">
            <strong>Important:</strong> No supported subcategories have been
            selected for this store. Please select supported subcategories in
            the Additional Details section above before configuring
            serviceability.
          </p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <p className="text-blue-800">
          <strong>Note:</strong> Serviceability defines where this store can
          deliver for each category:
        </p>
        <ul className="list-disc list-inside mt-2 text-blue-700">
          <li>
            <strong>Hyperlocal:</strong> Delivery within a specific radius
            (e.g., 5 km)
          </li>

          <li>
            <strong>Pan-India:</strong> Delivery across the entire country
          </li>
          <li>
            <strong>Polygon:</strong> Delivery within a custom geographic
            boundary
          </li>
        </ul>
      </div>
    </div>
  );
};

export default BusinessVerificationForm;
