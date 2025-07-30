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
        },
      ],
    },
  });

  console.log("errors", errors);

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
    });
  };

  const removeMenuItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = (data: any) => {
    
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
        };
      }),
    };
    
    onNext(formData);
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
                  errors={errors}
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
                  errors={errors}
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
                  errors={errors}
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
                  errors={errors}
                  required="Long description is required"
                  validations={{
                    minLength: {
                      value: 50,
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
                  errors={errors}
                  required="Start time is required"
                />

                <FormInput
                  label="Available To (Time)"
                  name={`menu.${index}.timeTo`}
                  type="time"
                  register={register}
                  errors={errors}
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
