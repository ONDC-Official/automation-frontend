import {
  useForm,
  useFieldArray,
  Controller,
  Control,
  FieldValues,
  UseFormWatch,
} from "react-hook-form";
import { FormInput } from "@components/Input";
import LoadingButton from "@components/LoadingButton";
import { SellerOnboardingData, MenuItem } from "@pages/seller-onboarding";
import { weekDays } from "@constants/common";
import { Select, Button, Card, Modal, Checkbox, Tabs } from "antd";
import TimeInput from "@components/TimeInput";
import MultiImageUpload from "@/components/ImageUpload/multi-image-upload";
import { useFormImageState } from "@hooks/useImageUpload";
import { FaPlus, FaTrash, FaEdit, FaSitemap, FaClock } from "react-icons/fa";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import CustomMenuComprehensiveView from "./custom-menu-comprehensive-view";

interface CustomizationItem {
  id: string;
  name: string;
  price: string;
  description?: string;
  default?: boolean;
  vegNonVeg?: string;
}

interface CustomizationGroup {
  id: string;
  name: string;
  type: "single" | "multiple";
  required: boolean;
  minQuantity: number;
  maxQuantity: number;
  seq: number; // Display sequence for the customization group
  items: CustomizationItem[];
}

// interface AvailabilityTiming {
//   dayFrom?: string;
//   dayTo?: string;
//   timeFrom?: string;
//   timeTo?: string;
// }

interface CustomMenuFormEnhancedProps {
  initialData: SellerOnboardingData;
  onNext: (data: Partial<SellerOnboardingData>) => void;
  onPrevious: () => void;
  isFinalStep?: boolean;
}

// Component for managing multiple availability timings
interface AvailabilityTimingsSectionProps {
  menuIndex: number;
  control: unknown;
  watch: UseFormWatch<FieldValues>;
  setValue?: unknown;
  register?: unknown;
  errors?: unknown;
}

const AvailabilityTimingsSection = ({
  menuIndex,
  control,
  watch,
}: AvailabilityTimingsSectionProps) => {
  const {
    fields: timingFields,
    append: appendTiming,
    remove: removeTiming,
  } = useFieldArray({
    control: control as unknown as Control<FieldValues>,
    name: `menu.${menuIndex}.availabilityTimings`,
  });

  const watchTimings = watch(`menu.${menuIndex}.availabilityTimings`);
  const [timeFormat, setTimeFormat] = useState<"24h" | "12h">("12h");

  const handleFormatSync = (format: "24h" | "12h") => {
    setTimeFormat(format);
  };

  const addTiming = () => {
    appendTiming({
      dayFrom: "",
      dayTo: "",
      timeFrom: "",
      timeTo: "",
    });
  };

  const handleRemoveTiming = (timingIndex: number) => {
    if (timingFields.length > 1) {
      removeTiming(timingIndex);
    } else {
      toast.error("At least one availability timing is required");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <FaClock className="text-sky-600" />
          Availability Timings
        </h5>
        <button
          type="button"
          onClick={addTiming}
          className="text-sm px-3 py-1 border border-sky-600 text-sky-600 rounded-md hover:bg-sky-50 transition-colors"
        >
          + Add Timing
        </button>
      </div>

      {timingFields.map((field, timingIndex) => (
        <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-start mb-4">
            <h6 className="text-sm font-semibold text-gray-600">Timing {timingIndex + 1}</h6>
            {timingFields.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveTiming(timingIndex)}
                className="text-red-500 hover:text-red-700 p-1"
                title="Remove timing"
              >
                <FaTrash className="text-sm" />
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="mb-4 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available From (Day) <span className="text-red-500">*</span>
              </label>
              <Controller
                name={`menu.${menuIndex}.availabilityTimings.${timingIndex}.dayFrom`}
                control={control as Control<FieldValues>}
                rules={{ required: "Starting day is required" }}
                render={({ field, fieldState: { error } }) => (
                  <>
                    <Select
                      {...field}
                      placeholder="Select starting day"
                      className="w-full"
                      size="large"
                      allowClear
                      status={error ? "error" : undefined}
                    >
                      {weekDays.map((day) => (
                        <Select.Option key={day.value} value={day.value}>
                          {day.key}
                        </Select.Option>
                      ))}
                    </Select>
                    {error && <p className="text-red-500 text-xs italic mt-1">{error.message}</p>}
                  </>
                )}
              />
            </div>

            <div className="mb-4 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available To (Day) <span className="text-red-500">*</span>
              </label>
              <Controller
                name={`menu.${menuIndex}.availabilityTimings.${timingIndex}.dayTo`}
                control={control as Control<FieldValues>}
                rules={{ required: "Ending day is required" }}
                render={({ field, fieldState: { error } }) => (
                  <>
                    <Select
                      {...field}
                      placeholder="Select ending day"
                      className="w-full"
                      size="large"
                      allowClear
                      status={error ? "error" : undefined}
                    >
                      {weekDays.map((day) => (
                        <Select.Option key={day.value} value={day.value}>
                          {day.key}
                        </Select.Option>
                      ))}
                    </Select>
                    {error && <p className="text-red-500 text-xs italic mt-1">{error.message}</p>}
                  </>
                )}
              />
            </div>

            <div className="mb-4 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available From (Time) <span className="text-red-500">*</span>
              </label>
              <Controller
                name={`menu.${menuIndex}.availabilityTimings.${timingIndex}.timeFrom`}
                control={control as Control<FieldValues>}
                rules={{
                  required: "Start time is required",
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
                      syncId={`menu-${menuIndex}-timing-${timingIndex}`}
                      placeholder="Select start time (12hr or 24hr format)"
                    />
                    {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
                  </>
                )}
              />
            </div>

            <div className="mb-4 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available To (Time) <span className="text-red-500">*</span>
              </label>
              <Controller
                name={`menu.${menuIndex}.availabilityTimings.${timingIndex}.timeTo`}
                control={control as Control<FieldValues>}
                rules={{
                  required: "End time is required",
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
                      syncId={`menu-${menuIndex}-timing-${timingIndex}`}
                      placeholder="Select end time (12hr or 24hr format)"
                    />
                    {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
                  </>
                )}
              />
            </div>
          </div>

          {/* Show summary of this timing */}
          {watchTimings?.[timingIndex]?.dayFrom && watchTimings?.[timingIndex]?.dayTo && (
            <div className="mt-3 text-sm text-gray-600">
              <span className="font-medium">Active:</span> {watchTimings[timingIndex].dayFrom} to{" "}
              {watchTimings[timingIndex].dayTo}
              {watchTimings?.[timingIndex]?.timeFrom &&
                watchTimings?.[timingIndex]?.timeTo &&
                ` • ${watchTimings[timingIndex].timeFrom} - ${watchTimings[timingIndex].timeTo}`}
            </div>
          )}
        </div>
      ))}

      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Add multiple timings for different day ranges (e.g., weekdays vs
          weekends) or special hours.
        </p>
      </div>
    </div>
  );
};

const CustomMenuFormEnhanced = ({
  initialData,
  onNext,
  onPrevious,
  isFinalStep = true,
}: CustomMenuFormEnhancedProps) => {
  const [showCustomizationModal, setShowCustomizationModal] = useState<number | null>(null);
  const [editingGroup, setEditingGroup] = useState<CustomizationGroup | null>(null);

  // Use optimized hook for managing menu images
  const menuImages = useFormImageState<{ [menuIndex: number]: string[] }>({});

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm({
    defaultValues: {
      menu:
        initialData.menuItems && initialData.menuItems.length > 0
          ? initialData.menuItems.map((item: MenuItem) => ({
              ...item,
              // Ensure availabilityTimings array exists
              availabilityTimings:
                (
                  item as MenuItem & {
                    availabilityTimings?: Array<{
                      dayFrom?: string;
                      dayTo?: string;
                      timeFrom?: string;
                      timeTo?: string;
                    }>;
                  }
                ).availabilityTimings &&
                Array.isArray(
                  (item as MenuItem & { availabilityTimings?: unknown[] }).availabilityTimings
                ) &&
                ((item as MenuItem & { availabilityTimings?: unknown[] }).availabilityTimings
                  ?.length ?? 0) > 0
                  ? (item as MenuItem & { availabilityTimings?: unknown[] }).availabilityTimings!
                  : [
                      {
                        dayFrom: item.dayFrom || "",
                        dayTo: item.dayTo || "",
                        timeFrom: item.timeFrom || "",
                        timeTo: item.timeTo || "",
                      },
                    ],
            }))
          : [
              {
                name: "",
                shortDescription: "",
                longDescription: "",
                images: "",
                // Legacy single timing fields (kept for backward compatibility)
                dayFrom: "",
                dayTo: "",
                timeFrom: "",
                timeTo: "",
                // New multiple availability timings
                availabilityTimings: [
                  {
                    dayFrom: "",
                    dayTo: "",
                    timeFrom: "",
                    timeTo: "",
                  },
                ],
                price: "",
                category: "",
                vegNonVeg: "veg",
                rank: 1,
                customizationGroups: [],
              },
            ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "menu",
  });

  const watchMenu = watch("menu");

  // Reset form when initialData changes (when navigating back)
  useEffect(() => {
    const menuData =
      initialData.menuItems && initialData.menuItems.length > 0
        ? initialData.menuItems.map((item: MenuItem) => ({
            ...item,
            // Ensure availabilityTimings array exists
            availabilityTimings:
              (item as MenuItem & { availabilityTimings?: unknown[] }).availabilityTimings &&
              Array.isArray(
                (item as MenuItem & { availabilityTimings?: unknown[] }).availabilityTimings
              ) &&
              ((item as MenuItem & { availabilityTimings?: unknown[] }).availabilityTimings
                ?.length ?? 0) > 0
                ? (item as MenuItem & { availabilityTimings?: unknown[] }).availabilityTimings!
                : [
                    {
                      dayFrom: item.dayFrom || "",
                      dayTo: item.dayTo || "",
                      timeFrom: item.timeFrom || "",
                      timeTo: item.timeTo || "",
                    },
                  ],
            customizationGroups: item.customizationGroups || [],
          }))
        : [
            {
              name: "",
              shortDescription: "",
              longDescription: "",
              images: "",
              dayFrom: "",
              dayTo: "",
              timeFrom: "",
              timeTo: "",
              price: "",
              category: "",
              vegNonVeg: "",
              rank: 1,
              availabilityTimings: [
                {
                  dayFrom: "",
                  dayTo: "",
                  timeFrom: "",
                  timeTo: "",
                },
              ],
              customizationGroups: [],
            },
          ];

    (reset as (data: unknown) => void)({ menu: menuData });
  }, [initialData, reset]);

  // Helper function to get nested errors for field arrays
  const createErrorsObject = (index: number): Record<string, { message?: string }> => {
    const menuErrors = errors?.menu?.[index];
    if (!menuErrors) return {};

    const flatErrors: Record<string, { message?: string }> = {};
    Object.keys(menuErrors).forEach((key) => {
      const errorValue = (menuErrors as Record<string, unknown>)[key];
      flatErrors[`menu.${index}.${key}`] =
        typeof errorValue === "object" && errorValue !== null && "message" in errorValue
          ? { message: String((errorValue as { message?: unknown }).message) }
          : { message: String(errorValue) };
    });

    return flatErrors;
  };

  const addMenuItem = () => {
    append({
      name: "",
      shortDescription: "",
      longDescription: "",
      images: "",
      // Legacy single timing fields
      dayFrom: "",
      dayTo: "",
      timeFrom: "",
      timeTo: "",
      // New multiple availability timings
      availabilityTimings: [
        {
          dayFrom: "",
          dayTo: "",
          timeFrom: "",
          timeTo: "",
        },
      ],
      price: "",
      category: "",
      vegNonVeg: "veg",
      rank: fields.length + 1,
      customizationGroups: [],
    } as never);
  };

  const removeMenuItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const handleAddCustomizationGroup = (menuIndex: number) => {
    const menuItem = watchMenu[menuIndex];
    const currentGroups =
      menuItem &&
      "customizationGroups" in menuItem &&
      Array.isArray((menuItem as { customizationGroups?: unknown[] }).customizationGroups)
        ? ((menuItem as { customizationGroups: unknown[] })
            .customizationGroups as CustomizationGroup[])
        : [];
    const newGroup: CustomizationGroup = {
      id: `CG${currentGroups.length + 1}`,
      name: "",
      type: "single",
      required: false,
      minQuantity: 0,
      maxQuantity: 1,
      seq: currentGroups.length + 1,
      items: [
        {
          id: `CI1`,
          name: "",
          price: "0",
          vegNonVeg: "veg",
        },
      ],
    };

    setValue(`menu.${menuIndex}.customizationGroups`, [...currentGroups, newGroup] as never);
    setEditingGroup(newGroup);
    setShowCustomizationModal(menuIndex);
  };

  const handleEditCustomizationGroup = (menuIndex: number, groupIndex: number) => {
    const menuItem = watchMenu[menuIndex];
    const groups =
      menuItem &&
      "customizationGroups" in menuItem &&
      Array.isArray((menuItem as { customizationGroups?: unknown[] }).customizationGroups)
        ? ((menuItem as { customizationGroups: unknown[] })
            .customizationGroups as CustomizationGroup[])
        : [];
    const group = groups[groupIndex];
    if (group) {
      setEditingGroup({ ...group });
      setShowCustomizationModal(menuIndex);
    }
  };

  const handleSaveCustomizationGroup = () => {
    if (showCustomizationModal !== null && editingGroup) {
      // Validation: if required is true, minQuantity must be at least 1
      if (editingGroup.required && editingGroup.minQuantity < 1) {
        toast.error("Minimum quantity must be at least 1 when customization is required");
        return;
      }

      // Additional validation: check if group name is provided
      if (!editingGroup.name || editingGroup.name.trim() === "") {
        toast.error("Customization group name is required");
        return;
      }

      // Check if at least one item exists
      if (editingGroup.items.length === 0) {
        toast.error("At least one customization option is required");
        return;
      }

      const menuItem = watchMenu[showCustomizationModal];
      const currentGroups =
        menuItem &&
        "customizationGroups" in menuItem &&
        Array.isArray((menuItem as { customizationGroups?: unknown[] }).customizationGroups)
          ? ((menuItem as { customizationGroups: unknown[] })
              .customizationGroups as CustomizationGroup[])
          : [];
      const existingIndex = currentGroups.findIndex(
        (g: { id: string }) => g.id === editingGroup.id
      );

      const updatedGroups = [...currentGroups];
      if (existingIndex >= 0) {
        updatedGroups[existingIndex] = editingGroup;
      } else {
        updatedGroups.push(editingGroup);
      }

      setValue(`menu.${showCustomizationModal}.customizationGroups`, updatedGroups as never);
      setShowCustomizationModal(null);
      setEditingGroup(null);
      toast.success("Customization group saved successfully");
    }
  };

  const handleRemoveCustomizationGroup = (menuIndex: number, groupIndex: number) => {
    const menuItem = watchMenu[menuIndex];
    const currentGroups =
      menuItem &&
      "customizationGroups" in menuItem &&
      Array.isArray((menuItem as { customizationGroups?: unknown[] }).customizationGroups)
        ? (menuItem as { customizationGroups: CustomizationGroup[] }).customizationGroups
        : [];
    const updatedGroups = [...currentGroups];
    updatedGroups.splice(groupIndex, 1);
    setValue(`menu.${menuIndex}.customizationGroups`, updatedGroups as never);
  };

  interface MenuFormData {
    menu: Array<Record<string, unknown>>;
  }

  const onSubmit = (data: MenuFormData) => {
    try {
      const convertTimeFormat = (time: string) => {
        if (!time) return "";
        return time.replace(":", "");
      };

      const formData = {
        menuItems: data.menu.map((item: Record<string, unknown>) => {
          // Process availability timings
          let processedTimings: Array<Record<string, unknown>> = [];
          if (
            item.availabilityTimings &&
            Array.isArray(item.availabilityTimings) &&
            item.availabilityTimings.length > 0
          ) {
            processedTimings = item.availabilityTimings.map((timing: Record<string, unknown>) => ({
              dayFrom: String(timing.dayFrom || ""),
              dayTo: String(timing.dayTo || ""),
              timeFrom: convertTimeFormat(String(timing.timeFrom || "")) || "",
              timeTo: convertTimeFormat(String(timing.timeTo || "")) || "",
            }));
          }

          return {
            name: String(item.name || ""),
            shortDescription: String(item.shortDescription || ""),
            longDescription: String(item.longDescription || ""),
            images: Array.isArray(item.images) ? item.images.map(String) : [],
            // Legacy single timing fields (kept for backward compatibility)
            dayFrom: String(item.dayFrom || processedTimings[0]?.dayFrom || ""),
            dayTo: String(item.dayTo || processedTimings[0]?.dayTo || ""),
            timeFrom:
              convertTimeFormat(String(item.timeFrom || "")) ||
              String(processedTimings[0]?.timeFrom || ""),
            timeTo:
              convertTimeFormat(String(item.timeTo || "")) ||
              String(processedTimings[0]?.timeTo || ""),
            // New multiple availability timings
            availabilityTimings: processedTimings,
            price: item.price ? String(item.price) : "",
            category: String(item.category || ""),
            vegNonVeg: String(item.vegNonVeg || ""),
            rank:
              typeof item.rank === "number"
                ? item.rank
                : typeof item.rank === "string"
                  ? parseInt(item.rank, 10) || 1
                  : 1,
            customizationGroups:
              "customizationGroups" in item && Array.isArray(item.customizationGroups)
                ? item.customizationGroups
                : [],
          };
        }),
      };

      onNext(formData);
    } catch (error) {
      console.error("Error in form submission:", error);
      alert(`Error submitting form: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleSkip = () => {
    // Pass empty menu items when skipping
    const formData = {
      menuItems: [],
      ...initialData,
    };
    onNext(formData);
    toast.info("Custom menu step skipped. You can add menu items later.");
  };

  return (
    <>
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tab="Menu" key="1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Optional Step Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Optional Step</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      This step is optional. You can skip it now and add menu items later. Click
                      "Skip This Step" to proceed without adding custom menu items.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-700">
                  Custom Menu with Customizations
                </h3>
                <button
                  type="button"
                  onClick={addMenuItem}
                  className="px-4 py-2 text-sm bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors"
                >
                  + Add Menu
                </button>
              </div>

              {fields.map((field, index) => (
                <Card
                  key={field.id}
                  className="shadow-md"
                  title={
                    <div className="flex items-center justify-between">
                      <h4 className="text-md font-medium">Menu Item {index + 1}</h4>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMenuItem(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  }
                >
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h5 className="text-sm font-medium text-gray-700">Basic Information</h5>
                      <div className="grid md:grid-cols-1 gap-4">
                        <FormInput
                          label="Menu Name"
                          labelInfo="Enter Menu Name"
                          name={`menu.${index}.name`}
                          register={register}
                          errors={createErrorsObject(index)}
                          required
                          validations={{
                            minLength: {
                              value: 3,
                              message: "Name must be at least 3 characters",
                            },
                          }}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormInput
                          label="Short Description"
                          labelInfo="Enter Short Description"
                          name={`menu.${index}.shortDescription`}
                          register={register}
                          errors={createErrorsObject(index)}
                          required
                          validations={{
                            minLength: {
                              value: 10,
                              message: "Short description must be at least 10 characters",
                            },
                          }}
                        />

                        <FormInput
                          label="Long Description"
                          labelInfo="Enter Long Description"
                          name={`menu.${index}.longDescription`}
                          register={register}
                          errors={createErrorsObject(index)}
                          required
                          validations={{
                            minLength: {
                              value: 30,
                              message: "Long description must be at least 30 characters",
                            },
                          }}
                        />
                      </div>

                      <div className="grid md:grid-cols-1 gap-4">
                        <MultiImageUpload
                          label="Menu Item Images"
                          labelInfo="Upload multiple images for this menu item"
                          required={true}
                          folder="workbench-seller-onboarding"
                          value={menuImages.imageState[index] || []}
                          onChange={(urls) => {
                            menuImages.updateImageField(index, urls);
                            setValue(`menu.${index}.images`, urls.join(","));
                          }}
                          maxFiles={5}
                          previewSize="small"
                        />
                      </div>

                      <div className="grid md:grid-cols-4 gap-4">
                        {/* <FormInput
                      label="Price (₹)"
                      name={`menu.${index}.price`}
                      type="number"
                      step="1"
                      min="1"
                      placeholder="e.g., 99.99"
                      register={register}
                      errors={createErrorsObject(index)}
                      required="Price is required"
                    /> */}

                        {/* <div className="mb-4 w-full">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category <span className="text-red-500">*</span>
                          </label>
                          <Controller
                            name={`menu.${index}.category`}
                            control={control as Control<FieldValues>}
                            rules={{ required: "Category is required" }}
                            render={({ field, fieldState: { error } }) => (
                              <>
                                <Select
                                  {...field}
                                  className="w-full"
                                  size="large"
                                  placeholder="Select or type category"
                                  showSearch
                                  allowClear
                                  status={error ? "error" : undefined}
                                  options={[
                                    {
                                      value: "Appetizers",
                                      label: "Appetizers",
                                    },
                                    { value: "Starters", label: "Starters" },
                                    { value: "Soups", label: "Soups" },
                                    { value: "Salads", label: "Salads" },
                                    {
                                      value: "Main Course",
                                      label: "Main Course",
                                    },
                                    { value: "Breads", label: "Breads" },
                                    { value: "Rice", label: "Rice" },
                                    { value: "Beverages", label: "Beverages" },
                                    { value: "Desserts", label: "Desserts" },
                                  ]}
                                />
                                {error && (
                                  <p className="text-red-500 text-xs italic mt-1">
                                    {error.message}
                                  </p>
                                )}
                              </>
                            )}
                          />
                        </div>

                        <div className="mb-4 w-full">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Veg/Non-Veg <span className="text-red-500">*</span>
                          </label>
                          <Controller
                            name={`menu.${index}.vegNonVeg`}
                            control={control as Control<FieldValues>}
                            defaultValue="veg"
                            rules={{
                              required: "Veg/Non-veg selection is required",
                            }}
                            render={({ field, fieldState: { error } }) => (
                              <>
                                <Select
                                  {...field}
                                  className="w-full"
                                  size="large"
                                  status={error ? "error" : undefined}
                                >
                                  <Select.Option value="veg">
                                    Vegetarian
                                  </Select.Option>
                                  <Select.Option value="non-veg">
                                    Non-Vegetarian
                                  </Select.Option>
                                  <Select.Option value="egg">
                                    Eggetarian
                                  </Select.Option>
                                </Select>
                                {error && (
                                  <p className="text-red-500 text-xs italic mt-1">
                                    {error.message}
                                  </p>
                                )}
                              </>
                            )}
                          />
                        </div> */}

                        <div className="mb-4 w-full">
                          <FormInput
                            label="Display Rank"
                            name={`menu.${index}.rank`}
                            type="number"
                            // min="1"
                            // placeholder="e.g., 1"
                            register={register}
                            errors={createErrorsObject(index)}
                            required
                            validations={{
                              min: {
                                value: 1,
                                message: "Rank must be at least 1",
                              },
                            }}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Lower numbers appear first in menu
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Availability Timings - Multiple Timings Support */}
                    <AvailabilityTimingsSection
                      menuIndex={index}
                      control={control as unknown as Control<FieldValues>}
                      watch={watch as unknown as UseFormWatch<FieldValues>}
                      setValue={setValue}
                      register={register}
                      errors={errors}
                    />

                    {/* Customizations Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium text-gray-700">
                          Customizations & Add-ons
                        </h5>
                        <Button
                          type="default"
                          size="small"
                          icon={<FaPlus />}
                          onClick={() => handleAddCustomizationGroup(index)}
                        >
                          Add Customization Group
                        </Button>
                      </div>

                      {(() => {
                        const menuItem = watchMenu[index];
                        const groups =
                          menuItem &&
                          "customizationGroups" in menuItem &&
                          Array.isArray(
                            (menuItem as { customizationGroups?: unknown[] }).customizationGroups
                          )
                            ? ((menuItem as { customizationGroups: unknown[] })
                                .customizationGroups as CustomizationGroup[])
                            : [];
                        return groups.map((group: CustomizationGroup, groupIndex: number) => (
                          <div
                            key={group.id}
                            className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h6 className="font-medium text-gray-800">
                                  {group.name || "Unnamed Group"}
                                  <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                    Seq: {group.seq || groupIndex + 1}
                                  </span>
                                </h6>
                                <p className="text-sm text-gray-600 mt-1">
                                  Type:{" "}
                                  {group.type === "single"
                                    ? "Single Selection"
                                    : "Multiple Selection"}{" "}
                                  |{group.required ? " Required" : " Optional"} | Min:{" "}
                                  {group.minQuantity} | Max: {group.maxQuantity}
                                </p>
                                <div className="mt-2">
                                  <span className="text-sm text-gray-700">Options: </span>
                                  {group.items.map((item, idx) => (
                                    <span key={idx} className="text-sm text-gray-600">
                                      {item.name} (+₹{item.price})
                                      {idx < group.items.length - 1 ? ", " : ""}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="link"
                                  size="small"
                                  icon={<FaEdit />}
                                  onClick={() => handleEditCustomizationGroup(index, groupIndex)}
                                />
                                <Button
                                  type="link"
                                  danger
                                  size="small"
                                  icon={<FaTrash />}
                                  onClick={() => handleRemoveCustomizationGroup(index, groupIndex)}
                                />
                              </div>
                            </div>
                          </div>
                        ));
                      })()}

                      {(!("customizationGroups" in (watchMenu[index] || {})) ||
                        !Array.isArray(
                          (watchMenu[index] as { customizationGroups?: unknown[] })
                            ?.customizationGroups
                        ) ||
                        (watchMenu[index] as { customizationGroups?: unknown[] })
                          ?.customizationGroups?.length === 0) && (
                        <p className="text-sm text-gray-500 italic">
                          No customizations added yet. Add customization groups for size options,
                          toppings, add-ons, etc.
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={onPrevious}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  Skip This Step
                </button>
                <LoadingButton
                  buttonText={isFinalStep ? "Submit Application" : "Next Step"}
                  type="submit"
                  isLoading={false}
                />
              </div>
            </div>
          </form>
        </Tabs.TabPane>

        {/* <Tabs.TabPane 
          tab={
            <span>
              <FaEye className="inline mr-1" />
              Relationship View
            </span>
          } 
          key="2"
        >
          <CustomMenuRelationshipView menuItems={watchMenu} />
          
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={onPrevious}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSkip}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors border border-gray-300"
              >
                Skip This Step
              </button>
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                className="px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors"
              >
                {isFinalStep ? "Submit Application" : "Next Step"}
              </button>
            </div>
          </div>
        </Tabs.TabPane> */}

        <Tabs.TabPane
          tab={
            <span>
              <FaSitemap className="inline mr-1" />
              Comprehensive View
            </span>
          }
          key="3"
        >
          <CustomMenuComprehensiveView
            menuItems={
              watchMenu.filter(
                (item) =>
                  item !== null &&
                  typeof item === "object" &&
                  "name" in item &&
                  "category" in item &&
                  "price" in item &&
                  "vegNonVeg" in item
              ) as unknown as MenuItem[]
            }
          />

          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={onPrevious}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSkip}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors border border-gray-300"
              >
                Skip This Step
              </button>
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                className="px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors"
              >
                {isFinalStep ? "Submit Application" : "Next Step"}
              </button>
            </div>
          </div>
        </Tabs.TabPane>
      </Tabs>

      {/* Customization Group Modal */}
      <Modal
        title={editingGroup?.id ? "Edit Customization Group" : "Add Customization Group"}
        open={showCustomizationModal !== null}
        onOk={handleSaveCustomizationGroup}
        onCancel={() => {
          setShowCustomizationModal(null);
          setEditingGroup(null);
        }}
        width={700}
      >
        {editingGroup && <CustomizationGroupForm group={editingGroup} onChange={setEditingGroup} />}
      </Modal>
    </>
  );
};

// Customization Group Form Component
const CustomizationGroupForm = ({
  group,
  onChange,
}: {
  group: CustomizationGroup;
  onChange: (group: CustomizationGroup) => void;
}) => {
  const addCustomizationItem = () => {
    const newItem: CustomizationItem = {
      id: `CI${group.items.length + 1}`,
      name: "",
      price: "0",
      vegNonVeg: "veg",
    };
    onChange({
      ...group,
      items: [...group.items, newItem],
    });
  };

  const removeCustomizationItem = (index: number) => {
    if (group.items.length > 1) {
      const newItems = [...group.items];
      newItems.splice(index, 1);
      onChange({
        ...group,
        items: newItems,
      });
    }
  };

  const updateCustomizationItem = (index: number, item: CustomizationItem) => {
    const newItems = [...group.items];
    newItems[index] = item;
    onChange({
      ...group,
      items: newItems,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Group Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={group.name}
            onChange={(e) => onChange({ ...group, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="e.g., Size, Toppings, Add-ons"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Selection Type <span className="text-red-500">*</span>
          </label>
          <Select
            value={group.type}
            onChange={(value) => onChange({ ...group, type: value })}
            className="w-full"
          >
            <Select.Option value="single">Single Selection (Radio)</Select.Option>
            <Select.Option value="multiple">Multiple Selection (Checkbox)</Select.Option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display Sequence <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={group.seq || 1}
            onChange={(e) => onChange({ ...group, seq: parseInt(e.target.value) || 1 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="1"
          />
          <p className="text-xs text-gray-500 mt-1">Order of this group (1 = first)</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Required?</label>
          <Checkbox
            checked={group.required}
            onChange={(e) => {
              const isRequired = e.target.checked;
              // If required is checked and minQuantity is 0, set it to 1
              const updatedGroup = {
                ...group,
                required: isRequired,
                minQuantity: isRequired && group.minQuantity === 0 ? 1 : group.minQuantity,
              };
              onChange(updatedGroup);
            }}
          >
            This customization is required
          </Checkbox>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Quantity {group.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="number"
            min={group.required ? "1" : "0"}
            value={group.minQuantity}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              // If required is checked, don't allow value less than 1
              const minValue = group.required ? Math.max(1, value) : value;
              onChange({ ...group, minQuantity: minValue });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          {group.required && group.minQuantity < 1 && (
            <p className="text-xs text-red-500 mt-1">
              Minimum quantity must be at least 1 when customization is required
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Quantity</label>
          <input
            type="number"
            min="1"
            value={group.maxQuantity}
            onChange={(e) => onChange({ ...group, maxQuantity: parseInt(e.target.value) || 1 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Options <span className="text-red-500">*</span>
          </label>
          <Button type="link" size="small" icon={<FaPlus />} onClick={addCustomizationItem}>
            Add Option
          </Button>
        </div>

        <div className="space-y-2">
          {group.items.map((item, index) => (
            <div key={item.id} className="flex gap-2 items-end">
              <div className="flex-1">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) =>
                    updateCustomizationItem(index, {
                      ...item,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Option name (e.g., Small, Large, Extra Cheese)"
                />
              </div>
              <div className="w-32">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={item.price}
                  onChange={(e) =>
                    updateCustomizationItem(index, {
                      ...item,
                      price: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Price"
                />
              </div>
              <div className="w-32">
                <Select
                  value={item.vegNonVeg}
                  onChange={(value) =>
                    updateCustomizationItem(index, {
                      ...item,
                      vegNonVeg: value,
                    })
                  }
                  className="w-full"
                >
                  <Select.Option value="veg">Veg</Select.Option>
                  <Select.Option value="non-veg">Non-Veg</Select.Option>
                  <Select.Option value="egg">Egg</Select.Option>
                </Select>
              </div>
              {group.items.length > 1 && (
                <Button
                  type="text"
                  danger
                  icon={<FaTrash />}
                  onClick={() => removeCustomizationItem(index)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomMenuFormEnhanced;
