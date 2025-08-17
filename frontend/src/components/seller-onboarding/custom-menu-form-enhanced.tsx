import { useForm, useFieldArray, Controller } from "react-hook-form";
import { FormInput } from "../ui/forms/form-input";
import LoadingButton from "../ui/forms/loading-button";
import { SellerOnboardingData } from "../../pages/seller-onboarding";
import { weekDays } from "../../constants/common";
import { Select, Button, Card, Modal, Checkbox, Tabs } from "antd";
import { FaPlus, FaMinus, FaEdit, FaEye, FaSitemap } from "react-icons/fa";
import { useState } from "react";
import CustomMenuRelationshipView from "./custom-menu-relationship-view";
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
  items: CustomizationItem[];
}


interface CustomMenuFormEnhancedProps {
  initialData: SellerOnboardingData;
  onNext: (data: Partial<SellerOnboardingData>) => void;
  onPrevious: () => void;
  isFinalStep?: boolean;
}

const CustomMenuFormEnhanced = ({
  initialData,
  onNext,
  onPrevious,
  isFinalStep = true,
}: CustomMenuFormEnhancedProps) => {
  const [showCustomizationModal, setShowCustomizationModal] = useState<number | null>(null);
  const [editingGroup, setEditingGroup] = useState<CustomizationGroup | null>(null);
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      menu: initialData.menuItems || [
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
          vegNonVeg: "veg",
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

  // Helper function to get nested errors for field arrays
  const createErrorsObject = (index: number) => {
    const menuErrors = errors?.menu?.[index];
    if (!menuErrors) return {};
    
    const flatErrors: any = {};
    Object.keys(menuErrors).forEach((key) => {
      flatErrors[`menu.${index}.${key}`] = (menuErrors as any)[key];
    });
    
    return flatErrors;
  };

  const addMenuItem = () => {
    append({
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
      vegNonVeg: "veg",
      customizationGroups: [],
    });
  };

  const removeMenuItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const handleAddCustomizationGroup = (menuIndex: number) => {
    const currentGroups = watchMenu[menuIndex]?.customizationGroups || [];
    const newGroup: CustomizationGroup = {
      id: `CG${currentGroups.length + 1}`,
      name: "",
      type: "single",
      required: false,
      minQuantity: 0,
      maxQuantity: 1,
      items: [
        {
          id: `CI1`,
          name: "",
          price: "0",
          vegNonVeg: "veg",
        },
      ],
    };
    
    setValue(`menu.${menuIndex}.customizationGroups`, [...currentGroups, newGroup]);
    setEditingGroup(newGroup);
    setShowCustomizationModal(menuIndex);
  };

  const handleEditCustomizationGroup = (menuIndex: number, groupIndex: number) => {
    const group = watchMenu[menuIndex]?.customizationGroups?.[groupIndex];
    if (group) {
      setEditingGroup({ ...group });
      setShowCustomizationModal(menuIndex);
    }
  };

  const handleSaveCustomizationGroup = () => {
    if (showCustomizationModal !== null && editingGroup) {
      const currentGroups = watchMenu[showCustomizationModal]?.customizationGroups || [];
      const existingIndex = currentGroups.findIndex(g => g.id === editingGroup.id);
      
      if (existingIndex >= 0) {
        currentGroups[existingIndex] = editingGroup;
      } else {
        currentGroups.push(editingGroup);
      }
      
      setValue(`menu.${showCustomizationModal}.customizationGroups`, currentGroups);
      setShowCustomizationModal(null);
      setEditingGroup(null);
    }
  };

  const handleRemoveCustomizationGroup = (menuIndex: number, groupIndex: number) => {
    const currentGroups = watchMenu[menuIndex]?.customizationGroups || [];
    currentGroups.splice(groupIndex, 1);
    setValue(`menu.${menuIndex}.customizationGroups`, currentGroups);
  };

  const onSubmit = (data: any) => {
    try {
      const convertTimeFormat = (time: string) => {
        if (!time) return "";
        return time.replace(":", "");
      };
      
      const formData = {
        menuItems: data.menu.map((item: any) => {
          return {
            name: item.name,
            shortDescription: item.shortDescription,
            longDescription: item.longDescription,
            images: item.images,
            dayFrom: item.dayFrom,
            dayTo: item.dayTo,
            timeFrom: convertTimeFormat(item.timeFrom),
            timeTo: convertTimeFormat(item.timeTo),
            price: item.price ? item.price.toString() : "",
            category: item.category,
            vegNonVeg: item.vegNonVeg,
            customizationGroups: item.customizationGroups || [],
          };
        }),
      };
      
      onNext(formData);
    } catch (error) {
      console.error("Error in form submission:", error);
      alert(`Error submitting form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <>
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tab="Menu Items" key="1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-700">Custom Menu with Customizations</h3>
                <button
                  type="button"
                  onClick={addMenuItem}
                  className="px-4 py-2 text-sm bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors"
                >
                  + Add Menu Item
                </button>
              </div>

          {fields.map((field, index) => (
            <Card
              key={field.id}
              className="shadow-md"
              title={
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium">
                    Menu Item {index + 1}
                  </h4>
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
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormInput
                      label="Menu Name"
                      name={`menu.${index}.name`}
                      register={register}
                      errors={createErrorsObject(index)}
                      required="Menu name is required"
                      validations={{
                        minLength: {
                          value: 3,
                          message: "Name must be at least 3 characters",
                        },
                      }}
                    />

                    <FormInput
                      label="Images (URL)"
                      name={`menu.${index}.images`}
                      type="url"
                      register={register}
                      errors={createErrorsObject(index)}
                      required="Image URL is required"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormInput
                      label="Short Description"
                      name={`menu.${index}.shortDescription`}
                      register={register}
                      errors={createErrorsObject(index)}
                      required="Short description is required"
                      validations={{
                        minLength: {
                          value: 10,
                          message: "Short description must be at least 10 characters",
                        },
                      }}
                    />

                    <FormInput
                      label="Long Description"
                      name={`menu.${index}.longDescription`}
                      register={register}
                      errors={createErrorsObject(index)}
                      required="Long description is required"
                      validations={{
                        minLength: {
                          value: 30,
                          message: "Long description must be at least 30 characters",
                        },
                      }}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <FormInput
                      label="Price (₹)"
                      name={`menu.${index}.price`}
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="e.g., 99.99"
                      register={register}
                      errors={createErrorsObject(index)}
                      required="Price is required"
                    />

                    <div className="mb-4 w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <Controller
                        name={`menu.${index}.category`}
                        control={control}
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
                                { value: "Appetizers", label: "Appetizers (Rank 1)" },
                                { value: "Starters", label: "Starters (Rank 1)" },
                                { value: "Soups", label: "Soups (Rank 2)" },
                                { value: "Salads", label: "Salads (Rank 3)" },
                                { value: "Main Course", label: "Main Course (Rank 4)" },
                                { value: "Breads", label: "Breads (Rank 5)" },
                                { value: "Rice", label: "Rice (Rank 6)" },
                                { value: "Beverages", label: "Beverages (Rank 7)" },
                                { value: "Desserts", label: "Desserts (Rank 8)" },
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
                        control={control}
                        defaultValue="veg"
                        rules={{ required: "Veg/Non-veg selection is required" }}
                        render={({ field, fieldState: { error } }) => (
                          <>
                            <Select
                              {...field}
                              className="w-full"
                              size="large"
                              status={error ? "error" : undefined}
                            >
                              <Select.Option value="veg">Vegetarian</Select.Option>
                              <Select.Option value="non-veg">Non-Vegetarian</Select.Option>
                              <Select.Option value="egg">Eggetarian</Select.Option>
                            </Select>
                            {error && (
                              <p className="text-red-500 text-xs italic mt-1">
                                {error.message}
                              </p>
                            )}
                          </>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Availability Timings */}
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-gray-700">Availability Timings</h5>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="mb-4 w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Available From (Day) <span className="text-red-500">*</span>
                      </label>
                      <Controller
                        name={`menu.${index}.dayFrom`}
                        control={control}
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
                        Available To (Day) <span className="text-red-500">*</span>
                      </label>
                      <Controller
                        name={`menu.${index}.dayTo`}
                        control={control}
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
                            {error && (
                              <p className="text-red-500 text-xs italic mt-1">
                                {error.message}
                              </p>
                            )}
                          </>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormInput
                      label="Available From (Time)"
                      name={`menu.${index}.timeFrom`}
                      type="time"
                      register={register}
                      errors={createErrorsObject(index)}
                      required="Start time is required"
                    />

                    <FormInput
                      label="Available To (Time)"
                      name={`menu.${index}.timeTo`}
                      type="time"
                      register={register}
                      errors={createErrorsObject(index)}
                      required="End time is required"
                    />
                  </div>
                </div>

                {/* Customizations Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium text-gray-700">Customizations & Add-ons</h5>
                    <Button
                      type="default"
                      size="small"
                      icon={<FaPlus />}
                      onClick={() => handleAddCustomizationGroup(index)}
                    >
                      Add Customization Group
                    </Button>
                  </div>

                  {watchMenu[index]?.customizationGroups?.map((group: CustomizationGroup, groupIndex: number) => (
                    <div key={group.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h6 className="font-medium text-gray-800">{group.name || "Unnamed Group"}</h6>
                          <p className="text-sm text-gray-600 mt-1">
                            Type: {group.type === "single" ? "Single Selection" : "Multiple Selection"} | 
                            {group.required ? " Required" : " Optional"} | 
                            Min: {group.minQuantity} | Max: {group.maxQuantity}
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
                            icon={<FaMinus />}
                            onClick={() => handleRemoveCustomizationGroup(index, groupIndex)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!watchMenu[index]?.customizationGroups || watchMenu[index]?.customizationGroups?.length === 0) && (
                    <p className="text-sm text-gray-500 italic">
                      No customizations added yet. Add customization groups for size options, toppings, add-ons, etc.
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
              <LoadingButton
                buttonText={isFinalStep ? "Submit Application" : "Next Step"}
                type="submit"
                isLoading={false}
              />
            </div>
          </form>
        </Tabs.TabPane>
        
        <Tabs.TabPane 
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
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              className="px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors"
            >
              {isFinalStep ? "Submit Application" : "Next Step"}
            </button>
          </div>
        </Tabs.TabPane>
        
        <Tabs.TabPane 
          tab={
            <span>
              <FaSitemap className="inline mr-1" />
              Comprehensive View
            </span>
          } 
          key="3"
        >
          <CustomMenuComprehensiveView menuItems={watchMenu} />
          
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={onPrevious}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              className="px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors"
            >
              {isFinalStep ? "Submit Application" : "Next Step"}
            </button>
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
        {editingGroup && (
          <CustomizationGroupForm
            group={editingGroup}
            onChange={setEditingGroup}
          />
        )}
      </Modal>
    </>
  );
};

// Customization Group Form Component
const CustomizationGroupForm = ({ 
  group, 
  onChange 
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
      <div className="grid grid-cols-2 gap-4">
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
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Required?
          </label>
          <Checkbox
            checked={group.required}
            onChange={(e) => onChange({ ...group, required: e.target.checked })}
          >
            This customization is required
          </Checkbox>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Quantity
          </label>
          <input
            type="number"
            min="0"
            value={group.minQuantity}
            onChange={(e) => onChange({ ...group, minQuantity: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Quantity
          </label>
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
          <Button
            type="link"
            size="small"
            icon={<FaPlus />}
            onClick={addCustomizationItem}
          >
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
                  onChange={(e) => updateCustomizationItem(index, { ...item, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Option name (e.g., Small, Large, Extra Cheese)"
                />
              </div>
              <div className="w-32">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => updateCustomizationItem(index, { ...item, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Price"
                />
              </div>
              <div className="w-32">
                <Select
                  value={item.vegNonVeg}
                  onChange={(value) => updateCustomizationItem(index, { ...item, vegNonVeg: value })}
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
                  icon={<FaMinus />}
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