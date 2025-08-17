import { useForm, useFieldArray, Controller } from "react-hook-form";
import { FormInput } from "../ui/forms/form-input";
import LoadingButton from "../ui/forms/loading-button";
import { SellerOnboardingData } from "../../pages/seller-onboarding";
import { weekDays } from "../../constants/common";
import { Select } from "antd";

interface CustomMenuFormProps {
  initialData: SellerOnboardingData;
  onNext: (data: Partial<SellerOnboardingData>) => void;
  onPrevious: () => void;
  isFinalStep?: boolean;
}


const CustomMenuForm = ({
  initialData,
  onNext,
  onPrevious,
  isFinalStep = true,
}: CustomMenuFormProps) => {
  
  // Create a modified errors object that works with nested paths
  const createErrorsObject = (index: number) => {
    const menuErrors = errors?.menu?.[index];
    if (!menuErrors) return {};
    
    // Create a flat object with the full path as keys
    const flatErrors: any = {};
    Object.keys(menuErrors).forEach((key) => {
      flatErrors[`menu.${index}.${key}`] = (menuErrors as any)[key];
    });
    
    return flatErrors;
  };
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
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
        },
      ],
    },
  });

  // Uncomment for debugging form validation
  // console.log("Form validation errors:", errors);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "menu",
  });

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
    });
  };

  const removeMenuItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = (data: any) => {
    try {
      console.log("Form submitted with data:", data);
      
      const convertTimeFormat = (time: string) => {
        if (!time) return "";
        return time.replace(":", "");
      };
      
      const formData = {
        menuItems: data.menu.map((item: any, index: number) => {
          console.log(`Menu item ${index + 1}:`, item);
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
          };
        }),
      };
      
      console.log("Processed form data:", formData);
      onNext(formData);
    } catch (error) {
      console.error("Error in form submission:", error);
      alert(`Error submitting form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-700">Custom Menu</h3>
          <button
            type="button"
            onClick={addMenuItem}
            className="px-4 py-2 text-sm bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors"
          >
            + Add Menu
          </button>
        </div>

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="p-6 border border-gray-200 rounded-lg bg-gray-50 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-800">
                Menu {index + 1}
              </h4>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMenuItem(index)}
                  className="text-red-600 hover:text-red-800 text-sm underline"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="space-y-4">
              <h5 className="text-sm font-medium text-gray-700">
                Basic Information
              </h5>
              <div className="grid md:grid-cols-2 gap-4">
                <FormInput
                  label="Menu  Name"
                  name={`menu.${index}.name`}
                  register={register}
                  errors={createErrorsObject(index)}
                  required="Menu name is required"
                  validations={{
                    minLength: {
                      value: 3,
                      message: "Name must be at least 3 characters",
                    },
                    maxLength: {
                      value: 100,
                      message: "Name cannot exceed 100 characters",
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
                  validations={{
                    pattern: {
                      value:
                        /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
                      message: "Please enter a valid URL",
                    },
                  }}
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
                      message:
                        "Short description must be at least 10 characters",
                    },
                    maxLength: {
                      value: 150,
                      message: "Short description cannot exceed 150 characters",
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
                      message:
                        "Long description must be at least 30 characters",
                    },
                    maxLength: {
                      value: 500,
                      message: "Long description cannot exceed 500 characters",
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
                  validations={{
                    min: {
                      value: 1,
                      message: "Price must be at least ₹1",
                    },
                    validate: {
                      isNumber: (value: string) => {
                        const num = parseFloat(value);
                        if (isNaN(num)) {
                          return "Price must be a valid number";
                        }
                        if (num <= 0) {
                          return "Price must be greater than 0";
                        }
                        // Check for maximum 2 decimal places
                        if (value.includes('.') && value.split('.')[1].length > 2) {
                          return "Price can have maximum 2 decimal places";
                        }
                        return true;
                      }
                    }
                  }}
                />

                <FormInput
                  label="Category"
                  name={`menu.${index}.category`}
                  register={register}
                  errors={createErrorsObject(index)}
                  required="Category is required"
                  placeholder="e.g., Appetizers, Main Course, Beverages"
                />

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

            <div className="space-y-4">
              <h5 className="text-sm font-medium text-gray-700">
                Availability Timings
              </h5>
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
          </div>
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
  );
};

export default CustomMenuForm;
